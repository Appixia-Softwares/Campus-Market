// Test script to send notifications to subscribers
// Run with: node scripts/test-notifications.js

const fetch = require('node-fetch');

async function testNotifications() {
  try {
    const response = await fetch('http://localhost:3000/api/notify-subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_KEY || 'test-key'}`
      },
      body: JSON.stringify({
        subject: '🚀 Campus Marketplace is Live!',
        message: 'We are excited to announce that Campus Marketplace is now officially launched! Check out all the amazing new features.',
        type: 'launch'
      })
    });

    const result = await response.json();
    console.log('Notification result:', result);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

testNotifications();
