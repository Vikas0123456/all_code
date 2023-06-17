const Joi = require("joi").extend(require("@joi/date"));
const ServerResponse = require("../response/ServerResponse");
const StatusCode = require("../statuscode/index");

const proxy = {
    search: async (req, res, next) => {
        const schema = Joi.object().keys({
            // search_term: Joi.string()
            //     .required()
            //     .error(() => {
            //         return new Error("Search term is Required");
            //     }),
            search_term: Joi.string().optional().allow(""),
            person_id: Joi.number()
                .optional()
                .allow("")
                .error(() => {
                    return new Error("Person_id should be number type");
                }),
            organization_id: Joi.number()
                .optional()
                .allow("")
                .error(() => {
                    return new Error("Organization_id should be number type");
                }),
            start: Joi.number()
                .optional()
                .allow("")
                .error(() => {
                    return new Error("Start should be number type");
                }),
            limit: Joi.number()
                .optional()
                .allow("")
                .error(() => {
                    return new Error("Limit should be number type");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(
                    ServerResponse.validationResponse(result.error.message)
                );
            } else {
                next();
            }
        } catch (error) {
            // console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
};

module.exports = proxy;
