const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const buildTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP configuration');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

app.post('/api/reminders', async (req, res) => {
  const { to, from, subject, text } = req.body || {};

  if (!to || !from || !subject || !text) {
    return res.status(400).json({ error: 'to, from, subject, and text are required' });
  }

  try {
    const transporter = buildTransporter();
    const info = await transporter.sendMail({ to, from, subject, text });
    return res.status(200).json({ status: 'sent', messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

const port = Number(process.env.REMINDERS_PORT || 8787);
app.listen(port, () => {
  console.log(`Reminders API listening on port ${port}`);
});
