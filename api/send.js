const { Resend } = require('resend');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { senderName, recipients, subject, message, apiKey } = req.body;

    if (!apiKey || !recipients || !subject || !message) {
      return res.status(400).json({ error: 'Resend API Key aur baaki saare fields bharein!' });
    }

    const resend = new Resend(apiKey.trim());

    const recipientList = recipients
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'Atleast 1 recipient email chahiye!' });
    }

    let sent = 0;
    let failed = 0;
    const formattedSender = senderName && senderName.trim() ? senderName.trim() : 'Sender';

    for (const to of recipientList) {
      try {
        const data = await resend.emails.send({
          from: `${formattedSender} `,
          to: to,
          subject: subject,
          text: message
        });

        if (data.error) {
          failed++;
        } else {
          sent++;
        }
      } catch (err) {
        failed++;
      }
    }

    return res.status(200).json({
      success: true,
      sent: sent,
      failed: failed,
      message: `Email sending completed. Sent: \({sent}, Failed:\){failed}.`
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server Error' });
  }
};
