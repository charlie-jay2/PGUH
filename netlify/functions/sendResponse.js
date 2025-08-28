const { MongoClient } = require("mongodb");
const { sendEmail } = require("./emailHelper");

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

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST")
      return { statusCode: 405, body: "Method Not Allowed" };

    const data = JSON.parse(event.body);

    // Required fields
    const requiredFields = [
      "robloxName",
      "discordUsername",
      "roleApplied",
      "motivation",
      "standOut",
      "experience",
      "scenarioAnswers",
      "email",
    ];

    for (const field of requiredFields) {
      if (!data[field])
        return { statusCode: 400, body: `Missing required field: ${field}` };
    }

    const db = await connectDB();
    const result = await db.collection("applications").insertOne({
      robloxName: data.robloxName,
      discordUsername: data.discordUsername,
      robloxProfileLink: data.robloxProfileLink || null,
      email: data.email,
      roleApplied: data.roleApplied,
      motivation: data.motivation,
      standOut: data.standOut,
      experience: data.experience,
      scenarioAnswers: data.scenarioAnswers,
      submittedAt: new Date(),
      status: "Pending",
    });

    // Send confirmation email to applicant
    await sendEmail(data.email, data.robloxName, "", "account");

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Application submitted and confirmation email sent",
        id: result.insertedId,
      }),
    };
  } catch (error) {
    console.error("sendResponse error:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
