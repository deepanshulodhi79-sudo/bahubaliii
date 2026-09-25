const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { senderName, email, appPassword, recipients, subject, message } = body || {};

    if (!email || !appPassword || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    const cleanEmail = email.trim();
    const cleanPassword = appPassword.replace(/\s+/g, '');

    const recipientList = recipients
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'At least one recipient email is required.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanEmail,
        pass: cleanPassword
      }
    });

    let sent = 0;
    let failed = 0;
    let lastError = '';

    const formattedSenderName = senderName && senderName.trim() ? senderName.trim() : 'Sender';
    const fromHeader = `"\({formattedSenderName}" <\){cleanEmail}>`;

    for (const to of recipientList) {
      try {
        await transporter.sendMail({
          from: fromHeader,
          to: to,
          subject: subject,
          text: message,
          html: `
