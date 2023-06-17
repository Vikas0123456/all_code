const Joi = require("joi");
const StatusCode = require('../statuscode/index');
const ServerResponse = require('../response/ServerResponse');
const enc_dec = require("../../utilities/decryptor/decryptor");
const idchecker = require('./idchecker');
const checkifrecordexist = require("./checkifrecordexist");

const MerchantKeyAndSecretValidator = {
    details: async (req,res,next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required.")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let merchant_id =  enc_dec.cjs_decrypt(req.bodyString('merchant_id'))
                let record_exist = await checkifrecordexist({'id':merchant_id},'master_merchant');
                if(!record_exist){
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Merchant id  not exist." ));
                } else{
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }

    }
}

module.exports = MerchantKeyAndSecretValidator