// emailHelper.js
const nodemailer = require("nodemailer");

async function sendEmail(to, username, content = "", type = "account") {
  if (!to) throw new Error("No recipient email provided");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let subject = "";
  let htmlMessage = "";

  if (type === "accepted") {
    subject = "Application Update — PGUH Careers";
    htmlMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
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
          body { background-color: var(--bg); margin:0; padding:0; }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: var(--panel);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          }
          .header { background-color: var(--nhs-blue); padding: 20px; text-align: center; }
          .header img { max-width: 150px; }
          .content { padding: 20px; color: #333; line-height: 1.6; }
          h1 { color: var(--nhs-dark); font-size: 20px; }
          .footer { text-align: center; font-size: 12px; color: var(--muted); padding: 15px; }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 20px;
            background-color: var(--nhs-blue);
            color: #fff;
            text-decoration: none;
            border-radius: var(--radius);
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://pguh.uk/Assets/Logo2.png" alt="NHS Logo"/>
          </div>
          <div class="content">
            <h1>Application Accepted</h1>
            <p>Dear ${username},</p>
            <p>We are pleased to inform you that your application for a role at <strong>Prince George University Hospital</strong> has been <strong>accepted</strong>.</p>
            <p>Our recruitment team will contact you shortly with the next steps regarding your onboarding.</p>
            <p>Thank you for your interest in joining our healthcare team. We look forward to having you on board.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Prince George University Hospital — NHS Careers Portal
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (type === "denied") {
    subject = "Application Update — PGUH Careers";
    htmlMessage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
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
          body { background-color: var(--bg); margin:0; padding:0; }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: var(--panel);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          }
          .header { background-color: var(--nhs-blue); padding: 20px; text-align: center; }
          .header img { max-width: 150px; }
          .content { padding: 20px; color: #333; line-height: 1.6; }
          h1 { color: var(--nhs-dark); font-size: 20px; }
          .footer { text-align: center; font-size: 12px; color: var(--muted); padding: 15px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://pguh.uk/Assets/Logo2.png" alt="NHS Logo"/>
          </div>
          <div class="content">
            <h1>Application Update</h1>
            <p>Dear ${username},</p>
            <p>Thank you for applying for a role at <strong>Prince George University Hospital</strong>.</p>
            <p>After careful consideration, we regret to inform you that your application has not been successful on this occasion.</p>
            <p>We encourage you to apply for future opportunities with our hospital and thank you for your interest in our healthcare community.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Prince George University Hospital — NHS Careers Portal
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // fallback/default
    subject = "Notification — PGUH Careers";
    htmlMessage = `<p>${content}</p>`;
  }

  await transporter.sendMail({
    from: `"NHS Careers" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlMessage,
  });
}

module.exports = { sendEmail };
