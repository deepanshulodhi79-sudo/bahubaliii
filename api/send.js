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
      return res.status(400).json({ error: 'Atleast 1 recipient email chahiye!' });
    }

    if (recipientList.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 recipients allowed.' });
    }

    // Transporter configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL use karein
      auth: {
        user: email.trim(),
        pass: appPassword.replace(/\s+/g, '') // App password ke saare spaces remove karein
      }
    });

    let sent = 0;
    let failed = 0;

    const formattedSenderName = senderName && senderName.trim() ? senderName.trim() : 'Sender';
    const fromHeader = '"' + formattedSenderName + '" <' + email.trim() + '>';

    for (const to of recipientList) {
      try {
        await transporter.sendMail({
          from: fromHeader,
          to: to,
          subject: subject,
          text: message
        });
        sent++;
      } catch (err) {
        console.error('Mail error for ' + to + ':', err);
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      sent: sent,
      failed: failed,
      message: 'Email sending completed. Sent: ' + sent + ', Failed: ' + failed + '.'
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: error.message || 'Server Internal Error' });
  }
};
