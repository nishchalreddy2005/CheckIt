import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendMailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMail({ to, subject, html, text }: SendMailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"CheckIt" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    })

    console.log("Email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

// Beautiful HTML email template
export function emailTemplate(title: string, body: string, buttonText?: string, buttonUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a3e 0%,#0d0d2b 100%);border-radius:16px;border:1px solid rgba(99,102,241,0.2);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 16px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">✓ CheckIt</h1>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:8px 40px 16px;text-align:center;">
              <h2 style="margin:0;font-size:22px;color:#e2e8f0;font-weight:600;">${title}</h2>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:16px 40px;color:#94a3b8;font-size:15px;line-height:1.7;">
              ${body}
            </td>
          </tr>
          
          <!-- Button -->
          ${buttonText && buttonUrl ? `
          <tr>
            <td style="padding:16px 40px 32px;text-align:center;">
              <a href="${buttonUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;box-shadow:0 4px 20px rgba(99,102,241,0.4);">${buttonText}</a>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">This email was sent by CheckIt Task Management.<br>If you did not request this, please ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendOtpEmail(to: string, code: string, purpose: string): Promise<boolean> {
  const htmlBody = `
        <div style="text-align: center; font-size: 16px; color: #cbd5e1; margin-bottom: 24px;">
            <p>You have requested an OTP for <strong>${purpose}</strong>.</p>
            <p>Please use the following 6-digit code to complete your request:</p>
            
            <div style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 24px 0; text-shadow: 0 0 10px rgba(99,102,241,0.5);">
                ${code}
            </div>
            
            <p style="font-size: 14px; color: #94a3b8; margin-top: 24px;">This code will expire in 10 minutes. If you did not request this, please secure your account immediately.</p>
        </div>
    `

  const html = emailTemplate(
    "Your Verification Code",
    htmlBody
  )

  return sendMail({
    to,
    subject: `Your CheckIt verification code: ${code}`,
    html
  })
}
