export async function sendSMS(to, message) {
  console.log(`
SMS NOTIFICATION (MOCK)
-------------------------
To: ${to}
Message: ${message}
Status: SENT (demo)
-------------------------
  `);

  return {
    sid: "SM_DEMO",
    status: "mocked"
  };
}