import { baseTemplate } from "./base";

export const welcomeAdminTemplate = (
    firstName: string,
    email: string,
    temporaryPassword: string
) => baseTemplate({
    previewText: "Your administrator account has been created on ResultTrack.",
    accentColor: "#BF9B30", // gold — positive/confirmed
    content: `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
                <td style="width:44px; height:44px; background-color:#fbf6e8; border-radius:10px; text-align:center; vertical-align:middle;">
                     <i data-lucide="bar-chart-3" style="width:16px;height:16px;stroke-width:2.5"></i>
                </td>
            </tr>
        </table>

        <h1 style="margin:0 0 14px; font-family:'Roboto Slab', Georgia, serif; font-size:26px; font-weight:700; color:#1B2A4A; letter-spacing:-0.01em;">
            Welcome to ResultTrack
        </h1>
        <p style="margin:0 0 20px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            Hello ${firstName}, your administrator account has been successfully created on ResultTrack. You can now sign in using the credentials below.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
                <td style="padding:18px 20px; background-color:#f7f6f1; border:1px solid #ddd9cd; border-radius:6px;">
                    <p style="margin:0 0 8px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#7a7d84;">
                        Email
                    </p>
                    <p style="margin:0 0 16px; font-family:'Work Sans', Arial, sans-serif; font-size:14px; color:#1B2A4A; font-weight:600;">
                        ${email}
                    </p>
                    <p style="margin:0 0 8px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#7a7d84;">
                        Temporary Password
                    </p>
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:14px; color:#1B2A4A; font-weight:600; letter-spacing:0.02em;">
                        ${temporaryPassword}
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:0 0 24px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#383C42; line-height:1.7;">
            As an administrator, you can:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
                <td style="padding:20px 22px; background-color:#eef1f6; border-left:3px solid #1B2A4A; border-radius:6px;">
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; Create and manage your school
                    </p>
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; Manage teachers and students
                    </p>
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; Configure school settings
                    </p>
                    <p style="margin:0 0 10px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; View and manage academic records
                    </p>
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#1B2A4A; line-height:1.6;">
                        &#8226;&nbsp; Oversee user accounts within your school
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:0 0 28px; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#C24141; line-height:1.7;">
            For your security, you will be required to change your temporary password after your first login.
        </p>

        <p style="margin:0 0 16px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#1B2A4A; font-weight:600;">
            Ready to get started?
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
                <td style="background-color:#1B2A4A; border-radius:8px;">
                    <a href="${process.env.CLIENT_URL}"
                       style="display:inline-block; padding:13px 30px; font-family:'Work Sans', Arial, sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                        Log In and Set Up Your School →
                    </a>
                </td>
            </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
            <tr>
                <td style="padding:14px 18px; background-color:#f9ecec; border-radius:6px;">
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:12px; color:#A63D3D; line-height:1.6;">
                        If you did not expect this account to be created, please contact the ResultTrack support team immediately.
                    </p>
                </td>
            </tr>
        </table>

        <p style="margin:24px 0 0; font-family:'Work Sans', Arial, sans-serif; font-size:13px; color:#383C42; line-height:1.6;">
            Thank you,<br />
            The ResultTrack Team
        </p>
    `,
});