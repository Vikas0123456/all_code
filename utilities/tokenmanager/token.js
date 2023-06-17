const jwt = require('jsonwebtoken');
module.exports = function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1day' });
}