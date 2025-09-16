# Email Notification System Setup

This document explains how to set up the email notification system for Campus Marketplace.

## 🚀 Features

- **Email Collection**: Collect emails from countdown banner, countdown modal, and landing page
- **Database Storage**: Store subscribers in Supabase database
- **Email Notifications**: Send beautiful HTML emails using Resend
- **Launch Notifications**: Send notifications to all subscribers when launching

## 📋 Prerequisites

1. Supabase project with API access
2. Resend account with API key
3. Node.js environment variables configured

## 🛠️ Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of scripts/create-subscribers-table.sql
```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zxqgdxydzolafekafljr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4cWdkeHlkem9sYWZla2FmbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzExODIsImV4cCI6MjA3MzUwNzE4Mn0.XtXy8hG5nfLrTKabyLJvFvn3BAaOmhaNyzMxPzpLrY0

# Resend API Key
RESEND_API_KEY=re_XorZYMSo_FydyMvRMjw8mooMaaz3Arspe

# Email domain for sending emails
EMAIL_DOMAIN=email.campusmarket.co.zw

# Admin API Key (for sending notifications)
ADMIN_API_KEY=your-secure-admin-key-here
```

### 3. Install Dependencies

```bash
pnpm install @supabase/supabase-js resend
```

## 📧 Email Collection Points

### 1. Countdown Banner
- Appears at the top of the page
- Collects emails with source: `countdown_banner`
- Dismissible with close button

### 2. Countdown Modal
- Shows when users click any navigation button
- Collects emails with source: `countdown_modal`
- Includes countdown timer and email form

### 3. Landing Page Form
- Dedicated email signup section
- Collects emails with source: `landing_page`
- Clean, focused design

## 🔧 API Endpoints

### POST /api/subscribe
Subscribe a user to email notifications.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "countdown_banner" // or "countdown_modal" or "landing_page"
}
```

**Response:**
```json
{
  "message": "Successfully subscribed! Check your email for confirmation.",
  "email": "user@example.com"
}
```

### POST /api/notify-subscribers
Send notifications to all active subscribers.

**Request:**
```json
{
  "subject": "🚀 Campus Marketplace is Live!",
  "message": "We are excited to announce...",
  "type": "launch" // or "generic"
}
```

**Headers:**
```
Authorization: Bearer your-admin-api-key
```

## 📊 Database Schema

### subscribers table
```sql
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source VARCHAR(50) DEFAULT 'landing_page' CHECK (source IN ('countdown_banner', 'countdown_modal', 'landing_page')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎨 Email Templates

The system includes beautiful HTML email templates:

1. **Welcome Email**: Sent when users subscribe
2. **Launch Email**: Sent when notifying about launch
3. **Generic Email**: For custom notifications

All emails include:
- Responsive design
- Brand colors and styling
- Unsubscribe links
- Call-to-action buttons

## 🧪 Testing

### Test Email Subscription
1. Visit the landing page
2. Enter an email in any of the signup forms
3. Check your email for the welcome message

### Test Notifications
```bash
# Set admin API key
export ADMIN_API_KEY="your-secure-admin-key"

# Run test script
node scripts/test-notifications.js
```

## 🔒 Security Features

- Email validation
- Duplicate prevention
- Rate limiting (can be added)
- Admin API key protection
- Row Level Security (RLS) enabled

## 📈 Analytics

Track subscription sources:
- `countdown_banner`: Users from top banner
- `countdown_modal`: Users from countdown popup
- `landing_page`: Users from main signup form

## 🚀 Launch Day

When ready to launch:

1. Send notification to all subscribers:
```bash
curl -X POST http://localhost:3000/api/notify-subscribers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-api-key" \
  -d '{
    "subject": "🚀 Campus Marketplace is Live!",
    "message": "We are excited to announce that Campus Marketplace is now officially launched!",
    "type": "launch"
  }'
```

2. Monitor subscription growth in Supabase dashboard
3. Check email delivery in Resend dashboard

## 🛠️ Troubleshooting

### Common Issues

1. **Emails not sending**: Check Resend API key and domain verification
2. **Database errors**: Verify Supabase connection and RLS policies
3. **CORS issues**: Ensure API routes are properly configured

### Debug Mode

Enable debug logging by adding to your environment:
```env
DEBUG=email-notifications
```

## 📞 Support

For issues or questions:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check Supabase and Resend dashboards for errors
