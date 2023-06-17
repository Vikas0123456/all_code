const Joi = require('joi');
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const txnValidation = {
    list_get: async (req, res, next) => {
        const schema = Joi.object().keys({
            perpage: Joi.number(),
            page: Joi.number(),
            from_date: Joi.any(),
            to_date: Joi.any(),
            status: Joi.string(),
            class: Joi.string(),
            type: Joi.string(),
            mode: Joi.string().required().valid('test', 'live'),
        }).error((error)=>{
            return new Error(error);
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
               next()
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
   
}
module.exports = txnValidation