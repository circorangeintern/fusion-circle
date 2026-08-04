// import { transporter } from "./email";

// export const sendEmail = async (
//     to: string,
//     subject: string,
//     html: string
// ) => {
//     return await transporter.sendMail({
//         from: `"ResultTrack" <${process.env.EMAIL_FROM}>`,
//         to,
//         subject,
//         html,
//     });
// await brevo.transactionalEmails.sendTransacEmail({
//     subject,
//     htmlContent: html,
//     sender: {
//         name: process.env.EMAIL_FROM_NAME!,
//         email: process.env.EMAIL_FROM!,
//     },
//     to: [
//         {
//             email: to,
//         },
//     ],
//});
//}
// email.service.ts
import { brevo } from "./email";

export const sendEmail = async (
    to: string,
    subject: string,
    html: string
) => {
    try {
        const response = await brevo.transactionalEmails.sendTransacEmail({
            subject: subject,
            htmlContent: html,
            sender: {
                name: process.env.EMAIL_FROM_NAME || "ResultTrack",
                email: process.env.EMAIL_FROM!, // Ensure this is verified in Brevo
            },
            to: [
                {
                    email: to,
                },
            ],
        });

        console.log("Email sent! ID:", response.messageId);
        return response;
    } catch (error: any) {
        // Detailed error logging for debugging on Render
        console.error("Brevo API Error Details:", error.body || error.message);
        throw error;
    }
}