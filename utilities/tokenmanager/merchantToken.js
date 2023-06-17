const jwt = require('jsonwebtoken');
module.exports = function generateAccessToken(payload) {
    console.log(process.env.MERCHANT_TOKEN_SECRET);
    return jwt.sign(payload, process.env.MERCHANT_TOKEN_SECRET, { expiresIn: '1day' });
}