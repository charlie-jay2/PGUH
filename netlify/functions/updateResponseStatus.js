const { MongoClient, ObjectId } = require("mongodb");
const { sendEmail } = require("./sendEmail"); // reusing your helper

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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { id, status } = JSON.parse(event.body);
    if (!id || !status) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const db = await connectDB();
    const application = await db
      .collection("applications")
      .findOne({ _id: new ObjectId(id) });

    if (!application) {
      return { statusCode: 404, body: "Application not found" };
    }

    await db
      .collection("applications")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    // Prepare email based on status
    let subjectType;
    let content = "";
    if (status === "Accepted") {
      subjectType = "accepted";
      content = `We are pleased to inform you that your application for <strong>${application.roleApplied}</strong> has been accepted. Our team will be in touch shortly with the next steps.`;
    } else if (status === "Denied") {
      subjectType = "denied";
      content = `We regret to inform you that your application for <strong>${application.roleApplied}</strong> has not been successful on this occasion. We encourage you to apply again in the future.`;
    }

    // Send email
    await sendEmail(
      application.email, // must be a real email address
      application.robloxName,
      content,
      subjectType
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Application ${status}` }),
    };
  } catch (error) {
    console.error("updateResponseStatus error:", error);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
