const { connectToDatabase } = require("./_mongodb");

exports.handler = async (event) => {
  try {
    const { db } = await connectToDatabase();
    const username = event.queryStringParameters.username;

    const user = await db.collection("users").findOne({ username });
    if (!user) return { statusCode: 404, body: "User not found" };

    return {
      statusCode: 200,
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        role: user.role,
        strikes: user.strikes || [],
        comments: user.comments || [],
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Error: " + err.message };
  }
};
