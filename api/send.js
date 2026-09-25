const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { senderName, email, appPassword, recipients, subject, message } = body || {};

    if (!email || !appPassword || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Sare fields bharna zaroori hai!' });
    }

    const cleanEmail = email.trim();
    const cleanPassword = appPassword.replace(/\s+/g, ''); // Removes spaces from App Password

    const recipientList = recipients
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'At least 1 recipient email chahiye!' });
    }

    // SMTP Config
    const transporter = nodemailer.createTransport({
      service: 'gmail',
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
