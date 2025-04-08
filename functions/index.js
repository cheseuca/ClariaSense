const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.sendErrorEmailToSubscribers = onDocumentCreated('error_logs/{logId}', async (event) => {
  const errorData = event.data.data();

  // Get all subscribers
  const subscribersSnap = await admin.firestore().collection('subscribers').get();
  const subscriberEmails = subscribersSnap.docs.map((doc) => doc.data().email);

  // Optional: If no subscribers, do nothing
  if (subscriberEmails.length === 0) return null;

  // Build email message
  const subject = '🚨 Out of Parameters Detected';
  const htmlMessage = `
    <div style="background-color: white; padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <div style="display: flex; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
        <div style="flex-shrink: 0; margin-right: 10px;">
          <img src="https://clariasense.web.app/clariaSenseLogo.png" alt="Logo" style="width: 40px; height: 40px;">
        </div>
        <h3 style="margin: 0;">🚨 Out of Parameters Detected</h3>
      </div>
      <p><strong>Out of Parameters:</strong> ${
        Array.isArray(errorData.errorParameters)
          ? errorData.errorParameters.join(' , ')
          : 'N/A'
      }</p>
      <p><strong>Recorded Data when out of Parameters occurred:</strong></p>
      <ul style="list-style-type: none; padding: 0;">
        <li><strong>pH Level:</strong> ${errorData.ph} pH</li>
        <li><strong>TDS:</strong> ${errorData.tds} ppm</li>
        <li><strong>Temperature:</strong> ${errorData.temp} °C</li>
      </ul>
      <p><strong>Time and Date:</strong> ${errorData.timestamp}</p>
      <footer style="margin-top: 20px; font-size: 12px; color: #777; border-top: 2px solid #ccc; padding-top: 10px;">
        This is an automated message. Please do not reply.
        <br>
        <a href="https://clariasense.web.app/unsubscribe?email=${encodeURIComponent(email)}" style="color: #007BFF; text-decoration: none;">Unsubscribe</a>
    </div>
  `;

  // For each subscriber, write to the 'mail' collection
  const mailCollection = admin.firestore().collection('mail');

  const emailWrites = subscriberEmails.map((email) => {
    return mailCollection.add({
      to: [email],
      message: {
        subject,
        html: htmlMessage,
      },
    });
  });

  // Wait for all emails to be queued
  await Promise.all(emailWrites);
  return null;
});