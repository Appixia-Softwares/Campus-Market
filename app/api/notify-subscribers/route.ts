import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_XorZYMSo_FydyMvRMjw8mooMaaz3Arspe')

export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (you might want to add API key verification)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, subject, type = 'launch' } = await request.json()

    // Get all active subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('email, source')
      .eq('status', 'active')

    if (fetchError) {
      throw fetchError
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers found' }, { status: 200 })
    }

    // Send emails to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const emailContent = type === 'launch' ? getLaunchEmailTemplate(subscriber.email) : getGenericEmailTemplate(subject, message, subscriber.email)
        
    await resend.emails.send({
      from: `Campus Marketplace <hello@${process.env.EMAIL_DOMAIN || 'campusmart.co.zw'}>`,
      replyTo: `support@${process.env.EMAIL_DOMAIN || 'campusmart.co.zw'}`,
          to: [subscriber.email],
          subject: subject || '🚀 Campus Marketplace is Live!',
          html: emailContent
        })
      } catch (emailError) {
        console.error(`Failed to send email to ${subscriber.email}:`, emailError)
        return { email: subscriber.email, success: false, error: emailError }
      }
    })

    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length

    return NextResponse.json({
      message: `Emails sent successfully`,
      total: subscribers.length,
      successful,
      failed
    })

  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

function getLaunchEmailTemplate(email: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campus Marketplace is Live!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6); padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <div style="margin-bottom: 20px;">
            <img src="https://campusmarket.co.zw/logo%20(2).png" alt="Campus Market Logo" style="width: 80px; height: 80px; object-fit: contain; margin: 0 auto; display: block;" />
          </div>
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">
            We're Live!
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px;">
            Campus Marketplace is now officially launched!
          </p>
        </div>

        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
            The wait is over!
          </h2>
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 16px;">
            After months of development, we're excited to announce that Campus Marketplace is now live and ready to revolutionize your campus experience!
          </p>
          
          <div style="background: white; padding: 25px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
              What's new and exciting:
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
              <li style="margin-bottom: 8px;">✓ Enhanced marketplace with better search and filters</li>
              <li style="margin-bottom: 8px;">✓ Improved messaging system for seamless communication</li>
              <li style="margin-bottom: 8px;">✓ Advanced security features for safe transactions</li>
              <li style="margin-bottom: 8px;">✓ Mobile-optimized experience for on-the-go access</li>
              <li style="margin-bottom: 8px;">✓ Exclusive launch day offers and discounts</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://campusmarket.co.zw" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; margin: 10px;">
            Explore Now
          </a>
          <a href="https://campusmarket.co.zw/marketplace" 
             style="display: inline-block; background: transparent; color: #10b981; padding: 15px 35px; text-decoration: none; border: 2px solid #10b981; border-radius: 8px; font-weight: 600; font-size: 18px; margin: 10px;">
            Browse Marketplace
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            Questions? Just reply to this email - we'd love to hear from you!
          </p>
          <p style="margin: 0 0 10px 0;">
            Thank you for being part of our journey! We're excited to have you on board.
          </p>
          <p style="margin: 0;">
            <a href="https://campusmarket.co.zw/unsubscribe?email=${email}" 
               style="color: #6b7280; text-decoration: underline;">
              Unsubscribe
            </a> | 
            <a href="https://campusmarket.co.zw" 
               style="color: #6b7280; text-decoration: underline;">
              Campus Marketplace
            </a> |
            <a href="mailto:support@campusmart.co.zw" 
               style="color: #6b7280; text-decoration: underline;">
              Contact Support
            </a>
          </p>
        </div>
      </body>
    </html>
  `
}

function getGenericEmailTemplate(subject: string, message: string, email: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <div style="margin-bottom: 15px;">
            <img src="https://campusmarket.co.zw/logo%20(2).png" alt="Campus Market Logo" style="width: 60px; height: 60px; object-fit: contain; margin: 0 auto; display: block;" />
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            ${subject}
          </h1>
        </div>

        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 25px;">
          <div style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://campusmarket.co.zw" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Visit Campus Marketplace
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            Questions? Just reply to this email - we'd love to hear from you!
          </p>
          <p style="margin: 0;">
            <a href="https://campusmarket.co.zw/unsubscribe?email=${email}" 
               style="color: #6b7280; text-decoration: underline;">
              Unsubscribe
            </a> | 
            <a href="https://campusmarket.co.zw" 
               style="color: #6b7280; text-decoration: underline;">
              Campus Marketplace
            </a> |
            <a href="mailto:support@campusmart.co.zw" 
               style="color: #6b7280; text-decoration: underline;">
              Contact Support
            </a>
          </p>
        </div>
      </body>
    </html>
  `
}
