// login.js
const { connectToDatabase } = require('./_mongodb');
const bcrypt = require('bcryptjs');
const { generateToken } = require('./_auth');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return { statusCode: 400, body: 'Username and password required' };

    const db = await connectToDatabase(process.env.MONGODB_URI, process.env.DB_NAME);
    const staffCol = db.collection('staff');
    const user = await staffCol.findOne({ username });
    if (!user) return { statusCode: 401, body: 'Invalid credentials' };

    const match = await bcrypt.compare(password, user.password);
    if (!match) return { statusCode: 401, body: 'Invalid credentials' };

    const token = generateToken(user);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, username: user.username, role: user.role })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err.message) };
  }
};
