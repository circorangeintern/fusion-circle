import { brevo, transporter } from "./email";

export const sendEmail = async (
    to: string,
    subject: string,
    html: string
) => {
    return await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    });
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
}