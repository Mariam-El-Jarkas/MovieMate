// Sends optional email notifications with Resend (https://resend.com).
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, text }) {
  if (!mailConfigured()) throw new Error('Email delivery is not configured.');
  const from = process.env.MAIL_FROM?.trim();
  if (!from) throw new Error('MAIL_FROM is required when email delivery is configured.');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) console.error('Resend error:', res.status, await res.text());
  return res.ok;
}
