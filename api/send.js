const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  try {
    // Get request body
    let body = req.body;

    // If body is string, parse JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const {
      senderName,
      email,
      appPassword,
      recipients,
      subject,
      message
    } = body || {};

    // Validate required fields
    if (
      !email ||
      !appPassword ||
      !recipients ||
      !subject ||
      !message
    ) {
      return res.status(400).json({
        error: 'Sare fields bharna zaroori hai!'
      });
    }

    // Clean email and app password
    const cleanEmail = String(email).trim();
    const cleanPassword = String(appPassword).replace(/\s+/g, '');

    // Convert recipients into array
    const recipientList = String(recipients)
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({
        error: 'At least 1 recipient email chahiye!'
      });
    }

    // Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanEmail,
        pass: cleanPassword
      }
    });

    // Sender display name
    const displayName =
      senderName && String(senderName).trim()
        ? String(senderName).trim()
        : 'Sender';

    // IMPORTANT:
    // This makes the sender appear as:
    // "Clair" <example@gmail.com>
    const fromHeader = `"${displayName}" <${cleanEmail}>`;

    let sent = 0;
    let failed = 0;
    let lastError = '';

    // Send emails one by one
    for (const to of recipientList) {
      try {
        await transporter.sendMail({
          from: fromHeader,
          to: to,
          subject: subject,
          text: message,
          html: message,
          replyTo: cleanEmail
        });

        sent++;
      } catch (err) {
        failed++;
        lastError = err.message || String(err);
      }
    }

    // If all emails failed
    if (sent === 0 && failed > 0) {
      return res.status(400).json({
        error: `Gmail Error: ${lastError}`
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      sent: sent,
      failed: failed,
      message: `Email sending completed. Sent: ${sent}, Failed: ${failed}.`
    });

  } catch (error) {
    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
};
