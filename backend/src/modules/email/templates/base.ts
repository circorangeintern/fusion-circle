type BaseTemplateOptions = {
    previewText?: string;
    accentColor?: string;
    content: string;
};

export const baseTemplate = ({ previewText = "", accentColor = "#BF9B30", content }: BaseTemplateOptions) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ResultTrack</title>
</head>
<body style="margin:0; padding:0; background-color:#EEEDE6; font-family:'Work Sans', Arial, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${previewText}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEEDE6; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

          <!-- Wordmark, sits above the card -->
          <tr>
            <td style="padding:0 8px 20px;">
              <span style="font-family:'Roboto Slab', Georgia, serif; font-size:15px; font-weight:700; color:#1B2A4A; letter-spacing:0.04em; text-transform:uppercase;">
                ResultTrack
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff; border:1px solid #ddd9cd; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(27,42,74,0.06);">

              <!-- Accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:5px; background-color:${accentColor};"></td></tr>
              </table>

              <!-- Body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 36px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>

              <!-- Footer strip -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f1; border-top:1px solid #ddd9cd;">
                <tr>
                  <td style="padding:18px 36px;">
                    <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:12px; color:#7a7d84; line-height:1.6;">
                      ResultTrack — every entry, edit, and submission is logged.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:20px 8px 0;">
              <p style="margin:0; font-family:'Work Sans', Arial, sans-serif; font-size:11px; color:#7a7d84;">
                Automated message — please don't reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;