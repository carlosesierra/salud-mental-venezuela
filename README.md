# Salud Mental Venezuela

Landing page en Next.js para recibir solicitudes de apoyo psicológico y enviarlas por correo al equipo de coordinación.

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local` usando `env.example` como referencia:

```bash
GMAIL_USER=cuenta-dedicada@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FORM_TO_EMAIL=carlosesierra@gmail.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_public_recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=your_private_recaptcha_v3_secret_key
RECAPTCHA_MIN_SCORE=0.5
RECAPTCHA_EXPECTED_HOSTNAME=localhost
```

`GMAIL_USER` debe ser una cuenta dedicada con verificación en dos pasos activa. `GMAIL_APP_PASSWORD` debe ser una contraseña de aplicación generada desde la cuenta de Google.

Para reCAPTCHA, registra el dominio en Google reCAPTCHA v3 y usa la clave pública en `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` y la clave privada en `RECAPTCHA_SECRET_KEY`. En producción, cambia `RECAPTCHA_EXPECTED_HOSTNAME` por el dominio real del sitio. Si no quieres validar el hostname, omite esa variable.

Para tráfico real sin servicios pagos adicionales, publica el dominio detrás de Cloudflare Free. El sitio mantiene reCAPTCHA v3, validación estricta, límite de tamaño de solicitud y un límite básico en memoria. Cloudflare debe absorber el abuso volumétrico y permitir reglas de seguridad sobre `/api/solicitud`.

3. Ejecuta el servidor:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Envío de solicitudes

El formulario publica en `POST /api/solicitud`. La ruta exige JSON, limita el cuerpo a 8 KB, valida los campos, exige consentimiento, verifica reCAPTCHA v3, aplica rate limiting básico en memoria, bloquea duplicados recientes con un hash de los datos de contacto y envía el correo con Nodemailer usando Gmail SMTP. Las credenciales solo se leen desde variables de entorno del servidor.

El límite en memoria es una defensa local de bajo costo, no una protección distribuida. Para producción pública, configura Cloudflare Free con proxy activo, HTTPS, reglas de seguridad para `/api/solicitud` y modo de desafío si aparece abuso.

## Validación

```bash
npm run lint
npm run build
```
