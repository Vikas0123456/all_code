const jwt = require('jsonwebtoken');
module.exports = function generateAccessToken(payload) {
    console.log(process.env.CUSTOMER_TOKEN_SECRET);
    return jwt.sign(payload, process.env.CUSTOMER_TOKEN_SECRET, { expiresIn: '1day' });
}