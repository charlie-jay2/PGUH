const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let client;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

// Email sender function
async function sendApplicationEmail(to, applicantName, role) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = `Application Confirmation — ${role}`;

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
        font-family: "Frutiger", Arial, sans-serif;
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
      }
      h1 {
        color: var(--nhs-dark);
        font-size: 20px;
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
        <h1>Application Successfully Submitted</h1>
        <p>Dear ${applicantName},</p>
        <p>Thank you for submitting your application for the role of <strong>${role}</strong> at Prince George University Hospital.</p>
        <p>Your application has been received and will be reviewed by our recruitment team within the next <strong>48 hours</strong>. If your application is successful, you will be contacted with the next steps.</p>
        <p>Please note: Do not reply to this automated email. If you have any questions, please contact our recruitment office directly.</p>
        <p>We appreciate your interest in joining our healthcare team and look forward to reviewing your application.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Prince George University Hospital — NHS Careers Portal
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"NHS Careers" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlMessage,
  });
}

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body);

    // Basic validation
    const requiredFields = [
      "robloxName",
      "discordUsername",
      "robloxProfileLink",
      "roleApplied",
      "motivation",
      "standOut",
      "experience",
      "scenarioAnswers",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          statusCode: 400,
          body: `Missing required field: ${field}`,
        };
      }
    }

    const db = await connectDB();

    const result = await db.collection("applications").insertOne({
      robloxName: data.robloxName,
      discordUsername: data.discordUsername,
      robloxProfileLink: data.robloxProfileLink,
      roleApplied: data.roleApplied,
      motivation: data.motivation,
      standOut: data.standOut,
      experience: data.experience,
      scenarioAnswers: data.scenarioAnswers,
      submittedAt: new Date(),
    });

    // Send confirmation email
    await sendApplicationEmail(
      data.robloxProfileLink, // ⚠️ Currently using robloxProfileLink. Change to applicant email field if you add one.
      data.robloxName,
      data.roleApplied
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Application submitted and confirmation email sent",
        id: result.insertedId,
      }),
    };
  } catch (error) {
    console.error("sendResponse error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
