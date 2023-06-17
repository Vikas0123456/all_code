const jwt = require('jsonwebtoken');
module.exports = function generateAccessToken(payload) {
    console.log(process.env.EKYC_TOKEN_SECRET);
    return jwt.sign(payload, process.env.EKYC_TOKEN_SECRET, { expiresIn: '20day' });
}