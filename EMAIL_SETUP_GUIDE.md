# Email Configuration Guide for Fleet Marketplace

Your Fleet Marketplace now includes email functionality that will send:
- ✅ Email verification when users register
- ✅ Company verification notifications
- ✅ Booking confirmation emails to both customers and providers

## 🚀 Quick Setup (Gmail SMTP)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. In Google Account Security, find "App passwords"
2. Generate a new app password for "Mail"
3. Copy the 16-character password (no spaces)

### Step 3: Configure Backend Environment
Edit `/app/backend/.env` and fill in these values:

```env
# Replace with your actual Gmail credentials
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_FROM=your-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME=Fleet Marketplace Platform
```

### Step 4: Restart Backend
```bash
sudo supervisorctl restart backend
```

## 🧪 Test Email Functionality

Once configured, test by:

1. **Register a new user** - You should receive a verification email
2. **Complete company registration** - You should receive a company verified email  
3. **Create a booking** - Both customer and provider should receive confirmation emails

## 📧 Email Templates Included

Your system includes professional HTML email templates:

- **verification_email.html** - Welcome email with verification link
- **company_verified.html** - Company approval notification  
- **booking_confirmation_customer.html** - Booking confirmation for customers
- **booking_confirmation_provider.html** - New booking notification for providers

## 🔒 Security Notes

- ✅ Uses App Passwords (more secure than regular passwords)
- ✅ Verification tokens expire in 24 hours
- ✅ All email links use HTTPS
- ✅ Tokens are hashed before database storage

## 🚫 Current State (Email Not Configured)

Currently, emails are **disabled** because credentials are not set. The system will:
- ✅ Still allow registration and login
- ✅ Log email attempts to console  
- ⚠️ Show "Email not configured" warnings in logs
- ❌ Not send actual emails

## ✨ Benefits Once Configured

1. **Better User Experience**: Users receive immediate confirmation
2. **Verification Security**: Email verification prevents fake accounts
3. **Business Communication**: Automatic booking confirmations
4. **Professional Branding**: Branded email templates with your platform

## 🎯 Alternative SMTP Providers

Instead of Gmail, you can use:

- **SendGrid**: Professional email service
- **AWS SES**: Cost-effective for high volumes  
- **Mailgun**: Developer-friendly email API
- **Outlook/Hotmail**: Similar to Gmail setup

Just update the SMTP settings in `.env` file accordingly.

## 🆘 Troubleshooting

**Email not sending?**
1. Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
2. Verify credentials are correct
3. Ensure 2-step verification is enabled
4. Try regenerating the app password

**Getting authentication errors?**
- Make sure you're using the App Password, not your regular password
- Check that MAIL_USERNAME and MAIL_FROM are the same email address

## 🔧 Testing Without Email Setup

You can test the full registration flow without email:
1. Register a user (you'll see "email not configured" in logs)
2. The verification step is automatically marked as complete
3. Company registration works immediately
4. Booking confirmations are logged but not emailed

Once you add email credentials, restart the backend and all email functionality will work automatically!