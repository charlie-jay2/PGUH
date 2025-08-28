const { MongoClient, ObjectId } = require("mongodb");
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

    const { id, status } = JSON.parse(event.body);
    if (!id || !status)
      return { statusCode: 400, body: "Missing required fields" };

    const db = await connectDB();
    const application = await db
      .collection("applications")
      .findOne({ _id: new ObjectId(id) });
    if (!application) return { statusCode: 404, body: "Application not found" };

    await db
      .collection("applications")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    let type;
    if (status === "Accepted") type = "accepted";
    else if (status === "Denied") type = "denied";

    await sendEmail(
      application.email || application.robloxProfileLink,
      application.robloxName,
      "",
      type
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
