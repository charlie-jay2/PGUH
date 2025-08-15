const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;

exports.handler = async (event) => {
  const { ward, name, priority } = JSON.parse(event.body);
  if (!name || !ward) return { statusCode: 400, body: "Missing fields" };

  try {
    await client.connect();
    const db = client.db(dbName);
    await db
      .collection("bays")
      .insertOne({
        ward,
        name,
        priority: priority ?? 0,
        patientName: "",
        nurseName: "",
      });
    return { statusCode: 200, body: "Bay created" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error creating bay" };
  }
};
