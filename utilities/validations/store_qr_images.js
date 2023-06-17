const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkifrecordexist = require('./checkifrecordexist')
const enc_dec = require("../decryptor/decryptor");
const multer = require('multer');
const helpers = require('../helper/general_helper');
const fs = require('fs');
const encrypt_decrypt = require("../../utilities/decryptor/encrypt_decrypt");
const { join } = require('path');
const checkifrecordexistanddata = require('../../utilities/validations/checkifrecordexistanddata');

const Validator = {
    image_add: async (req, res, next) => {
        req.body.image = req.all_files?.image;
        const schema = Joi.object().keys({
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            title:Joi.string().required().error(()=>{
                return new Error("Title  required")
            }),
            image:Joi.any().required().error(()=>{
                return new Error("Image required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_merchant');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid store id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_update: async (req, res, next) => {
        const schema = Joi.object().keys({
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            title:Joi.string().required().error(()=>{
                return new Error("Title  required")
            }),
            image_id:Joi.string().required().error(()=>{
                return new Error("Image id required") 
            }),
            image:Joi.any().allow('')
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('image_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'store_qr_images');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid image id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_list:async(req,res,next)=>{
        const schema = Joi.object().keys({
            store_id: Joi.string().allow('')
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_details:async(req,res,next)=>{
        const schema = Joi.object().keys({
            image_id: Joi.string().required().error(()=>{
                return new Error("Image id required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let image_id = enc_dec.cjs_decrypt(req.bodyString('image_id'));
                let record_exist = await checkifrecordexist({id:image_id,deleted:0},'store_qr_images')
                if(record_exist){
                    next();
                }else{
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid image id'));
                }
               
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_activate:async(req,res,next)=>{
        const schema = Joi.object().keys({
            image_id: Joi.string().required().error(()=>{
                return new Error("Image id required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let image_id = enc_dec.cjs_decrypt(req.bodyString('image_id'));
                let record_exist = await checkifrecordexist({id:image_id,status:1},'store_qr_images')
                if(record_exist){
                    next();
                }else{
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid image id or already activated.'));
                }
               
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_deactivate:async(req,res,next)=>{
        const schema = Joi.object().keys({
            image_id: Joi.string().required().error(()=>{
                return new Error("Image id required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let image_id = enc_dec.cjs_decrypt(req.bodyString('image_id'));
                let record_exist = await checkifrecordexist({id:image_id,status:0},'store_qr_images')
                if(record_exist){
                    next();
                }else{
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid image id or already deactivated.'));
                }
               
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    image_delete:async(req,res,next)=>{
        const schema = Joi.object().keys({
            image_id: Joi.string().required().error(()=>{
                return new Error("Image id required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let image_id = enc_dec.cjs_decrypt(req.bodyString('image_id'));
                let record_exist = await checkifrecordexist({id:image_id,deleted:0},'store_qr_images')
                if(record_exist){
                    next();
                }else{
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid image id or already deleted.'));
                }
               
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    add_config:async(req,res,next)=>{
        const schema = Joi.object().keys({
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            authorized_url_use_for:Joi.any().allow(''),
            authorized_url: Joi.alternatives().conditional('authorized_url_use_for',{
                is: '2', then : Joi.string().uri().required().error(()=> {
                    throw new Error('Valid authorized url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
            cancelled_url_use_for: Joi.any().allow(''),
            cancelled_url: Joi.alternatives().conditional('cancelled_url_use_for',{
                is: '2', then : Joi.string().uri().required().error(()=> {
                    throw new Error('Valid cancel url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
            declined_url_use_for: Joi.any().allow(''),
            declined_url: Joi.alternatives().conditional('declined_url_use_for',{
                is: '2', then : Joi.string().uri().required().error(()=> {
                    throw new Error('Valid declined url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_merchant');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid store id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    }
   
}
module.exports = Validator;