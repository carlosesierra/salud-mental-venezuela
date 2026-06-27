import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const DUPLICATE_SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;
const RECAPTCHA_ACTION = "solicitud_apoyo";
const submissionsByIp = new Map<string, { count: number; resetAt: number }>();
const duplicateSubmissions = new Map<string, number>();

type IntakePayload = {
  fullName?: unknown;
  age?: unknown;
  location?: unknown;
  contactMethod?: unknown;
  phone?: unknown;
  email?: unknown;
  consent?: unknown;
  website?: unknown;
  recaptchaToken?: unknown;
};

type ValidIntake = {
  fullName: string;
  age: string;
  location: string;
  contactMethod: string;
  phone: string;
  email: string;
};

type RecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

type FieldResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

function jsonResponse(message: string, status: number) {
  return NextResponse.json({ ok: status < 400, message }, { status });
}

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasUnsafeText(value: string) {
  return (
    /[\u0000-\u001f\u007f]/.test(value) ||
    /[<>]/.test(value) ||
    /(https?:\/\/|www\.|\.com\b|\.net\b|\.org\b|\.io\b|\.ru\b)/i.test(value) ||
    /(.)\1{12,}/.test(value)
  );
}

function getRequiredText(
  value: unknown,
  fieldName: string,
  minLength: number,
  maxLength: number,
): FieldResult {
  if (typeof value !== "string") {
    return { ok: false, message: `${fieldName} no tiene un formato válido.` };
  }

  const normalized = normalizeText(value);

  if (normalized.length < minLength) {
    return { ok: false, message: `${fieldName} es obligatorio.` };
  }

  if (normalized.length > maxLength) {
    return { ok: false, message: `${fieldName} es demasiado largo.` };
  }

  if (hasUnsafeText(normalized)) {
    return {
      ok: false,
      message: `${fieldName} contiene caracteres no permitidos.`,
    };
  }

  return { ok: true, value: normalized };
}

function getOptionalEmail(value: unknown): FieldResult {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: true, value: "" };
  }

  const email = normalizeText(value).toLowerCase();

  if (email.length > 160) {
    return {
      ok: false,
      message: "El correo electrónico indicado es demasiado largo.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      message: "El correo electrónico indicado no es válido.",
    };
  }

  return { ok: true, value: email };
}

function validatePayload(payload: IntakePayload): ValidIntake | string {
  if (payload.consent !== "accepted") {
    return "Debes autorizar el envío de la información para continuar.";
  }

  const fullName = getRequiredText(payload.fullName, "Nombre completo", 2, 120);
  if (!fullName.ok) {
    return fullName.message;
  }

  const location = getRequiredText(payload.location, "Ubicación", 2, 140);
  if (!location.ok) {
    return location.message;
  }

  const age = getRequiredText(payload.age, "Edad", 1, 3);
  if (!age.ok) {
    return age.message;
  }

  const numericAge = Number(age.value);
  if (
    !/^\d{1,3}$/.test(age.value) ||
    !Number.isInteger(numericAge) ||
    numericAge < 1 ||
    numericAge > 120
  ) {
    return "La edad indicada no es válida.";
  }

  const contactMethod = textValue(payload.contactMethod, 40);
  if (
    !["WhatsApp", "Llamada telefónica", "Correo electrónico"].includes(
      contactMethod,
    )
  ) {
    return "El método de contacto indicado no es válido.";
  }

  const phone = getRequiredText(payload.phone, "Número de teléfono", 7, 40);
  if (!phone.ok) {
    return phone.message;
  }

  if (!/^[+()\d\s.-]{7,40}$/.test(phone.value)) {
    return "El número de teléfono indicado no es válido.";
  }

  const email = getOptionalEmail(payload.email);
  if (!email.ok) {
    return email.message;
  }

  return {
    fullName: fullName.value,
    age: age.value,
    location: location.value,
    contactMethod,
    phone: phone.value,
    email: email.value,
  };
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const existing = submissionsByIp.get(ip);

  if (!existing || existing.resetAt < now) {
    submissionsByIp.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getSubmissionFingerprint(intake: ValidIntake) {
  const normalizedPhone = intake.phone.replace(/[^\d+]/g, "").toLowerCase();
  const normalizedEmail = intake.email.toLowerCase();
  return hashIdentifier(`${normalizedPhone}|${normalizedEmail}`);
}

function isDuplicateSubmissionInMemory(fingerprint: string) {
  const now = Date.now();
  const blockedUntil = duplicateSubmissions.get(fingerprint);

  if (blockedUntil && blockedUntil > now) {
    return true;
  }

  duplicateSubmissions.set(fingerprint, now + DUPLICATE_SUBMISSION_WINDOW_MS);
  return false;
}

function isDuplicateSubmission(intake: ValidIntake) {
  const fingerprint = getSubmissionFingerprint(intake);
  return isDuplicateSubmissionInMemory(fingerprint);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getRecaptchaMinScore() {
  const configuredScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
  return Number.isFinite(configuredScore) ? configuredScore : 0.5;
}

async function verifyRecaptcha(token: string, ip: string) {
  const secret = requireEnv("RECAPTCHA_SECRET_KEY");
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (ip !== "unknown") {
    body.set("remoteip", ip);
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as RecaptchaResponse;
  const minScore = getRecaptchaMinScore();
  const expectedHostname = process.env.RECAPTCHA_EXPECTED_HOSTNAME;

  if (
    !result.success ||
    result.action !== RECAPTCHA_ACTION ||
    typeof result.score !== "number" ||
    result.score < minScore
  ) {
    console.warn("reCAPTCHA rejected request.", {
      action: result.action,
      score: result.score,
      errorCodes: result["error-codes"],
    });
    return false;
  }

  if (expectedHostname && result.hostname !== expectedHostname) {
    console.warn("reCAPTCHA hostname mismatch.", {
      expectedHostname,
      receivedHostname: result.hostname,
    });
    return false;
  }

  return true;
}

function buildEmailText(intake: ValidIntake) {
  return [
    "Nueva solicitud - Salud Mental Venezuela",
    "",
    `Nombre: ${intake.fullName}`,
    `Edad: ${intake.age}`,
    `Ubicación: ${intake.location}`,
    `Contacto preferido: ${intake.contactMethod}`,
    `Teléfono: ${intake.phone}`,
    `Correo electrónico: ${intake.email || "No indicado"}`,
    "",
    "La persona autorizó el envío de su información al equipo de coordinación.",
  ].join("\n");
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (!contentType.includes("application/json")) {
    return {
      error: jsonResponse("La solicitud debe enviarse como JSON.", 415),
    };
  }

  if (contentLength > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse("La solicitud es demasiado grande.", 413),
    };
  }

  const rawBody = await request.text();
  const byteLength = new TextEncoder().encode(rawBody).length;

  if (byteLength > MAX_REQUEST_BODY_BYTES) {
    return {
      error: jsonResponse("La solicitud es demasiado grande.", 413),
    };
  }

  try {
    return {
      payload: JSON.parse(rawBody) as IntakePayload,
    };
  } catch {
    return {
      error: jsonResponse("La solicitud no tiene un formato válido.", 400),
    };
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return jsonResponse(
      "Recibimos varias solicitudes desde esta conexión. Inténtalo de nuevo más tarde.",
      429,
    );
  }

  const { payload, error } = await readPayload(request);

  if (error) {
    return error;
  }

  if (!payload) {
    return jsonResponse("La solicitud no tiene un formato válido.", 400);
  }

  if (textValue(payload.website, 200)) {
    return jsonResponse("Solicitud recibida.", 200);
  }

  const validated = validatePayload(payload);

  if (typeof validated === "string") {
    const status = validated === "Solicitud recibida." ? 200 : 400;
    return jsonResponse(validated, status);
  }

  try {
    const recaptchaToken = textValue(payload.recaptchaToken, 4000);

    if (!recaptchaToken) {
      return jsonResponse("No se pudo verificar reCAPTCHA.", 400);
    }

    const recaptchaAccepted = await verifyRecaptcha(recaptchaToken, ip);

    if (!recaptchaAccepted) {
      return jsonResponse(
        "No se pudo verificar que la solicitud sea legítima. Inténtalo de nuevo.",
        403,
      );
    }

    if (isDuplicateSubmission(validated)) {
      return jsonResponse(
        "Ya recibimos una solicitud reciente con estos datos de contacto.",
        429,
      );
    }

    const gmailUser = requireEnv("GMAIL_USER");
    const gmailAppPassword = requireEnv("GMAIL_APP_PASSWORD");
    const toEmail = requireEnv("FORM_TO_EMAIL");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"Salud Mental Venezuela" <${gmailUser}>`,
      to: toEmail,
      replyTo: validated.email || undefined,
      subject: "Nueva solicitud de apoyo psicológico",
      text: buildEmailText(validated),
    });

    return jsonResponse(
      "Solicitud enviada. El equipo de coordinación revisará la información.",
      200,
    );
  } catch (error) {
    console.error(
      "No se pudo enviar la solicitud por Gmail.",
      error instanceof Error ? error.message : error,
    );

    return jsonResponse(
      "No se pudo enviar la solicitud en este momento. Inténtalo de nuevo.",
      500,
    );
  }
}
