/**
 * Summit Wheels Admin - Email Templates
 * Professional, branded email templates for authentication flows
 *
 * SETUP: Replace LOGO_URL with your hosted logo URL (e.g., from Supabase Storage or CDN)
 */

// Configuration - Update these for your deployment
const EMAIL_CONFIG = {
  LOGO_URL: 'https://hkdvzffawpjgokrfimvj.supabase.co/storage/v1/object/public/assets/icon-512.png',
  COMPANY_NAME: 'Summit Wheels',
  SUPPORT_EMAIL: 'support@summitwheels.com',
  WEBSITE_URL: 'https://summitwheels.com',
  APP_STORE_URL: 'https://apps.apple.com/app/summit-wheels',
  PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.summitwheels',
  PRIMARY_COLOR: '#4F46E5',
  SECONDARY_COLOR: '#7C3AED',
  YEAR: new Date().getFullYear()
};

// Base HTML wrapper for all emails
const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${EMAIL_CONFIG.COMPANY_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      -webkit-font-smoothing: antialiased;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      background: linear-gradient(135deg, ${EMAIL_CONFIG.PRIMARY_COLOR} 0%, ${EMAIL_CONFIG.SECONDARY_COLOR} 100%);
      padding: 40px 20px;
      text-align: center;
    }

    .logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .brand-name {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 16px 0 4px 0;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      margin: 0;
    }

    .content {
      padding: 40px 32px;
    }

    .title {
      color: #18181b;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }

    .text {
      color: #52525b;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }

    .button-container {
      text-align: center;
      margin: 32px 0;
    }

    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${EMAIL_CONFIG.PRIMARY_COLOR} 0%, ${EMAIL_CONFIG.SECONDARY_COLOR} 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      transition: all 0.2s ease;
    }

    .button:hover {
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.45);
    }

    .code-box {
      background-color: #f4f4f5;
      border: 2px dashed #d4d4d8;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }

    .code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 32px;
      font-weight: 700;
      color: ${EMAIL_CONFIG.PRIMARY_COLOR};
      letter-spacing: 4px;
    }

    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }

    .warning-text {
      color: #92400e;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }

    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid ${EMAIL_CONFIG.PRIMARY_COLOR};
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }

    .info-text {
      color: #1e40af;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }

    .security-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 24px 0;
    }

    .security-text {
      color: #991b1b;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }

    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #e4e4e7;
      font-size: 14px;
    }

    .details-label {
      color: #71717a;
      width: 120px;
    }

    .details-value {
      color: #18181b;
      font-weight: 500;
    }

    .divider {
      height: 1px;
      background-color: #e4e4e7;
      margin: 32px 0;
    }

    .footer {
      background-color: #fafafa;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #e4e4e7;
    }

    .footer-links {
      margin-bottom: 20px;
    }

    .footer-link {
      color: #71717a;
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
    }

    .footer-link:hover {
      color: ${EMAIL_CONFIG.PRIMARY_COLOR};
    }

    .social-links {
      margin: 20px 0;
    }

    .social-icon {
      width: 32px;
      height: 32px;
      margin: 0 8px;
      opacity: 0.7;
    }

    .social-icon:hover {
      opacity: 1;
    }

    .footer-text {
      color: #a1a1aa;
      font-size: 12px;
      line-height: 1.6;
      margin: 0;
    }

    .footer-address {
      color: #a1a1aa;
      font-size: 11px;
      margin-top: 16px;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #18181b !important;
      }
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 20px !important;
      }
      .title {
        font-size: 20px !important;
      }
      .button {
        display: block !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text (hidden but shows in email preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Header component
const headerSection = () => `
<tr>
  <td class="header">
    <img src="${EMAIL_CONFIG.LOGO_URL}" alt="${EMAIL_CONFIG.COMPANY_NAME}" class="logo" width="80" height="80">
    <h1 class="brand-name">${EMAIL_CONFIG.COMPANY_NAME}</h1>
    <p class="brand-tagline">Admin Dashboard</p>
  </td>
</tr>
`;

// Footer component
const footerSection = () => `
<tr>
  <td class="footer">
    <div class="footer-links">
      <a href="${EMAIL_CONFIG.WEBSITE_URL}" class="footer-link">Website</a>
      <a href="${EMAIL_CONFIG.WEBSITE_URL}/help" class="footer-link">Help Center</a>
      <a href="${EMAIL_CONFIG.WEBSITE_URL}/privacy" class="footer-link">Privacy Policy</a>
    </div>
    <p class="footer-text">
      This email was sent by ${EMAIL_CONFIG.COMPANY_NAME}.<br>
      If you didn't request this email, you can safely ignore it.
    </p>
    <p class="footer-address">
      &copy; ${EMAIL_CONFIG.YEAR} ${EMAIL_CONFIG.COMPANY_NAME}. All rights reserved.
    </p>
  </td>
</tr>
`;

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Magic Link Sign-In Email
 */
export const magicLinkEmail = (data: {
  recipientName?: string;
  magicLink: string;
  expiresIn: string;
  ipAddress?: string;
  deviceInfo?: string;
}) => {
  const subject = `Sign in to ${EMAIL_CONFIG.COMPANY_NAME} Admin`;
  const preheader = `Click to securely sign in - link expires in ${data.expiresIn}`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Sign in to your account</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          Click the button below to securely sign in to your ${EMAIL_CONFIG.COMPANY_NAME} Admin account.
          No password needed!
        </p>

        <div class="button-container">
          <a href="${data.magicLink}" class="button">Sign In to Dashboard</a>
        </div>

        <div class="info-box">
          <p class="info-text">
            <strong>This link expires in ${data.expiresIn}</strong><br>
            For your security, this magic link can only be used once.
          </p>
        </div>

        ${data.ipAddress || data.deviceInfo ? `
        <div class="divider"></div>
        <p class="text" style="font-size: 13px; color: #71717a;">
          <strong>Request Details:</strong>
        </p>
        <table class="details-table">
          ${data.ipAddress ? `
          <tr>
            <td class="details-label">IP Address</td>
            <td class="details-value">${data.ipAddress}</td>
          </tr>
          ` : ''}
          ${data.deviceInfo ? `
          <tr>
            <td class="details-label">Device</td>
            <td class="details-value">${data.deviceInfo}</td>
          </tr>
          ` : ''}
          <tr>
            <td class="details-label">Time</td>
            <td class="details-value">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        ` : ''}

        <div class="warning-box">
          <p class="warning-text">
            <strong>Didn't request this?</strong><br>
            If you didn't try to sign in, someone may have entered your email by mistake.
            You can safely ignore this email.
          </p>
        </div>

        <p class="text" style="font-size: 12px; color: #a1a1aa;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all; color: ${EMAIL_CONFIG.PRIMARY_COLOR};">${data.magicLink}</span>
        </p>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Sign in to ${EMAIL_CONFIG.COMPANY_NAME} Admin

Click this link to sign in: ${data.magicLink}

This link expires in ${data.expiresIn} and can only be used once.

If you didn't request this email, you can safely ignore it.

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * Password Reset Email
 */
export const passwordResetEmail = (data: {
  recipientName?: string;
  resetLink: string;
  expiresIn: string;
  ipAddress?: string;
}) => {
  const subject = `Reset your ${EMAIL_CONFIG.COMPANY_NAME} Admin password`;
  const preheader = `Password reset requested - link expires in ${data.expiresIn}`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Reset your password</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          We received a request to reset your password for your ${EMAIL_CONFIG.COMPANY_NAME} Admin account.
          Click the button below to create a new password.
        </p>

        <div class="button-container">
          <a href="${data.resetLink}" class="button">Reset My Password</a>
        </div>

        <div class="info-box">
          <p class="info-text">
            <strong>This link expires in ${data.expiresIn}</strong><br>
            For security, this reset link can only be used once.
          </p>
        </div>

        <div class="security-box">
          <p class="security-text">
            <strong>Didn't request a password reset?</strong><br>
            If you didn't make this request, please ignore this email. Your password will remain unchanged.
            If you're concerned about your account security, please contact our support team.
          </p>
        </div>

        <div class="divider"></div>

        <p class="text" style="font-size: 13px;">
          <strong>Password Requirements:</strong>
        </p>
        <ul style="color: #52525b; font-size: 13px; line-height: 1.8; padding-left: 20px;">
          <li>At least 12 characters long</li>
          <li>One uppercase letter (A-Z)</li>
          <li>One lowercase letter (a-z)</li>
          <li>One number (0-9)</li>
          <li>One special character (!@#$%^&*)</li>
        </ul>

        <p class="text" style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
          If the button doesn't work, copy and paste this link:<br>
          <span style="word-break: break-all; color: ${EMAIL_CONFIG.PRIMARY_COLOR};">${data.resetLink}</span>
        </p>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Reset your ${EMAIL_CONFIG.COMPANY_NAME} Admin password

Click this link to reset your password: ${data.resetLink}

This link expires in ${data.expiresIn} and can only be used once.

Password Requirements:
- At least 12 characters long
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

If you didn't request this, you can safely ignore this email.

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * Email Confirmation Email
 */
export const emailConfirmationEmail = (data: {
  recipientName?: string;
  confirmLink: string;
  expiresIn: string;
}) => {
  const subject = `Confirm your ${EMAIL_CONFIG.COMPANY_NAME} Admin email`;
  const preheader = `Please verify your email address to activate your account`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Verify your email address</h2>
        <p class="text">
          ${data.recipientName ? `Welcome ${data.recipientName}!` : 'Welcome!'}<br><br>
          Thank you for creating a ${EMAIL_CONFIG.COMPANY_NAME} Admin account.
          Please confirm your email address by clicking the button below.
        </p>

        <div class="button-container">
          <a href="${data.confirmLink}" class="button">Verify Email Address</a>
        </div>

        <div class="info-box">
          <p class="info-text">
            <strong>This link expires in ${data.expiresIn}</strong><br>
            After verification, you'll have full access to the admin dashboard.
          </p>
        </div>

        <div class="divider"></div>

        <p class="text" style="font-size: 14px;">
          <strong>What you can do after verification:</strong>
        </p>
        <ul style="color: #52525b; font-size: 14px; line-height: 2; padding-left: 20px;">
          <li>Access the investor analytics dashboard</li>
          <li>View real-time game metrics and KPIs</li>
          <li>Generate comprehensive reports</li>
          <li>Manage game configuration</li>
        </ul>

        <p class="text" style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
          If the button doesn't work, copy and paste this link:<br>
          <span style="word-break: break-all; color: ${EMAIL_CONFIG.PRIMARY_COLOR};">${data.confirmLink}</span>
        </p>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Verify your ${EMAIL_CONFIG.COMPANY_NAME} Admin email

Click this link to verify your email: ${data.confirmLink}

This link expires in ${data.expiresIn}.

After verification, you'll have full access to the admin dashboard.

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * Password Changed Notification Email
 */
export const passwordChangedEmail = (data: {
  recipientName?: string;
  changedAt: Date;
  ipAddress?: string;
  deviceInfo?: string;
}) => {
  const subject = `Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password was changed`;
  const preheader = `Your password was successfully changed`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Password successfully changed</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password was successfully changed.
        </p>

        <table class="details-table">
          <tr>
            <td class="details-label">Changed At</td>
            <td class="details-value">${data.changedAt.toLocaleString()}</td>
          </tr>
          ${data.ipAddress ? `
          <tr>
            <td class="details-label">IP Address</td>
            <td class="details-value">${data.ipAddress}</td>
          </tr>
          ` : ''}
          ${data.deviceInfo ? `
          <tr>
            <td class="details-label">Device</td>
            <td class="details-value">${data.deviceInfo}</td>
          </tr>
          ` : ''}
        </table>

        <div class="security-box">
          <p class="security-text">
            <strong>Didn't change your password?</strong><br>
            If you didn't make this change, your account may be compromised.
            Please reset your password immediately and contact our support team.
          </p>
        </div>

        <div class="button-container">
          <a href="${EMAIL_CONFIG.WEBSITE_URL}/admin/auth/reset-password" class="button" style="background: #ef4444;">
            Reset Password Now
          </a>
        </div>

        <div class="divider"></div>

        <p class="text" style="font-size: 13px; color: #71717a;">
          <strong>Security Tips:</strong>
        </p>
        <ul style="color: #71717a; font-size: 13px; line-height: 1.8; padding-left: 20px;">
          <li>Never share your password with anyone</li>
          <li>Use a unique password for each account</li>
          <li>Enable two-factor authentication for extra security</li>
          <li>Regularly review your account activity</li>
        </ul>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password was changed

Changed At: ${data.changedAt.toLocaleString()}
${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
${data.deviceInfo ? `Device: ${data.deviceInfo}` : ''}

If you didn't make this change, please reset your password immediately at:
${EMAIL_CONFIG.WEBSITE_URL}/admin/auth/reset-password

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * New Login Alert Email
 */
export const newLoginAlertEmail = (data: {
  recipientName?: string;
  loginTime: Date;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  browser?: string;
}) => {
  const subject = `New sign-in to your ${EMAIL_CONFIG.COMPANY_NAME} Admin account`;
  const preheader = `New login detected from ${data.location || data.ipAddress || 'a new device'}`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">New sign-in detected</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          We detected a new sign-in to your ${EMAIL_CONFIG.COMPANY_NAME} Admin account.
        </p>

        <div class="info-box">
          <p class="info-text" style="font-size: 14px;">
            <strong>If this was you, no action is needed.</strong>
          </p>
        </div>

        <table class="details-table">
          <tr>
            <td class="details-label">Time</td>
            <td class="details-value">${data.loginTime.toLocaleString()}</td>
          </tr>
          ${data.ipAddress ? `
          <tr>
            <td class="details-label">IP Address</td>
            <td class="details-value">${data.ipAddress}</td>
          </tr>
          ` : ''}
          ${data.location ? `
          <tr>
            <td class="details-label">Location</td>
            <td class="details-value">${data.location}</td>
          </tr>
          ` : ''}
          ${data.deviceInfo ? `
          <tr>
            <td class="details-label">Device</td>
            <td class="details-value">${data.deviceInfo}</td>
          </tr>
          ` : ''}
          ${data.browser ? `
          <tr>
            <td class="details-label">Browser</td>
            <td class="details-value">${data.browser}</td>
          </tr>
          ` : ''}
        </table>

        <div class="security-box">
          <p class="security-text">
            <strong>Wasn't you?</strong><br>
            If you don't recognize this sign-in activity, your account may be compromised.
            Please change your password immediately and review your account security settings.
          </p>
        </div>

        <div class="button-container">
          <a href="${EMAIL_CONFIG.WEBSITE_URL}/admin/settings" class="button">
            Review Account Security
          </a>
        </div>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
New sign-in to your ${EMAIL_CONFIG.COMPANY_NAME} Admin account

Time: ${data.loginTime.toLocaleString()}
${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
${data.location ? `Location: ${data.location}` : ''}
${data.deviceInfo ? `Device: ${data.deviceInfo}` : ''}
${data.browser ? `Browser: ${data.browser}` : ''}

If this was you, no action is needed.

If you don't recognize this activity, please change your password immediately at:
${EMAIL_CONFIG.WEBSITE_URL}/admin/settings

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * Two-Factor Authentication Enabled Email
 */
export const twoFactorEnabledEmail = (data: {
  recipientName?: string;
  enabledAt: Date;
}) => {
  const subject = `Two-factor authentication enabled on your ${EMAIL_CONFIG.COMPANY_NAME} account`;
  const preheader = `2FA has been successfully enabled for added security`;

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Two-factor authentication enabled</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          Great news! Two-factor authentication (2FA) has been successfully enabled on your
          ${EMAIL_CONFIG.COMPANY_NAME} Admin account.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 20px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4"></path>
            </svg>
          </div>
        </div>

        <table class="details-table">
          <tr>
            <td class="details-label">Enabled At</td>
            <td class="details-value">${data.enabledAt.toLocaleString()}</td>
          </tr>
          <tr>
            <td class="details-label">Method</td>
            <td class="details-value">Authenticator App (TOTP)</td>
          </tr>
        </table>

        <div class="info-box">
          <p class="info-text">
            <strong>Keep your backup codes safe!</strong><br>
            If you lose access to your authenticator app, you'll need your backup codes to sign in.
            Store them in a secure location.
          </p>
        </div>

        <div class="divider"></div>

        <p class="text" style="font-size: 13px; color: #71717a;">
          From now on, you'll need to enter a verification code from your authenticator app
          each time you sign in. This adds an extra layer of security to protect your account.
        </p>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Two-factor authentication enabled

2FA has been successfully enabled on your ${EMAIL_CONFIG.COMPANY_NAME} Admin account.

Enabled At: ${data.enabledAt.toLocaleString()}
Method: Authenticator App (TOTP)

Keep your backup codes safe! If you lose access to your authenticator app,
you'll need your backup codes to sign in.

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

/**
 * Password Expiry Warning Email
 */
export const passwordExpiryWarningEmail = (data: {
  recipientName?: string;
  daysUntilExpiry: number;
  expiryDate: Date;
}) => {
  const subject = `Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password expires in ${data.daysUntilExpiry} days`;
  const preheader = `Please update your password before it expires`;

  const urgencyColor = data.daysUntilExpiry <= 7 ? '#ef4444' : '#f59e0b';

  const content = `
    ${headerSection()}
    <tr>
      <td class="content">
        <h2 class="title">Password expiring soon</h2>
        <p class="text">
          ${data.recipientName ? `Hi ${data.recipientName},` : 'Hi there,'}<br><br>
          Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password will expire in
          <strong style="color: ${urgencyColor};">${data.daysUntilExpiry} days</strong>.
        </p>

        <div class="code-box" style="border-color: ${urgencyColor};">
          <p style="margin: 0; color: ${urgencyColor}; font-size: 18px; font-weight: 600;">
            Expires: ${data.expiryDate.toLocaleDateString()}
          </p>
        </div>

        <p class="text">
          To maintain access to your account, please update your password before it expires.
        </p>

        <div class="button-container">
          <a href="${EMAIL_CONFIG.WEBSITE_URL}/admin/settings" class="button">
            Change Password Now
          </a>
        </div>

        <div class="warning-box">
          <p class="warning-text">
            <strong>Why do passwords expire?</strong><br>
            Regular password changes help protect your account from unauthorized access.
            For security, admin passwords must be updated every 6 months.
          </p>
        </div>
      </td>
    </tr>
    ${footerSection()}
  `;

  return {
    subject,
    html: baseTemplate(content, preheader),
    text: `
Password expiring soon

Your ${EMAIL_CONFIG.COMPANY_NAME} Admin password will expire in ${data.daysUntilExpiry} days.
Expiry Date: ${data.expiryDate.toLocaleDateString()}

Please update your password before it expires:
${EMAIL_CONFIG.WEBSITE_URL}/admin/settings

- The ${EMAIL_CONFIG.COMPANY_NAME} Team
    `.trim()
  };
};

// Export configuration for customization
export { EMAIL_CONFIG };
