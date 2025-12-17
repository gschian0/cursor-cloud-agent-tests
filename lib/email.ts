import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEventNotification({
  to,
  eventTitle,
  eventStart,
  eventEnd,
  eventLocation,
}: {
  to: string
  eventTitle: string
  eventStart: Date
  eventEnd: Date
  eventLocation?: string
}) {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'calendar@yourdomain.com',
      to: [to],
      subject: `Event Reminder: ${eventTitle}`,
      html: `
        <h2>You have an upcoming event</h2>
        <p><strong>Event:</strong> ${eventTitle}</p>
        <p><strong>Start:</strong> ${eventStart.toLocaleString()}</p>
        <p><strong>End:</strong> ${eventEnd.toLocaleString()}</p>
        ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
      `,
    })

    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
