"use client";

import Script from "next/script";
import { useState, type FormEvent } from "react";

const contactMethods = ["WhatsApp", "Llamada telefónica", "Correo electrónico"];
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const recaptchaAction = "solicitud_apoyo";
const noNumbersPattern = "[^0-9]+";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

type SubmitState = {
  kind: "idle" | "success" | "error";
  message: string;
};

async function getRecaptchaToken() {
  if (!recaptchaSiteKey) {
    throw new Error("La protección reCAPTCHA no está configurada.");
  }

  if (!window.grecaptcha) {
    throw new Error("No se pudo cargar reCAPTCHA. Inténtalo de nuevo.");
  }

  return new Promise<string>((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(recaptchaSiteKey, { action: recaptchaAction })
        .then(resolve)
        .catch(() => {
          reject(new Error("No se pudo verificar reCAPTCHA."));
        });
    });
  });
}

function formatVenezuelanPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits = digits.startsWith("58")
    ? digits.slice(2)
    : digits.replace(/^0+/, "");

  return `+58${nationalDigits.slice(0, 10)}`;
}

export function IntakeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    kind: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setSubmitState({ kind: "idle", message: "" });

    try {
      const recaptchaToken = await getRecaptchaToken();

      const response = await fetch("/api/solicitud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          recaptchaToken,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.message || "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        );
      }

      form.reset();
      setSubmitState({
        kind: "success",
        message:
          result?.message ||
          "Solicitud enviada. El equipo de coordinación revisará la información.",
      });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {recaptchaSiteKey ? (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-[#d9e5e2] bg-[#f9fbfa] p-4 shadow-sm sm:p-6"
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold text-[#294842] sm:col-span-2">
            Nombre completo
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              required
              pattern={noNumbersPattern}
              maxLength={120}
              title="No uses números en este campo."
              className="min-h-12 rounded-lg border border-[#cbd9d6] bg-white px-4 text-base font-medium text-[#14312d] outline-none transition focus:border-[#00796b] focus:ring-4 focus:ring-[#00796b]/15"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#294842]">
            Edad
            <input
              name="age"
              type="number"
              inputMode="numeric"
              min="12"
              max="99"
              required
              placeholder="12"
              className="min-h-12 rounded-lg border border-[#cbd9d6] bg-white px-4 text-base font-medium text-[#14312d] outline-none transition focus:border-[#00796b] focus:ring-4 focus:ring-[#00796b]/15"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#294842]">
            Ubicación: ciudad/estado
            <input
              name="location"
              type="text"
              autoComplete="address-level2"
              required
              pattern={noNumbersPattern}
              maxLength={140}
              title="No uses números en este campo."
              className="min-h-12 rounded-lg border border-[#cbd9d6] bg-white px-4 text-base font-medium text-[#14312d] outline-none transition focus:border-[#00796b] focus:ring-4 focus:ring-[#00796b]/15"
            />
          </label>

          <fieldset className="flex flex-col gap-3 rounded-lg border border-[#cbd9d6] bg-white p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-semibold text-[#294842]">
              Método de contacto preferido
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {contactMethods.map((method) => (
                <label
                  key={method}
                  className="flex min-h-12 items-center gap-3 rounded-lg border border-[#d9e5e2] px-3 text-sm font-semibold text-[#31504b]"
                >
                  <input
                    name="contactMethod"
                    type="radio"
                    value={method}
                    required
                    className="h-5 w-5 accent-[#00796b]"
                  />
                  {method}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#294842]">
            Número de teléfono
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              defaultValue="+58"
              pattern="\+58\d{10}"
              minLength={13}
              maxLength={13}
              title="Usa el formato venezolano +58 seguido de 10 dígitos, por ejemplo +584121234567."
              onInput={(event) => {
                event.currentTarget.value = formatVenezuelanPhone(
                  event.currentTarget.value,
                );
              }}
              className="min-h-12 rounded-lg border border-[#cbd9d6] bg-white px-4 text-base font-medium text-[#14312d] outline-none transition focus:border-[#00796b] focus:ring-4 focus:ring-[#00796b]/15"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-[#294842]">
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={160}
              className="min-h-12 rounded-lg border border-[#cbd9d6] bg-white px-4 text-base font-medium text-[#14312d] outline-none transition focus:border-[#00796b] focus:ring-4 focus:ring-[#00796b]/15"
            />
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[#d9e5e2] bg-white p-4 text-sm font-medium leading-6 text-[#31504b] sm:col-span-2">
            <input
              name="consent"
              type="checkbox"
              value="accepted"
              required
              className="mt-1 h-5 w-5 shrink-0 accent-[#00796b]"
            />
            Autorizo que mi información sea enviada al equipo de coordinación de
            Salud Mental Venezuela para gestionar esta solicitud.
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 min-h-[52px] w-full rounded-lg bg-[#00796b] px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-[#00695c] focus:outline-none focus:ring-4 focus:ring-[#00796b]/25 disabled:cursor-not-allowed disabled:bg-[#7aa9a1]"
        >
          {isSubmitting ? "Enviando solicitud..." : "Enviar solicitud"}
        </button>

        {submitState.kind !== "idle" ? (
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold leading-6 ${
              submitState.kind === "success"
                ? "bg-[#e8f5f1] text-[#00695c]"
                : "bg-[#fff1f0] text-[#8a1f17]"
            }`}
            role="status"
            aria-live="polite"
          >
            {submitState.message}
          </p>
        ) : null}

        <p className="mt-4 text-sm leading-6 text-[#526964]">
          Tu información será manejada de forma confidencial y enviada al equipo
          de saludmentalvenezuela.app.
        </p>
      </form>
    </>
  );
}
