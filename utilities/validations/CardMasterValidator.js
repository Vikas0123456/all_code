const Joi = require("joi");
const ServerResponse = require("../response/ServerResponse");
const StatusCode = require('../statuscode/index');
const enc_dec = require("../decryptor/decryptor");
const idChecker = require('./idchecker');

const CardMasterValidator = {
    details: async (req, res, next) => {
        const schema = Joi.object().keys({
            card_id: Joi.string().required().error(() => {
                return new Error("Card id Required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                    let card_id = await enc_dec.cjs_decrypt(req.bodyString('card_id'));
                    let card_exist = await idChecker(card_id, 'card_master');
                    if (!card_exist){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid card id'));
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

module.exports = CardMasterValidator