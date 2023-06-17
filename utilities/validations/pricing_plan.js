const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));;
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const idChecker = require('./idchecker');
const checkifrecordexist = require('./checkifrecordexist');
const enc_dec = require("../../utilities/decryptor/decryptor");
const checkIfPricingPlanExistbtwAmount = require('./checkIfPricingPlanExistbtwAmount');
const PricingPlanValidator = {
    add: async (req, res, next) => {
        const schema = Joi.object().keys({
            plan_name: Joi.string().required().messages({
                'string.empty': "Plan name should can be an empty",
                'any.required': 'Plan name required',
            }),
            from_amount: Joi.number().required().messages({
                "number.empty": "Valid from amount required",
                "any.required": "From amount required"
            }),
            to_amount: Joi.number().greater(Joi.ref('from_amount')).required().messages({
                "number.empty": "Valid to amount required",
                "number.greater":"To amount should be greater than From Amount",
                "any.required": "To amount required"
            }),
            fixed_amount: Joi.number().required().messages({
                "number.empty": "Valid fixed amount required",
                "any.required": " Fixed amount required"
            }),
            monthly_fee: Joi.number().required().messages({
                "number.empty": "Valid monthly fee fixed required",
                "any.required": " Monthly fee required"
            }),
            percentage_value: Joi.number().required().messages({
                "number.empty": "Valid percentage value required",
                "any.required": "Percentage value required"
            }),
            feature: Joi.string().required().messages({
                'string.empty': "feature should can be an empty",
                'any.required': 'feature name required',
            }),

        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let plan_name = req.bodyString('plan_name');
                let checkIfNameExits = await checkifrecordexist({name:plan_name},'pricing_plan');
                let record_exist = await checkifrecordexist({ 'name': req.bodyString('plan_name') }, 'pricing_plan');
                let isPricingPlanExistBtwAmount = await checkIfPricingPlanExistbtwAmount(req.bodyString('from_amount'),req.bodyString('to_amount'),'pricing_plan',null)
                if(record_exist || isPricingPlanExistBtwAmount || checkIfNameExits){
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(record_exist ? 'Pricing Plan already exist.': isPricingPlanExistBtwAmount ? "pricing plan already exist btw these amounts." : checkIfNameExits ? "Plan Name is already exist": ""));
                } else{
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    get: async (req, res, next) => {
        const schema = Joi.object().keys({
            pricing_plan_id: Joi.string().required().error(() => {
                return new Error("Pricing plan id Required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                    let psp_id = await enc_dec.cjs_decrypt(req.bodyString('pricing_plan_id'));
                    let psp_exits = await idChecker(psp_id, 'pricing_plan');
                    if (!psp_exits){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid pricing plan id'));
                    }else{
                        next();
                    }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    update: async (req, res, next) => {
        const schema = Joi.object().keys({
            id: Joi.string().min(2).required().messages({
                'string.empty': "Pricing Plan id should can be an empty",
                'any.required': 'Valid Pricing plan id required',
            }),
            name: Joi.string().required().messages({
                'string.empty': "Plan name should can be an empty",
                'any.required': 'Plan name required',
            }),
            from_amount: Joi.number().required().messages({
                "number.empty": "Valid from amount required",
                "any.required": "From amount required"
            }),
            to_amount: Joi.number().greater(Joi.ref('from_amount')).required().messages({
                "number.empty": "Valid to amount required",
                "number.greater":"To amount should be greater than From Amount",
                "any.required": "To amount required"
            }),
            fixed_amount: Joi.number().required().messages({
                "number.empty": "Valid fixed amount required",
                "any.required": " Fixed amount required"
            }),
            monthly_fee: Joi.number().required().messages({
                "number.empty": "Valid monthly fee fixed required",
                "any.required": " Monthly fee required"
            }),
            percentage_value: Joi.number().required().messages({
                "number.empty": "Valid percentage value required",
                "any.required": "Percentage value required"
            }),
            feature: Joi.string().required().messages({
                'string.empty': "feature should can be an empty",
                'any.required': 'feature name required',
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                let record_exist = await checkifrecordexist({ 'id': record_id }, 'pricing_plan');
                let isPricingPlanExistBtwAmount = await checkIfPricingPlanExistbtwAmount(req.bodyString('from_amount'),req.bodyString('to_amount'),'pricing_plan',record_id)
                if (record_exist && !isPricingPlanExistBtwAmount) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!record_exist ? 'Record not found' :  isPricingPlanExistBtwAmount ? "pricing plan already exist btw these amounts." : ""));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
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
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'psp');
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
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'psp');
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
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'psp');
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
module.exports = PricingPlanValidator