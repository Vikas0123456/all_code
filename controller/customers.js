const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const enc_dec = require("../utilities/decryptor/decryptor")
const CustomerModel = require("../models/customers");
const TransactionsModel = require("../models/transactions");
const MccModel = require("../models/mccModel");
const MerchantModel = require("../models/merchantmodel");
const PspModel = require("../models/psp");
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const helpers = require("../utilities/helper/general_helper");
const mailSender = require('../utilities/mail/mailsender');
const otpSender = require('../utilities/sms/sentotp');
require('dotenv').config({ path: "../.env" });
const SequenceUUID = require('sequential-uuid');
const accessToken = require("../utilities/tokenmanager/token");
const moment = require('moment');
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
var uuid = require('uuid');
require("dotenv").config({ path: "../.env" });
var admin_user = {
    list: async (req, res) => {

        let limit = {
            perpage: 0,
            page: 0,
        }
        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        const name = req.bodyString('name');
        const email = req.bodyString('email');
        const mobile = req.bodyString('mobile');
        const code = req.bodyString('code');
        const search = {}
        let user_type = '';
        if (req.user.type == 'admin') {
            user_type = "admin";
        } else {
            user_type = "merchant";
        }
        if (req.bodyString('name')) { search.name = name }
        if (req.bodyString('email')) { search.email = email }
        if (req.bodyString('mobile')) { search.mobile_no = mobile }
        if (req.bodyString('code')) { search.dial_code = code }
        let table_name = "";
        if (req.bodyString('mode')) {
            table_name = "orders_test";
        } else {
            table_name = "orders";
        }
        CustomerModel.select(limit, search, user_type, req.user.id, table_name)
            .then(async (result) => {

                let send_res = [];
                for (let val of result) {
                    let res = {
                        customer_id: await enc_dec.cjs_encrypt(val.id),
                        name: (val.name) ? val.name : "-",
                        email: val.email,
                        mobile_no: val.mobile_no,
                        country_code: val.dial_code ? val.dial_code : '',
                        profile_pic: (val.avatar) ? server_addr + ':' + port + "/static/avatar/" + val.avatar : "",
                        image_name: (val.avatar) ? val.avatar : "",
                    };
                    send_res.push(res);
                };
                if (user_type == 'admin') {
                    total_count = await CustomerModel.get_customer_count(search);
                } else {
                    total_count = await CustomerModel.get_merchant_customer_count(search, req.user.id, table_name);
                }

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    customer_details: async (req, res) => {
        let cid = enc_dec.cjs_decrypt(req.bodyString("cid"));
        CustomerModel.selectOne('*', { id: cid })
            .then(async (result) => {
                let transaction_data = await CustomerModel.selectCustomerTransaction('*', { cid: req.bodyString("cid") }, date_con = "")
                let transaction = [];
                for (let val of transaction_data) {
                    let res = {
                        order_id: val.order_id,
                        order_amount: val.currency + ' ' + val.amount.toFixed(2),
                        order_currency: val.currency,
                        status: val.status,
                        billing_address_1: val.billing_address_line_1,
                        billing_address_2: val.billing_address_line_2,
                        billing_city: val.billing_city,
                        billing_pincode: val.billing_pincode,
                        billing_province: val.billing_province,
                        billing_country: val.billing_country,
                        shipping_address_1: val.shipping_address_line_1,
                        shipping_address_2: val.shipping_address_line_2,
                        shipping_city: val.shipping_city,
                        shipping_province: val.shipping_province,
                        shipping_country: val.shipping_country,
                        shipping_pincode: val.shipping_pincode,
                        transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss'),
                    };
                    transaction.push(res);
                };
                let send_res = [];
                let val = result
                let res1 = {
                    name: val.name,
                    email: val.email,
                    mobile_no: val.mobile_no,
                    country_code: val.dial_code ? val.dial_code : '',
                    profile_pic: (val.avatar) ? server_addr + ':' + port + "/static/avatar/" + val.avatar : "",
                    image_name: (val.avatar) ? val.avatar : "",
                    transaction_data: transaction
                };
                send_res = res1;

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    details: async (req, res) => {
        let cid = req.user.id;

        CustomerModel.selectOne('*', { id: cid })
            .then(async (result) => {

                let send_res = [];
                let val = result
                let res1 = {
                    name: val.name,
                    email: val.email,
                    mobile_no: val.mobile_no,
                    country_code: val.dial_code ? val.dial_code : '',
                    profile_pic: (val.avatar) ? server_addr + ':' + port + "/static/avatar/" + val.avatar : "",
                    image_name: (val.avatar) ? val.avatar : "",
                };
                send_res = res1;

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    otp_Sent: async (req, res) => {
        let is_existing = req.bodyString('is_existing');
        if (is_existing == 1) {
            let foundCust = await CustomerModel.selectOne("id,email,name", { dial_code: req.bodyString('mobile_code'), mobile_no: req.bodyString('mobile_no') });
            if (foundCust.email == req.bodyString('email')) {
                payload = {
                    id: foundCust.id,
                    name: foundCust.name,
                    email: foundCust.email,
                    type: 'customer'
                };

                const aToken = accessToken(payload);
                res.status(statusCode.ok).send(response.loginSuccess({ accessToken: aToken, name: payload.name, cid: encrypt_decrypt('encrypt', payload.id), 'user_type': 'customer' }));
            } else {
                res.status(statusCode.ok).send(response.errormsg('Not valid email id linked with mobile no'));
            }
        } else {
            let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let token = uuid.v1()
            let otp = await helpers.generateOtp(4)
            let ins_data = {
                email: req.bodyString('email'),
                token: token,
                otp: otp,
                register_at: register_at
            }
            CustomerModel.add(ins_data).then(async (result_add_reset) => {
                let title = await helpers.get_title();
                let subject = ' Verify email account';

                await mailSender.otpMail(req.bodyString('email'), subject, otp);
                res.status(statusCode.ok).send(response.successansmsg({ otp_token: token }, 'OTP sent, Please Verify your mail'));
            })
                .catch((error) => {
                    res.status(statusCode.internalError).send(response.errormsg(error));
                })
        }

    },
    otp_Sent_email: async (req, res) => {
        let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let token = uuid.v1()
        let otp = await helpers.generateOtp(4)
        let ins_data = {
            email: req.bodyString('email'),
            token: token,
            otp: otp,
            register_at: register_at
        }
        CustomerModel.add(ins_data).then(async (result_add_reset) => {
            let title = await helpers.get_title();
            let subject = ' Verify email account';

            await mailSender.otpMail(req.bodyString('email'), subject, otp);
            res.status(statusCode.ok).send(response.successansmsg({ otp_token: token }, 'OTP sent, Please Verify your mail'));
        })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error));
            })

    },
    otp_verity: async (req, res) => {
        let selection = "id,email";
        let condition = { token: req.bodyString('otp_token'), otp: req.bodyString('otp') };
        CustomerModel.selectOtpDAta(selection, condition).then(async (result) => {

            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let customerData = {
                name: '',
                email: result.email,
                created_at: added_date
            }
            let updateTaken = await CustomerModel.updateCustomerTempToken({ token: req.bodyString('token') }, customerData);

            let cid = await CustomerModel.selectCustomerDetails("id", { token: req.bodyString('token') });
            res.status(statusCode.ok).send(response.successdatamsg({ cid: encrypt_decrypt('encrypt', cid.id) }, "Registered successfully."));

        }).catch((error) => {
            console.log(error)
            res
                .status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
    reset_otp_verity: async (req, res) => {
        let selection = "id,email";
        let condition = { token: req.bodyString('otp_token'), otp: req.bodyString('otp') };
        CustomerModel.selectOtpDAta(selection, condition).then(async (result) => {
            let cid = await CustomerModel.selectCustomer("id", { email: result.email });
            res.status(statusCode.ok).send(response.successdatamsg({ cid: encrypt_decrypt('encrypt', cid.id) }, "Email verified."));

        }).catch((error) => {
            console.log(error)
            res
                .status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
    customer_ques_list: async (req, res) => {
        let cid = await enc_dec.cjs_decrypt(req.bodyString('cid'))

        CustomerModel.selectAnswer('id,customer_id,question_id', { deleted: 0, customer_id: cid })
            .then(async (result) => {

                let send_res = [];
                for (let val of result) {
                    let res = {
                        id: await enc_dec.cjs_encrypt(val.id),
                        customer_id: await enc_dec.cjs_encrypt(val.customer_id),
                        question_id: await enc_dec.cjs_encrypt(val.question_id),
                        question: await helpers.get_question_by_id(val.question_id),
                        //   answer: val.answer,
                    };
                    send_res.push(res);
                };
                total_count = await CustomerModel.get_count({ deleted: 0, customer_id: cid })
                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    verify_question_answer: async (req, res) => {
        let verify_data = req.body.data;
        let correct_answer = 0;

        let customer_id = verify_data[0].cid

        for (let i = 0; i < verify_data.length; i++) {
            let cid = await enc_dec.cjs_decrypt(verify_data[i].cid)
            let qid = await enc_dec.cjs_decrypt(verify_data[i].question_id)
            let answer = verify_data[i].answer
            if (answer < 2) {
                res
                    .status(statusCode.badRequest)
                    .send(response.validationResponse("Please select at least 2 answers"));
            }
            else {
                await CustomerModel.selectAnswer('*', { deleted: 0, customer_id: cid, question_id: qid, answer: answer })
                    .then((result) => {
                        if (result.length > 0) {
                            correct_answer++;
                        }
                    })
            }
        }
        if (correct_answer >= 2) {
            res.status(statusCode.ok).send(response.successdatamsg({ cid: customer_id }, 'Answer matched.You can proceed.'));
        }
        else {
            res.status(statusCode.badRequest).send(response.validationResponse(`Answer does not match`));
        }


    },
    reset_pin: async (req, res) => {
        let selection = "id";
        let condition = { id: encrypt_decrypt('decrypt', req.bodyString('cid')) };
        CustomerModel.selectOne(selection, condition).then(async (result) => {

            let customerData = {
                pin: encrypt_decrypt('encrypt', req.bodyString('pin'))
            }
            let updateTaken = await CustomerModel.updateDetails({ id: result.id }, customerData);
            res.status(statusCode.ok).send(response.successmsg("PIN reset successfully."));

        }).catch((error) => {
            console.log(error)
            res.status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
    update_profile: async (req, res) => {
        try {

            let cid = req.user.id;

            insdata = {
                name: req.bodyString("name"),

            };
            if (req.all_files) {
                if (req.all_files.avatar) {
                    insdata.avatar = req.all_files.avatar
                }
            }

            $ins_id = await CustomerModel.updateDetails({ id: cid }, insdata);

            res.status(statusCode.ok).send(response.successmsg('Customer profile updated successfully'));


        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    transaction_list: async (req, res) => {
        try {
            let limit = {
                perpage: 10,
                start: 0,
                page: 1,
            }

            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))

                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }

            let and_filter_obj = {};
            let date_condition = {};
            let cid = await encrypt_decrypt('encrypt', req.user.id)
            and_filter_obj.cid = cid
            if (req.bodyString('card_no')) {
                and_filter_obj.card_no = req.bodyString('card_no')
            }
            if (req.bodyString('from_date')) {
                date_condition.from_date = req.bodyString('from_date')
            }

            if (req.bodyString('to_date')) {
                date_condition.to_date = req.bodyString('to_date')
            }
            CustomerModel.selectTransaction(and_filter_obj, date_condition, limit)
                .then(async (result) => {

                    let send_res = [];
                    for (let val of result) {
                        let res = {
                            order_id: val.order_id,
                            transaction_id: await enc_dec.cjs_encrypt(val.id),
                            transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss'),
                            order_currency: val.currency,
                            order_amount: val.amount.toFixed(2),
                            status: val.status,
                            card_no: val.card_no,
                        };
                        send_res.push(res);
                    };
                    res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully'));
                })

        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    change_pin: async (req, res) => {
        let new_pin = req.bodyString("new_pin");
        let hashPin = await encrypt_decrypt('encrypt', new_pin)
        await CustomerModel.updateDetails({ id: req.user.id }, { pin: hashPin })
        res.status(statusCode.ok).send(response.successmsg("Pin changed successfully"));
    },
    change_email: async (req, res) => {

        let cid = req.user.id;
        let selection = "id,email";
        let condition = { otp: req.bodyString('otp'), token: req.bodyString('otp_token') };
        let old_email = await CustomerModel.selectOne('email', { id: cid, })

        let new_email = await CustomerModel.selectOtpDAta(selection, condition)
        let get_count = await CustomerModel.get_count_logs(cid, { new_email: `'${new_email.email}'` })
        let customerData = {
            email: new_email.email
        }
        let updateTaken = await CustomerModel.updateDetails({ id: cid }, customerData);
        if (get_count == 0) {
            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let logs = {
                cid: req.user.id,
                old_email: old_email.email,
                new_email: new_email.email,
                created_at: added_date
            }
            CustomerModel.addLogs(logs);
        }
        res.status(statusCode.ok).send(response.successmsg("Email updated successfully."));

    },
    cardList: async (req, res, next) => {
        // let dec_token = req.bodyString('token');
        let cid = await encrypt_decrypt('encrypt', req.user.id)
        if (cid) {
            // let customer_data = JSON.parse(dec_token);
            // let email = customer_data.email;
            // let customer = await merchantOrderModel.selectOne('*', { email: email }, 'customers')
            let customer_cards = await CustomerModel.selectDynamicCard('*', { cid: cid, deleted: 0 }, 'customers_cards')
            if (customer_cards[0]) {
                let cards = []
                for (let card of customer_cards) {
                    let card_obj = {
                        'card_id': enc_dec.cjs_encrypt(card.id),
                        'name': card.name_on_card,
                        'expiryDate': card.card_expiry,
                        'card_no': card.card_number,
                        'card_last_digit': card.last_4_digit,
                        'status': (card.status == 1) ? "Hide" : "Show",
                        'primary_card': card.primary_card,
                    }
                    cards.push(card_obj)
                }
                res.status(statusCode.ok).send(response.successdatamsg(cards, 'List fetched successfully.'));
            } else {
                res.status(statusCode.badRequest).send(response.successdatamsg([], 'No card found.'));
            }
        } else {
            res.status(statusCode.ok).send(response.successdatamsg([], 'No card found.'));
        }
    },
    card_add: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let name_on_card = req.bodyString("card_holder_name");
        let expiry_date = req.bodyString("expiry_date");
        let cid = await encrypt_decrypt('encrypt', req.user.id)
        let ins_body = {
            'name_on_card': name_on_card,
            'browser_token': '',
            'card_number': await enc_dec.cjs_encrypt(req.bodyString('card_no')),
            'card_nw': "VISA",
            'last_4_digit': req.bodyString('card_no').slice(-4),
            'cid': cid,
            'card_expiry': expiry_date,
            'deleted': 0,
            'created_at': added_date,
            'updated_at': added_date,
        }
        CustomerModel.addDynamic(ins_body, 'customers_cards').then((result) => {
            res.status(statusCode.ok).send(response.successmsg('Card added successfully.'));
        }).catch((error) => {

            res.status(statusCode.internalError).send(response.errormsg(error.message));
        });

    },
    card_delete: async (req, res) => {
        let card_id_exist = await enc_dec.cjs_decrypt(req.bodyString("card_id"))
        await CustomerModel.updateDynamic({ id: card_id_exist }, { deleted: 1 }, 'customers_cards')
        res.status(statusCode.ok).send(response.successmsg("Deleted successfully"));
    },
    card_hide: async (req, res) => {
        let card_id_exist = await enc_dec.cjs_decrypt(req.bodyString("card_id"))
        let visibility = req.bodyString("visibility")
        await CustomerModel.updateDynamic({ id: card_id_exist }, { status: visibility }, 'customers_cards')
        res.status(statusCode.ok).send(response.successmsg("Updated successfully"));
    },
    card_primary: async (req, res) => {
        let card_id_exist = await enc_dec.cjs_decrypt(req.bodyString("card_id"))
        let cid = await enc_dec.cjs_encrypt(req.user.id)
        await CustomerModel.updateDynamic({ cid: cid, deleted: 0 }, { primary_card: 0 }, 'customers_cards')
        await CustomerModel.updateDynamic({ id: card_id_exist }, { primary_card: 1 }, 'customers_cards')
        res.status(statusCode.ok).send(response.successmsg("Updated successfully"));
    },
    delete_hide_card: async (req, res) => {
        let verify_data = req.body.data;
        for (let i = 0; i < verify_data.length; i++) {
            let card_id = await enc_dec.cjs_decrypt(verify_data[i].card_id);
            let deleted = verify_data[i].deleted
            let hide = verify_data[i].hide
            let primary_card = verify_data[i].primary_card
            await CustomerModel.updateDynamic({ id: card_id }, { deleted: deleted, status: hide, primary_card: primary_card }, 'customers_cards')
                .then((result) => {
                    res.status(statusCode.ok).send(response.successmsg("Updated successfully"));
                })
        }
    },
    encrypt_mobile_no_and_code: async (req, res) => {
        let data = {
            mobile_no: encrypt_decrypt('encrypt', req.bodyString('mobile_code') + ' ' + req.bodyString('mobile_no') + ' ' + req.bodyString('fcm_id') + ' ' + req.user.id),
        }
        res.status(statusCode.ok).send(response.successdatamsg(data, "Encrypted successfully."));
    },
    receive_sms: async (req, res) => {
        
        let msg = req.body.Body;
        let from = req.body.From;
        let dec_msg = encrypt_decrypt('decrypt', msg);
        let split_msg = dec_msg.split(' ');
        let code = split_msg[0];
        let no = split_msg[1];
        let fcm_id = split_msg[2];
        let cid = split_msg[3];

        if (from == code + no) {
            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            const uuid = new SequenceUUID({
                valid: true,
                dashes: false,
                unsafeBuffer: true
            })
            let token = uuid.generate();
            let data = {

                dial_code: code,
                mobile_no: no,

            }
            CustomerModel.updateDetails({ id: cid }, data).then(async (result) => {

                let title = await helpers.get_title()
                let message = "Mobile verified"
                let url_ = ""
                let type = ""
                let user = await helpers.get_customer_name(cid)
                let payload = { "token": token, "message": message, "status": true }
                helpers.pushNotification(fcm_id, title, message, url_, type, payload, user = user)
                res.status(statusCode.ok).send(response.successdatamsg("Mobile no verified successfully."));
            }).catch((error) => {
                console.log(error)
                res
                    .status(statusCode.internalError)
                    .send(response.errormsg(error.message));
            })
        } else {

            let title = await helpers.get_title()
            let message = "Mobile not verified"
            let url_ = ""
            let type = ""
            let payload = { "message": message, "status": false }
            helpers.pushNotification(fcm_id, title, message, url_, type, payload, user = "")
            res.status(statusCode.ok).send(response.errormsg("Unable to verify mobile no."));
        }

    },
    receive_sms_fail: async (req, res) => {
        res.status(statusCode.internalError).send(response.errormsg("SMS Fail"));
    },
    dashboard: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        if (req.bodyString('from_date') && req.bodyString('to_date')) {
            from_date = req.bodyString('from_date')
            to_date = req.bodyString('to_date')
            var search_date = { from_date: from_date, to_date: to_date }
        }

        try {
            var transaction_table = 'orders'
            var id = encrypt_decrypt('encrypt', req.user.id)
            var customerbymcc = await CustomerModel.selectDynamicTransaction({ cid: id }, req.bodyString('from_date') ? search_date : false, transaction_table)

            var get_count = await CustomerModel.get_dynamic_count({ cid: id }, req.bodyString('from_date') ? search_date : {}, transaction_table);
            var total_amount = await CustomerModel.get_volume_dynamic({ cid: id }, req.bodyString('from_date') ? search_date : {}, transaction_table)
            let customer_list = [];
            var total_transactions = await CustomerModel.get_dynamic_count({ cid: id }, req.bodyString('from_date') ? search_date : {}, transaction_table);

            if (customerbymcc.length > 0) {
                for (let val of customerbymcc) {

                    var no_of_transactions = await CustomerModel.get_dynamic_count({ cid: id, mcc_category: val.mcc_category }, req.bodyString('from_date') ? search_date : {}, transaction_table);
                    var total_amount_mcc = await CustomerModel.get_volume_dynamic({ cid: id, mcc_category: val.mcc_category }, req.bodyString('from_date') ? search_date : {}, transaction_table)

                    let per_amount = total_amount > 0 ? (total_amount_mcc / total_amount) * 100 : 0;
                    let res = {

                        category: await helpers.get_mcc_category_name_by_id(val.mcc),
                        currency: total_amount_mcc.currency,
                        amount: total_amount_mcc.total ? total_amount_mcc.total.toFixed(2) : '0.00',

                        percentage: per_amount.toFixed(2),

                        total_transaction: no_of_transactions,

                    };
                    customer_list.push(res);
                }
            } else {
                var customerbymcc = await CustomerModel.selectDynamicTransaction({ cid: id }, {}, transaction_table)
                for (let val of customerbymcc) {

                    var no_of_transactions = await CustomerModel.get_dynamic_count({ cid: id, mcc_category: val.mcc_category }, req.bodyString('from_date') ? search_date : {}, transaction_table);
                    var total_amount_mcc = await CustomerModel.get_volume_dynamic({ cid: id, mcc_category: val.mcc_category }, req.bodyString('from_date') ? search_date : {}, transaction_table)

                    let per_amount = total_amount > 0 ? (total_amount_mcc / total_amount) * 100 : 0;
                    let res = {

                        category: (val.mcc) != '' ? await helpers.get_mcc_category_name_by_id(val.mcc) : '',
                        // currency:total_amount_mcc.currency,
                        amount: total_amount_mcc.total ? total_amount_mcc.total.toFixed(2) : '0.00',

                        percentage: per_amount.toFixed(2),

                        total_transaction: no_of_transactions,

                    };
                    customer_list.push(res);
                }
            }

            if (get_count == 0) {
                let res = {

                    category: '',

                    amount: '0.00',

                    percentage: '0.00',

                    total_transaction: '0',

                };
                customer_list.push(res);
            }
            let count = {
                total_transaction: total_transactions,
                total_amount: total_amount.total ? total_amount.total.toFixed(2) : '0.00',
            }

            res.status(statusCode.ok).send(response.successdatamsg(customer_list, 'Details fetch successfully', count));


        } catch (error) {
            console.log(error)
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    send_otp_mobile: async (req, res) => {
        const{mobile_code,mobile_no}=req.body;
          try {
              let otp = await helpers.generateOtp(4);
              const title = 'PayVault';
              const mobile_number = `${mobile_code}${mobile_no}`;
              const welcomeMessage = 'Welcome to ' + title + '! Your verification code is: ' + otp + '. Do not share it with anyone.';
              otpSender(mobile_number, welcomeMessage).then(async (data) => {
                let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                const uuid = new SequenceUUID({
                    valid: true,
                    dashes: true,
                    unsafeBuffer: true
                })
                  
                let token = uuid.generate();
                let ins_data = {
                    mobile_code: mobile_code,
                    mobile_no: mobile_no,
                    otp: otp,
                    token: token,
                    sms_id: data,
                    created_at: register_at
                }
              CustomerModel.addMobileOTP(ins_data).then(async (result) => {
                res.status(statusCode.ok).send(response.SentOTPMobile({otp_token:token}));
              }).catch((error) => {

                  res.status(statusCode.internalError).send(response.errormsg(error));
              })
              })
         .catch((error) => {

                      res.status(statusCode.internalError).send(response.errormsg(error));
                  })
          } catch (error) {
              res.status(statusCode.internalError).send(response.errormsg(error.message));
          }
      },
 
      mobile_otp_verify: async (req, res) => {
        let selection = "id,mobile_code,mobile_no,sms_id";
        let condition = {otp: req.bodyString('otp'),token:req.bodyString('otp_token')};
        CustomerModel.selectMobileOtpDAta(selection, condition).then(async (result) => {
            const uuid = new SequenceUUID({
                valid: true,
                dashes: false,
                unsafeBuffer: true
            })
              
              let token = uuid.generate();
            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let customerData = {
                token:token,
                mobile_code: result.mobile_code,
                mobile_no: result.mobile_no,
                twiloi_sms_id:result.sms_id,
                created_at: added_date
            }
            let updateTaken = await CustomerModel.add_customer_tem(customerData);
            res.status(statusCode.ok).send(response.successdatamsg({ token: token }, "Mobile no verified successfully."));

        }).catch((error) => {
            console.log(error)
            res
                .status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
    forgot_otp_verify: async (req, res) => {
        let selection = "id,mobile_code,mobile_no";
        let condition = { token: req.bodyString('otp_token'), otp: req.bodyString('otp') };
        CustomerModel.selectMobileOtpDAta(selection, condition).then(async (result) => {
            let cid = await CustomerModel.selectCustomer("id", { dial_code: result.mobile_code,mobile_no:result.mobile_no });
            res.status(statusCode.ok).send(response.successdatamsg({ cid: encrypt_decrypt('encrypt', cid.id) }, "Mobile number verified."));

        }).catch((error) => {
            console.log(error)
            res
                .status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
}
module.exports = admin_user;