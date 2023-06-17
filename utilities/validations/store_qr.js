const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkifrecordexist = require('./checkifrecordexist')
const enc_dec = require("../decryptor/decryptor");
const multer = require('multer');
const helpers = require('../helper/general_helper');
const fs = require('fs');
const encrypt_decrypt = require("../decryptor/encrypt_decrypt");
const { join } = require('path');
const checkifrecordexistanddata = require('./checkifrecordexistanddata');

const Validator = {
    qr_add: async (req, res, next) => {
        const schema = Joi.object().keys({
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            title:Joi.string().required().error(()=>{
                return new Error("Title required")
            }),
            product_or_card_id:Joi.string().allow(''),
            currency:Joi.string().required(()=>{
                return new Error("Currency required")
            }),
            amount:Joi.when('variable_value_status', {
                is:1,
                then:Joi.number().greater(0).allow('').error(()=>{
                    return new Error("Valid amount required")
                })
            }),
            min_order_quantity:Joi.number().integer().allow(''),
            max_order_quantity:Joi.number().integer().allow(''),
            full_name:Joi.string().allow(''),
            address_line_1:Joi.string().allow(''),
            city:Joi.string().allow(''),
            country:Joi.any().allow(''),
            email:Joi.string().allow(''),
            phone_code:Joi.string().allow(''),
            phone_no:Joi.string().allow(''),
            city:Joi.string().allow(''),
            variable_value_status:Joi.number().integer().allow(''),
            variable_value_title:Joi.string().allow(''),
            not_valid_before:Joi.date().format('YYYY-MM-DD').allow(''),
            not_valid_after:Joi.date().format('YYYY-MM-DD').allow(''),
            stock_control:Joi.number().integer().allow(''),
            stock_count:Joi.number().integer().allow(''),
            description:Joi.string().allow(''),
            images:Joi.string().allow(''),
            tweeter_id:Joi.string().allow(''),
            mode:Joi.string().required().error(()=>{
                return new Error("Mode required")       
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
    qr_list:async(req,res,next)=>{
        const schema = Joi.object().keys({
            store_id: Joi.string().allow('').error(() => {
                return new Error("Store id required")
            }),
            from_date:Joi.string().allow(''),
            to_date:Joi.string().allow(''),
            status:Joi.string().allow(''),
            currency:Joi.string().currency().allow(''),
            amount_compare_type:Joi.string().allow(''),
            amount:Joi.number().allow(''),
            perpage:Joi.any().allow(''),
            page:Joi.any().allow(''),
            mode:Joi.string().required().error(()=>{
                return new Error("Mode is required")
            })
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
    qr_details:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid QR id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    qr_update:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            title:Joi.string().required().error(()=>{
                return new Error("Title required")
            }),
            product_or_card_id:Joi.string().allow(''),
            currency:Joi.string().required(()=>{
                return new Error("Currency required")
            }),
            amount:Joi.when('variable_value_status',{
                is:1,
                then:Joi.number().greater(0).allow('').error(()=>{
                    return new Error("Valid amount required")
                })
            }),
            
            min_order_quantity:Joi.number().integer().allow(''),
            max_order_quantity:Joi.number().integer().allow(''),
            full_name:Joi.string().allow(''),
            address_line_1:Joi.string().allow(''),
            city:Joi.string().allow(''),
            country:Joi.any().allow(''),
            email:Joi.string().allow(''),
            phone_code:Joi.string().allow(''),
            phone_no:Joi.string().allow(''),
            city:Joi.string().allow(''),
            variable_value_status:Joi.number().integer().allow(''),
            variable_value_title:Joi.string().allow(''),
            not_valid_before:Joi.date().format('YYYY-MM-DD').allow(''),
            not_valid_after:Joi.date().format('YYYY-MM-DD').allow(''),
            stock_control:Joi.number().integer().allow(''),
            stock_count:Joi.number().integer().allow(''),
            description:Joi.string().allow(''),
            images:Joi.string().allow(''),
            tweeter_id:Joi.string().allow(''),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid qr  id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    qr_activate:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0,status:1 }, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid QR id or already active'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    qr_deactivate:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0,status:0 }, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid QR id or already deactivated'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    qr_code_details:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = req.bodyString('qr_id')
                let record_exist = await checkifrecordexist({ 'qr_id': record_id, 'deleted': 0 }, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid QR code'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    qr_delete:async(req,res,next)=>{
        const schema = Joi.object().keys({
            qr_id: Joi.string().required().error(() => {
                return new Error("QR id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0}, 'store_qrs');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid QR id or already deleted'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
   
}
module.exports = Validator;