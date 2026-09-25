const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { senderName, email, appPassword, recipients, subject, message } = req.body;

  if (!email || !appPassword || !recipients || !subject || !message) {
    return res.status(400).json({ error: 'Sare fields bharo!' });
  }

  const recipientList = recipients
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  if (recipientList.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 recipients allowed.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: appPassword
    }
  });

  let sent = 0;
  let failed = 0;

  // Name fix using String Concatenation
  const formattedSenderName = senderName && senderName.trim() ? senderName.trim() : 'Sender';
  const fromHeader = '"' + formattedSenderName + '" <' + email + '>';

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
      failed++;
    }
  }

  return res.status(200).json({
    success: true,
    sent: sent,
    failed: failed,
    message: 'Email sending completed. Sent: ' + sent + ', Failed: ' + failed + '.'
  });
};
