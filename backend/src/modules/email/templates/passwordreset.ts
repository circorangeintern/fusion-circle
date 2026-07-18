import { baseTemplate } from "./base";

export const resetPasswordTemplate = (firstName: string, resetPasswordLink: any) => baseTemplate({
    previewText: "Reset your ResultTrack password — link expires in 15 minutes.",
    accentColor: "#A63D3D", // red — attention, matches your brand rule
    content: `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
                <td style="width:44px; height:44px; background-color:#f9ecec; border-radius:10px; text-align:center; vertical-align:middle;">
                </td>
            </tr>
        </table>

        <h1 style="margin:0 0 14px; font-family:'Roboto Slab', Georgia, serif; font-size:26px; font-weight:700; color:#1B2A4A; letter-spacing:-0.01em;">
            Reset Your Password
        </h1>
        <p style="margin:0 0 8px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            Hello ${firstName},
        </p>
        <p style="margin:0 0 28px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            We received a request to reset the password for your ResultTrack account. If you made this request, click the button below to create a new password.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
                <td style="background-color:#A63D3D; border-radius:8px;">
                    <a href="${resetPasswordLink}"
                       style="display:inline-block; padding:13px 30px; font-family:'Work Sans', Arial, sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                        Reset Password →
                    </a>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
                <td style="padding:20px 22px; background-color:#eef1f6; border-left:3px solid #1B2A4A; border-radius:6px;">
                    <p style="margin:0 0 4px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; font-weight:600;">
                        For your security:
                    </p>
                    <p style="margin:8px 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; This password reset link will expire in 15 minutes.
                    </p>
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; The link can only be used once.
                    </p>
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:0 0 6px; font-family:'Work Sans', Arial, sans-serif; font-size:12px; color:#7a7d84; line-height:1.6;">
            If the button above does not work, copy and paste the following link into your browser:
        </p>
        <p style="margin:0 0 28px; font-family:'Work Sans', Arial, sans-serif; font-size:12px; color:#1B2A4A; line-height:1.6; word-break:break-all;">
            ${resetPasswordLink}
        </p>

        <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#383C42; line-height:1.6;">
            Thank you,<br />
            The ResultTrack Team
        </p>
    `,
});