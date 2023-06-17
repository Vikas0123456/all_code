const Joi = require("joi");
const ServerResponse = require("../response/ServerResponse");
const StatusCode = require('../statuscode/index');
const enc_dec = require("../decryptor/decryptor");
const idChecker = require('./idchecker');

const StoreStatusValidator = {
    details: async (req, res, next) => {
        const schema = Joi.object().keys({
            store_status_id: Joi.string().required().error(() => {
                return new Error("Store status id Required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                    let store_status_id = await enc_dec.cjs_decrypt(req.bodyString('store_status_id'));
                    let card_exist = await idChecker(store_status_id, 'store_status_master');
                    if (!card_exist){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid store status id'));
                    }else{
                        next();
                    }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    }
}

module.exports = StoreStatusValidator