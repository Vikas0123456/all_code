const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));;
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkifrecordexist = require('./checkifrecordexist');
const enc_dec = require("../../utilities/decryptor/decryptor");
const idchecker = require('./idchecker');
const TerminalValidator = {
    add: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("sub merchant id required.")
            }),
            mid: Joi.string().required().error(() => {
                return new Error("mid required.")
            }),
            psp_id: Joi.string().required().error(() => {
                return new Error("psp id required.")
            }),
            class: Joi.string().required().error(() => {
                return new Error("class required.")
            }),
            auth_currency: Joi.string().required().error(() => {
                return new Error("auth currency required.")
            }),
            settlement_currency: Joi.string().required().error(() => {
                return new Error("settlement currency required.")
            }),
            protocol: Joi.string().required().error(() => {
                return new Error("protocol required.")
            }),
            threeds: Joi.string().required().error(() => {
                return new Error("threeds required.")
            }),         
            password: Joi.string().required().error(() => {
                return new Error("password required.")
            }),
            mode: Joi.string().required().error(() => {
                return new Error("mode required.")
            }), 
            cvv_setting: Joi.string().required().error(() => {
                return new Error("cvv setting required.")
            }), 
            class_setting: Joi.string().required().error(() => {
                return new Error("class setting required.")
            }),           
            // buy_percentage: Joi.string().required().error(() => {
            //     return new Error("buy percentage required.")
            // }), 
            // buy_fixed: Joi.string().required().error(() => {
            //     return new Error("buy fixed required.")
            // }), 
            // sell_percentage: Joi.string().required().error(() => {
            //     return new Error("sell percentage required.")
            // }), 
            // sell_fixed: Joi.string().required().error(() => {
            //     return new Error("sell fixed required.")
            // }), 
            payout_delay: Joi.string().required().error(() => {
                return new Error("payout delay required.")
            }), 
            submerchant_name: Joi.string().required().messages({
                "string.empty": "Submerchant name should not be empty",
                "any.required": "Submerchant name required"
            }),
            submerchant_city: Joi.string().required().messages({
                "string.empty": "Submerchant city should not be empty",
                "any.required": "Submerchant city required"
            }),
            sales_person: Joi.string().required().messages({
                "string.empty": "Sales person name should not be empty",
                "any.required": "Sales person name required"
            }),
            convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid convenience percentage required",
                "any.required": "convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            convenience_fixed: Joi.number().messages({
                "number.empty": "Valid convenience fixed required",
                "any.required": "convenience fixed required"
            }),
            domestic_convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid domestic convenience percentage required",
                "any.required": "domestic convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            domestic_convenience_fixed: Joi.number().messages({
                "number.empty": "Valid domestic convenience fixed required",
                "any.required": "domestic convenience fixed required"
            }),
            international_convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid international convenience percentage required",
                "any.required": "international convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            international_convenience_fixed: Joi.number().messages({
                "number.empty": "Valid international convenience fixed required",
                "any.required": "international convenience fixed required"
            }),
            cards: Joi.string().required().messages({
                "string.empty": "cards should not be empty",
                "any.required": "Cards required"
            }),
            // telr_mid: Joi.string().messages({
            //     "string.empty": "telr mid should not be empty",
            // }),
            // telr_password: Joi.string().messages({
            //     "string.empty": "telr password should not be empty",
            // }),
            deleted: Joi.string().messages({
                "string.empty": "deleted should not be empty",
            }),
            status: Joi.string().messages({
                "string.empty": "status should not be empty",
            }),
            // international_buy_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international buy percentage required",
            //     "any.required": "international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_buy_fixed: Joi.number().messages({
            //     "number.empty": "Valid international buy fixed required",
            //     "any.required": "international buy fixed required"
            // }),
            // international_sell_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international sell percentage required",
            //     "any.required": "international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_sell_fixed: Joi.number().messages({
            //     "number.empty": "Valid international sell fixed required",
            //     "any.required": "international buy fixed required"
            // }),
            rates: Joi.array().items(
                Joi.object({
                    payment_method: Joi.string().required().error(() => {
                        throw new Error('Valid payment method required');
                    }),
                    scheme: Joi.string().required().error(() => {
                        throw new Error('Valid scheme required');
                    }),
                    domestic_international: Joi.string().required().error(() => {
                        throw new Error('Valid domestic international value required');
                    }),
                    variant: Joi.string().allow("").error(() => {
                        throw new Error('Valid varaint value required');
                    }),
                    buy_rate_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid buy rate percentage required');
                    }),
                    buy_rate_fixed: Joi.number().required().error(() => {
                        throw new Error('Valid buy rate fixed required');
                    }),
                    sell_rate_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid sell rate percentage required');
                    }),
                    sell_rate_fixed: Joi.number().required().error(() => {
                        throw new Error('Valid sell rate fixed required');
                    }),
                    tax_in_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid tax required');
                    })

                })
            ),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let psp_id = enc_dec.cjs_decrypt(req.bodyString('psp_id'))
                let record_exist = await checkifrecordexist({ 'id':psp_id}, 'psp');
                if(!record_exist){
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("PSP is not exist." ));
                } else{
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    update: async (req, res, next) => {
        const schema = Joi.object().keys({
            id: Joi.string().required().error(() => {
                return new Error("id required.")
            }),
            submerchant_id: Joi.string().required().error(() => {
                return new Error("sub merchant id required.")
            }),
            mid: Joi.string().required().error(() => {
                return new Error("mid required.")
            }),
            psp_id: Joi.string().required().error(() => {
                return new Error("psp id required.")
            }),
            class: Joi.string().required().error(() => {
                return new Error("class required.")
            }),
            auth_currency: Joi.string().required().error(() => {
                return new Error("auth currency required.")
            }),
            settlement_currency: Joi.string().required().error(() => {
                return new Error("settlement currency required.")
            }),
            protocol: Joi.string().required().error(() => {
                return new Error("protocol required.")
            }),
            threeds: Joi.string().required().error(() => {
                return new Error("threeds required.")
            }),         
            password: Joi.string().required().error(() => {
                return new Error("password required.")
            }),
            mode: Joi.string().required().error(() => {
                return new Error("mode required.")
            }), 
            cvv_setting: Joi.string().required().error(() => {
                return new Error("cvv setting required.")
            }), 
            class_setting: Joi.string().required().error(() => {
                return new Error("class setting required.")
            }),           
            // buy_percentage: Joi.string().required().error(() => {
            //     return new Error("buy percentage required.")
            // }), 
            // buy_fixed: Joi.string().required().error(() => {
            //     return new Error("buy fixed required.")
            // }), 
            // sell_percentage: Joi.string().required().error(() => {
            //     return new Error("sell percentage required.")
            // }), 
            // sell_fixed: Joi.string().required().error(() => {
            //     return new Error("sell fixed required.")
            // }), 
            payout_delay: Joi.string().required().error(() => {
                return new Error("payout delay required.")
            }),
            submerchant_name: Joi.string().messages({
                "string.empty": "Submerchant name should not be empty",
                "any.required": "Submerchant name required"
            }),
            submerchant_city: Joi.string().messages({
                "string.empty": "Submerchant city should not be empty",
                "any.required": "Submerchant city required"
            }),
            sales_person: Joi.string().messages({
                "string.empty": "Sales person name should not be empty",
                "any.required": "Sales person name required"
            }),
            convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid convenience percentage required",
                "any.required": "convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            convenience_fixed: Joi.number().messages({
                "number.empty": "Valid convenience fixed required",
                "any.required": "convenience fixed required"
            }),
            domestic_convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid domestic convenience percentage required",
                "any.required": "domestic convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            domestic_convenience_fixed: Joi.number().messages({
                "number.empty": "Valid domestic convenience fixed required",
                "any.required": "domestic convenience fixed required"
            }),
            international_convenience_percentage: Joi.number().max(100).messages({
                "number.empty": "Valid international convenience percentage required",
                "any.required": "international convenience percentage required",
                "number.max": "Not should be more than 100"
            }),
            international_convenience_fixed: Joi.number().messages({
                "number.empty": "Valid international convenience fixed required",
                "any.required": "international convenience fixed required"
            }),
            cards: Joi.string().messages({
                "string.empty": "cards should not be empty",
                "any.required": "Cards required"
            }),
            // telr_mid: Joi.string().messages({
            //     "string.empty": "telr mid should not be empty",
            // }),
            // telr_password: Joi.string().messages({
            //     "string.empty": "telr password should not be empty",
            // }),
            // international_buy_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international buy percentage required",
            //     "any.required": "international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_buy_fixed: Joi.number().messages({
            //     "number.empty": "Valid international buy fixed required",
            //     "any.required": "international buy fixed required"
            // }),
            // international_sell_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international sell percentage required",
            //     "any.required": "international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_sell_fixed: Joi.number().messages({
            //     "number.empty": "Valid international sell fixed required",
            //     "any.required": "international buy fixed required"
            // }),
            rates: Joi.array().items(
                Joi.object({
                    rate_id: Joi.string().allow("").error(() => {
                        throw new Error("Invalid rate id")
                    }),
                    payment_method: Joi.string().required().error(() => {
                        throw new Error('Valid payment method required');
                    }),
                    scheme: Joi.string().required().error(() => {
                        throw new Error('Valid scheme required');
                    }),
                    domestic_international: Joi.string().required().error(() => {
                        throw new Error('Valid domestic international value required');
                    }),
                    variant: Joi.string().allow("").error(() => {
                        throw new Error('Valid varaint value required');
                    }),
                    buy_rate_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid buy_rate_percentage required');
                    }),
                    buy_rate_fixed: Joi.number().required().error(() => {
                        throw new Error('Valid buy_rate_fixed required');
                    }),
                    sell_rate_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid sell_rate_percentage required');
                    }),
                    sell_rate_fixed: Joi.number().required().error(() => {
                        throw new Error('Valid sell_rate_fixed required');
                    }),
                    tax_in_percentage: Joi.number().required().error(() => {
                        throw new Error('Valid tax required');
                    })

                })
            ),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let psp_id = await enc_dec.cjs_decrypt(req.bodyString('psp_id'))
                let submerchant_id = await enc_dec.cjs_decrypt(req.bodyString('submerchant_id'))
                let record_exist = await checkifrecordexist({'id':req.bodyString('id'),'submerchant_id':submerchant_id,'psp_id':psp_id},'mid');
                if(!record_exist){
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("terminal not exist." ));
                } else{
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    details: async (req, res, next) => {
        const schema = Joi.object().keys({
            terminal_id: Joi.string().required().error(() => {
                return new Error("Terminal id required.")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let terminal_id = await enc_dec.cjs_decrypt(req.bodyString('terminal_id'))
                let record_exist = await idchecker(terminal_id, 'mid');
                if(!record_exist){
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Terminal is not exist." ));
                } else{
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
}
module.exports = TerminalValidator