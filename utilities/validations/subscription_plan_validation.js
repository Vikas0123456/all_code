const Joi = require("joi")
    .extend(require("@joi/date"))
    .extend(require("joi-currency-code"));
const encrypt_decrypt = require("../decryptor/encrypt_decrypt");
const enc_dec = require("../decryptor/decryptor");
const checkEmpty = require("./emptyChecker");
const ServerResponse = require("../response/ServerResponse");
const StatusCode = require("../statuscode/index");
const checkRecordExits = require("../validations/checkifrecordexist");
const checkifrecordexist = require("./checkifrecordexist");
const subs_plan_model = require("../../models/subs_plan_model");
const SubscriptionPlan = {
    add: async (req, res, next) => {
        const billing_freq = ["yearly", "monthly", "weekly", "daily"];
        const schema = Joi.object().keys({
            plan_name: Joi.string()
                .required()
                .error(() => {
                    return new Error("Plan name required");
                }),
            plan_description: Joi.string().error(() => {
                return new Error("Plan description required");
            }),
            plan_billing_frequency: Joi.string()
                .valid(...billing_freq)
                .required()
                .error(() => {
                    return new Error("Plan billing frequency required");
                }),
            currency: Joi.string()
                .currency()
                .required()
                .error(() => {
                    return new Error("Valid plan currency  required");
                }),
            plan_billing_amount: Joi.number()
                .allow("")
                .error(() => {
                    return new Error("Valid plan billing amount required");
                }),
            note: Joi.string()
                .allow("")
                .error(() => {
                    return new Error("Valid note required");
                }),
            store_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Store ID required");
                }),

            payment_interval: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid payment interval required");
                }),
            initial_payment_amount: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid initial payment amount required");
                }),
            start_date: Joi.date()
                .format("YYYY-MM-DD")
                .required()
                .error(() => {
                    return new Error("Valid start date (YYYY-MM-DD) required");
                }),
            terms: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid terms required");
                }),
            final_payment_amount: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid final payment amount required");
                }),
        });

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let plan_name = req.bodyString("plan_name");
                let plan_billing_frequency = req.bodyString(
                    "plan_billing_frequency"
                );

                let data_exist = await checkifrecordexist(
                    {
                        plan_billing_frequency: plan_billing_frequency,
                        plan_name: plan_name,
                        plan_currency: req.bodyString("currency"),
                        plan_billing_amount: req.bodyString(
                            "plan_billing_amount"
                        ),
                        merchant_id: req.user.id,
                        deleted: 0,
                    },
                    "subs_plans"
                );
                if (data_exist) {
                    res.status(StatusCode.badRequest).send(
                        ServerResponse.validationResponse("Data already exist.")
                    );
                } else {
                    next();
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    get: async (req, res, next) => {
        const schema = Joi.object().keys({
            subs_plan_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription plan id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subs_plan_id")
                );
                let record_exits = await checkRecordExits(
                    { id: record_id, merchant_id: req.user.id },
                    "subs_plans"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg("Record not exits.")
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    delete: async (req, res, next) => {
        const schema = Joi.object().keys({
            subs_plan_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription plan id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subs_plan_id")
                );
                let record_exits = await checkRecordExits(
                    { id: record_id, deleted: 0, merchant_id: req.user.id },
                    "subs_plans"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg(
                            "Record not exits or already deleted."
                        )
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    update: async (req, res, next) => {
        const billing_freq = ["yearly", "monthly", "weekly", "daily"];
        const schema = Joi.object().keys({
            plan_name: Joi.string()
                .required()
                .error(() => {
                    return new Error("Plan name required");
                }),
            plan_description: Joi.string().error(() => {
                return new Error("Plan description required");
            }),
            plan_billing_frequency: Joi.string()
                .valid(...billing_freq)
                .required()
                .error(() => {
                    return new Error("Plan billing frequency required");
                }),
            currency: Joi.string()
                .currency()
                .required()
                .error(() => {
                    return new Error("Valid plan currency  required");
                }),
            plan_billing_amount: Joi.number()
                .allow("")
                .error(() => {
                    return new Error("Valid plan billing amount required");
                }),
            note: Joi.string()
                .allow("")
                .error(() => {
                    return new Error("Valid note required");
                }),
            store_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Store ID required");
                }),
            subs_plan_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription id required");
                }),

            payment_interval: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid payment interval required");
                }),
            initial_payment_amount: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid initial payment amount required");
                }),
            start_date: Joi.date()
                .format("YYYY-MM-DD")
                .required()
                .error(() => {
                    return new Error("valid start date required");
                }),
            terms: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid terms required");
                }),
            final_payment_amount: Joi.number()
                .required()
                .error(() => {
                    return new Error("Valid final payment amount required");
                }),
        });

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                record_id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
                let plan_name = req.bodyString("plan_name");
                let plan_billing_frequency = req.bodyString(
                    "plan_billing_frequency"
                );

                let data_exist = await checkifrecordexist(
                    {
                        plan_billing_frequency: plan_billing_frequency,
                        plan_name: plan_name,
                        plan_currency: req.bodyString("currency"),
                        plan_billing_amount: req.bodyString(
                            "plan_billing_amount"
                        ),
                        merchant_id: req.user.id,
                        deleted: 0,
                        "id !=": record_id,
                    },
                    "subs_plans"
                );
                if (data_exist) {
                    res.status(StatusCode.badRequest).send(
                        ServerResponse.validationResponse("Data already exist.")
                    );
                } else {
                    next();
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    activate: async (req, res, next) => {
        const schema = Joi.object().keys({
            subs_plan_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription plan id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subs_plan_id")
                );
                let record_exits = await checkRecordExits(
                    {
                        id: record_id,
                        deleted: 0,
                        status: 1,
                        merchant_id: req.user.id,
                    },
                    "subs_plans"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg(
                            "Record not exits or already activated."
                        )
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    deactivate: async (req, res, next) => {
        const schema = Joi.object().keys({
            subs_plan_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription plan id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subs_plan_id")
                );
                let record_exits = await checkRecordExits(
                    {
                        id: record_id,
                        deleted: 0,
                        status: 0,
                        merchant_id: req.user.id,
                    },
                    "subs_plans"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg(
                            "Record not exits or already deactivated."
                        )
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    mail_send: async (req, res, next) => {
        let email = req.body.emails.split(",");
        const schema = Joi.object().keys({
            id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Id required");
                }),
            //   {
            //       multiple: true, minDomainSegments: 2, tlds: { allow: ['com', 'net'] }
            //   }
            emails: Joi.string()
                .email()
                .required()
                .error(() => {
                    return new Error("Valid emails required");
                }),

            subject: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subject required");
                }),
            //    message: Joi.string().optional().allow("").error(() => {
            //       return new Error("Message required")
            //    }),
        });
        try {
            const result = schema.validate(req.body);

            if (result.error) {
                res.status(StatusCode.badRequest).send(
                    ServerResponse.validationResponse(result.error.message)
                );
            } else {
                if (email.length > 40) {
                    res.status(StatusCode.badRequest).send(
                        ServerResponse.validationResponse(
                            "More than 40  emails not allow at one time"
                        )
                    );
                } else {
                    next();
                }
                //   let record_exist = await checkifrecordexist({ 'id': enc_dec.cjs_decrypt(req.bodyString('invoice_id')) }, 'inv_invoice_master');
                //   if (record_exist) {
                // next();
                //   } else {
                //      res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Record not found.'));
                //   }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error.message)
            );
        }
    },
    link_details: async (req, res, next) => {
        let record_exist;
        if (checkEmpty(req.body, ["token"])) {
            const schema = Joi.object().keys({
                token: Joi.string()
                    .min(10)
                    .required()
                    .error(() => {
                        return new Error("Token required");
                    }),
            });

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(
                        ServerResponse.validationResponse(result.error.message)
                    );
                } else {
                    record_id = req.bodyString("token");

                    let plan_id = await subs_plan_model.selectMail("plan_id", {
                        token: record_id,
                    });
                    let token_exist = await checkifrecordexist(
                        { token: record_id },
                        "subs_plan_mail"
                    );
                    let record_exist = await checkifrecordexist(
                        { id: plan_id.plan_id, deleted: 0 },
                        "subs_plans"
                    );
                    let deactivate_data = await checkifrecordexist(
                        { id: plan_id.plan_id, status: 0 },
                        "subs_plans"
                    );
                    // let record_reset = await checkifrecordexist({ 'id': record_id, 'is_reseted': 0 }, 'merchant_qr_codes');
                    if (!token_exist || !record_exist || !deactivate_data) {
                        if (!token_exist) {
                            res.status(StatusCode.badRequest).send(
                                ServerResponse.validationResponse(
                                    `Record not found`
                                )
                            );
                        } else if (!record_exist) {
                            res.status(StatusCode.badRequest).send(
                                ServerResponse.validationResponse(
                                    `Link expired`
                                )
                            );
                        } else if (!deactivate_data) {
                            res.status(StatusCode.badRequest).send(
                                ServerResponse.validationResponse(
                                    `Link is deactivated`
                                )
                            );
                        }
                    } else {
                        // res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!deactivate_data?"Invalid link.":!record_exist?'Record not found.':""));
                        next();
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(
                    ServerResponse.validationResponse(error)
                );
            }
        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    subscription_details: async (req, res, next) => {
        let record_exist;
        if (checkEmpty(req.body, ["token"])) {
            const schema = Joi.object().keys({
                token: Joi.string()
                    .min(10)
                    .required()
                    .error(() => {
                        return new Error("Token required");
                    }),
            });

            try {
                const result = schema.validate(req.body);
                if (result.error) {
                    res.status(StatusCode.badRequest).send(
                        ServerResponse.validationResponse(result.error.message)
                    );
                } else {
                    record_id = req.bodyString("token");
                    let find = await subs_plan_model.get_count_pay({
                        payment_id: `'${req.bodyString("token")}'`,
                    });
                    if (find > 0) {
                        var token_exist = await checkifrecordexist(
                            { payment_id: record_id },
                            "subscription"
                        );
                        var deactivate_data = await checkifrecordexist(
                            { payment_id: record_id, status: 0 },
                            "subscription"
                        );
                    } else {
                        var token_exist = true;
                        var deactivate_data = true;
                    }

                    // let record_reset = await checkifrecordexist({ 'id': record_id, 'is_reseted': 0 }, 'merchant_qr_codes');
                    if (!token_exist || !deactivate_data) {
                        if (!token_exist) {
                            res.status(StatusCode.badRequest).send(
                                ServerResponse.validationResponse(
                                    `Record not found`
                                )
                            );
                        } else if (!deactivate_data) {
                            res.status(StatusCode.badRequest).send(
                                ServerResponse.validationResponse(
                                    `Link is deactivated`
                                )
                            );
                        }
                    } else {
                        // res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(!deactivate_data?"Invalid link.":!record_exist?'Record not found.':""));
                        next();
                    }
                }
            } catch (error) {
                res.status(StatusCode.badRequest).send(
                    ServerResponse.validationResponse(error)
                );
            }
        } else {
            res.status(StatusCode.badRequest).send(ServerResponse.badRequest);
        }
    },
    get_subscriber: async (req, res, next) => {
        const schema = Joi.object().keys({
            subscriber_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscriber id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subscriber_id")
                );
                let record_exits = await checkRecordExits(
                    { id: record_id, super_merchant: req.user.id },
                    "subscription"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg("Record not exits.")
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
    cancel: async (req, res, next) => {
        const schema = Joi.object().keys({
            subscription_id: Joi.string()
                .required()
                .error(() => {
                    return new Error("Subscription id required");
                }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(
                    ServerResponse.errormsg(result.error.message)
                );
            } else {
                let record_id = enc_dec.cjs_decrypt(
                    req.bodyString("subscription_id")
                );
                let record_exits = await checkRecordExits(
                    { id: record_id, status: 0, super_merchant: req.user.id },
                    "subscription"
                );
                if (record_exits) {
                    next();
                } else {
                    res.status(StatusCode.ok).send(
                        ServerResponse.errormsg(
                            "Record not exits or already deleted."
                        )
                    );
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(
                ServerResponse.validationResponse(error)
            );
        }
    },
};

module.exports = SubscriptionPlan;
