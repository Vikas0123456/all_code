const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));;
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const idChecker = require('./idchecker');
const checkifrecordexist = require('./checkifrecordexist');
const enc_dec = require("../../utilities/decryptor/decryptor");
const PspValidator = {
    add: async (req, res, next) => {
        const schema = Joi.object().keys({
            name: Joi.string().min(3).max(60).pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).required().messages({
                "string.pattern.base": "Name can contain alphabets",
                'string.empty': "Name should can be an empty",
                'any.required': 'Name required',
                'string.min': 'Name minimum length is 3 characters',
                'string.max': 'Name maximum length is 60 characters'
            }),
            class: Joi.string().required().messages({
                "string.empty": "Class should not be empty",
                "any.required": "Class required"
            }),
            // auth_currency: Joi.string().currency().required().messages({
            //     "string.empty": "Auth currency required",
            //     "any.required": "Auth currency required"
            // }),
            // settlement_currency: Joi.string().currency().required().messages({
            //     "string.empty": "Settlement currency required",
            //     "any.required": "Settlement currency required",
            //     "string.currency": "Valid ISO currency required"
            // }),
            // protocol: Joi.string().required().messages({
            //     "string.empty": "Protocol should not be empty",
            //     "any.required": "Protocol required"
            // }),
            // mode: Joi.string().required().messages({
            //     "string.empty": "Mode should not be empty",
            //     "any.required": "Mode required"
            // }),
            // cvv_setting: Joi.string().required().messages({
            //     "string.empty": "CVV setting should not be empty",
            //     "any.required": "CVV setting required"
            // }),
            // class_setting: Joi.string().required().messages({
            //     "string.empty": "Class setting should not be empty",
            //     "any.required": "Class setting required"
            // }),
            // buy_percentage: Joi.number().max(100).required().messages({
            //     "number.empty": "Valid buy percentage required",
            //     "any.required": "Buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // buy_fixed: Joi.number().required().messages({
            //     "number.empty": "Valid buy fixed required",
            // }),
            // sell_percentage: Joi.number().max(100).required().messages({
            //     "number.empty": "Valid buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // sell_fixed: Joi.number().required().messages({
            //     "number.empty": "Valid buy percentage required",
            // }),
            // international_buy_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_buy_fixed: Joi.number().messages({
            //     "number.empty": "Valid international buy fixed required",
            // }),
            // international_sell_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international sell percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_sell_fixed: Joi.number().messages({
            //     "number.empty": "Valid international sell fixed required",
            //     "any.required": "international sell fixed required"
            // }),
            // convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid convenience fixed required",
            //     "any.required": "convenience fixed required"
            // }),
            // domestic_convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid domestic convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // domestic_convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid domestic convenience fixed required",
            // }),
            // international_convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid international convenience fixed required",
            // }),
            cards: Joi.string().required().messages({
                "string.empty": "cards should not be empty",
                "any.required": "Cards required"
            }),
            // telr_mid: Joi.string().messages({
            //     "string.empty": "TELR MID should not be empty",
            // }),
            // telr_password: Joi.string().messages({
            //     "string.empty": "TELR Password should not be empty",
            // }),
            // deleted: Joi.string(),
            // status: Joi.string(),
            // sales_person: Joi.string().messages({
            //     "string.empty": "Sales Person should not be empty",
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
            applicable_rates: Joi.string().required().error(() => {
                throw new Error('Valid applicable rates required');
            })
        })

        try {
            const result = schema.validate(req.body);
            let rates = req.body.rates
            let count = 0
            rates_array = []
            for (let i = 0; i < rates.length; i++) {
                let ins_rate = `${rates[i].payment_method}-${rates[i].scheme}-${rates[i].domestic_international}`
                if(rates_array.includes(ins_rate)) {
                    count += 1
                    break
                }else{
                    rates_array.push(ins_rate)
                }
            }
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                if (rates.length > 0) {
                    if (count > 0) {
                        res.status(StatusCode.badRequest).send(ServerResponse.errormsg("Duplicate entries are not allowed"))
                    } else {
                        next()
                    }
                } else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
        }


    },
    get: async (req, res, next) => {
        const schema = Joi.object().keys({
            psp_id: Joi.string().required().error(() => {
                return new Error("PSP id Required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                if (req.bodyString('psp_id')) {
                    let psp_id = await enc_dec.cjs_decrypt(req.bodyString('psp_id'));
                    let psp_exits = await idChecker(psp_id, 'psp');
                    if (!psp_exits) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid psp id'));
                    } else {
                        next();
                    }
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    update: async (req, res, next) => {
        const schema = Joi.object().keys({
            psp_id: Joi.string().required().error(() => {
                return new Error("PSP id Required")
            }),
            name: Joi.string().min(3).max(60).pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).required().messages({
                "string.pattern.base": "Name can contain alphabets",
                'string.empty': "Name should can be an empty",
                'any.required': 'Name required',
                'string.min': 'Name minimum length is 3 characters',
                'string.max': 'Name maximum length is 60 characters'
            }),
            class: Joi.string().required().messages({
                "string.empty": "Class should not be empty",
                "any.required": "Class required"
            }),
            // auth_currency: Joi.string().currency().required().messages({
            //     "string.empty": "Auth currency required",
            //     "any.required": "Auth currency required"
            // }),
            // settlement_currency: Joi.string().currency().required().messages({
            //     "string.empty": "Settlement currency required",
            //     "any.required": "Settlement currency required",
            //     "string.currency": "Valid ISO currency required"
            // }),
            // protocol: Joi.string().required().messages({
            //     "string.empty": "Protocol should not be empty",
            //     "any.required": "Protocol required"
            // }),
            // mode: Joi.string().required().messages({
            //     "string.empty": "Mode should not be empty",
            //     "any.required": "Mode required"
            // }),
            // cvv_setting: Joi.string().required().messages({
            //     "string.empty": "CVV setting should not be empty",
            //     "any.required": "CVV setting required"
            // }),
            // class_setting: Joi.string().required().messages({
            //     "string.empty": "Class setting should not be empty",
            //     "any.required": "Class setting required"
            // }),
            // buy_percentage: Joi.number().max(100).required().messages({
            //     "number.empty": "Valid buy percentage required",
            //     "any.required": "Buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // buy_fixed: Joi.number().required().messages({
            //     "number.empty": "Valid buy fixed required",
            //     "any.required": "Buy fixed required"
            // }),
            // sell_percentage: Joi.number().max(100).required().messages({
            //     "number.empty": "Valid buy percentage required",
            //     "any.required": "Buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // sell_fixed: Joi.number().required().messages({
            //     "number.empty": "Valid buy percentage required",
            //     "any.required": "Buy percentage required"
            // }),
            // international_buy_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international buy percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_buy_fixed: Joi.number().messages({
            //     "number.empty": "Valid international buy fixed required",
            // }),
            // international_sell_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international sell percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_sell_fixed: Joi.number().messages({
            //     "number.empty": "Valid international sell fixed required",
            //     "any.required": "international sell fixed required"
            // }),
            // convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid convenience fixed required",
            //     "any.required": "convenience fixed required"
            // }),
            // domestic_convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid domestic convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // domestic_convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid domestic convenience fixed required",
            // }),
            // international_convenience_percentage: Joi.number().max(100).messages({
            //     "number.empty": "Valid international convenience percentage required",
            //     "number.max": "Not should be more than 100"
            // }),
            // international_convenience_fixed: Joi.number().messages({
            //     "number.empty": "Valid international convenience fixed required",
            // }),
            cards: Joi.string().required().messages({
                "string.empty": "cards should not be empty",
                "any.required": "Cards required"
            }),
            // telr_mid: Joi.string().messages({
            //     "string.empty": "TELR MID should not be empty",
            // }),
            // telr_password: Joi.string().messages({
            //     "string.empty": "TELR Password should not be empty",
            // }),
            // deleted: Joi.string(),
            // status: Joi.string(),
            // sales_person: Joi.string().messages({
            //     "string.empty": "Sales Person should not be empty",
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
            applicable_rates: Joi.string().required().error(() => {
                throw new Error('Valid applicable rates required');
            })
        })

        try {
            const result = schema.validate(req.body);
            let rates = req.body.rates
            let count = 0
            rates_array = []
            for (let i = 0; i < rates.length; i++) {
                let ins_rate = `${rates[i].payment_method}-${rates[i].scheme}-${rates[i].domestic_international}`
                if(rates_array.includes(ins_rate)) {
                    count += 1
                    break
                }else{
                    rates_array.push(ins_rate)
                }
            }
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let psp_id = await enc_dec.cjs_decrypt(req.bodyString('psp_id'));
                let psp_exits = await idChecker(psp_id, 'psp');
                if (!psp_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid psp id'));
                } else {
                    if (rates.length > 0) {
                        if (count > 0) {
                            res.status(StatusCode.badRequest).send(ServerResponse.errormsg("Duplicate entries are not allowed"))
                        } else {
                            next()
                        }
                    } else {
                        next();
                    }
                }

            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
        }


    },
    deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["psp_id"])) {

            const schema = Joi.object().keys({
                psp_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid psp ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('psp_id'));
                    let record_exist = await checkifrecordexist({
                        'id': record_id,
                        'status': 0,
                        'deleted': 0
                    }, 'psp');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already deactivated.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["psp_id"])) {

            const schema = Joi.object().keys({
                psp_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid psp ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('psp_id'));
                    let record_exist = await checkifrecordexist({
                        'id': record_id,
                        'status': 1,
                        'deleted': 0
                    }, 'psp');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already activated.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["psp_id"])) {

            const schema = Joi.object().keys({
                psp_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid psp ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('psp_id'));
                    let record_exist = await checkifrecordexist({
                        'id': record_id,
                        'deleted': 0
                    }, 'psp');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already deleted.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
}
module.exports = PspValidator