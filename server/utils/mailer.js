const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');

let transporter = null;

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

const enviarCorreo = async ({ to, subject, text }) => {
  if (!to) return;

  if (!estaConfigurado()) {
    console.warn(`Correo no enviado a ${to}: falta configurar SMTP en server/config/mail.js. Mensaje: ${text}`);
    return;
  }

  await getTransporter().sendMail({
    from: mailConfig.from,
    to,
    subject,
    text,
    html: `<p>${escaparHtml(text)}</p>`
  });
};

module.exports = {
  enviarCorreo
};
