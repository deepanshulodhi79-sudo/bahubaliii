const { Resend } = require('resend');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { senderName, recipients, subject, message, apiKey } = req.body;

  if (!apiKey || !recipients || !subject || !message) {
    return res.status(400).json({ error: 'Sare fields bharo!' });
  }

  const resend = new Resend(apiKey);

  const recipientList = recipients
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0);

  let sent = 0;
  let failed = 0;

  for (const to of recipientList) {
    try {
      await resend.emails.send({
        from: `${senderName || 'Sender'} `,
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
