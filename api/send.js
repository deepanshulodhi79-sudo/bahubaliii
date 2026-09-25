const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS configuration
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
    // Body parse handling for Vercel Serverless
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const { senderName, email, appPassword, recipients, subject, message } = body || {};

    if (!email || !appPassword || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Sare fields bharna zaroori hai!' });
    }

    const cleanEmail = email.trim();
    // Spaces remove karein App Password se
    const cleanPassword = appPassword.replace(/\s+/g, '');

    const recipientList = recipients
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'Kam se kam 1 recipient email daliye!' });
    }

    // Direct Google SMTP Configuration (Fixes Vercel Connection Timeout)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL Connection
      auth: {
        user: cleanEmail,
        pass: cleanPassword
      },
      connectionTimeout: 10000 // 10 seconds timeout limit
    });

    let sent = 0;
    let failed = 0;
    let errorMessage = '';

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
