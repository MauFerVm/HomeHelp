const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');

let transporter = null;

const SECCIONES_DESTINO = new Set([
  'buscar-trabajo',
  'mis-presupuestos',
  'calendario',
  'mis-servicios',
  'trabajos-asignados'
]);

const estaConfigurado = () => Boolean(mailConfig.host && mailConfig.user && mailConfig.pass);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure || Number(mailConfig.port) === 465,
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass
      }
    });
  }
  return transporter;
};

const escaparHtml = (valor) => String(valor)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const baseCliente = () => String(mailConfig.clientUrl || 'http://localhost:3000').replace(/\/$/, '');

const urlDestino = (seccion) => {
  const base = baseCliente();
  if (!SECCIONES_DESTINO.has(seccion)) {
    return `${base}/main`;
  }
  return `${base}/main?seccion=${encodeURIComponent(seccion)}`;
};

const filasDetalle = (detalles) => (Array.isArray(detalles) ? detalles : [])
  .filter((fila) => fila && fila.etiqueta && String(fila.valor ?? '').trim() !== '');

const armarPresentacion = ({ titulo, introduccion, detalles = [], nota, botonTexto, url }) => {
  const filas = filasDetalle(detalles);
  const textoDetalles = filas.map((fila) => `${fila.etiqueta}: ${fila.valor}`).join('\n');
  const text = [
    'HomeHelp',
    '',
    titulo,
    '',
    introduccion || '',
    textoDetalles ? `\n${textoDetalles}` : '',
    nota ? `\n${nota}` : '',
    '',
    `${botonTexto}: ${url}`
  ].filter((linea, indice, lista) => !(linea === '' && lista[indice - 1] === '')).join('\n');

  const filasHtml = filas.map((fila) => `
    <tr>
      <td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:13px;color:#6b7280;width:130px;vertical-align:top;">${escaparHtml(fila.etiqueta)}</td>
      <td style="padding:10px 14px;font-family:Arial,sans-serif;font-size:15px;color:#1f2937;font-weight:700;">${escaparHtml(fila.valor)}</td>
    </tr>
  `).join('');

  const tarjeta = filasHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;">${filasHtml}</table>`
    : '';

  const notaHtml = nota
    ? `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#4b5563;">${escaparHtml(nota)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#FF6B35;padding:20px 28px;">
              <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">HomeHelp</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:22px;line-height:1.3;color:#1f2937;">${escaparHtml(titulo)}</h1>
              ${introduccion ? `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#4b5563;">${escaparHtml(introduccion)}</p>` : ''}
              ${tarjeta}
              ${notaHtml}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:8px;background:#FF6B35;">
                    <a href="${escaparHtml(url)}" style="display:inline-block;padding:12px 22px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escaparHtml(botonTexto)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;">
              El botón abre HomeHelp en la pantalla correspondiente. La acción se hace dentro de la app.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
};

const enviarCorreo = async ({ to, subject, text, html }) => {
  if (!to) return;

  if (!estaConfigurado()) {
    console.warn(`Correo no enviado a ${to}: falta configurar SMTP en server/config/mail.js. Asunto: ${subject}`);
    return;
  }

  await getTransporter().sendMail({
    from: mailConfig.from,
    to,
    subject,
    text,
    html: html || `<p>${escaparHtml(text)}</p>`
  });
};

module.exports = {
  enviarCorreo,
  armarPresentacion,
  urlDestino
};
