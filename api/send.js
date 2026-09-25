const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { senderName, email, appPassword, recipients, subject, message } = req.body;

    if (!email || !appPassword || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Sare fields bharo!' });
    }

    const recipientList = recipients
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'At least 1 recipient email chahiye!' });
    }

    if (recipientList.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 recipients allowed per request.' });
    }

    // Gmail SMTP Transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email.trim(),
        pass: appPassword.replace(/\s+/g, '') // Removes any accidentally pasted spaces
      }
    });

    let sent = 0;
    let failed = 0;

    const formattedSenderName = senderName && senderName.trim() ? senderName.trim() : 'Sender';
    const cleanEmail = email.trim();
    const fromHeader = `"\({formattedSenderName}" <\){cleanEmail}>`;

    for (const to of recipientList) {
      try {
        await transporter.sendMail({
          from: fromHeader,
          to: to,
          subject: subject,
          text: message, // Plain text version
          html: `
