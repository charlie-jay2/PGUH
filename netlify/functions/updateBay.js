const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;

exports.handler = async (event) => {
  const { id, ward, name, patientName, nurseName, priority } = JSON.parse(
    event.body
  );
  if (!id) return { statusCode: 400, body: "Missing bay ID" };

  try {
    await client.connect();
    const db = client.db(dbName);
    await db
      .collection("bays")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { ward, name, patientName, nurseName, priority } }
      );
    return { statusCode: 200, body: "Bay updated" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error updating bay" };
  }
};
