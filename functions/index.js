const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Import Xendit functions
require('./xendit');

// Create email transporter (using Gmail SMTP)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().gmail?.user || 'your-email@gmail.com',
    pass: functions.config().gmail?.password || 'your-app-password'
  }
});

// Process pending emails
exports.processEmails = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  console.log('Processing pending emails...');
  
  const db = admin.firestore();
  const emailsRef = db.collection('emails');
  
  try {
    // Get pending emails
    const snapshot = await emailsRef.where('status', '==', 'pending').limit(10).get();
    
    if (snapshot.empty) {
      console.log('No pending emails found.');
      return null;
    }
    
    const batch = db.batch();
    const promises = [];
    
    snapshot.forEach(doc => {
      const emailData = doc.data();
      const emailId = doc.id;
      
      console.log(`Processing email ${emailId} to ${emailData.to}`);
      
      // Send email
      const emailPromise = sendEmail(emailData)
        .then(() => {
          // Update status to sent
          batch.update(doc.ref, { status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
          console.log(`Email ${emailId} sent successfully`);
        })
        .catch(error => {
          // Update status to failed
          batch.update(doc.ref, { 
            status: 'failed', 
            error: error.message,
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.error(`Failed to send email ${emailId}:`, error);
        });
      
      promises.push(emailPromise);
    });
    
    // Wait for all emails to be processed
    await Promise.all(promises);
    
    // Commit batch updates
    await batch.commit();
    
    console.log(`Processed ${snapshot.size} emails`);
    return null;
  } catch (error) {
    console.error('Error processing emails:', error);
    return null;
  }
});

// Send individual email
async function sendEmail(emailData) {
  const mailOptions = {
    from: emailData.landlordEmail || 'noreply@rentmatic.com',
    to: emailData.to,
    subject: emailData.subject,
    html: generateEmailHTML(emailData)
  };
  
  return transporter.sendMail(mailOptions);
}

// Generate HTML email content
function generateEmailHTML(emailData) {
  const { type, message, registrationLink, propertyName, landlordName, tenantName, unitName, rentAmount, dueDate } = emailData;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailData.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 RentMatic</h1>
          <p>Property Management System</p>
        </div>
        <div class="content">
  `;
  
  if (type === 'invitation') {
    html += `
      <h2>Tenant Registration Invitation</h2>
      <p>Hello!</p>
      <p>You have been invited to register as a tenant${propertyName ? ` for ${propertyName}` : ''}.</p>
      <p>${message}</p>
      ${registrationLink ? `<a href="${registrationLink}" class="button">Complete Registration</a>` : ''}
      <p>Best regards,<br><strong>${landlordName || 'Property Manager'}</strong></p>
    `;
  } else if (type === 'welcome') {
    html += `
      <h2>Welcome to RentMatic!</h2>
      <p>Hello ${tenantName}!</p>
      <p>Your tenant registration has been completed for ${propertyName}.</p>
      <p>You can now access your tenant portal and manage your rental information.</p>
      <p>Welcome aboard!</p>
      <p>Best regards,<br><strong>${landlordName}</strong></p>
    `;
  } else if (type === 'reminder') {
    html += `
      <h2>Rent Reminder</h2>
      <p>Hello ${tenantName}!</p>
      <p>This is a friendly reminder that your rent payment is due soon.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3>Payment Details:</h3>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Unit:</strong> ${unitName}</p>
        <p><strong>Amount:</strong> ₱${rentAmount.toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      <p>Please ensure your payment is made on time.</p>
      <p>Best regards,<br><strong>${landlordName}</strong></p>
    `;
  }
  
  html += `
        </div>
        <div class="footer">
          <p>© 2024 RentMatic. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

// Manual trigger for testing
exports.sendTestEmail = functions.https.onCall(async (data, context) => {
  try {
    const emailData = {
      to: data.email,
      subject: 'Test Email from RentMatic',
      message: 'This is a test email to verify the email system is working.',
      type: 'invitation',
      landlordName: 'RentMatic System',
      status: 'pending'
    };
    
    await sendEmail(emailData);
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: error.message };
  }
});


