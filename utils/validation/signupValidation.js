const Joi = require('joi');
const StatusCode = require('../statuscode/statusCode');
const serverResponse = require('../response/serverResponse');

const nameSchema = Joi.string().min(2).max(50).allow('');
const emailSchema = Joi.string().email().pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
const mobileNumber = Joi.string().pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid international number starting with "+"',
      'any.required': 'Mobile number is required'
    });
const passwordSchema = Joi.string().min(4).required();
const confirmPasswordSchema = Joi.string().valid(Joi.ref('password'));

const schema = Joi.object({
  name: nameSchema,
  email: emailSchema,
  mobile_number: mobileNumber,
  password: passwordSchema,
  confirmpassword: confirmPasswordSchema,
});

const signupValidate = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(StatusCode.badRequest)
      .send(serverResponse.errorMessage(error.details[0].message));
  }
  next();
};

module.exports = signupValidate;
