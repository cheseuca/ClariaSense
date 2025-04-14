const { onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.sendNotifForWaterRefill = onValueWritten('/sensorForRefill/distance', async (event) => {
  const distance = event.data.after; 

  if (distance <= 14) {
    console.log('Distance is within acceptable range.');
    return null;
  }

  try {
    // Get the last notification timestamp from RTDB
    const lastSentSnap = await admin.database().ref('/sensorForRefill/lastNotification').once('value');
    const lastSent = lastSentSnap.val();

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastSent && now - lastSent < oneHour) {
      console.log('Notification already sent within the last hour.');
      return null;
    }

    // Update the last notification timestamp in RTDB
    await admin.database().ref('/sensorForRefill/lastNotification').set(now);

    // Get all subscribers from Firestore
    const subscribersSnap = await admin.firestore().collection('mail').get();
    const subscriberEmails = subscribersSnap.docs.map((doc) => doc.data().to);

    if (subscriberEmails.length === 0) {
      console.log('No subscribers found.');
      return null;
    }

    // For each subscriber, write an email document with personalized unsubscribe link
    const mailCollection = admin.firestore().collection('mail');

    const subject = '🚨 Water Running Out';

    const emailWrites = subscriberEmails.map((email) => {
      const htmlMessage = `
        <div style="background-color: white; padding: 20px; font-family: Arial, sans-serif; color: #333;">
          <div style="display: flex; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
            <div style="flex-shrink: 0; margin-right: 10px;">
              <img src="https://clariasense.web.app/clariaSenseLogo.png" alt="Logo" style="width: 40px; height: 40px;">
            </div>
            <h3 style="margin: 0;">🚨 Water Almost Runs Out!</h3>
          </div>
          <p>The water is almost running out. Please refill the water tank</p>
          <footer style="margin-top: 20px; font-size: 12px; color: #777; border-top: 2px solid #ccc; padding-top: 10px;">
            This is an automated message. Please do not reply.<br>
            <a href="https://clariasense.web.app/unsubscribe?email=${encodeURIComponent(email)}" style="color: #007BFF; text-decoration: none;">Unsubscribe</a>
          </footer>
        </div>
      `;

      return mailCollection.add({
        to: Array.isArray(email) ? email : [email],
        message: {
          subject,
          html: htmlMessage,
        },
      });
    });

    await Promise.all(emailWrites);
    console.log('Hourly distance notification emails queued successfully.');

    return null;
  } catch (error) {
    console.error('Error sending hourly distance notification emails:', error);
    return null;
  }
});