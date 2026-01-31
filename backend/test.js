import "dotenv/config";
import readline from "readline";
import { sendAppointmentReminder, sendMissedAppointmentAlert } from "./notificationServices/notificationService.js";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter patient's email: ", (email) => {
  rl.question("Enter patient's phone (with country code, e.g., +14165551234): ", (phone) => {
    rl.question("Enter patient's name: ", (name) => {
      rl.question("Enter appointment date (e.g., 2026-02-02 10:00 AM): ", (date) => {
    // Create dynamic patient object
    const demoPatient = {
      email,
      phone,
      name: name || "John Doe",
      date: date || "2026-02-02 10:00 AM"
    };

    // Send notifications
    (async () => {
      await sendAppointmentReminder(demoPatient);
      await sendMissedAppointmentAlert(demoPatient);
      console.log("Demo notifications triggered");
      rl.close();
        })();
      });
    });
  });
});

// Run the demo
// runDemo();
