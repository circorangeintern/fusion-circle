import { baseTemplate } from "./base";

export const activationOtpTemplate = (
    firstName: string,
    otp: string
) => baseTemplate({
    previewText: "Your account activation OTP is ready.",
    accentColor: "#BF9B30",
    content: `
        <h1 style="margin:0 0 14px; font-family:'Roboto Slab', Georgia, serif; font-size:26px; font-weight:700; color:#1B2A4A; letter-spacing:-0.01em;">
            Activation OTP
        </h1>
        <p style="margin:0 0 20px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            Hello ${firstName},<br />
            We found your result account and have generated an OTP to activate it.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
                <td style="padding:22px 24px; background-color:#f7f6f1; border:1px solid #ddd9cd; border-radius:12px; text-align:center;">
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#7a7d84; text-transform:uppercase; letter-spacing:0.08em;">
                        Your OTP code
                    </p>
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:32px; font-weight:700; color:#1B2A4A; letter-spacing:0.12em;">
                        ${otp}
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:0 0 20px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            Use this OTP to complete your account activation. It is valid for 15 minutes.
        </p>

        <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:14px; color:#7a7d84; line-height:1.7;">
            If you did not request this, please ignore this email.
        </p>
    `,
});
