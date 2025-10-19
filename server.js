// server.js
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async(req, res) => {
  res.send('Welcome!')
})

// POST route to send email
app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body || {};

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing fields: 'to', 'subject', and 'message' are required",
      });
    }

    // Create a Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.FROM_GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Convert HTML to plain text for better deliverability
    const textMessage = message
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Email options with improved headers
    const mailOptions = {
      from: {
        name: 'SLA Invisible Grills',
        address: process.env.FROM_GMAIL_ADDRESS
      },
      to: to,
      subject: subject,
      text: textMessage, // Plain text version
      html: message, // HTML version
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'SLA Admin System',
        'X-MimeOLE': 'Produced By SLA Admin',
        'Reply-To': process.env.FROM_GMAIL_ADDRESS,
        'Return-Path': process.env.FROM_GMAIL_ADDRESS,
        'List-Unsubscribe': `<mailto:${process.env.FROM_GMAIL_ADDRESS}?subject=Unsubscribe>`
      },
      // Add message ID for better tracking
      messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@slainvisiblegrills.com>`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return res.json({ 
      success: true, 
      data: {
        messageId: info.messageId,
        response: info.response
      }
    });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Function to send daily automated email
const sendDailyEmail = async () => {
  try {
    console.log("🕐 Sending daily automated email...");
    
    // Use IST timezone for date/time
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const currentDate = istTime.toLocaleDateString('en-IN');
    const currentTime = istTime.toLocaleTimeString('en-IN');
    
    console.log(`📅 Current IST Date: ${currentDate}, Time: ${currentTime}`);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.FROM_GMAIL_ADDRESS,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Daily email content
    const dailyEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📅 Daily Report - SLA Invisible Grills</h2>
        <p>Good Morning!</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Daily Reminder:</h3>
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Time:</strong> ${currentTime}</p>
          <p>This is your daily automated reminder from SLA Admin System.</p>
          <ul>
            <li>Review pending leads</li>
            <li>Follow up with customers</li>
            <li>Update lead status</li>
            <li>Check for new inquiries</li>
          </ul>
        </div>
        
        <p style="color: #28a745;"><strong>Have a productive day!</strong></p>
        <hr>
        <small style="color: #6c757d;">This is an automated email from SLA Admin System</small>
      </div>
    `;

    const textContent = `
      Daily Report - SLA Invisible Grills
      
      Good Morning!
      
      Date: ${currentDate}
      Time: ${currentTime}
      
      This is your daily automated reminder from SLA Admin System.
      
      Daily Tasks:
      - Review pending leads
      - Follow up with customers  
      - Update lead status
      - Check for new inquiries
      
      Have a productive day!
    `;

    const mailOptions = {
      from: {
        name: 'SLA Admin System',
        address: process.env.FROM_GMAIL_ADDRESS
      },
      to: "arumullasivakrishna6@gmail.com",
      subject: `📅 Daily Report - ${currentDate}`,
      text: textContent,
      html: dailyEmailContent,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'SLA Admin System - Daily Report',
        'Reply-To': process.env.FROM_GMAIL_ADDRESS,
      },
      messageId: `<daily-${Date.now()}.${Math.random().toString(36).substr(2, 9)}@slainvisiblegrills.com>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Daily email sent successfully:", info.messageId);
    
  } catch (error) {
    console.error("❌ Error sending daily email:", error);
  }
};

// Test cron job that runs every minute (for debugging)
cron.schedule('* * * * *', () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  console.log(`⏰ Cron test - Current IST time: ${istTime.toLocaleTimeString('en-IN')}`);
}, {
  timezone: "Asia/Kolkata"
});

// Schedule daily email at 11:14 AM IST
// Using direct IST time: 14 minutes past 11 AM
cron.schedule('14 11 * * *', () => {
  console.log('🕐 Daily email cron job triggered at 11:14 AM IST');
  sendDailyEmail();
}, {
  timezone: "Asia/Kolkata"
});

// Additional backup schedule (in case timezone handling fails)
// This runs at 5:44 AM UTC which should be 11:14 AM IST
cron.schedule('44 5 * * *', () => {
  console.log('🕐 Backup daily email cron job triggered (UTC based)');
  sendDailyEmail();
});

// Check current time on server start
const serverStartTime = new Date();
const istStartTime = new Date(serverStartTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
console.log(`🚀 Server started at IST: ${istStartTime.toLocaleString('en-IN')}`);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});