import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendEmail(to, subject, text) {
    if (process.env.EMAIL_ENABLED !== 'true') {
        console.log("Email skipped (Disabled)");
        return;
    }

    return transporter.sendMail({
        from: `"Clearwater Ridge Healthcare System" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });

}