// _auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set. Set JWT_SECRET in environment for production.');
}

function generateToken(user) {
  // user: { _id, username, role }
  return jwt.sign(
    { id: user._id.toString ? user._id.toString() : user._id, username: user.username, role: user.role },
    JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  );
}

function getAuthHeader(headers) {
  if (!headers) return null;
  return headers['authorization'] || headers['Authorization'] || headers['Authorization'.toLowerCase()];
}

function verifyTokenFromHeaders(headers) {
  const authHeader = getAuthHeader(headers);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Missing or invalid Authorization header');
    err.code = 'NO_AUTH';
    throw err;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET || 'dev-secret');
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }
}

module.exports = { generateToken, verifyTokenFromHeaders };
