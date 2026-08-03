// import { BrevoClient } from "@getbrevo/brevo";

// export const brevo = new BrevoClient({
//     apiKey: process.env.BREVO_API_KEY!,
// });

// import nodemailer from "nodemailer";

// export const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number(process.env.EMAIL_PORT),
//     secure: true,
//     auth: {
//         user: "apikey",
//         pass: process.env.EMAIL_PASS,
//     },
// });


// email.ts
import { BrevoClient } from "@getbrevo/brevo";

// In the new SDK, this single client handles everything via HTTPS
export const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY!,
});
