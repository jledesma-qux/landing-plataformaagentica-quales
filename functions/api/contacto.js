// functions/api/contacto.js
// Cloudflare Pages Function — recibe el formulario de la landing y envía el mail vía SendGrid.
// La API key vive en una variable de entorno secreta (SENDGRID_API_KEY), NUNCA en el código.

const TO_EMAIL   = "marketing@qualesgroup.com";        // casilla que recibe las consultas
const FROM_EMAIL = "no-reply@qualesgroup.com";         // remitente verificado en SendGrid
const FROM_NAME  = "Landing Plataforma Agéntica - Quales";

export async function onRequestPost({ request, env }) {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

  try {
    // 1) Leer los datos del formulario (soporta form-urlencoded y JSON)
    let data = {};
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) data[k] = v;
    }

    const nombre  = (data.nombre  || "").toString().trim();
    const email   = (data.email   || "").toString().trim();
    const telefono= (data.telefono|| "").toString().trim();
    const empresa = (data.empresa || "").toString().trim();
    const mensaje = (data.mensaje || "").toString().trim();

    // 2) Anti-spam: honeypot. Si el campo oculto viene lleno, es un bot.
    //    Respondemos "ok" para no darle pistas, pero NO enviamos nada.
    if ((data.website || data._gotcha || "").toString().trim() !== "") {
      return json({ ok: true });
    }

    // 3) Validación mínima (los campos obligatorios del form son Nombre y Email)
    if (!nombre || !email) {
      return json({ ok: false, error: "Faltan campos obligatorios (nombre y email)." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: "El email no es válido." }, 400);
    }

    // 4) Verificar que la API key esté configurada en Cloudflare
    if (!env.SENDGRID_API_KEY) {
      return json({ ok: false, error: "Falta configurar SENDGRID_API_KEY en Cloudflare." }, 500);
    }

    // 5) Armar el contenido del mail
    const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const filas = [
      ["Nombre", nombre],
      ["Email", email],
      ["Teléfono", telefono || "—"],
      ["Empresa", empresa || "—"],
      ["Mensaje", mensaje || "—"],
    ].map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:bold">${k}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`).join("");

    const payload = {
      personalizations: [{
        to: [{ email: TO_EMAIL }],
        // reply-to = el email del interesado: al responder, marketing le contesta directo a él
        subject: `Nueva consulta de la landing — ${nombre}`,
      }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email, name: nombre },
      content: [{
        type: "text/html",
        value: `<h2>Nueva consulta desde la landing</h2><table style="border-collapse:collapse">${filas}</table>`,
      }],
    };

    // 6) Enviar vía SendGrid
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (resp.status === 202) {
      return json({ ok: true });
    } else {
      const detalle = await resp.text();
      return json({ ok: false, error: `SendGrid respondió ${resp.status}: ${detalle}` }, 502);
    }
  } catch (e) {
    return json({ ok: false, error: "Error inesperado: " + e.message }, 500);
  }
}
