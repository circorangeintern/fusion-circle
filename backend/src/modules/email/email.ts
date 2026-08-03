import { BrevoClient } from "@getbrevo/brevo";

export const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY!,
});

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});