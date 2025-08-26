const nodemailer = require("nodemailer");
const path = require("path");

exports.handler = async (event) => {
  try {
    const {
      to,
      username,
      content = "",
      type = "account",
    } = JSON.parse(event.body);

    // Gmail transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let subject = "";
    let intro = "";
    let detailsHtml = "";
    let attachments = [];

    if (type === "account") {
      subject = "Your New NHS Staff Account";
      intro = `Your NHS Staff account has been successfully created.`;
      detailsHtml = `
        <p>Here are your account details:</p>
        <div class="details">
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${content}</p>
        </div>`;
    } else if (type === "reset") {
      subject = "Your NHS Staff Password Has Been Reset";
      intro = `Your NHS Staff account password has been reset.`;
      detailsHtml = `
        <p>Your password has been changed successfully.</p>
        <div class="details">
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>New Password:</strong> ${content}</p>
        </div>`;
    } else if (type === "deleted") {
      subject = "Your NHS Staff Account Has Been Deleted";
      intro = `Your NHS Staff account has been deleted.`;
      detailsHtml = `
        <p>This is to inform you that your NHS Staff account with username <strong>${username}</strong> has been removed from the system.</p>
        <p>If you think this was a mistake, please contact your administrator immediately.</p>`;
    } else if (type === "reset-link") {
      subject = "Password Reset Request";
      intro = `
        <p>Hello ${username},</p>
        <p>You requested a password reset for your NHS Staff account.</p>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <p><a href="${content}">${content}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `;
      detailsHtml = "";
    } else if (type === "suspended") {
      subject = "Your NHS Staff Account Has Been Suspended";
      intro = `Your NHS Staff account has been temporarily suspended.`;
      detailsHtml = `
        <p>This is to inform you that your NHS Staff account with username <strong>${username}</strong> has been suspended.</p>
        <p>Please contact your administrator for further details or to appeal this decision.</p>`;
    } else if (type === "termination") {
      subject = "Termination of Employment – Prince George University Hospital";
      intro = `
        <p>Dear Mr Linson,</p>
        <p>Please find attached formal documentation regarding the termination of your employment at Prince George University Hospital. The document outlines the specific reasons for this decision.</p>
        <p>We appreciate that this outcome may be disappointing, and we wish to assure you that the decision was made following due process and careful consideration.</p>
        <p>Should you have any questions or require further clarification, please do not hesitate to contact us via this email address. We will endeavour to respond to your enquiry as promptly as possible.</p>
        <p>Yours sincerely,<br/>
        Internal Affairs Team<br/>
        Prince George University Hospital</p>
      `;
      detailsHtml = "";
      attachments.push({
        filename: "IA Report - Luis Linson.pdf",
        path: path.resolve(
          __dirname,
          "../../Documents/PDFs/IA Report - Luis Linson.pdf"
        ),
      });
    }

    const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        :root {
          --nhs-blue: #1d5fad;
          --nhs-dark: #003b6f;
          --muted: #6b6b6b;
          --bg: #f6f8fb;
          --panel: #ffffff;
          --radius: 8px;
          font-family: "Frutiger", Arial, sans-serif;
        }
        body {
          background-color: var(--bg);
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: var(--panel);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          background-color: var(--nhs-blue);
          padding: 20px;
          text-align: center;
        }
        .header img {
          max-width: 150px;
        }
        .content {
          padding: 20px;
          color: #333;
          font-size: 15px;
          line-height: 1.6;
        }
        h1 {
          color: var(--nhs-dark);
          font-size: 20px;
        }
        .details {
          background: var(--bg);
          border-radius: var(--radius);
          padding: 15px;
          margin-top: 15px;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: var(--muted);
          padding: 15px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="https://pguh.uk/Assets/Logo2.png" alt="NHS Logo" />
        </div>
        <div class="content">
          ${intro}
          ${detailsHtml}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Prince George University Hospital — NHS Staff Portal
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"NHS Automated System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlMessage,
      attachments,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
