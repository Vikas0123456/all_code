const Joi = require("joi")
const ServerResponse = require("../response/ServerResponse")
const helpers  = require('../helper/general_helper')
const  path  = require('path')
const fs = require('fs');

const checkIfRecordExits = require('../validations/checkifrecordexist');
const enc_dec = require('../decryptor/decryptor');
const statusCode = require("../statuscode")

const EFRValidation = {
    confirmData: async (req,res,next) => {
        const schema = Joi.object().keys({
            registrationNumber: Joi.number().min(15).required().error(() => {
                throw new Error("Valid registration number required")
            }),
            face: Joi.string().required().error(() => {
                throw new Error("Valid face value required")
            }),
            dataHash: Joi.string().required().error(() => {
                throw new Error("Valid data hash required")
            }),
            tag: Joi.string().required().error(() => {
                throw new Error("Valid tag required")
            }),
            merchant_id: Joi.string().required().error(() => {
                throw new Error("Valid merchant_id required")
            })
        })

        try{

            const {error} = schema.validate(req.body)
            if(error){
                res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
            }else{
                let merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let merchant_id_exits = await checkIfRecordExits({id:merchant_id,deleted:0},'master_merchant');
                if(!merchant_id_exits){
                    res.status(statusCode.badRequest).send(ServerResponse.errormsg('Invalid merchant id'))
                }else{
                    next()
                }
              
            }
        }catch(error){
            res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
        }

    },

    VideoKycData:async(req,res,next) =>{
        const schema = Joi.object().keys({
            selfie: Joi.any().required().error(() => {
                throw new Error("selfie required")
            }),
            video_kyc: Joi.any().error(() => {
                throw new Error("video File required")
            }),
            customer_id: Joi.string().required().error(() => {
                throw new Error("customer Id required")
            }),
            comparison_message: Joi.string().required().error(() => {
                throw new Error("comparison message  required")
            }),
        })
        try{
            const {error} = schema.validate(req.body)
            if(error){
                res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
            }else{
                next()
            }
        }catch(error){
            res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
        }
    },
    WroldCheckData:async(req,res,next) =>{
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                throw new Error("merchant id required")
            }),
        })
        try{
            const {error} = schema.validate(req.body)
            if(error){
                res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
            }else{
                next()
            }
        }catch(error){
            res.status(statusCode.badRequest).send(ServerResponse.errormsg(error.message))
        }
    }
}

module.exports = EFRValidation