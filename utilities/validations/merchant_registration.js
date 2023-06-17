const Joi = require('joi').extend(require('@joi/date'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const idChecker = require('./idchecker');
const checkifrecordexist = require('./checkifrecordexist');
const validate_mobile = require('./validate_mobile');
const enc_dec = require("../../utilities/decryptor/decryptor");
const checkifrecordexistandexpiration = require('../../utilities/validations/checkifrecordexistandexpiration');
const helpers = require('../helper/general_helper');
const country = require('../../controller/country');
const MerchantRegister = {
    register: async (req, res, next) => {
        const schema = Joi.object().keys({
            name:Joi.string().required().error(()=>{
                return new Error("Valid name required")
            }),
            company_name: Joi.string().required().error(()=>{
                return new Error("Valid Business name required")
            }),
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            }),
            mobile_no: Joi.string().pattern(/^[0-9]+$/).required().error(() => {
                return new Error("Valid mobile required")
            }),
            code:Joi.string().required().error(() => {
                return new Error("Valid mobile code required")
            }),
            referral_code: Joi.string().min(10).max(10).optional().allow('').error(() => {
                return new Error("Invalid referral code")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let referral_exist = true
                // if(req.bodyString('referral_code') !=""){
                //     referral_exist = await checkifrecordexist({referral_code: req.bodyString('referral_code') }, 'master_merchant');
                // }
                let email_exits = await checkifrecordexist({ email: req.bodyString('email') }, 'master_super_merchant');
                let mobile_exits = await checkifrecordexist({ mobile_no: req.bodyString('mobile_no') }, 'master_super_merchant');
                let code_country = await validate_mobile(req.bodyString('code'),"country",req.bodyString('mobile_no'));
                
                if (email_exits || mobile_exits || !code_country.status || !referral_exist) {
                    if (email_exits){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with email ${req.bodyString('email')} already exits`));
                    }else if(!code_country.status){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(code_country.message));
                    }else if(mobile_exits){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with mobile no ${req.bodyString('mobile_no')} already exits`));
                    }else if(!referral_exist){
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid referral code`));
                    }
                } else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    resend_link: async (req, res, next) => {
        const schema = Joi.object().keys({
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let email_exits = await checkifrecordexist({ email: req.bodyString('email') }, 'master_super_merchant');
                if (!email_exits) {
                    res.status(StatusCode.ok).send(ServerResponse.validationResponse(`If your account is identified, you will be receiving an email to change your password.`));
                } else {
                    let rec_exits = await checkifrecordexist({ email: req.bodyString('email'),password:""}, 'master_super_merchant');
                    if(rec_exits){
                         next();
                    }else{
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with email ${req.bodyString('email')} has already set password. Please Login.`));
                    }
                    
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    verify_link: async (req, res, next) => {
        const schema = Joi.object().keys({
            token: Joi.string().required().error(() => {
                return new Error("Valid token required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let link_valid = await checkifrecordexistandexpiration({ token: req.bodyString('token'), is_expired: 0 }, 'master_merchant_password_reset');
                if (link_valid) {
                    res.status(StatusCode.ok).send(ServerResponse.successmsg('link is valid, please reset password'));
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('link expired or invalid token'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    reset_password: async (req, res, next) => {
        const schema = Joi.object().keys({
            password: Joi.string().required().error(() => {
                return new Error("Password required")
            }),
            confirm_password: Joi.string().equal(Joi.ref('password')).required().error(() => {
                return new Error("Confirm password required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Valid token required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let link_valid = await checkifrecordexistandexpiration({ token: req.bodyString('token'), is_expired: 0 }, 'master_merchant_password_reset');
                if (link_valid) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('link expired or invalid token'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

    reset_merchant_password: async (req, res, next) => {
        const schema = Joi.object().keys({
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let email_exits = await checkifrecordexist({ email: req.bodyString('email') }, 'master_super_merchant');
                if (!email_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.successmsg(`If your account is identified, you will be receiving an email to change your password.`));
                } else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },

    otp_registration:async (req, res, next) => {
        const schema = Joi.object().keys({
            token: Joi.string().required().error(() => {
                return new Error("Token required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let link_valid = await checkifrecordexistandexpiration({ token: req.bodyString('token'),is_expired:0}, 'twofa_authenticator');
                if (link_valid) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('Token is not valid or expired.'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    resend_otp:async (req, res, next) => {
        const schema = Joi.object().keys({
            token: Joi.string().required().error(() => {
                return new Error("Token required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let link_valid = await checkifrecordexist({ token: req.bodyString('token'),is_expired:0}, 'twofa_authenticator');
                if (link_valid) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('Token is not valid or expired.'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    verify_otp:async (req, res, next) => {
        const schema = Joi.object().keys({
            token: Joi.string().required().error(() => {
                return new Error("Token required")
            }),
            otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().error(() => {
                return new Error("OTP Required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let link_valid = await checkifrecordexistandexpiration({ token: req.bodyString('token'),is_expired:0}, 'twofa_authenticator');
                if (link_valid) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('Token is not valid or expired.'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

}
module.exports = MerchantRegister