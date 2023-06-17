const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const validate_mobile = require('./validate_mobile');
const checkwithcolumn = require('./checkerwithcolumn');
const checkifrecordexist = require('./checkifrecordexist')
const enc_dec = require("../decryptor/decryptor");
const multer = require('multer');
const helpers = require('../helper/general_helper');
const fs = require('fs');
const encrypt_decrypt = require("../../utilities/decryptor/encrypt_decrypt");
const { join } = require('path');
const checkifrecordexistanddata = require('../../utilities/validations/checkifrecordexistanddata');
const checkifrecordexistandexpiration = require('../../utilities/validations/checkifrecordexistandexpiration');
const checkIfRecordExitsWithName = require('../../utilities/validations/checkifrecordexistwithname');
const Validator = {
    login: async (req, res, next) => {
        const schema = Joi.object().keys({
            username: Joi.string().email().required().error(() => {
                return new Error("Valid Email Required")
            }),
            password: Joi.string().required().error(() => {
                return new Error("Password Required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                next();
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    forget_password: async (req, res, next) => {
        if (checkEmpty(req.body, ["email", "user"])) {
            const schema = Joi.object().keys({
                email: Joi.string().email().required().error(() => {
                    return new Error("Valid email required")
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    next();
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    reset_forget_password: async (req, res, next) => {
        if (checkEmpty(req.body, ["authtoken", "password", "confirm_password"])) {
            const schema = Joi.object().keys({
                authtoken: Joi.string().required().error(() => {
                    return new Error("Authentication failed or link expired.")
                }),
                password: Joi.string().min(8).max(15).required().error(() => {
                    return new Error("Valid password required.(Length 8 to 15 words)")
                }),
                confirm_password: Joi.string().valid(Joi.ref('password')).min(8).max(15).required().error(() => {
                    return new Error("Valid confirm password required.(Length 8 to 15 words)")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let check_authtoken = await helpers.get_token_check({ token: req.bodyString("authtoken") });
                    if (check_authtoken) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Your request was not found or link expired.'));
                    }

                }
            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    register: async (req, res, next) => {


        const schema = Joi.object().keys({
            name: Joi.string().min(2).max(100).required().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).error(() => {
                return new Error("Name can contain only alphabets")
            }),
            designation: Joi.string().required().error(() => {
                return new Error("Valid designation required")
            }),
            department: Joi.string().required().error(() => {
                return new Error("Valid department required")
            }),
            email: Joi.string().min(5).max(100).email().required().error(() => {
                return new Error("Valid email required")
            }),
            mobile_no: Joi.string().min(8).max(10).optional().allow('').error(() => {
                return new Error("Valid mobile no required")
            }),
            country_code: Joi.string().min(1).max(7).optional().allow('').error(() => {
                return new Error("Valid country code required")
            }),
            role: Joi.string().min(2).required().error(() => {
                return new Error("Valid role required")
            }),
            // username: Joi.string().min(5).max(29).required().pattern(new RegExp(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/)).messages({
            //     "string.pattern.base": "Username can contain alphanumeric characters and/or underscores(_)",
            //     'string.empty': 'Username should not be an empty',
            //     'any.required': 'Username required',
            //     'string.min': 'Username minimum length is 5 characters',
            //     'string.max': 'Username maximum length is 29 characters'
            // }),
            image: Joi.optional().allow('').error(() => {
                return new Error("Valid image required")
            }),

            // password: Joi.string().min(8).max(15).optional().allow('').pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
            //     "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
            //     'string.empty': 'Password should not be an empty',
            //     'any.required': 'Password required',
            //     'string.max': 'Maximum length is 15 characters'
            // }),
            // confirm_password: Joi.string().valid(Joi.ref('password')).label('Confirm Password').min(8).max(15).optional().allow('').pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
            //     "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
            //     'string.empty': 'Password should not be an empty',
            //     'any.required': 'Password required',
            //     'string.max': 'Maximum length is 15 characters',
            //     'any.only': '{{#label}} does not match'
            // })
        })

        try {
            const result = schema.validate(req.body);
            console.log(result);
            if (result.error) {
                if (req.all_files) {
                    if (req.all_files.image) {
                        fs.unlink('public/images/' + req.all_files.image, function (err) {
                            if (err) console.log(err);
                        });
                    }
                }
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

            } else {
                var error1 = '';
                if (req.all_files) {

                    if (!req.all_files.image) {
                        error1 = "Please upload valid image file. Only .jpg,.png file accepted (size: upto 1MB)";

                    }
                }



                if (req.bodyString('mobile_no')) {
                    let mobile_exist = await checkifrecordexist({ 'mobile': req.bodyString('mobile_no'), 'deleted': 0 }, 'adm_user');
                    if (mobile_exist) {
                        error1 = 'Mobile number already exist';
                    }
                }

                if (req.bodyString('email')) {
                    let email_exist = await checkifrecordexist({ 'email': req.bodyString('email'), 'deleted': 0 }, 'adm_user');
                    if (email_exist) {
                        error1 = 'Email already exist.';
                    }
                }
                // let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                // let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0 }, 'adm_user');

                if (error1 == '' /*&& !username_exist*/) {

                    next();
                } else {

                    if (req.all_files) {
                        if (req.all_files.image) {
                            fs.unlink('public/images/' + req.all_files.image, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }

                    if (error1) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error1));
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Username already exist'));
                    }

                }
            }

        } catch (error) {
            console.log(error)
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    create_password: async (req, res, next) => {
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
                let link_valid = await checkifrecordexistandexpiration({ token: req.bodyString('token'), is_expired: 0 }, 'admin_reset_password');
                if (link_valid) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('link expired or invalid token'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

    admin_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["user_id"])) {
            const schema = Joi.object().keys({
                user_id: Joi.string().required().error(() => {
                    return new Error("User ID not found")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let user_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));

                    let user_exist = await checkifrecordexist({ 'id': user_id, 'deleted': 0 }, 'adm_user');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse());
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    admin_details_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["name", "designation", "department", "email", "password", "confirm_password", "mobile_no", "role", "user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().required().error(() => {
                    return new Error("Valid user ID required")
                }),
                name: Joi.string().min(2).max(100).required().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).error(() => {
                    return new Error("Name can contain alphabets")
                }),
                designation: Joi.string().required().error(() => {
                    return new Error("Valid designation required")
                }),
                department: Joi.string().required().error(() => {
                    return new Error("Valid department required")
                }),
                email: Joi.string().min(5).max(100).email().optional().allow('').error(() => {
                    return new Error("Valid email required")
                }),
                mobile_no: Joi.string().min(8).max(15).optional().allow('').pattern(new RegExp(/^[0-9]*$/)).error(() => {
                    return new Error("Please enter only digits.")
                }),
                country_code: Joi.string().min(1).max(7).optional().allow('').error(() => {
                    return new Error("Valid country code required")
                }),
                role: Joi.string().allow('').required().error(() => {
                    return new Error("Valid role required")
                }),
                image: Joi.any(),
                // username: Joi.string().min(5).max(29).required().pattern(new RegExp(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/)).messages({
                //     "string.pattern.base": "Username can contain alphanumeric characters and/or underscores(_)",
                //     'string.empty': 'Username should not be an empty',
                //     'any.required': 'Username required',
                //     'string.min': 'Username minimum length is 5 characters',
                //     'string.max': 'Username maximum length is 29 characters'
                // }),
                // password: Joi.string().min(8).max(15).optional().allow('').pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
                //     "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
                //     'string.empty': 'Password should not be an empty',
                //     'any.required': 'Password required',
                //     'string.max': 'Maximum length is 15 characters'
                // }),
                // confirm_password: Joi.string().valid(Joi.ref('password')).label('Confirm Password').min(8).max(15).optional().allow('').pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
                //     "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
                //     'string.empty': 'Password should not be an empty',
                //     'any.required': 'Password required',
                //     'string.max': 'Maximum length is 15 characters',
                //     'any.only': '{{#label}} does not match'
                // })
            })
            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    if (req.all_files) {
                        if (req.all_files.image) {
                            fs.unlink('public/images/' + req.all_files.image, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

                } else {
                    user_id = enc_dec.cjs_decrypt(req.bodyString('user_id'))
                    if (req.all_files) {
                        if (!req.all_files.image) {
                            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Please upload valid image file. Only .jpg,.png file accepted (size: upto 1MB)'));
                        }
                    }

                    // let mobile_exist = await checkifrecordexist({ 'mobile': req.bodyString('mobile_no'), 'id !=': user_id, 'deleted': 0 }, 'adm_user');
                    // if (mobile_exist) {
                    //     res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Mobile number already exist.'));
                    // }

                    // let email_exist = await checkifrecordexist({ 'email': req.bodyString('email'), 'deleted': 0, 'id !=': user_id }, 'adm_user');
                    // if (email_exist) {
                    //     res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Email already exist.'));
                    // }
                    // let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                    // let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0, 'id !=': user_id }, 'adm_user');

                    let email_exist , mobile_exist;
                    if (!email_exist && !mobile_exist) {
                        next();
                    } else {
                        if (req.all_files) {
                            if (req.all_files.image) {
                                fs.unlink('public/images/' + req.all_files.image, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                        }
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('User with email exist'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    admin_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'adm_user');
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

    admin_server_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                
                email:Joi.string().required().error(() => {
                    return new Error("Valid Email required")
                })
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'email': req.body.email, 'status': 0, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.ok).send(ServerResponse.validationResponse('Record not found or already deactivated.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    admin_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })
            
            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'adm_user');
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
    admin_server_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {
            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
                email:Joi.string().required().error(() => {
                    return new Error("Valid Email required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'email': req.body.email, 'status': 1, 'deleted': 0 }, 'adm_user');
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
    admin_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    admin_blocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 0, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already blocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },    
    admin_server_blocked: async (req, res, next) => {
        if (checkEmpty(req.body, ["user_id"])) {
            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
                email:Joi.string().required().error(() => {
                    return new Error("Valid Email required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'email': req.body.email, 'is_blocked': 0, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already blocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    admin_unblocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('user_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 1, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already unblocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    
    admin_server_unblocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["user_id"])) {

            const schema = Joi.object().keys({
                user_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
                email:Joi.string().required().error(() => {
                    return new Error("Valid Email required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'email': req.body.email, 'is_blocked': 1, 'deleted': 0 }, 'adm_user');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already unblocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    updatePassword: async (req, res, next) => {
        if (checkEmpty(req.body, ["email", "password"])) {

            const schema = Joi.object().keys({
                email: Joi.string().email().required().error(() => {
                    return new Error("Email  Required")
                }),
                password: Joi.string().required().error(() => {
                    return new Error("Password  Required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    next();
                }
            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    designation_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["designation", "role"])) {
            const schema = Joi.object().keys({
                designation: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid Designation Name Required")
                }),
                role: Joi.string().min(2).max(2000).required().error(() => {
                    return new Error("Valid role required")
                })

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let designation_exist = await checkifrecordexist({ 'designation': req.bodyString('designation'), 'deleted': 0 }, 'master_designation');
                    if (!designation_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Designation already exist.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    designation_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["designation_id"])) {

            const schema = Joi.object().keys({
                designation_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Designation ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('designation_id')), 'deleted': 0 }, 'master_designation');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record  not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    designation_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["designation_id", "designation", "role"])) {

            const schema = Joi.object().keys({
                designation_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid Designation ID Required")
                }),
                designation: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid Designation Name Required")
                }),
                role: Joi.string().min(1).max(2000).required().error(() => {
                    return new Error("Valid role Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('designation_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_designation');
                    let designation_exist = await checkifrecordexist({ 'designation': req.bodyString('designation'), 'id !=': record_id, 'deleted': 0 }, 'master_designation');
                    if (record_exist && !designation_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(designation_exist ? 'Designation already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    designation_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["designation_id"])) {

            const schema = Joi.object().keys({
                designation_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid designation ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('designation_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_designation');
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
    designation_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["designation_id"])) {

            const schema = Joi.object().keys({
                designation_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid designation ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('designation_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_designation');
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
    designation_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["designation_id"])) {

            const schema = Joi.object().keys({
                designation_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid designation ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('designation_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_designation');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    department_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["department"])) {

            const schema = Joi.object().keys({
                department: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid department name required")
                }),


            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let department_exist = await checkifrecordexist({ 'department': req.bodyString('department'), 'deleted': 0 }, 'master_department');
                    if (!department_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Department already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    department_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["department_id"])) {

            const schema = Joi.object().keys({
                department_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Department ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('department_id')), 'deleted': 0 }, 'master_department');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    department_update: async (req, res, next) => {
        console.log("in dept update details")
        if (checkEmpty(req.body, ["department_id", "department"])) {

            const schema = Joi.object().keys({
                department_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid department ID required")
                }),
                department: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid department name required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('department_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_department');
                    let department_exist = await checkifrecordexist({ 'department': req.bodyString('department'), 'id !=': record_id, 'deleted': 0 }, 'master_department');
                    if (record_exist && !department_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(department_exist ? 'Department already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    department_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["department_id"])) {

            const schema = Joi.object().keys({
                department_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid department ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('department_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_department');
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
    department_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["department_id"])) {

            const schema = Joi.object().keys({
                department_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid department ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('department_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_department');
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
    department_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["department_id"])) {

            const schema = Joi.object().keys({
                department_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid department ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('department_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_department');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },


    currency_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["currency", "code"])) {

            const schema = Joi.object().keys({
                currency: Joi.string().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).min(2).max(100).required().messages({
                    'string.pattern.base': 'Currency can contain only alphabets',
                    'string.empty': 'Currency should not be an empty',
                    'any.required': 'Currency required',
                    'string.min': 'Currency minimum length is 2 characters',
                    'string.max': 'Currency maximum length is 100 characters'
                }),
                code: Joi.string().pattern(new RegExp(/^[a-zA-Z]+$/)).min(1).max(3).required().error(() => {
                    return new Error("Valid code name required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let currency_exist = await checkifrecordexist({ 'code': req.bodyString('code'), 'currency': req.bodyString('currency'), 'deleted': 0 }, 'master_currency');
                    if (!currency_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('currency already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    currency_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["currency_id"])) {

            const schema = Joi.object().keys({
                currency_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("currency ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('currency_id')), 'deleted': 0 }, 'master_currency');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    currency_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["currency_id", "currency", "code"])) {

            const schema = Joi.object().keys({
                currency_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid currency ID required")
                }),
                currency: Joi.string().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).min(2).max(100).required().messages({
                    'string.pattern.base': 'Currency can contain only alphabets',
                    'string.empty': 'Currency should not be an empty',
                    'any.required': 'Currency required',
                    'string.min': 'Currency minimum length is 2 characters',
                    'string.max': 'Currency maximum length is 100 characters'
                }),
                code: Joi.string().pattern(new RegExp(/^[a-zA-Z]+$/)).min(1).max(3).required().error(() => {
                    return new Error("Valid code name required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('currency_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_currency');
                    let currency_exist = await checkifrecordexist({ 'code': req.bodyString('code'), 'currency': req.bodyString('currency'), 'id !=': record_id, 'deleted': 0 }, 'master_currency');
                    if (record_exist && !currency_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(currency_exist ? 'currency already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    currency_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["currency_id"])) {

            const schema = Joi.object().keys({
                currency_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid currency ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('currency_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_currency');
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
    currency_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["currency_id"])) {

            const schema = Joi.object().keys({
                currency_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid currency ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('currency_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_currency');
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
    currency_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["currency_id"])) {

            const schema = Joi.object().keys({
                currency_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid currency ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('currency_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_currency');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    type_of_business_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["type_of_business"])) {

            const schema = Joi.object().keys({
                type_of_business: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid type of business name required")
                }),


            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let type_of_business_exist = await checkifrecordexist({ 'type_of_business': req.bodyString('type_of_business'), 'deleted': 0 }, 'master_type_of_business');
                    if (!type_of_business_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(' type of business already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    type_of_business_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["type_of_business_id"])) {

            const schema = Joi.object().keys({
                type_of_business_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error(" type of business ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('type_of_business_id')), 'deleted': 0 }, 'master_type_of_business');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    type_of_business_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["type_of_business_id", "type_of_business"])) {

            const schema = Joi.object().keys({
                type_of_business_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid  type of business ID required")
                }),
                type_of_business: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid  type of business required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('type_of_business_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_type_of_business');
                    let type_of_business_exist = await checkifrecordexist({ 'type_of_business': req.bodyString('type_of_business'), 'id !=': record_id, 'deleted': 0 }, 'master_type_of_business');
                    if (record_exist && !type_of_business_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(type_of_business_exist ? ' Type of business already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    type_of_business_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["type_of_business_id"])) {

            const schema = Joi.object().keys({
                type_of_business_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid  type of business ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('type_of_business_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_type_of_business');
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
    type_of_business_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["type_of_business_id"])) {

            const schema = Joi.object().keys({
                type_of_business_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid  type of business ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('type_of_business_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_type_of_business');
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
    type_of_business_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["type_of_business_id"])) {

            const schema = Joi.object().keys({
                type_of_business_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid  type of business ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('type_of_business_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_type_of_business');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    merchant_category_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["category_name", "role"])) {

            const schema = Joi.object().keys({
                category_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid Category Name Required")
                }),
                role: Joi.string().min(2).max(2000).required().error(() => {
                    return new Error("Valid role required")
                })

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkwithcolumn('category', req.bodyString('category_name'), 'merchant_category');
                    if (!record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(record_exist ? 'Merchant category already exist.' : ''));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_category_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["category_id"])) {

            const schema = Joi.object().keys({
                category_id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Category ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkwithcolumn('id', enc_dec.cjs_decrypt(req.bodyString('category_id')), 'merchant_category');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse());
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_category_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["category_id", "category_name", "role"])) {

            const schema = Joi.object().keys({
                category_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid Category ID Required")
                }),
                category_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid Category Name Required")
                }),
                role: Joi.string().min(1).max(2000).required().error(() => {
                    return new Error("Valid role Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('category_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id }, 'merchant_category');
                    let rec_name_exist = await checkifrecordexist({ 'category': req.bodyString('category'), 'id !=': record_id }, 'merchant_category');
                    if (record_exist && !rec_name_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(rec_name_exist ? 'Category already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },



    country_add: async (req, res, next) => {
        const schema = Joi.object().keys({
            country_name: Joi.string().min(2).max(100).required().error(() => {
                return new Error("Valid Country Name Required")
            }),
            country_code: Joi.string().min(3).max(3).required().error(() => {
                return new Error("Valid country ISO required")
            }),
            iso2: Joi.string().min(2).max(2).required().error(() => {
                return new Error("Valid country ISO2 required")
            }),
            dial: Joi.string().min(1).max(6).required().error(() => {
                return new Error("Valid country code required")
            }),
            mobile_no_length: Joi.number().min(7).max(10).required().error(() => {
                return new Error("Valid mobile length required")
            }),
            accept_zero_first_place: Joi.string().required().error(() => {
                return new Error("Accept zero at first place field required")
            }),
            high_risk_country: Joi.number().min(0).max(1).required().error(() => {
                return new Error("Valid high risk country value required")
            }),
            is_sanctioned_country: Joi.number().min(0).max(1).error(() => {
                return new Error("Valid Is sanctioned country value required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {

                let record_exist = await checkifrecordexist({ 'country_name': req.bodyString('country_name'), 'deleted': 0 }, 'country');

                let country_code_exist = await checkifrecordexist({ 'country_code': req.bodyString('country_code'), 'deleted': 0 }, 'country');

                if (!record_exist && !country_code_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(record_exist ? 'Country already exist.' : country_code_exist ? 'Country code already exist.' : ''));
                }
            }

        } catch (error) {

            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    country_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["country_id"])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Country ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('country_id')), 'deleted': 0 }, 'country');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    country_update: async (req, res, next) => {


        const schema = Joi.object().keys({
            country_id: Joi.string().min(2).required().error(() => {
                return new Error("Valid Country ID Required")
            }),
            country_name: Joi.string().min(2).max(100).required().error(() => {
                return new Error("Valid Country Name Required")
            }),
            country_code: Joi.string().min(3).max(3).required().error(() => {
                return new Error("Valid country ISO required")
            }),
            dial: Joi.string().min(1).max(6).required().error(() => {
                return new Error("Valid country code required")
            }),
            mobile_no_length: Joi.number().min(7).max(10).required().error(() => {
                return new Error("Valid mobile length required")
            }),
            accept_zero_first_place: Joi.string().required().error(() => {
                return new Error("Accept zero at first place field required")
            }),
            high_risk_country: Joi.number().min(0).max(1).required().error(() => {
                return new Error("Valid high risk country value required")
            }),
            is_sanctioned_country: Joi.number().min(0).max(1).error(() => {
                return new Error("Valid Is sanctioned country value required")
            }),
        })

        try {

            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                record_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'country');
                let country_name = await checkIfRecordExitsWithName({ 'country_name': req.bodyString('country_name'), 'id !=': record_id, 'deleted': 0 }, 'country');
                let country_code = await checkIfRecordExitsWithName({ 'country_code': req.bodyString('country_code'), 'id !=': record_id, 'deleted': 0 }, 'country');
                if (record_exist && !country_name && !country_code) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!record_exist ? 'Record not found' : country_name ? 'Country name already exist.' : country_code ? 'Country code already exist.' : ''));
                }
            }

        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    country_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["country_id"])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid country ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0, 'status': 0 }, 'country');
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
    country_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["country_id"])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid country ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'country');
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
    country_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["country_id"])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid country ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'country');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    state_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["state_name", "state_code", "country_id"])) {
            const schema = Joi.object().keys({
                country_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid country ID required")
                }),
                state_name: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid state Name Required")
                }),
                state_code: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid state code required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'state_name': req.bodyString('state_name'), 'ref_country': country_id, 'deleted': 0 }, 'states');
                    let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                    let state_code_exist = await checkifrecordexist({ 'state_code': req.bodyString('state_code'), 'ref_country': country_id, 'deleted': 0 }, 'states');

                    if (country_id == '') {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Country not found.'));
                    } if (!record_exist && !state_code_exist && country_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!country_exist ? 'Country not found.' : record_exist ? 'State already exist.' : state_code_exist ? 'State code already exist.' : ''));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    state_list: async (req, res, next) => {
        if (checkEmpty(req.body, [])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("country ID Required")
                }),
                state_name: Joi.string().max(100).optional().allow('').error(() => {
                    return new Error("State name Required")
                }),
                country_name: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("Country name Required")
                }),
                perpage: Joi.number().optional().allow('').error(() => {
                    return new Error("Invalid perpage value")
                }),
                page: Joi.number().optional().allow('').error(() => {
                    return new Error("Invalid page value")
                }),
                status: Joi.string().optional().allow('').error(() => {
                    return new Error("Invalid status")
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    var record_exist = true;
                    if (req.bodyString('country_id')) {
                        var record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('country_id')), 'deleted': 0 }, 'country');
                    }
                    if (record_exist) {

                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Country not found'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {

            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    state_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["state_id"])) {

            const schema = Joi.object().keys({
                state_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("state ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('state_id')), 'deleted': 0 }, 'states');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    state_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["country_id", "state_id", "state_name", "state_code"])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(2).required().error(() => {
                    return new Error("Valid state ID Required")
                }),
                state_id: Joi.string().min(2).required().error(() => {
                    return new Error("Valid state ID Required")
                }),
                state_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid state Name Required")
                }),
                state_code: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid state code required")
                })
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {

                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'states');
                    let state_name = await checkifrecordexist({ 'state_name': req.bodyString('state_name'), 'id !=': record_id, 'ref_country': country_id, 'deleted': 0 }, 'states');
                    let state_code = await checkifrecordexist({ 'state_code': req.bodyString('state_code'), 'id !=': record_id, 'ref_country': country_id, 'deleted': 0 }, 'states');

                    if (record_exist && !state_name && !state_code) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(state_name ? 'state name already exist.' : state_code ? 'state code already exist.' : !record_exist ? 'Record not found' : ''));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    state_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["state_id"])) {

            const schema = Joi.object().keys({
                state_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid state ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'states');
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
    state_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["state_id"])) {

            const schema = Joi.object().keys({
                state_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid state ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'states');
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
    state_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["state_id"])) {

            const schema = Joi.object().keys({
                state_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid state ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'states');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    city_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["city_name", "state_id", "country_id"])) {
            const schema = Joi.object().keys({

                city_name: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid city Name Required")
                }),
                country_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid country ID required")
                }),
                state_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid state ID required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let state_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    if (country_id == '') {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Country not found.'));
                    }
                    if (state_id == '') {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('State not found.'));
                    }
                    let record_exist = await checkifrecordexist({ 'city_name': req.bodyString('city_name'), 'ref_state': state_id, 'ref_country': country_id, 'deleted': 0 }, 'city');
                    let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                    let state_exist = await checkifrecordexist({ 'id': state_id, 'deleted': 0 }, 'states');

                    if (!record_exist && state_exist && country_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!country_exist ? 'Country not found.' : !state_exist ? 'State not found.' : record_exist ? 'Record already exist.' : ''));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    city_list: async (req, res, next) => {
        if (checkEmpty(req.body, [])) {

            const schema = Joi.object().keys({
                country_id: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("country ID Required")
                }),
                state_id: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("state ID Required")
                }),
                country_name: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("Country name Required")
                }),
                city_name: Joi.string().max(100).optional().allow('').error(() => {
                    return new Error("City name Required")
                }),
                state_name: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("State name Required")
                }),
                perpage: Joi.number().optional().allow('').error(() => {
                    return new Error("Invalid perpage value")
                }),
                page: Joi.number().optional().allow('').error(() => {
                    return new Error("Invalid page value")
                }),
                status: Joi.string().optional().allow('').error(() => {
                    return new Error("Invalid status")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    var country_exist = true;
                    if (req.bodyString('country_id')) {
                        country_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('country_id')), 'deleted': 0 }, 'country');
                    }

                    var state_exist = true;
                    if (req.bodyString('state_id')) {
                        state_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('state_id')), 'deleted': 0 }, 'states');
                    }




                    if (country_exist && state_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!country_exist ? 'Country not found' : !state_exist ? 'State not found' : ''));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    city_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["city_id"])) {

            const schema = Joi.object().keys({
                city_id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("city ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('city_id')), 'deleted': 0 }, 'city');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    city_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["city_id", "city_name", "country_id", "state_id"])) {

            const schema = Joi.object().keys({
                city_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid city ID required")
                }),
                city_name: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid city name required")
                }),
                country_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid country ID required")
                }),
                state_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid state ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {

                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('city_id'));
                    state_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                    country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'city');
                    let city_name = await checkifrecordexist({ 'city_name': req.bodyString('city_name'), 'id !=': record_id, 'ref_state': state_id, 'ref_country': country_id, 'deleted': 0 }, 'city');

                    let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                    let state_exist = await checkifrecordexist({ 'id': state_id, 'ref_country': country_id, 'deleted': 0 }, 'states');

                    if (record_exist && !city_name && country_exist && state_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!country_exist ? 'Country not found.' : !state_exist ? 'State not found.' : city_name ? 'City name already exist.' : !record_exist ? 'Record not found' : ''));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    city_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["city_id"])) {

            const schema = Joi.object().keys({
                city_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid city ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('city_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'city');
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
    city_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["city_id"])) {

            const schema = Joi.object().keys({
                city_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid city ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('city_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'city');
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
    city_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["city_id"])) {

            const schema = Joi.object().keys({
                city_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid city ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('city_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'city');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    language_add: async (req, res, next) => {

        if (checkEmpty(req.body, ["language", "direction"])) {

            const schema = Joi.object().keys({
                language: Joi.string().min(1).max(100).required().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).error(() => {
                    return new Error("Valid language name required.")
                }),
                direction: Joi.string().min(3).max(3).required().error(() => {
                    return new Error("Valid direction required.")
                }),
            })
            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    if (req.all_files) {
                        if (req.all_files.file) {
                            fs.unlink('public/language/' + req.all_files.file, function (err) {
                                if (err) console.log(err);
                            });
                        }
                        if (req.all_files.flag) {
                            fs.unlink('public/language/' + req.all_files.flag, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let language_exist = await checkifrecordexist({ 'name': req.bodyString('language'), 'deleted': 0 }, 'master_language');
                    var error = ""
                    if (req.all_files) {
                        if (!req.all_files.file) {
                            error = 'Please upload valid file. Only .json file accepted (size: upto 1MB)';
                        }

                        if (!req.all_files.flag) {
                            error = 'Please upload valid flag file. Only .jpg,.png file accepted (size: upto 1MB)';
                        }

                    } else if (!req.all_files) {
                        error = 'Please upload valid file.(size: upto 1MB)';
                    }

                    if (req.bodyString('direction') != 'ltr' && req.bodyString('direction') != 'rtl') {
                        error = 'Please add valid direction ltr or rlt';
                    }

                    if (!language_exist && error == "") {
                        next();
                    } else {
                        if (req.all_files) {
                            if (req.all_files.file) {
                                fs.unlink('public/language/' + req.all_files.file, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                            if (req.all_files.flag) {
                                fs.unlink('public/language/' + req.all_files.flag, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                        }
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(language_exist ? 'Language already exist.' : error ? error : "Error in data."));
                    }
                }

            } catch (error) {
                console.log(error, 'error');
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    language_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["language_id"])) {

            const schema = Joi.object().keys({
                language_id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("language ID Required")
                })
            })
            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('language_id')), 'deleted': 0 }, 'master_language');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }
        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    language_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["language_id", "language",])) {

            const schema = Joi.object().keys({
                language_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid language ID Required")
                }),
                language: Joi.string().pattern(new RegExp(/^[A-Za-z]+[A-Za-z ]*$/)).min(2).max(100).required().error(() => {
                    return new Error("Valid language Name Required")
                }),
                direction: Joi.string().min(3).max(3).required().error(() => {
                    return new Error("Valid direction required.")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    if (req.all_files) {
                        if (req.all_files.file) {
                            fs.unlink('public/language/' + req.all_files.file, function (err) {
                                if (err) console.log(err);
                            });
                        }
                        if (req.all_files.flag) {
                            fs.unlink('public/language/' + req.all_files.flag, function (err) {
                                if (err) console.log(err);
                            });
                        }
                    }
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('language_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_language');
                    let language_exist = await checkifrecordexist({ 'name': req.bodyString('language'), 'id !=': record_id, 'deleted': 0 }, 'master_language');
                    if (record_exist && !language_exist) {
                        next();
                    } else {
                        if (req.all_files) {
                            if (req.all_files.file) {
                                fs.unlink('public/language/' + req.all_files.file, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                            if (req.all_files.flag) {
                                fs.unlink('public/language/' + req.all_files.flag, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                        }
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(language_exist ? 'Language already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    language_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["language_id"])) {

            const schema = Joi.object().keys({
                language_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid language ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('language_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_language');
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
    language_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["language_id"])) {

            const schema = Joi.object().keys({
                language_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid language ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('language_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_language');
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
    language_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["language_id"])) {

            const schema = Joi.object().keys({
                language_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid language ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('language_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_language');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    partner_login: async (req, res, next) => {
        if (checkEmpty(req.body, ["username", "password"])) {
            const schema = Joi.object().keys({
                username: Joi.string().required().error(() => {
                    return new Error("Valid Username Required")
                }),
                password: Joi.string().required().error(() => {
                    return new Error("Password Required")
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    next();
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    partner_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["name", "email", "country_code", "mobile_no", "company_name", "type_of_business", "address", "country_id", "state", "city", "zipcode", "username", "password"])) {

            const schema = Joi.object().keys({
                name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid name required")
                }),
                email: Joi.string().min(5).max(100).email().required().error(() => {
                    return new Error("Valid email required")
                }),
                country_code: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid country code required")
                }),
                mobile_no: Joi.string().min(9).max(12).required().error(() => {
                    return new Error("Valid mobile no required")
                }),
                company_name: Joi.string().min(1).max(200).required().error(() => {
                    return new Error("Valid company name no required")
                }),
                type_of_business: Joi.string().min(9).max(200).required().error(() => {
                    return new Error("Valid type of business required")
                }),
                address: Joi.string().min(2).max(200).optional().allow('').error(() => {
                    return new Error("Valid address required (max. characters 200)")
                }),
                country_id: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("Valid country required")
                }),
                state: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid state required")
                }),
                city: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid city required")
                }),
                zipcode: Joi.string().min(4).max(6).optional().allow('').error(() => {
                    return new Error("Valid zipcode required (max. length 6)")
                }),
                username: Joi.string().min(2).max(15).required().error(() => {
                    return new Error("Valid username required")
                }),
                password: Joi.string().min(8).max(15).required().error(() => {
                    return new Error("Valid password required.(Length 8 to 15 words)")
                }),
                confirm_password: Joi.string().valid(Joi.ref('password')).min(8).max(15).required().error(() => {
                    return new Error("Valid confirm password required.(Length 8 to 15 words)")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

                } else {
                    var error = ""
                    let mobile_exist = await checkifrecordexist({ 'mobile': req.bodyString('mobile_no'), 'deleted': 0 }, 'master_partners');
                    let email_exist = await checkifrecordexist({ 'email': req.bodyString('email'), 'deleted': 0 }, 'master_partners');
                    let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                    let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0 }, 'master_partners');

                    if (req.bodyString('country_id')) {
                        country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                        let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                        if (!country_exist) {
                            error = 'Country not found.';
                        }
                    }

                    if (!email_exist && !mobile_exist && !username_exist && error === "") {
                        next();
                    } else {

                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(email_exist ? 'Email already exist.' : mobile_exist ? 'Mobile already exist.' : username_exist ? 'Username already exist.' : error ? error : 'Error in data'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    partner_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["id"])) {
            const schema = Joi.object().keys({
                id: Joi.string().required().error(() => {
                    return new Error("ID not found")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let user_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('id')), 'id': user_id, 'deleted': 0 }, 'master_partners');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    partner_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["id", "name", "email", "country_code", "mobile_no", "company_name", "type_of_business", "address", "country_id", "state", "city", "zipcode"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid ID required")
                }),
                name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid name required")
                }),
                email: Joi.string().min(5).max(100).email().required().error(() => {
                    return new Error("Valid email required")
                }),
                country_code: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid country code required")
                }),
                mobile_no: Joi.string().min(9).max(12).required().error(() => {
                    return new Error("Valid mobile no required")
                }),
                company_name: Joi.string().min(1).max(200).required().error(() => {
                    return new Error("Valid company name required")
                }),
                type_of_business: Joi.string().min(1).max(200).required().error(() => {
                    return new Error("Valid type of business required")
                }),
                address: Joi.string().min(2).max(200).optional().allow('').error(() => {
                    return new Error("Valid address required (max. characters 200)")
                }),
                country_id: Joi.string().min(2).optional().allow('').error(() => {
                    return new Error("Valid country required")
                }),
                state: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid state required")
                }),
                city: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid city required")
                }),
                zipcode: Joi.string().min(4).max(6).optional().allow('').error(() => {
                    return new Error("Valid zipcode required (max. length 6)")
                }),
                username: Joi.string().min(5).max(15).required().error(() => {
                    return new Error("Valid username required (Length 5 to 15 words)")
                }),
                password: Joi.string().min(8).max(15).optional().allow('').error(() => {
                    return new Error("Valid password required.(Length 8 to 15 words)")
                }),
                confirm_password: Joi.string().valid(Joi.ref('password')).min(8).max(15).optional().allow('').error(() => {
                    return new Error("Valid confirm password required.(Length 8 to 15 words)")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

                } else {
                    user_id = enc_dec.cjs_decrypt(req.bodyString('id'))

                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('id')), 'id': user_id, 'deleted': 0 }, 'master_partners');
                    let mobile_exist = await checkifrecordexist({ 'mobile': req.bodyString('mobile_no'), 'deleted': 0, 'id !=': user_id }, 'master_partners');
                    let email_exist = await checkifrecordexist({ 'email': req.bodyString('email'), 'deleted': 0, 'id !=': user_id }, 'master_partners');
                    let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                    let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0, 'id !=': user_id }, 'master_partners');

                    if (req.bodyString('country_id')) {
                        country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                        let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');

                        if (!country_exist) {
                            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Country not found.'));
                        }
                    }


                    if (!email_exist && !mobile_exist && user_exist && !username_exist) {
                        next();
                    } else {

                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!user_exist ? 'Record not found.' : email_exist ? 'Email already exist.' : mobile_exist ? 'Mobile already exist.' : username_exist ? 'Username already exist.' : 'Error in data'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    partner_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["id"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_partners');
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
    partner_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["id"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_partners');
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
    partner_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["id"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_partners');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    partner_blocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["id"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 0, 'deleted': 0 }, 'master_partners');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already blocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    partner_unblocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["id"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid user ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 1, 'deleted': 0 }, 'master_partners');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already unblocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    theme_change: async (req, res, next) => {
        if (checkEmpty(req.body, ["theme"])) {

            const schema = Joi.object().keys({
                theme: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Theme value required")
                })
            })
            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    if (req.bodyString('theme') == 'light' || req.bodyString('theme') == 'dark') {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid theme value.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }
        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    company_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["company_name", "contact_no", "email", "currency_id", "logout_time", "batch_size"])) {

            const schema = Joi.object().keys({
                company_name: Joi.string().min(1).required().error(() => {
                    return new Error("Valid company name required")
                }),
                code: Joi.string().min(1).max(7).required().error(() => {
                    return new Error("Valid code required")
                }),
                contact_no: Joi.string().min(6).max(12).required().error(() => {
                    return new Error("Valid contact number required")
                }),
                email: Joi.string().min(1).max(200).required().email().error(() => {
                    return new Error("Valid email required")
                }),
                currency_id: Joi.string().min(1).required().error(() => {
                    return new Error("Valid currency ID required")
                }),
                logout_time: Joi.number().min(15).max(120).required().error(() => {
                    return new Error("Idle logout timeout should be 15-120")
                }),
                batch_size: Joi.number().min(1).max(500).required().error(() => {
                    return new Error("Batch size should be 1-500")
                }),
                country_id: Joi.string().min(1).max(500).optional().allow('').error(() => {
                    return new Error("Valid country ID required")
                }),
                state_id: Joi.string().min(1).max(500).optional().allow('').error(() => {
                    return new Error("Valid state ID required")
                }),
                city_id: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid city ID required")
                }),
                zipcode: Joi.number().min(100).max(999999).optional().allow('').error(() => {
                    return new Error("Valid zipcode required")
                }),
                address: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid address required")
                }),
                logo: Joi.optional().allow('').error(() => {
                    return new Error("Valid logo required")
                }),
                letter_head: Joi.optional().allow('').error(() => {
                    return new Error("Valid letter head required")
                }),
                fav_icon: Joi.optional().allow('').error(() => {
                    return new Error("Valid fav icon required")
                }),
                footer_banner: Joi.optional().allow('').error(() => {
                    return new Error("Valid footer banner required")
                }),
                android_link: Joi.optional().allow('').error(() => {
                    return new Error("Valid android link required")
                }),
                ios_link: Joi.optional().allow('').error(() => {
                    return new Error("Valid ios link required")
                }),
                smtp_name: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp name required")
                }),
                smtp_port: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp port required")
                }),
                smtp_host: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp host required")
                }),
                smtp_username: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp username required")
                }),
                smtp_password: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp password required")
                }),
                smtp_from: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp from required")
                }),
                smtp_from_name: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp from name required")
                }),
                smtp_tls: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp tls name required")
                }),
                smtp_reply: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp reply name required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let error = "";
                    if (req.bodyString('country_id')) {
                        country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                        let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                        if (!country_exist) {
                            error = 'Country not found.';
                        }
                    }
                    if (req.bodyString('country_id') && req.bodyString('state_id')) {
                        state_id = enc_dec.cjs_decrypt(req.bodyString('state_id'));
                        let state_exist = await checkifrecordexist({ 'id': state_id, 'ref_country': country_id, 'deleted': 0 }, 'states');
                        if (!state_exist) {
                            error = 'State not found.';
                        }
                    }
                    if (error == "") {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
                    }


                }

            } catch (error) {
                console.log(error);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    smtp_update: async (req, res, next) => {

        if (checkEmpty(req.body, [])) {

            const schema = Joi.object().keys({

                smtp_name: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp name required")
                }),
                smtp_port: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp port required")
                }),
                smtp_host: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp host required")
                }),
                smtp_username: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp username required")
                }),
                smtp_password: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp password required")
                }),
                smtp_from: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp from required")
                }),
                smtp_from_name: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp from name required")
                }),
                smtp_tls: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp tls name required")
                }),
                smtp_reply: Joi.optional().allow('').error(() => {
                    return new Error("Valid smtp reply name required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let error = "";

                    if (error == "") {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
                    }


                }

            } catch (error) {
                console.log(error);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    change_password: async (req, res, next) => {
        if (checkEmpty(req.body, ["old_password", "new_password", "confirm_password"])) {

            const schema = Joi.object().keys({
                old_password: Joi.string().min(8).max(15).required().error(() => {
                    return new Error("Valid old password required")
                }),
                new_password: Joi.string().required().min(8).max(15).pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
                    "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
                    'string.empty': 'Password should not be an empty',
                    'any.required': 'Password required',
                    'string.max': 'Maximum length is 15 characters'
                }),

                confirm_password: Joi.string().valid(Joi.ref('new_password')).label('Confirm Password').min(8).max(15).required().pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])([a-zA-Z0-9@$!%*?&]{8,15})$/)).messages({
                    "string.pattern.base": "Password can contain at least 8 characters long,one lowercase, one uppercase, one number and one special character,no whitespaces,",
                    'string.empty': 'Password should not be an empty',
                    'any.required': 'Password required',
                    'string.max': 'Maximum length is 15 characters',
                    'any.only': '{{#label}} does not match'
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let old_password = await encrypt_decrypt('encrypt', req.bodyString("old_password"));
                    if (req.user.type == "admin") {
                        var check = await checkifrecordexist({ "password": old_password, id: req.user.id }, 'adm_user');

                    }

                    if (req.user.type == "merchant") {
                        var check = await checkifrecordexist({ "password": old_password, id: req.user.id }, 'master_super_merchant');

                    }
                    if (check) {
                        next();
                    }
                    else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("You have entered wrong old password"));
                    }

                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    update_profile: async (req, res, next) => {

        if (checkEmpty(req.body, ["name", "email", "mobile"])) {

            const schema = Joi.object().keys({

                avatar: Joi.optional().allow('').error(() => {
                    return new Error("Valid avatar required")
                }),
                name: Joi.string().min(1).max(100).required().error(() => {
                    return new Error("Valid name required")
                }),
                email: Joi.string().min(1).max(100).email().required().error(() => {
                    return new Error("Valid business email required")
                }),
                code: Joi.string().min(1).max(10).required().error(() => {
                    return new Error("Valid code required")
                }),
                mobile: Joi.string().required().error(() => {
                    return new Error("Valid mobile number required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let rec_id = req.user.id;
                    let user_exist = await checkifrecordexist({ 'id': req.user.id }, 'master_super_merchant');
                    let code_country = await validate_mobile(req.bodyString('code'), "country", req.bodyString('mobile'));
                    if (user_exist && code_country.status) {
                        next();
                    } else if (!code_country.status) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(code_country.message));
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_add: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_name", "partner_id", "business_name", "api_key", "merchant_key", "email", "country_code", "mobile_no", "business_address", "country_id", "username", "password"])) {

            const schema = Joi.object().keys({
                merchant_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid merchant name required")
                }),

                business_name: Joi.string().min(1).max(100).required().error(() => {
                    return new Error("Valid business name required")
                }),
                api_key: Joi.string().min(8).max(30).required().error(() => {
                    return new Error("Valid API key required (length: 8-30 char.)")
                }),
                merchant_key: Joi.string().min(8).max(30).required().error(() => {
                    return new Error("Valid merchant key required (length: 8-30 char.)")
                }),
                email: Joi.string().min(1).max(100).email().required().error(() => {
                    return new Error("Valid business email required")
                }),
                currency: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid currency required")
                }),
                country_code: Joi.number().min(1).max(999).required().error(() => {
                    return new Error("Valid country code required")
                }),
                mobile_no: Joi.string().min(9).max(12).required().error(() => {
                    return new Error("Valid mobile number required")
                }),
                business_address: Joi.string().min(1).max(200).required().error(() => {
                    return new Error("Valid business address required")
                }),
                country_id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid country ID required")
                }),

                state: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid state required")
                }),
                city: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid city required")
                }),
                zipcode: Joi.number().min(1000).max(999999).optional().allow('').error(() => {
                    return new Error("Valid zipcode required (max. length 6)")
                }),
                username: Joi.string().min(2).max(15).required().error(() => {
                    return new Error("Valid username required")
                }),
                password: Joi.string().min(8).max(15).required().error(() => {
                    return new Error("Valid password required.(Length 8 to 15 words)")
                }),
                confirm_password: Joi.string().valid(Joi.ref('password')).min(8).max(15).required().error(() => {
                    return new Error("Valid confirm password required.(Length 8 to 15 words)")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

                } else {
                    var error = ""
                    let mobile_exist = await checkifrecordexist({ 'business_contact': req.bodyString('mobile_no'), 'deleted': 0 }, 'master_merchant');
                    let email_exist = await checkifrecordexist({ 'business_email': req.bodyString('email'), 'deleted': 0 }, 'master_merchant');

                    if (req.bodyString('country_id')) {
                        country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                        let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');
                        if (!country_exist) {
                            error = 'Country not found.';
                        }
                    }

                    let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                    let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0 }, 'master_merchant');
                    let api_key_exist = await checkifrecordexist({ 'pg_mid': req.bodyString('api_key'), 'deleted': 0 }, 'master_merchant');

                    if (!email_exist && !mobile_exist && !username_exist && !api_key_exist && error === "") {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(email_exist ? 'Email already exist.' : mobile_exist ? 'Mobile already exist.' : username_exist ? 'Username already exist.' : api_key_exist ? 'API key already exist.' : error ? error : 'Error in data'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["merchant_id"])) {
            const schema = Joi.object().keys({
                merchant_id: Joi.string().required().error(() => {
                    return new Error("Merchant ID not found")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let rec_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('merchant_id')), 'id': rec_id, 'deleted': 0 }, 'master_merchant');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id", "merchant_name", "partner_id", "business_name", "email", "country_code", "mobile_no", "business_address", "country_id", "confirm_password", "password"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
                merchant_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid merchant name required")
                }),

                business_name: Joi.string().min(1).max(100).required().error(() => {
                    return new Error("Valid business name required")
                }),
                currency: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid currency required")
                }),
                api_key: Joi.string().min(8).max(30).required().error(() => {
                    return new Error("Valid API key required (length: 8-30 char.)")
                }),
                merchant_key: Joi.string().min(8).max(30).required().error(() => {
                    return new Error("Valid merchant key required (length: 8-30 char.)")
                }),
                email: Joi.string().min(1).max(100).email().required().error(() => {
                    return new Error("Valid business email required")
                }),
                country_code: Joi.number().min(1).max(999).required().error(() => {
                    return new Error("Valid country code required")
                }),
                mobile_no: Joi.string().min(9).max(12).required().error(() => {
                    return new Error("Valid mobile number required")
                }),
                business_address: Joi.string().min(1).max(200).required().error(() => {
                    return new Error("Valid business address required")
                }),
                country_id: Joi.string().min(2).max(200).required().error(() => {
                    return new Error("Valid country ID required")
                }),

                state: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid state required")
                }),
                city: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid city required")
                }),
                zipcode: Joi.number().min(1000).max(999999).optional().allow('').error(() => {
                    return new Error("Valid zipcode required (max. length 6)")
                }),
                username: Joi.string().min(2).max(15).required().error(() => {
                    return new Error("Valid username required")
                }),
                password: Joi.string().min(8).max(15).optional().allow('').error(() => {
                    return new Error("Valid password required.(Length 8 to 15 words)")
                }),
                confirm_password: Joi.string().valid(Joi.ref('password')).min(8).max(15).optional().allow('').error(() => {
                    return new Error("Valid confirm password required.(Length 8 to 15 words)")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));

                } else {
                    user_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'))

                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('merchant_id')), 'deleted': 0 }, 'master_merchant');
                    let mobile_exist = await checkifrecordexist({ 'business_contact': req.bodyString('mobile_no'), 'deleted': 0, 'id !=': user_id }, 'master_merchant');
                    let email_exist = await checkifrecordexist({ 'business_email': req.bodyString('email'), 'deleted': 0, 'id !=': user_id }, 'master_merchant');

                    let username = await encrypt_decrypt('encrypt', req.bodyString('username'))
                    let username_exist = await checkifrecordexist({ 'username': username, 'deleted': 0, 'id !=': user_id }, 'master_merchant');
                    let api_key_exist = await checkifrecordexist({ 'pg_mid': req.bodyString('api_key'), 'id !=': user_id, 'deleted': 0 }, 'master_merchant');

                    if (req.bodyString('country_id')) {
                        country_id = enc_dec.cjs_decrypt(req.bodyString('country_id'));
                        let country_exist = await checkifrecordexist({ 'id': country_id, 'deleted': 0 }, 'country');

                        if (!country_exist) {
                            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Country not found.'));
                        }
                    }


                    if (!email_exist && !mobile_exist && !username_exist && !api_key_exist && user_exist) {
                        next();
                    } else {

                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!user_exist ? 'Record not found.' : email_exist ? 'Email already exist.' : mobile_exist ? 'Mobile already exist.' : username_exist ? 'Username already exist.' : api_key_exist ? 'API key already exist.' : 'Error in data'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already deactivated.'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_merchant');
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
    merchant_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_blocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 0, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already blocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_unblocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 1, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already unblocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    merchant_branding: async (req, res, next) => {

        if (checkEmpty(req.body, ["id", "use_logo_instead_icon", "brand_color", "accent_color", "language"])) {

            const schema = Joi.object().keys({
                id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid submerchant ID required")
                }),
                logo: Joi.optional().allow('').error(() => {
                    return new Error("Valid logo required")
                }),
                icon: Joi.optional().allow('').error(() => {
                    return new Error("Valid icon required")
                }),
                accept_image: Joi.optional().allow('').error(() => {
                    return new Error("Valid accept image required")
                }),
                use_logo_instead_icon: Joi.number().min(0).max(1).required().error(() => {
                    return new Error("Valid use logo instead of icon required")
                }),
                language: Joi.string().min(1).max(100).required().error(() => {
                    return new Error("Valid language required")
                }),
                brand_color: Joi.string().min(3).max(40).required().error(() => {
                    return new Error("Valid brand color required")
                }),
                accent_color: Joi.string().min(3).max(40).required().error(() => {
                    return new Error("Valid accent color required")
                }),

            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let rec_id = req.user.id;
                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('id')), 'deleted': 0, 'super_merchant_id': rec_id }, 'master_merchant');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    submerchant_add_mid: async (req, res, next) => {

        if (checkEmpty(req.body.data, ["submerchant_id", "psp_id", "currency_id", "MID"])) {

            const schema = Joi.object().keys({

                submerchant_id: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid submerchant id required")
                }),
                psp_id: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid psp id required")
                }),
                currency_id: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid currency id required")
                }),
                MID: Joi.string().min(3).max(100).optional().allow('').error(() => {
                    return new Error("Valid MID required")
                }),
            })

            try {
                const result = schema.validate(req.body);
                console.log(result.error);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let rec_id = req.user.id;
                    let data_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('submerchant_id')), 'psp_id': enc_dec.cjs_decrypt(req.bodyString('psp_id')), 'cureency_id': enc_dec.cjs_decrypt(req.bodyString('cureency_id')), 'MID': enc_dec.cjs_decrypt(req.bodyString('MID')), 'deleted': 0 }, 'mid');

                    if (data_exist) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Data exist found."));

                    } else {
                        next();
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_delete_mid: async (req, res, next) => {

        if (checkEmpty(req.body, ["mid_id"])) {

            const schema = Joi.object().keys({
                mid_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid MID ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mid_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'mid');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_add: async (req, res, next) => {

        if (checkEmpty(req.body, ["legal_business_name"])) {

            const schema = Joi.object().keys({
                legal_business_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid legal business name required")
                }),

            })

            try {

                const result = schema.validate(req.body);

                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    next();
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["submerchant_id"])) {
            const schema = Joi.object().keys({
                submerchant_id: Joi.string().required().error(() => {
                    return new Error("Submerchant ID not found")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('submerchant_id')), 'deleted': 0 }, 'master_merchant');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_psp: async (req, res, next) => {
        if (checkEmpty(req.body, ["submerchant_id"])) {
            const schema = Joi.object().keys({
                submerchant_id: Joi.string().required().error(() => {
                    return new Error("Submerchant ID not found")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('submerchant_id')), 'deleted': 0 }, 'master_merchant');

                    if (user_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_profile_details: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID not found")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {

                let user_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('submerchant_id')), 'deleted': 0 }, 'master_merchant');

                if (user_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                }
            }

        } catch (error) {
            console.log(error)
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    submerchant_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["id", "merchant_id", "legal_business_name"])) {

            const schema = Joi.object().keys({

                id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid ID required")
                }),
                merchant_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
                legal_business_name: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid legal business name required")
                })

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    details_id = enc_dec.cjs_decrypt(req.bodyString('id'))
                    merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'))
                    let details_exist = await checkifrecordexist({ 'id': details_id, 'merchant_id': merchant_id }, 'master_merchant_details');
                    // let mobile_exist = await checkifrecordexist({ 'mobile_no': req.bodyString('mobile_no'), 'deleted': 0, 'id !=': user_id }, 'master_submerchant');
                    // let email_exist = await checkifrecordexist({ 'email': req.bodyString('email'), 'deleted': 0, 'id !=': user_id }, 'master_submerchant');
                    if (details_exist) {
                        next();
                    } else {

                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!details_exist ? 'Record not found.' : error ? error : 'Error in data'));
                    }

                }
            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["submerchant_id"])) {

            const schema = Joi.object().keys({
                submerchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid submerchant ID required")
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('submerchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already deactivated.'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["submerchant_id"])) {

            const schema = Joi.object().keys({
                submerchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid submerchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('submerchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_merchant');
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
    submerchant_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["submerchant_id"])) {

            const schema = Joi.object().keys({
                submerchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid submerchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('submerchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_blocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 0, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already blocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    submerchant_unblocked: async (req, res, next) => {

        if (checkEmpty(req.body, ["merchant_id"])) {

            const schema = Joi.object().keys({
                merchant_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid merchant ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'is_blocked': 1, 'deleted': 0 }, 'master_merchant');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or already unblocked.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    create_order: async (req, res, next) => {

        if (checkEmpty(req.body, ["amount", "currency", "payment_method"])) {

            const schema = Joi.object().keys({
                amount: Joi.number().min(1).max(99999999).required().error(() => {
                    return new Error("Valid amount required")
                }),
                currency: Joi.string().min(1).max(3).required().error(() => {
                    return new Error("Valid currency required")
                }),
                payment_method: Joi.string().min(1).max(100).required().error(() => {
                    return new Error("Valid payment method required")
                }),
                customer_name: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid customer name required")
                }),
                customer_email: Joi.string().min(1).max(100).email().optional().allow('').error(() => {
                    return new Error("Valid customer email required")
                }),
                customer_mobile: Joi.string().min(8).max(15).optional().allow('').error(() => {
                    return new Error("Valid customer mobile required")
                }),
                description: Joi.string().min(1).max(150).optional().allow('').error(() => {
                    return new Error("Valid description required")
                }),
                card_type: Joi.string().min(1).max(100).optional().allow('').error(() => {
                    return new Error("Valid card type required")
                }),
                card_number: Joi.string().min(1).max(150).optional().allow('').error(() => {
                    return new Error("Valid card number  required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    if (req.user.type == "merchant") {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Unauthorized access.'));
                    }

                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    transaction_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["id"])) {
            const schema = Joi.object().keys({
                id: Joi.string().required().error(() => {
                    return new Error(" ID not found")
                }),
                mode: Joi.string().allow('')
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let rec_id = enc_dec.cjs_decrypt(req.bodyString('id'));
                    let rec_exist = await checkifrecordexist({ 'id': rec_id }, 'transaction_logs');

                    if (rec_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },



    // Entity validation

    entity_add: async (req, res, next) => {
        if (checkEmpty(req.body, [])) {

            const schema = Joi.object().keys({
                entity_type: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid entity type required")
                }),


            })

            try {
                req.body = req.body.data;
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let entity_exist = await checkifrecordexist({ 'entity': req.bodyString('entity_type'), 'deleted': 0 }, 'master_entity_type');
                    if (!entity_exist) {
                        console.log('here')
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Entity type already exist.'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    entity_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["entity_id"])) {

            const schema = Joi.object().keys({
                submerchant_id: Joi.string().min(2).max(100).optional().allow('').error(() => {
                    return new Error("Valid submerchant id required")
                }),
                entity_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Entity ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('entity_id')), 'deleted': 0 }, 'master_entity_type');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    entity_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["entity_id", "entity_type"])) {

            const schema = Joi.object().keys({
                entity_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid entity ID required")
                }),
                entity_type: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid entity type required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('entity_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_entity_type');
                    let entity_exist = await checkifrecordexist({ 'entity': req.bodyString('entity'), 'id !=': record_id, 'deleted': 0 }, 'master_entity_type');
                    if (record_exist && !entity_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(entity_exist ? 'Entity type already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    entity_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["entity_id"])) {

            const schema = Joi.object().keys({
                entity_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid entity ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('entity_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_entity_type');
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
    entity_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["entity_id"])) {

            const schema = Joi.object().keys({
                entity_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid entity ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('entity_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_entity_type');
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
    entity_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["entity_id"])) {

            const schema = Joi.object().keys({
                entity_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid entity ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('entity_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_entity_type');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },


    //Mcc Category


    mcc_category_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["mcc_category"])) {

            const schema = Joi.object().keys({
                mcc_category: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid mcc category required")
                }),


            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let mcc_exist = await checkifrecordexist({ 'mcc_category': req.bodyString('mcc_category'), 'deleted': 0 }, 'master_mcc_category');
                    if (!mcc_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Mcc category already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_category_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Mcc ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('mcc_id')), 'deleted': 0 }, 'master_mcc_category');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_category_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["mcc_id", "mcc_category"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
                mcc_category: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid mcc category required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_mcc_category');
                    let entity_exist = await checkifrecordexist({ 'mcc_category': req.bodyString('mcc_category'), 'id !=': record_id, 'deleted': 0 }, 'master_mcc_category');
                    if (record_exist && !entity_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(entity_exist ? 'Mcc category already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_category_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_mcc_category');
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
    mcc_category_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_mcc_category');
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
    mcc_category_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_mcc_category');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },



    //Mcc


    mcc_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["category", "mcc", "description"])) {

            const schema = Joi.object().keys({
                category: Joi.string().required().error(() => {
                    return new Error("Valid category required")
                }),
                mcc: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid mcc required")
                }),
                description: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid description required")
                }),
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let mcc_exist = await checkifrecordexist({ 'category': req.bodyString('category'), 'mcc': req.bodyString('mcc'), 'deleted': 0 }, 'mcc_codes');
                    if (!mcc_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Mcc already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Mcc ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('mcc_id')), 'deleted': 0 }, 'mcc_codes');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["mcc_id", "mcc", "category", "description"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
                category: Joi.string().required().error(() => {
                    return new Error("Valid category required")
                }),
                mcc: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid mcc required")
                }),
                description: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid description required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'mcc_codes');
                    let entity_exist = await checkifrecordexist({ 'category': req.bodyString('category'), 'mcc': req.bodyString('mcc'), 'deleted': 0, 'id !=': record_id }, 'mcc_codes');
                    if (record_exist && !entity_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(entity_exist ? 'Mcc already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    mcc_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'mcc_codes');
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
    mcc_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'mcc_codes');
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
    mcc_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["mcc_id"])) {

            const schema = Joi.object().keys({
                mcc_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid mcc ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('mcc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'mcc_codes');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    security_question_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["question"])) {

            const schema = Joi.object().keys({
                question: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid question  required")
                }),


            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let department_exist = await checkifrecordexist({ 'question': req.bodyString('question'), 'deleted': 0 }, 'master_security_questions');
                    if (!department_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Question already exist.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    security_question_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["question_id"])) {

            const schema = Joi.object().keys({
                question_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Question ID required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('question_id')), 'deleted': 0 }, 'master_security_questions');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    security_question_update: async (req, res, next) => {
        if (checkEmpty(req.body, ["question_id", "question"])) {

            const schema = Joi.object().keys({
                question_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid question ID required")
                }),
                question: Joi.string().min(2).max(100).required().error(() => {
                    return new Error("Valid question  required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('question_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_security_questions');
                    let department_exist = await checkifrecordexist({ 'question': req.bodyString('question'), 'id !=': record_id, 'deleted': 0 }, 'master_security_questions');
                    if (record_exist && !department_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(department_exist ? 'Question already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    security_question_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["question_id"])) {

            const schema = Joi.object().keys({
                question_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid question ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('question_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'master_security_questions');
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
    security_question_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["question_id"])) {

            const schema = Joi.object().keys({
                question_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid question ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('question_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'master_security_questions');
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
    security_question_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["question_id"])) {

            const schema = Joi.object().keys({
                question_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid question ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('question_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'master_security_questions');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },

    security_question_answer: async (req, res, next) => {
        if (checkEmpty(req.body, ["data"])) {
            try {

                let error = ""
                let data = req.body.data;

                for (ans_data of data) {
                    if (!ans_data.question_id) {
                        error = "Please select the questions.";
                        break;
                    } else if (!ans_data.cid) {
                        error = "Customer data required.";
                        break;
                    } else if (!ans_data.answer) {
                        error = "Answer should not be empty.";
                        break;
                    }
                }
                let record_exist = false
                if (!data[0]) {
                    error = "Please answer the questions"
                } else {
                    record_exist = await checkifrecordexist({ 'temp_id': enc_dec.cjs_decrypt(data[0].cid), 'deleted': 0 }, 'customers_answer');
                }

                if (error == "" && !record_exist) {
                    next();
                } else {
                    if (record_exist) {
                        error = "Record already exist."
                    }
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
                }


            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    check_mobile_and_code: async (req, res, next) => {
        const myCustomJoi = Joi.extend(require('joi-phone-number'));
        const schema = Joi.object().keys({
            mobile_code: myCustomJoi.string(),
            mobile_no: Joi.string().required().error(() => {
                return new Error("Valid mobile no required")
            }),
            fcm_id: Joi.string().required().error(() => {
                return new Error("Valid fcm id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                console.log(result);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                next();
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    checkCustomerRegistration: async (req, res, next) => {
        const myCustomJoi = Joi.extend(require('joi-phone-number'));
        const schema = Joi.object().keys({
            name: myCustomJoi.string().required().error(() => {
                return new Error("Valid name required")
            }),
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            }),
            token: Joi.string().required().error(() => {
                return new Error("Valid token required")
            }),
            is_existing: Joi.number().allow(''),
            mobile_code: Joi.string().required().error(() => {
                return new Error("Dial code required")
            }),
            mobile_no: Joi.string().required().error(() => {
                return new Error("Mobile no required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                console.log(result);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_exist = await checkifrecordexist({ 'token': req.bodyString('token'), 'is_invalid': 0 }, 'customer_temp');

                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Invalid token.'));
                }

            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    checkCustomerPin: async (req, res, next) => {
        const schema = Joi.object().keys({
            cid: Joi.string().required().error(() => {
                return new Error("Customer ID required")
            }),
            pin: Joi.string().min(4).max(4).required().error(() => {
                return new Error("4-digit PIN required")
            }),
            confirm_pin: Joi.string().valid(Joi.ref('pin')).min(4).max(4).required().error(() => {
                return new Error("4-digit confirm PIN required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                //console.log(result);
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {

                let record_exist = await checkifrecordexist({ id: enc_dec.cjs_decrypt(req.bodyString('cid')) }, 'customer_temp')
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Customer not found'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    test_pushnotification: async (req, res, next) => {
        await helpers.pushNotificationtesting(gcmid = "6d422d5d-2dbf-4d44-a21d-6a3eb3594a31", title = "testing-title", message = "testing message", url_ = "testing url", type = "testing type", payload = { "abc": "payload object" }, user = "test user")
        res.status(StatusCode.badRequest).send(ServerResponse.successmsg());
    },

    tc_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["tc", "version"])) {

            const schema = Joi.object().keys({
                tc: Joi.string().min(2).required().error(() => {
                    return new Error("Valid terms and conditions required")
                }),
                version: Joi.string().min(2).max(10).required().error(() => {
                    return new Error("Valid version required")
                })

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let rec_exist = await checkifrecordexist({ 'version': req.bodyString('version'), 'deleted': 0 }, 'tc');
                    if (!rec_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Version already exist.'));
                    }
                }

            } catch (error) {
                console.log(error)
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    tc_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["tc_id"])) {

            const schema = Joi.object().keys({
                tc_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Terms and conditions source required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('tc_id')), 'deleted': 0 }, 'tc');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    tc_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["tc_id", "tc", "version"])) {

            const schema = Joi.object().keys({
                tc_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid terms and condition source required")
                }),
                tc: Joi.string().min(2).required().error(() => {
                    return new Error("Valid terms and conditions required")
                }),
                version: Joi.string().min(2).max(10).required().error(() => {
                    return new Error("Valid version required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {
                    record_id = enc_dec.cjs_decrypt(req.bodyString('tc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'tc');
                    let ver_exist = await checkifrecordexist({ 'version': req.bodyString('version'), 'id !=': record_id, 'deleted': 0 }, 'tc');
                    if (record_exist && !ver_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(ver_exist ? 'Version already exist.' : 'Record not found.'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    tc_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["tc_id"])) {

            const schema = Joi.object().keys({
                tc_id: Joi.string().min(2).max(300).required().error(() => {
                    return new Error("Valid terms and condition source required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('tc_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'tc');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    suspicious_ip_add: async (req, res, next) => {
        const schema = Joi.object().keys({
            data: Joi.array().items(
                Joi.object().keys({
                    ip_from: Joi.string().ip().required().error(() => {
                        return new Error("valid ip address required")
                    }),
                    ip_to: Joi.string().ip().required().error(() => {
                        return new Error("valid ip address required")
                    }),
                })
            )
        })

        try {

            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                next();
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    fraud_detection_update: async (req, res, next) => {
        const schema = Joi.object().keys({
            suspicious_emails: Joi.array().items(
                Joi.string().email().required().error(() => {
                    return new Error("should be in proper csv format and valid emails")
                }),
            ),
            suspicious_ips: Joi.array().items(
                Joi.string().ip().required().error(() => {
                    return new Error("should be in proper csv format and valid ip")
                }),
            ),
        })

        try {
            let emails = req.bodyString('suspicious_emails');
            let ips = req.bodyString('suspicious_ips');
            let custom_body = { suspicious_emails: emails.split(","), suspicious_ips: ips.split(",") }
            console.log(custom_body);
            const result = schema.validate(custom_body);
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
    nationality_add: async (req, res, next) => {
        if (checkEmpty(req.body, ["code", "nationality"])) {
            const schema = Joi.object().keys({
                code: Joi.string().regex(/^[a-zA-Z]{3}$/).min(3).max(3).trim().required().error(() => {
                    return new Error("Valid nationality code Required")
                }),
                nationality: Joi.string().regex(/^[a-zA-Z!@#$%&*^()]{1,50}$/).min(1).max(50).trim().required().error(() => {
                    return new Error("Valid nationality required")
                }),

            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkifrecordexist({ 'nationality': req.bodyString('nationality'), 'deleted': 0 }, 'nationality');

                    let nationality_code_exist = await checkifrecordexist({ 'code': req.bodyString('code'), 'deleted': 0 }, 'nationality');

                    if (!record_exist && !nationality_code_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(record_exist ? 'Nationality already exist.' : nationality_code_exist ? 'Nationality code already exist.' : ''));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    nationality_details: async (req, res, next) => {
        if (checkEmpty(req.body, ["nationality_id"])) {

            const schema = Joi.object().keys({
                nationality_id: Joi.string().min(2).max(100).required().error(() => {
                    return new Error(" Valid nationality ID Required")
                })
            })

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('nationality_id')), 'deleted': 0 }, 'nationality');

                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found'));
                    }
                }

            } catch (error) {

                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    nationality_update: async (req, res, next) => {

        if (checkEmpty(req.body, ["nationality_id", "code", "nationality"])) {

            const schema = Joi.object().keys({
                nationality_id: Joi.string().min(2).required().error(() => {
                    return new Error("Valid nationality ID Required")
                }),
                code: Joi.string().regex(/^[a-zA-Z]{3}$/).min(3).max(3).required().error(() => {
                    return new Error("Valid nationality code Required")
                }),
                nationality: Joi.string().regex(/^[a-zA-Z!@#$%&*^()]{1,50}$/).min(1).max(50).trim().required().error(() => {
                    return new Error("Valid nationality required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('nationality_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'nationality');
                    let nationality = await checkifrecordexist({ 'nationality': req.bodyString('nationality'), 'id !=': record_id, 'deleted': 0 }, 'nationality');
                    let nationality_code = await checkifrecordexist({ 'code': req.bodyString('code'), 'id !=': record_id, 'deleted': 0 }, 'nationality');

                    if (record_exist && !nationality && !nationality_code) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!record_exist ? 'Record not found' : nationality ? 'Nationality already exist.' : nationality_code ? 'Nationality code already exist.' : ''));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    nationality_deactivate: async (req, res, next) => {

        if (checkEmpty(req.body, ["nationality_id"])) {

            const schema = Joi.object().keys({
                nationality_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid nationality ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('nationality_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0, 'status': 0 }, 'nationality');
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
    nationality_activate: async (req, res, next) => {

        if (checkEmpty(req.body, ["nationality_id"])) {

            const schema = Joi.object().keys({
                nationality_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid nationality ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('nationality_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 1, 'deleted': 0 }, 'nationality');
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
    nationality_delete: async (req, res, next) => {

        if (checkEmpty(req.body, ["nationality_id"])) {

            const schema = Joi.object().keys({
                nationality_id: Joi.string().min(10).required().error(() => {
                    return new Error("Valid nationality ID required")
                }),
            })

            try {

                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
                } else {

                    record_id = enc_dec.cjs_decrypt(req.bodyString('nationality_id'));
                    let record_exist = await checkifrecordexist({ 'id': record_id, 'deleted': 0 }, 'nationality');
                    if (record_exist) {
                        next();
                    } else {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                    }
                }

            } catch (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error.message));
            }

        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    reset_password: async (req, res, next) => {
        const schema = Joi.object().keys({
            admin_id: Joi.string().required().error(() => {
                return new Error("Admin id required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = enc_dec.cjs_decrypt(req.bodyString('admin_id'));
                let record_exist = await checkifrecordexist({ 'id': record_id, 'status': 0, 'deleted': 0 }, 'adm_user');
                if (record_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found or account is not active.'));
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    store_get: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required")
            })
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let rec_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let user_exist = await checkifrecordexist({ 'merchant_id': enc_dec.cjs_decrypt(req.bodyString('merchant_id')) }, 'master_merchant_details');

                if (user_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Record not found."));
                }
            }

        } catch (error) {
            console.log(error)
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    store_update: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required")
            }),
            authorised_url: Joi.string().uri().allow(null, "").error(() => {
                return new Error("Authorised url required")
            }),
            decline_url: Joi.string().uri().allow(null, "").error(() => {
                return new Error("Declined url required")
            }),
            cancelled_url: Joi.string().uri().allow(null, "").error(() => {
                return new Error("Cancelled url required")
            }),
            enable_refund: Joi.number().error(() => {
                return new Error("0 or 1 is valid value for enable refund")
            }),
            enable_partial_refund: Joi.number().error(() => {
                return new Error("0 or 1 is valid value for enable partial refund")
            }),
            payout_currency: Joi.string().currency().required().error(() => {
                return new Error("Valid iso currency required")
            }),
            payout_method: Joi.string().required().error(() => {
                return new Error("Payout method required")
            }),
            next_payout_date: Joi.date().format('YYYY-MM-DD').allow('').error(() => {
                return new Error("Next payout date required")
            }),
            interval_days: Joi.number().min(1).max(30).required().error(() => {
                return new Error("Valid interval days required")
            }),
            min_payout_amount: Joi.number().min(0).required().error(() => {
                return new Error("Minimum payout amount required")
            }),
            max_payout_amount: Joi.number().greater(Joi.ref('min_payout_amount')).required().messages({
                "number.greater": "Maximum payout amount should be greater than minimum payout amount.",
            }),
            payout_fee: Joi.number().min(0).required().error(() => {
                return new Error("Payout fee required")
            }),
            payout_fee: Joi.number().min(0).required().error(() => {
                return new Error("Payout fee required")
            }),
            free_payout_from: Joi.number().min(0).required().error(() => {
                return new Error("Free payout from required")
            }),
            max_per_txn_limit: Joi.number().min(0).required().error(() => {
                return new Error("Maximum transaction limit required")
            }),
            high_risk_txn_limit: Joi.number().min(0).required().error(() => {
                return new Error("High risk transaction limit required")
            }),
            rolling_reserve_limit: Joi.number().min(0).required().error(() => {
                return new Error("Rolling reserve limit required")
            }),
            store_status: Joi.number().required().error(() => {
                return new Error("Status required")
            }),
            mcc: Joi.string().required().error(() => {
                return new Error("MCC required")
            })

        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let rec_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let user_exist = await checkifrecordexist({ 'merchant_id': rec_id }, 'master_merchant_details');
                if (user_exist) {
                    next();
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse("Merchant is not onboard yet. Please add details and try again."));
                }
            }

        } catch (error) {
            console.log(error)
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },


}
module.exports = Validator;