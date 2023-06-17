const Joi = require('joi');
const StatusCode = require('../statuscode/statusCode');
const serverResponse = require('../response/serverResponse');

const emailSchema = Joi.string().email().pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
const passwordSchema = Joi.string().min(4).required();

const schema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

const signinValidate = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(StatusCode.badRequest)
      .send(serverResponse.errorMessage(error.details[0].message));
  }
  next();
};

module.exports = signinValidate;
