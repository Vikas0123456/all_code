const jwt = require('jsonwebtoken');
const statusCode = require('../statuscode/statusCode');
const response = require('../response/serverResponse');

const AuthenticateAccessToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    res
      .status(statusCode.expired)
      .send(response.errorMessage('Invalid access token', 'E0060'));
  } else {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        if (err.message == 'jwt expired') {
          res
            .status(statusCode.expired)
            .send(response.errorMessage('Token Expired Please Login', 'E0059'));
        } else {
          res
            .status(statusCode.expired)
            .send(response.errorMessage('Unable To Validate Token', 'E0060'));
        }
      } else {
        req.user = user;
        next();
      }
    });
  }
};

module.exports = AuthenticateAccessToken;
