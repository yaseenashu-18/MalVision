import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

function getEnv(key: string, fallback = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key]!;
  }
  return fallback;
}

const SMTP_HOST = getEnv('SMTP_HOST', 'smtp.gmail.com');
const SMTP_PORT = parseInt(getEnv('SMTP_PORT', '587'), 10);
const SMTP_USER = getEnv('SMTP_USER', 'support.malvisionai@gmail.com');
const SMTP_PASSWORD = getEnv('SMTP_PASSWORD', 'recqnknnznozjlpp');
const SMTP_FROM_EMAIL = getEnv('MAIL_FROM_ADDRESS', getEnv('SMTP_FROM_EMAIL', 'support.malvisionai@gmail.com'));
const SMTP_FROM_NAME = getEnv('MAIL_FROM_NAME', getEnv('SMTP_FROM_NAME', 'MalVision'));

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Returns inline Base64 Data URI of MalVision logo for embedded image src (0 file attachments sent)
 */
function getLogoDataUri(): string {
  try {
    const possibleSvgPaths = [
      path.resolve(process.cwd(), 'src/assets/MalVision_logo_pixel_match.svg'),
      path.resolve(process.cwd(), 'dist/assets/MalVision_logo_pixel_match.svg'),
      path.resolve(__dirname, '../assets/MalVision_logo_pixel_match.svg'),
      path.resolve(__dirname, '../../src/assets/MalVision_logo_pixel_match.svg'),
    ];

    for (const p of possibleSvgPaths) {
      if (fs.existsSync(p)) {
        const svgContent = fs.readFileSync(p, 'utf8');
        const match = svgContent.match(/href="(data:image\/png;base64,[^"]+)"/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    const possiblePngPaths = [
      path.resolve(process.cwd(), 'src/assets/malvision_logo.png'),
      path.resolve(process.cwd(), 'dist/assets/malvision_logo.png'),
      path.resolve(__dirname, '../assets/malvision_logo.png'),
      path.resolve(__dirname, '../../src/assets/malvision_logo.png'),
    ];

    for (const p of possiblePngPaths) {
      if (fs.existsSync(p)) {
        const fileBuf = fs.readFileSync(p);
        return `data:image/png;base64,${fileBuf.toString('base64')}`;
      }
    }
  } catch {
    /* fallback to SVG icon */
  }

  return '';
}

/**
 * Shared MalVision Outer Shell & Header / Footer Layout (PURE WHITE / SINGLE CARD STYLE ONLY - NO INNER SQUARE PANEL)
 */
function renderMalVisionEmailShell(contentHtml: string, footerWarningHtml: string): string {
  const logoDataUri = getLogoDataUri();

  const logoHeaderHtml = `
    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
      <tr>
        <td valign="middle" style="padding-right: 8px; vertical-align: middle;">
          ${
            logoDataUri
              ? `<img src="${logoDataUri}" alt="MalVision Logo" height="28" style="display: block; height: 28px; width: auto; border: 0; outline: none;" />`
              : `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M4 22V6L10 16L14 9.5L18 16L24 6V22" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>`
          }
        </td>
        <td valign="middle" style="vertical-align: middle; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1;">
          MalVision
        </td>
      </tr>
    </table>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MalVision</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #ffffff; }
    @media only screen and (max-width: 600px) {
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 20px !important; }
      .card-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!-- Main Email Card (Pure White Single Card Style - No Inner Square Background) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 540px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 30px; border-collapse: separate; overflow: hidden; margin: 0 auto;">
          <tr>
            <td class="card-padding" style="padding: 38px 40px 36px 40px;">
              <!-- Header -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    ${logoHeaderHtml}
                  </td>
                  <td align="right" valign="middle" style="font-size: 13.5px; color: #1e293b; font-weight: 400; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; white-space: nowrap;">
                    See the risk before you open it.
                  </td>
                </tr>
              </table>

              <!-- Gap before content -->
              <div style="height: 32px; line-height: 32px; font-size: 1px;">&nbsp;</div>

              <!-- Main Content (Sits directly on main white card surface) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0 20px 0;">
                    ${contentHtml}
                  </td>
                </tr>
              </table>

              <!-- Gap after content -->
              <div style="height: 24px; line-height: 24px; font-size: 1px;">&nbsp;</div>

              <!-- Footer -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 13px; color: #64748b; font-weight: 400; text-align: center; line-height: 1.5; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="margin-bottom: 6px;">
                      ${footerWarningHtml}
                    </div>
                    <div style="color: #94a3b8; font-size: 12.5px;">
                      &copy; 2026 MalVision. All rights reserved.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds Email Verification / OTP HTML Template matching Reference Image 1
 */
export function buildVerificationEmailHtml(otp: string, expirationMinutes = 10): string {
  const contentHtml = `
    <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 800; color: #0f172a; text-align: center; letter-spacing: -0.5px; line-height: 1.2; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      Verify your email
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #64748b; text-align: center; font-weight: 400; line-height: 1.4; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      Your MalVision verification code is below:
    </p>

    <!-- OTP Display Box -->
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 18px; border-collapse: separate;">
      <tr>
        <td align="center" valign="middle" style="padding: 16px 48px; font-size: 34px; font-weight: 800; color: #475569; letter-spacing: 7px; font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace, -apple-system, sans-serif;">
          ${otp}
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13.5px; color: #64748b; text-align: center; font-weight: 400; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      This code expires in ${expirationMinutes} minutes.
    </p>
  `;

  const footerWarningHtml = `If you didn't request this email, you can safely ignore it.`;

  return renderMalVisionEmailShell(contentHtml, footerWarningHtml);
}

/**
 * Builds Password Reset HTML Template matching Reference Image 2
 */
export function buildPasswordResetEmailHtml(resetUrl: string, expirationMinutes = 15, securityUrl = 'https://malvision.vercel.app/#/login'): string {
  const contentHtml = `
    <h1 style="margin: 0 0 14px 0; font-size: 26px; font-weight: 800; color: #0f172a; text-align: center; letter-spacing: -0.5px; line-height: 1.2; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      Reset your password
    </h1>
    <p style="margin: 0 0 26px 0; font-size: 14.5px; color: #64748b; text-align: center; font-weight: 400; line-height: 1.55; max-width: 380px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      We received a request to reset your MalVision<br />password. Click the button below to set a new<br />password:
    </p>

    <!-- Primary Action Button -->
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 26px auto;">
      <tr>
        <td align="center" style="background-color: #7c8392; border-radius: 18px; padding: 0;">
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 38px; font-size: 15.5px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 18px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.2;">
            Set New Password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13.5px; color: #64748b; text-align: center; font-weight: 400; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      This password reset link expires in ${expirationMinutes} minutes.
    </p>
  `;

  const footerWarningHtml = `If you didn't request a password reset, then <a href="${securityUrl}" style="color: #475569; font-weight: 700; text-decoration: none;">secure account.</a>`;

  return renderMalVisionEmailShell(contentHtml, footerWarningHtml);
}

/**
 * Sends 6-digit OTP verification email from support.malvisionai@gmail.com
 */
export async function sendVerificationOtpEmail(toEmail: string, otp: string, _userName?: string, expirationMinutes = 10): Promise<boolean> {
  try {
    const fromAddress = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
    const htmlContent = buildVerificationEmailHtml(otp, expirationMinutes);

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Verify your MalVision email',
      text: `MalVision - Verify your email\n\nYour MalVision verification code is below:\n\n${otp}\n\nThis code expires in ${expirationMinutes} minutes.\nIf you didn't request this email, you can safely ignore it.\n© 2026 MalVision. All rights reserved.`,
      html: htmlContent,
    });

    console.log(`[EmailService] Verification OTP email successfully sent to ${toEmail} from ${fromAddress}`);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send OTP email:', err);
    return false;
  }
}

/**
 * Sends Password Reset link / code email from support.malvisionai@gmail.com
 */
export async function sendPasswordResetEmail(toEmail: string, resetCode: string, resetLink?: string, _userName?: string, expirationMinutes = 15): Promise<boolean> {
  try {
    const fromAddress = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
    const targetUrl = resetLink || `https://malvision.vercel.app/#/reset-password?code=${resetCode}`;
    const securityUrl = `https://malvision.vercel.app/#/login`;
    const htmlContent = buildPasswordResetEmailHtml(targetUrl, expirationMinutes, securityUrl);

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Reset your MalVision password',
      text: `MalVision - Reset your password\n\nWe received a request to reset your MalVision password. Click the link below to set a new password:\n${targetUrl}\n\nThis password reset link expires in ${expirationMinutes} minutes.\nIf you didn't request a password reset, then secure account: ${securityUrl}\n© 2026 MalVision. All rights reserved.`,
      html: htmlContent,
    });

    console.log(`[EmailService] Password Reset email successfully sent to ${toEmail} from ${fromAddress}`);
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send Password Reset email:', err);
    return false;
  }
}
