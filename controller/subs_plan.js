const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper");
const enc_dec = require("../utilities/decryptor/decryptor");
const subs_plan_model = require("../models/subs_plan_model");
const mailSender = require("../utilities/mail/mailsender");
const moment = require("moment");
const server_addr = process.env.SERVER_LOAD;
const port = process.env.SERVER_PORT;
const Subscription = process.env.Subscription_URL;
const SequenceUUID = require("sequential-uuid");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");

const subs_plan = {
    add: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");
        let ins_data = {
            sub_merchant_id: enc_dec.cjs_decrypt(req.bodyString("store_id")),
            plan_name: req.bodyString("plan_name"),
            plan_description: req.bodyString("plan_description"),
            plan_billing_frequency: req.bodyString("plan_billing_frequency"),
            plan_currency: req.bodyString("currency"),
            plan_billing_amount: req.bodyString("plan_billing_amount"),
            merchant_id: req.user.id,
            note: req.bodyString("note"),
            status: 0,
            deleted: 0,
            created_at: added_date,
            updated_at: added_date,

            payment_interval: req.bodyString("payment_interval"),
            initial_payment_amount: req.bodyString("initial_payment_amount"),
            start_date: req.bodyString("start_date"),
            terms: req.bodyString("terms"),
            final_payment_amount: req.bodyString("final_payment_amount"),
        };
        subs_plan_model
            .add(ins_data)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg("Subscription plan added successfully.")
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    list: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        };
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));

            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }
        let condition = { deleted: 0, merchant_id: req.user.id };
        if (req.bodyString("currency")) {
            condition.currency = req.bodyString("currency");
        }
        let search = "";
        if (req.bodyString("search_string")) {
            search = req.bodyString("search_string");
        }
        subs_plan_model
            .select(condition, limit, search)
            .then(async (result) => {
                let send_res = [];
                for (val of result) {
                    let temp = {
                        subs_plan_id: enc_dec.cjs_encrypt(val.id),
                        store_name: helpers.get_merchant_details_name_by_id(val.sub_merchant_id),
                        plan_name: val.plan_name,
                        plan_description: val.plan_description,
                        plan_billing_frequency: val.plan_billing_frequency,
                        status: val.status == 0 ? "Active" : "Deactivated",
                        currency: val.plan_currency,
                        initial_payment_amount: result.initial_payment_amount,
                        payment_interval: result.payment_interval,
                        terms: result.terms,
                        final_payment_amount: val.final_payment_amount,
                        plan_billing_amount: val.plan_billing_amount.toFixed(2),
                        note: val.note,
                        start_date: moment(val.start_date).format(
                            "DD-MM-YYYY H:mm:ss"
                        ),
                    };
                    send_res.push(temp);
                }
                let total_count = await subs_plan_model.get_count(condition);
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Referrer list fetched successfully.",
                        total_count
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    get: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
        subs_plan_model
            .selectOne("*", { id: id })
            .then(async (result) => {
                let send_res = {
                    subs_plan_id: enc_dec.cjs_encrypt(result.id),
                    plan_name: result.plan_name,
                    store_name: helpers.get_merchant_details_name_by_id(val.sub_merchant_id),
                    merchant_name: result.merchant_id
                        ? await helpers.get_merchant_details_name_by_id(
                              await helpers.get_merchant_id(result.merchant_id)
                          )
                        : "",
                    super_merchant_name: result.merchant_id
                        ? await helpers.get_super_merchant_name(
                              result.merchant_id
                          )
                        : "",
                    plan_description: result.plan_description,
                    plan_billing_frequency: result.plan_billing_frequency,
                    status: result.status == 0 ? "Active" : "Deactivated",
                    currency: result.plan_currency,
                    initial_payment_amount:
                        result.initial_payment_amount.toFixed(2),
                    payment_interval: result.payment_interval,
                    terms: result.terms,
                    final_payment_amount:
                        result.final_payment_amount.toFixed(2),
                    plan_billing_amount: result.plan_billing_amount.toFixed(2),
                    note: result.note,
                    start_date: moment(result.start_date).format("DD-MM-YYYY"),
                };
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Details fetched successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    delete: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
        let update_data = { deleted: 1 };
        subs_plan_model
            .updateDetails({ id: id }, update_data)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Subscription plan deleted successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    update: async (req, res) => {
        let subs_plan_id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");
        let ins_data = {
            sub_merchant_id: enc_dec.cjs_decrypt(req.bodyString("store_id")),
            plan_name: req.bodyString("plan_name"),
            plan_description: req.bodyString("plan_description"),
            plan_billing_frequency: req.bodyString("plan_billing_frequency"),
            plan_currency: req.bodyString("currency"),
            plan_billing_amount: req.bodyString("plan_billing_amount"),
            note: req.bodyString("note"),
            updated_at: added_date,

            payment_interval: req.bodyString("payment_interval"),
            initial_payment_amount: req.bodyString("initial_payment_amount"),
            start_date: req.bodyString("start_date"),
            terms: req.bodyString("terms"),
            final_payment_amount: req.bodyString("final_payment_amount"),
        };
        subs_plan_model
            .updateDetails({ id: subs_plan_id }, ins_data)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Subscription plan updated successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    activate: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
        let update_data = { status: 0 };
        subs_plan_model
            .updateDetails({ id: id }, update_data)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Subscription plan activated successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    deactivate: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subs_plan_id"));
        let update_data = { status: 1 };
        subs_plan_model
            .updateDetails({ id: id }, update_data)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Subscription plan deactivated successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    mail_send: async (req, res) => {
        let register_at = new Date()
            .toJSON()
            .substring(0, 19)
            .replace("T", " ");
        let id = await enc_dec.cjs_decrypt(req.bodyString("id"));
        subs_plan_model
            .selectOne("*", { id: id })
            .then(async (subs_data) => {
                let dec_msg = req.bodyString("emails");
                let split_msg = dec_msg.split(",");
                for (var i = 0; i < split_msg.length; i++) {
                    const uuid = new SequenceUUID({
                        valid: true,
                        dashes: false,
                        unsafeBuffer: true,
                    });
                    let subs_token = uuid.generate();
                    let data = {
                        merchant_name: subs_data.merchant_id
                            ? await helpers.get_merchant_details_name_by_id(
                                  await helpers.get_merchant_id(
                                      subs_data.merchant_id
                                  )
                              )
                            : "",
                        message: subs_data.plan_description,
                        //    message_text:req.bodyString('message')!=''?'<b style="color: #263238 !important;">Plan Description</b><br>'+req.bodyString('message'):'<b style="color: #263238 !important;">Plan Description</b><br>'+ subs_data.plan_description,
                        mail_to: split_msg[i],
                        plan_name: subs_data.plan_name,
                        pay_url: Subscription + subs_token,
                        plan_billing_frequency:
                            subs_data.payment_interval +
                            " " +
                            subs_data.plan_billing_frequency
                                .charAt(0)
                                .toUpperCase() +
                            subs_data.plan_billing_frequency.slice(1),
                        currency: subs_data.plan_currency,
                        amount: subs_data.plan_billing_amount.toFixed(2),
                        note: subs_data.note,
                        start_date: moment(subs_data.start_date).format(
                            "DD-MM-YYYY"
                        ),
                        initial_payment_amount:
                            subs_data.initial_payment_amount.toFixed(2),
                        payment_interval: subs_data.payment_interval,
                        terms: subs_data.terms,
                        final_payment_amount:
                            subs_data.final_payment_amount.toFixed(2),
                        subject: req.bodyString("subject"),
                        merchant_logo: subs_data.merchant_id
                            ? server_addr +
                              ":" +
                              port +
                              "/static/files/" +
                              (await subs_plan_model.getMerchantlogo({
                                  super_merchant_id: subs_data.merchant_id,
                              }))
                            : "",
                        // invoice: inv_response
                    };

                    let mail_response = await mailSender.subs_plan_mail(data);

                    ins_data = {
                        merchant_id: subs_data.merchant_id,
                        emails: split_msg[i],
                        plan_id: id,
                        currency: subs_data.plan_currency,
                        amount: subs_data.plan_billing_amount.toFixed(2),
                        sending_date: register_at,
                        token: subs_token,
                    };
                    subs_plan_model
                        .addMail(ins_data)
                        .then(async (result) => {
                            res.status(statusCode.ok).send(
                                response.successmsg("Mail sent successfully")
                            );
                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error.message)
                            );
                        });
                }

                //  console.log(mail_response)
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    link_details: async (req, res) => {
        let company_name = await subs_plan_model.get_company_name();
        let company_details = await helpers.company_details({ id: 1 });
        let image_path = server_addr + ":" + port + "/static/images/";
        let data = {
            merchant_details: {},
            subscription_details: {},
            mail_details: {},
            prefer_lang: "",
        };
        record_id = req.bodyString("token");
        let find = await subs_plan_model.selectMail("*", { token: record_id });

        subs_plan_model
            .selectOneMerchant({ super_merchant_id: find.merchant_id })
            .then(async (rlt) => {
                //   console.log(rlt)
                data.merchant_details = {
                    theme: rlt.theme,
                    icon: process.env.STATIC_URL + "/static/files/" + rlt.icon,
                    logo: process.env.STATIC_URL + "/static/files/" + rlt.logo,
                    use_logo: rlt.use_logo,
                    we_accept_image:
                        process.env.STATIC_URL +
                        "/static/files/" +
                        rlt.we_accept_image,
                    brand_color: rlt.brand_color,
                    accent_color: rlt.accent_color,
                    merchant_name: find.merchant_id
                        ? await helpers.get_merchant_details_name_by_id({
                              merchant_id: rlt.id,
                          })
                        : "",
                    use_logo_instead_icon: rlt.use_logo,
                    branding_language: enc_dec.cjs_encrypt(
                        rlt.branding_language
                    ),
                    company_details: {
                        fav_icon: image_path + company_details.fav_icon,
                        logo: image_path + company_details.company_logo,
                        letter_head: image_path + company_details.letter_head,
                        footer_banner:
                            image_path + company_details.footer_banner,
                        title: await helpers.get_title(),
                    },
                };
                data.mail_details = {
                    email: find.emails,
                };
                let result = await subs_plan_model.selectOne("*", {
                    id: find.plan_id,
                });
                data.subscription_details = {
                    subs_plan_id: enc_dec.cjs_encrypt(result.id),
                    plan_name: result.plan_name,
                    merchant_name: result.merchant_id
                        ? await helpers.get_merchant_details_name_by_id(
                              await helpers.get_merchant_id(result.merchant_id)
                          )
                        : "",
                    plan_description: result.plan_description,
                    pay_url: record_id,
                    plan_billing_frequency:
                        result.payment_interval +
                        " " +
                        result.plan_billing_frequency.charAt(0).toUpperCase() +
                        result.plan_billing_frequency.slice(1),
                    status: result.status == 0 ? "Active" : "Deactivated",
                    currency: result.plan_currency,
                    initial_payment_amount:
                        result.initial_payment_amount.toFixed(2),
                    payment_interval: result.payment_interval,
                    terms: result.terms,
                    final_payment_amount:
                        result.final_payment_amount.toFixed(2),
                    plan_billing_amount: result.plan_billing_amount.toFixed(2),
                    note: result.note,
                    start_date: moment(result.start_date).format("DD-MM-YYYY"),
                };

                (data.prefer_lang = await enc_dec.cjs_encrypt(
                    rlt.branding_language
                )),
                    res
                        .status(statusCode.ok)
                        .send(
                            response.successansmsg(
                                data,
                                "Details fetch successfully."
                            )
                        );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    subscriber_list: async (req, res) => {
        let qb = await pool.get_connection();
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        };
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));
            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }

        let date = {};
        if (req.bodyString("from_date")) {
            date.from_date = req.bodyString("from_date");
        }
        if (req.bodyString("to_date")) {
            date.to_date = req.bodyString("to_date");
        }

        // let condition = { super_merchant: 60 };
        let condition = { super_merchant: req.user.id };
        let condition_for_count = { super_merchant: req.user.id };
        if (req.bodyString("currency")) {
            condition.plan_currency = req.bodyString("currency");
        }

        if (req.bodyString("status")) {
            if (req.bodyString("status") === "Active") {
                condition.status = 0;
            } else {
                condition.status = 1;
            }
        }

        let search = "";
        if (req.bodyString("search_string")) {
            search = req.bodyString("search_string");
        }

        let like_condition = {
            email: "",
            plan_name: "",
        };
        if (req.bodyString("email")) {
            like_condition.email = req.bodyString("email");
        }
        if (req.bodyString("plan_name")) {
            like_condition.plan_name = req.bodyString("plan_name");
        }
        // console.log("like_condition", like_condition);

        subs_plan_model
            .select_pay(condition, date, limit, like_condition)
            .then(async (result) => {
                let send_res = [];
                for (val of result) {
                    let subs_id = val.subscription_id;
                    // console.log(val);

                    let needed_info = await qb
                        .select("order_no")
                        .where({ subscription_id: val.subscription_id })
                        .get(config.table_prefix + "subs_payment");
                        // .get(config.table_prefix + "qr_payment");
                    // console.log(qb.last_query());
                    // console.log("needed_info", needed_info);

                    const order_ids = needed_info
                        .map((item) => item.order_no)
                        .join(",");
                    // console.log(order_ids);

                    let extra_info = await subs_plan_model.get_needed_info(
                        subs_id
                    );

                    // console.log("get data => ", extra_info);

                    let temp = {
                        subscription_id: enc_dec.cjs_encrypt(val.id),
                        plan_name: val.plan_name,
                        plan_frequency:
                            val.payment_interval +
                            " " +
                            val.plan_billing_frequency,
                        order_no: order_ids,
                        email: val.email,
                        status: val.status == 1 ? "Inactive" : "Active",
                        currency: val.plan_currency,
                        plan_billing_amount: val.plan_billing_amount.toFixed(2),
                        added_date: moment(val.added_date).format(
                            "DD-MM-YYYY H:mm:ss"
                        ),
                        start_date: moment(val.start_date).format(
                            "DD-MM-YYYY H:mm:ss"
                        ),
                        last_payment_amount: extra_info[0]?.last_payment_amount
                            ? extra_info[0]?.last_payment_amount
                            : "",
                        last_payment_term: extra_info[0]?.last_payment_term
                            ? extra_info[0]?.last_payment_term
                            : "",
                        last_payment_date: extra_info[0]?.last_payment_date
                            ? extra_info[0]?.last_payment_date
                            : "",
                    };
                    send_res.push(temp);
                }
                let total_count =
                    await subs_plan_model.get_count_all_conditions(
                        condition,
                        like_condition,
                        date
                    );
                // let total_count = await subs_plan_model.get_count_pay(
                //     condition_for_count
                // );
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Subscriber list fetched successfully.",
                        total_count
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    get_subscriber: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subscriber_id"));
        subs_plan_model
            .selectSubscriber("*", { id: id })
            .then(async (result) => {
                let data = await subs_plan_model.selectSubsPay("*", {
                    subscription_id: result.subscription_id,
                    payment_status: "Completed",
                });

                let payment_data = [];
                for (val of data) {
                    let temp = {
                        payment_id: enc_dec.cjs_encrypt(val.id),
                        payment_status: val.payment_status,
                        payment_mode: val.mode_of_payment,
                        order_no: val.order_no,
                        added_date: moment(val.added_date).format(
                            "DD-MM-YYYY H:mm:ss"
                        ),

                        transaction_date: moment(val.transaction_date).format(
                            "DD-MM-YYYY H:mm:ss"
                        ),
                    };
                    payment_data.push(temp);
                }

                let send_res = {
                    subscription_id: result.subscription_id,
                    plan_name: result.plan_name,
                    email: result.email,
                    merchant_name: result.merchant_id
                        ? await helpers.get_merchant_details_name_by_id(
                              await helpers.get_merchant_id(result.merchant_id)
                          )
                        : "",
                    super_merchant_name: result.super_merchant
                        ? await helpers.get_super_merchant_name(
                              result.super_merchant
                          )
                        : "",
                    plan_description: result.plan_description,
                    plan_billing_frequency:
                        result.payment_interval +
                        " " +
                        result.plan_billing_frequency,
                    status: result.status == 0 ? "Active" : "De-active",
                    currency: result.plan_currency,
                    payment_status: result.payment_status,
                    initial_payment_amount:
                        result.initial_payment_amount.toFixed(2),
                    payment_interval: result.payment_interval,
                    terms: result.terms,
                    final_payment_amount:
                        result.final_payment_amount.toFixed(2),
                    plan_billing_amount:
                        result.plan_currency +
                        " " +
                        result.plan_billing_amount.toFixed(2),
                    added_date: moment(result.added_date).format(
                        "DD-MM-YYYY H:mm:ss"
                    ),
                    start_date: moment(result.start_date).format(
                        "DD-MM-YYYY H:mm:ss"
                    ),
                    pay_data: payment_data,
                };
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Details fetched successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    cancel: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("subscription_id"));
        let update_data = { status: 1 };
        subs_plan_model
            .updateDynamic({ id: id }, update_data, "subscription")
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg("Subscription cancelled successfully.")
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
};

module.exports = subs_plan;
