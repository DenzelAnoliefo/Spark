import { notifyUser } from "./notify.js";

/**
 * Send a notification to a patient
 * @param {Object} options
 * @param {string} options.email - Patient email
 * @param {string} options.phone - Patient phone number 
 * @param {string} options.message - Notification message
 */
export async function sendNotification({ email, phone, message }) {
  try {
    await notifyUser({ email, phone, message });
    console.log("Notification sent successfully");
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

/**
 * Send a reminder for an upcoming appointment
 */
export async function sendAppointmentReminder(patient) {
  const { email, phone, name, date } = patient;
  const message = `Hello ${name}, this is a reminder for your appointment on ${date}.`;
  await sendNotification({ email, phone, message });
}

/**
 * Send a missed appointment alert
 */
export async function sendMissedAppointmentAlert(patient) {
  const { email, phone, name, date } = patient;
  const message = `Hello ${name}, it looks like you missed your appointment on ${date}. Please reschedule.`;
  await sendNotification({ email, phone, message });
}
