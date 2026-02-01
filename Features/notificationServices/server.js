import express from "express";
import { sendMissedAppointmentAlert } from "./notificationService.js";

const app = express();
app.use(express.json());

app.post("/notify", async (req, res) => {
  const { type, email, phone, name, date } = req.body;

  try {
    if (type === "MISSED_APPOINTMENT") {
      await sendMissedAppointmentAlert({ email, phone, name, date });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "notification failed" });
  }
});

app.listen(4000, () => console.log("🔔 Notification service running on port 4000"));
