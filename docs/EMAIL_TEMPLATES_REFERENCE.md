# Summit Wheels Admin - Email Templates Reference

Copy and paste these templates into your email service (SendGrid, AWS SES, Resend, etc.)

---

## 1. Magic Link Sign-In

**Subject:**
```
Sign in to Summit Wheels Admin
```

**Preheader:**
```
Click to securely sign in - link expires in 15 minutes
```

**Plain Text Body:**
```
Sign in to Summit Wheels Admin

Hi {{name}},

Click this link to sign in to your account:
{{magic_link}}

This link expires in 15 minutes and can only be used once.

Request Details:
- Time: {{timestamp}}
- IP Address: {{ip_address}}

If you didn't request this email, you can safely ignore it.

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 2. Password Reset

**Subject:**
```
Reset your Summit Wheels Admin password
```

**Preheader:**
```
Password reset requested - link expires in 1 hour
```

**Plain Text Body:**
```
Reset your Summit Wheels Admin password

Hi {{name}},

We received a request to reset your password. Click this link to create a new password:
{{reset_link}}

This link expires in 1 hour and can only be used once.

Password Requirements:
- At least 12 characters long
- One uppercase letter (A-Z)
- One lowercase letter (a-z)
- One number (0-9)
- One special character (!@#$%^&*)

If you didn't request this, you can safely ignore this email. Your password will remain unchanged.

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 3. Email Confirmation

**Subject:**
```
Confirm your Summit Wheels Admin email
```

**Preheader:**
```
Please verify your email address to activate your account
```

**Plain Text Body:**
```
Verify your Summit Wheels Admin email

Welcome {{name}}!

Thank you for creating an account. Please verify your email address:
{{confirm_link}}

This link expires in 24 hours.

After verification, you'll have full access to:
- Investor analytics dashboard
- Real-time game metrics and KPIs
- Comprehensive report generation
- Game configuration management

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 4. Password Changed Notification

**Subject:**
```
Your Summit Wheels Admin password was changed
```

**Preheader:**
```
Your password was successfully changed
```

**Plain Text Body:**
```
Password Successfully Changed

Hi {{name}},

Your Summit Wheels Admin password was successfully changed.

Details:
- Changed At: {{changed_at}}
- IP Address: {{ip_address}}
- Device: {{device_info}}

IMPORTANT: If you didn't make this change, your account may be compromised.
Please reset your password immediately at:
{{reset_password_url}}

Security Tips:
- Never share your password with anyone
- Use a unique password for each account
- Enable two-factor authentication for extra security
- Regularly review your account activity

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 5. New Login Alert

**Subject:**
```
New sign-in to your Summit Wheels Admin account
```

**Preheader:**
```
New login detected from {{location}}
```

**Plain Text Body:**
```
New Sign-In Detected

Hi {{name}},

We detected a new sign-in to your Summit Wheels Admin account.

If this was you, no action is needed.

Sign-In Details:
- Time: {{login_time}}
- IP Address: {{ip_address}}
- Location: {{location}}
- Device: {{device_info}}
- Browser: {{browser}}

WASN'T YOU?
If you don't recognize this sign-in activity, your account may be compromised.
Please change your password immediately at:
{{security_settings_url}}

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 6. Two-Factor Authentication Enabled

**Subject:**
```
Two-factor authentication enabled on your Summit Wheels account
```

**Preheader:**
```
2FA has been successfully enabled for added security
```

**Plain Text Body:**
```
Two-Factor Authentication Enabled

Hi {{name}},

Great news! Two-factor authentication (2FA) has been successfully enabled on your Summit Wheels Admin account.

Details:
- Enabled At: {{enabled_at}}
- Method: Authenticator App (TOTP)

IMPORTANT: Keep your backup codes safe!
If you lose access to your authenticator app, you'll need your backup codes to sign in.
Store them in a secure location.

From now on, you'll need to enter a verification code from your authenticator app each time you sign in.

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## 7. Password Expiry Warning

**Subject:**
```
Your Summit Wheels Admin password expires in {{days}} days
```

**Preheader:**
```
Please update your password before it expires
```

**Plain Text Body:**
```
Password Expiring Soon

Hi {{name}},

Your Summit Wheels Admin password will expire in {{days_until_expiry}} days.
Expiry Date: {{expiry_date}}

To maintain access to your account, please update your password before it expires:
{{change_password_url}}

Why do passwords expire?
Regular password changes help protect your account from unauthorized access.
For security, admin passwords must be updated every 6 months.

- The Summit Wheels Team

© 2026 Summit Wheels. All rights reserved.
```

---

## Email Service Setup

### For SendGrid:

1. Go to SendGrid Dashboard → Email API → Dynamic Templates
2. Create a new template for each email type
3. Use the HTML from `emailTemplates.ts` as the template
4. Replace variables with SendGrid handlebars: `{{variable}}`

### For AWS SES:

1. Create email templates using AWS CLI or Console
2. Use the HTML templates with SES template variables
3. Replace variables with SES format: `{{variable}}`

### For Resend:

```typescript
import { Resend } from 'resend';
import { magicLinkEmail } from './templates/emailTemplates';

const resend = new Resend('re_xxxxx');

const email = magicLinkEmail({
  recipientName: 'John',
  magicLink: 'https://...',
  expiresIn: '15 minutes'
});

await resend.emails.send({
  from: 'Summit Wheels <noreply@summitwheels.com>',
  to: 'john@example.com',
  subject: email.subject,
  html: email.html,
  text: email.text
});
```

---

## Logo Setup

Upload your app icon to Supabase Storage:

1. Go to Supabase Dashboard → Storage
2. Create a bucket called `assets` (make it public)
3. Upload `assets/icon-512.png` from the project
4. Update `EMAIL_CONFIG.LOGO_URL` in `emailTemplates.ts` with the public URL

Public URL format:
```
https://[project-id].supabase.co/storage/v1/object/public/assets/icon-512.png
```

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{name}}` | Recipient's name | John |
| `{{magic_link}}` | Magic link URL | https://... |
| `{{reset_link}}` | Password reset URL | https://... |
| `{{confirm_link}}` | Email confirmation URL | https://... |
| `{{timestamp}}` | Request timestamp | Feb 3, 2026, 10:30 AM |
| `{{ip_address}}` | User's IP address | 192.168.1.1 |
| `{{device_info}}` | Device description | Windows 11, Chrome |
| `{{location}}` | Geographic location | San Francisco, CA |
| `{{browser}}` | Browser name | Chrome 120 |
| `{{days_until_expiry}}` | Days until password expires | 7 |
| `{{expiry_date}}` | Password expiry date | March 1, 2026 |
