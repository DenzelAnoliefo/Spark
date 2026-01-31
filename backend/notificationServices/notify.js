import { sendSMS } from "./sms.js";
import { sendEmail } from "./email.js";

export async function notifyUser({ email, phone, message }) {
  const actions = [];

  if (email) {
    actions.push(
      sendEmail(email, "Notification", message)
    );
  }

  if (phone) {
    actions.push(
      sendSMS(phone, message)
    );
  }

  return Promise.all(actions);
}
