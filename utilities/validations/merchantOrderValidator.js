const Joi = require('joi').extend(require('@joi/date'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const idChecker = require('./idchecker');
const checkifrecordexist = require('./checkifrecordexist');
const enc_dec = require("../../utilities/decryptor/decryptor");
const checkifrecordexistandexpiration = require('../../utilities/validations/checkifrecordexistandexpiration');
const e = require('express');
const MerchantOrderValidator = {
    create: async (req, res, next) => {

        let customer_details = req.body.data.customer_details;
        let order_details = req.body.data.order_details;

        const customer_details_schema = Joi.object().keys({
            name: Joi.string().required().error(() => {
                return new Error("Valid name required")
            }),
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            }),
            mobile: Joi.string().length(10).pattern(/^[0-9]+$/).allow('').error(() => {
                return new Error("Valid mobile required")
            }),
        })
        const order_details_schema = Joi.object().keys({
            amount: Joi.number().required().error(() => {
                return new Error("Valid amount required")
            }),
            currency: Joi.string().required().error(() => {
                return new Error("Valid currency required")
            }),
            return_url: Joi.string().uri().required().error(() => {
                return new Error("Valid return url required")
            }),
        })

        const result1 = customer_details_schema.validate(customer_details);
        if (result1.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result1.error.message));
        }
        const result2 = order_details_schema.validate(order_details);
        if (result2.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result2.error.message));
        }
        if (!result1.error && !result2.error) {
            next()
        }
    },
    get: async (req, res, next) => {
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Valid order token required")
            }),
            browserFP:Joi.string().allow('')
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                if (req.bodyString('order_id')) {
                    let order_id = req.bodyString('order_id')
                    let table_name = '';
                    if (req.order.env == 'test') {
                        table_name = 'orders_test'
                    } else {
                        table_name = 'orders'
                    }
                    let order_exits = await checkifrecordexist({ order_id: order_id}, table_name);
                    if (!order_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                }
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    pay: async (req, res, next) => {
        const schema = Joi.object().keys({
            card_id: Joi.string().allow(''),
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            name: Joi.string().required().error(() => { return new Error("Valid name required") }),
            email:Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            }),
            dial_code:Joi.string().allow(''),
            mobile_no: Joi.string().length(10).pattern(/^[0-9]+$/).required().error(() => {
                return new Error("Valid mobile no required")
            }),
            card: Joi.when('card_id',{is:'',then:Joi.string().length(16).pattern(/^[0-9]+$/).required().error(() => {
                return new Error("Valid card no required")
            })}),
            expiry_date: Joi.when('card_id',{is:'',then:Joi.date().format('MM/YY').raw().greater(Date.now()).required(() => {
                return new Error("Valid expiry date required")
            })}),
            cvv: Joi.string().length(3).pattern(/^[0-9]+$/).required().error(() => {
                return new Error("Valid cvv required")
            }),
            save_card: Joi.string().allow('0', '1').required().error(() => {
                return new Error("Save card field required")
            }),
            payment_mode:Joi.string().required().error(()=>{
                return new Error("Payment mode required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Token required")
            }),
            browserFP:Joi.string().allow(''),
            prefer_lang:Joi.string().required().error(()=>{
                return new Error("Prefer lang required")
            })

        })
        const result = schema.validate(req.body);
        if (result.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
        } else {
            if (req.bodyString('order_id')) {
                let order_id = req.bodyString('order_id')
                let table_name = '';
                if (req.order.env == 'test') {
                    table_name = 'orders_test'
                } else {
                    table_name = 'orders'
                }
                let order_exits = await checkifrecordexist({ order_id: order_id, merchant_id: req.order.merchant_id }, table_name);
                let order_is_processed = true;//await checkifrecordexist({ order_id: order_id, merchant_id: req.credentials.merchant_id, status: 'Created' }, table_name);
                let card_id = req.bodyString('card_id');
                if(card_id!=''){
                 card_id = enc_dec.cjs_decrypt(req.bodyString('card_id'))
                }else{
                     card_id = false;
                }
                if (!order_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                } else if (!order_is_processed) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Order is already processed'));
                }else if(card_id){
                    let card_exits = await checkifrecordexist({ id: card_id }, 'customers_cards');
                    if(!card_exits){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('In valid card id'));
                    }else{
                        next();
                    }
                } else {
                    next();
                }
            } else {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Valid order id required'));
            }

        }
    },
    card_list: async (req, res, next) => {
        const schema = Joi.object().keys({
            token: Joi.string().allow(''),
        })
        const result = schema.validate(req.body);
        if (result.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
        } else {
            next();

        }
    },
    cancel: async (req, res, next) => {
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Token required")
            }),

        })
        const result = schema.validate(req.body);
        if (result.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
        } else {
                let order_id = req.bodyString('order_id')
                let table_name = '';
                if (req.order.env == 'test') {
                    table_name = 'orders_test'
                } else {
                    table_name = 'orders'
                }
                let order_exits = await checkifrecordexist({ order_id: order_id, merchant_id: req.order.merchant_id }, table_name);
                let order_is_processed = await checkifrecordexist({ order_id: order_id, merchant_id: req.order.merchant_id, status: 'Created' }, table_name);
                let card_id = req.bodyString('card_id');
                if (!order_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                } else if (!order_is_processed) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Order is already processed'));
                }else {
                    next();
                }
        }
    },
    remove:async(req,res,next)=>{
        const schema = Joi.object().keys({
            card_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
        })
        const result = schema.validate(req.body);
        if (result.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
        } else {
                let card_id = enc_dec.cjs_decrypt(req.bodyString('card_id'))
                let table_name = 'customers_cards';
                let card_exits = await checkifrecordexist({ id: card_id,deleted:0},table_name);
                if (!card_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid card id or already deleted.'));
                }else {
                    next();
                }
        }
    },
    send_notification_pay_with_vault: async (req, res, next) => {
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Valid order token required")
            }),
            browserFP:Joi.string().required().error(()=>{
                return new Error("Valid browser fingerprint required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                if (req.bodyString('order_id')) {
                    let order_id = req.bodyString('order_id')
                    let table_name = '';
                    if (req.order.env == 'test') {
                        table_name = 'orders_test'
                    } else {
                        table_name = 'orders'
                    }
                    let order_exits = await checkifrecordexist({ order_id: order_id}, table_name);
                    if (!order_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                    let browser_fingerprint = JSON.parse(enc_dec.cjs_decrypt(req.bodyString('browserFP')));
                    req.browser_fingerprint = browser_fingerprint;
                }
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    pay_with_vault: async (req, res, next) => {
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Valid order token required")
            }),
            card_id:Joi.string().required().error(()=>{
                return new Error("Valid card id required")
            }),
            cvv: Joi.string().length(3).pattern(/^[0-9]+$/).required().error(() => {
                return new Error("Valid cvv required")
            }),
            email:Joi.string().email().required().error(()=>{
                return new Error("Valid email required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                if (req.bodyString('order_id')) {
                    let order_id = req.bodyString('order_id')
                    let table_name = '';
                    if (req.order.env == 'test') {
                        table_name = 'orders_test'
                    } else {
                        table_name = 'orders'
                    }
                    let order_exits = await checkifrecordexist({ order_id: order_id}, table_name);
                    if (!order_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                    let browser_fingerprint = JSON.parse(enc_dec.cjs_decrypt(req.bodyString('browserFP')));
                    req.browser_fingerprint = browser_fingerprint;
                    let dec_card_id = enc_dec.cjs_decrypt(req.bodyString('card_id'));
                    let card_exits = await checkifrecordexist({id:dec_card_id},'customers_cards');
                    if(!card_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid card id'));
                }
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    order_details_fetch: async (req, res, next) => {
        console.log(`we are here`);
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
        })
        const result = schema.validate(req.body);
        if (result.error) {
            res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
        } else {
                let order_id = req.bodyString('order_id')
                let table_name = 'orders_test';
                /*** 
                 * skipping this because not clear now 
                if (req.order.env == 'test') {
                    table_name = 'orders_test'
                  
                } else {
                    table_name = 'orders'
                  
                }
                */
                console.log(table_name);
                let order_exits = await checkifrecordexist({ order_id: order_id}, table_name);
                if (!order_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid order id'));
                }else {
                    next();
                }
        }
    },
}
module.exports = MerchantOrderValidator;