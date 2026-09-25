const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, appPassword, recipients, subject, message, senderName } = req.body || {};

    if (!email || !appPassword || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: email.trim(),
        pass: appPassword.replace(/\s+/g, '')
      }
    });

    const recipientList = recipients.split('\n').map(e => e.trim()).filter(Boolean);

    await transporter.sendMail({
      from: `"\({senderName || 'Sender'}" <\){email.trim()}>`,
      to: recipientList,
      subject: subject,
      text: message
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully!' });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown Server Error' });
  }
};
