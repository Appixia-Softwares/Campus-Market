import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend('re_epkqnWRC_NCdUJPm1ucQigA6Ck49oHSfu')

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'landing_page' } = await request.json()

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingSubscriber } = await supabase
      .from('subscribers')
      .select('id, status')
      .eq('email', email)
      .single()

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return NextResponse.json(
          { error: 'Email is already subscribed' },
          { status: 409 }
        )
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({ 
            status: 'active',
            subscribed_at: new Date().toISOString(),
            source,
            updated_at: new Date().toISOString()
          })
          .eq('email', email)

        if (updateError) {
          throw updateError
        }
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({
          email,
          subscribed_at: new Date().toISOString(),
          status: 'active',
          source
        })

      if (insertError) {
        throw insertError
      }
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: 'Campus Marketplace <noreply@campusmarket.co.zw>',
        to: [email],
        subject: '🚀 Welcome to Campus Marketplace - Big Thing Coming!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Campus Marketplace</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                  🚀 Big Thing Coming!
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                  You're now on our exclusive launch list
                </p>
              </div>

              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px;">
                  Thank you for subscribing!
                </h2>
                <p style="margin: 0 0 15px 0; color: #6b7280;">
                  We're working on something incredible that will revolutionize your campus experience. 
                  You'll be among the first to know when we launch on <strong>September 22nd</strong>.
                </p>
                <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
                  <p style="margin: 0; font-weight: 500; color: #1f2937;">
                    What to expect:
                  </p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #6b7280;">
                    <li>Exclusive early access to new features</li>
                    <li>Special launch day offers and discounts</li>
                    <li>Priority support and updates</li>
                    <li>Behind-the-scenes content and sneak peeks</li>
                  </ul>
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
                  You're receiving this because you subscribed to our launch notifications.
                </p>
                <p style="margin: 0;">
                  <a href="https://campusmarket.co.zw/unsubscribe?email=${email}" 
                     style="color: #6b7280; text-decoration: underline;">
                    Unsubscribe
                  </a> | 
                  <a href="https://campusmarket.co.zw" 
                     style="color: #6b7280; text-decoration: underline;">
                    Campus Marketplace
                  </a>
                </p>
              </div>
            </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the subscription if email sending fails
    }

    return NextResponse.json(
      { 
        message: 'Successfully subscribed! Check your email for confirmation.',
        email 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
