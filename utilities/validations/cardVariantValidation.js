const Joi = require("joi")
const statusCode = require("../statuscode")
const ServerResponse = require("../response/ServerResponse")
const protector = require("../decryptor/decryptor")
const checkifrecordexist = require('./checkifrecordexist')

const cardVariantValidation = {

    list : async (req,res,next) => {
        const schema = Joi.object().keys({
            card_id : Joi.string().required().error(()=> {
                throw new Error("Invalid card Id")
            })
        })
        try{
            const {error} = schema.validate(req.body)
            if(error){
                res.status(statusCode.ok).send(ServerResponse.errormsg(error.message))
            }else{
                card_id = protector.cjs_decrypt(req.bodyString('card_id'))
                record_exist = await checkifrecordexist({card_id: card_id, deleted: 0}, 'card_variant_master')
                if(record_exist){
                    next()
                }else{
                    res.status(statusCode.badRequest).send(ServerResponse.errormsg('Unable to get list'))
                }
            }
        }
        catch(err){
            res.status(statusCode.badRequest).send(ServerResponse.errormsg(err.message))
        }
    }

}

module.exports = cardVariantValidation