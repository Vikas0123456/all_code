const merchantOrder = require("../models/merchantOrder");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
const admin_activity_logger = require('../utilities/activity-logger/admin_activity_logger');
const { custom } = require("joi");
var uuid = require('uuid');
const shortid = require('shortid')
const accessToken = require("../utilities/tokenmanager/token");
const merchantOrderModel = require("../models/merchantOrder");
const subs_plan_model = require("../models/subs_plan_model");
const { successdatamsg, successmsg } = require("../utilities/response/ServerResponse");
const SequenceUUID = require('sequential-uuid');
const e = require("express");
require('dotenv').config({ path: "../.env" });
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
const ShortUniqueId = require('short-unique-id');
const { pay_with_vault } = require("../utilities/validations/merchantOrderValidator");
const currency = require("./currency");
const EventEmitter = require('events');
const ee = new EventEmitter();
const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
var MerchantOrder = {
    create: async (req, res) => {
        let client = {
            os: req.headers.os,
            browser: req.headers.browser ? req.headers.browser : '',
            ip: req.headers.ip ? req.headers.ip : ''
        }
        let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let customer_details = req.body.data.customer_details;
        let order_details = req.body.data.order_details;
        let billing_details = req.body.data.billing_details;
        let shipping_details = req.body.data.shipping_details;
        const uid = new ShortUniqueId({ length: 10 });
        let order_id = uid();
        let status = 'Created'
        let token_payload = {
            order_id: 'ORD' + order_id.toUpperCase(),
            amount: order_details.amount,
            currency: order_details.currency,
            return_url: order_details.return_url,
            env: req.credentials.type,
            merchant_id: req.credentials.merchant_id,
        }
        let mode = '';
        if (req.credentials.type == 'test') {
            mode = 'test';
        } else {
            mode = 'live'
        }
        let token = accessToken(token_payload)
        let ins_body = {
            "merchant_id": req.credentials.merchant_id,
            "mcc": req.credentials.mcc_id,
            "mcc_category": req.credentials.mcc_cat_id,
            "super_merchant": req.credentials.super_merchant_id,
            "customer_name": customer_details.name,
            "customer_email": customer_details.email,
            "customer_mobile": customer_details.mobile,
            "billing_address_line_1": billing_details.address_line1,
            "billing_address_line_2": billing_details.address_line2,
            "billing_city": billing_details.city,
            "billing_pincode": billing_details.pin,
            "billing_province": billing_details.province,
            "billing_country": billing_details.country,
            "shipping_address_line_1": shipping_details.address_line1,
            "shipping_address_line_2": shipping_details.address_line2,
            "shipping_city": shipping_details.city,
            "shipping_country": shipping_details.country,
            "shipping_province": shipping_details.province,
            "shipping_pincode": shipping_details.pin,
            "amount": order_details.amount,
            "currency": order_details.currency,
            "return_url": order_details.return_url,
            "status": status,
            "order_id": 'ORD' + order_id.toUpperCase(),
            "browser": client.browser,
            "ip": client.ip,
            "os": client.os,
            "created_at": created_at,
            "updated_at": updated_at,
        }
        merchantOrderModel.add(ins_body, mode).then((result) => {
            let res_order_details = {
                status: status,
                message: "Order created",
                token: token,
                order_id: 'ORD' + order_id.toUpperCase(),
                amount: order_details.currency + ' ' + order_details.amount,
                payment_link: process.env.PAYMENT_URL + 'initiate/' + 'ORD' + order_id.toUpperCase() + '/' + token
            }
            res.status(statusCode.ok).send(res_order_details);
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        });

    },
    get: async (req, res) => {
        let data = {
            merchant_details: {},
            order_details: {},
            prefer_lang: ''
        }

        let merchant_id = req.order.merchant_id;
        let table_name = 'master_merchant';
        let selection = 'theme,icon,logo, use_logo,we_accept_image, brand_color, accent_color,branding_language';
        merchantOrderModel.selectOne(selection, { id: merchant_id }, table_name).then(async (result) => {

            let mer_details = await merchantOrderModel.selectOne("company_name", { 'merchant_id': merchant_id }, 'master_merchant_details')

            result.icon = process.env.STATIC_URL + '/static/files/' + result.icon;
            result.logo = process.env.STATIC_URL + '/static/files/' + result.logo;
            result.we_accept_image = process.env.STATIC_URL + '/static/files/' + result.we_accept_image;
            result.merchant_name = mer_details
                ? mer_details.company_name : "";
            result.use_logo_instead_icon = result.use_logo;
            result.branding_language = enc_dec.cjs_encrypt(result.branding_language);
            data.merchant_details = result;
            if (req.order.env == 'test') {
                table_name = 'orders_test'
            } else {
                table_name = 'orders'
            }
            if (req.bodyString('browserFP') == '') {
                data.pay_with_vault = 0;
            } else {
                try {
                    let browser_token = JSON.parse(enc_dec.cjs_decrypt(req.bodyString('browserFP')));
                    let customer_email = browser_token.email;
                    let fcm_fetch = await merchantOrderModel.selectOne('fcm_id', { email: customer_email }, 'customers');
                    
                    if (typeof fcm_fetch == 'undefined') {
                        data.pay_with_vault = 0;
                    } else {
                        data.pay_with_vault = 1;
                    }
                } catch (error) {
                    res.status(statusCode.internalError).send(response.errormsg(error.message));
                }
            }
            let image_path = server_addr + ':' + port + "/static/images/";
            let company_details = await helpers.company_details({ id: 1 });
            let title = await helpers.get_title()
            result.company_details = {
                fav_icon: image_path + company_details.fav_icon,
                logo: image_path + company_details.company_logo,
                letter_head: image_path + company_details.letter_head,
                footer_banner: image_path + company_details.footer_banner,
                title: title,
            }

            let selection = "order_id,customer_name as name,customer_email as email,customer_mobile as mobile,amount,currency,status,return_url";
            merchantOrderModel.selectOne(selection, { order_id: req.bodyString('order_id') }, table_name).then(async (result_1) => {
                result_1.env = req.order.env;
                data.order_details = result_1;
                let customer_email = req.bodyString('browserFP') ? JSON.parse(enc_dec.cjs_decrypt(req.bodyString('browserFP'))).email : '';
                if (customer_email == '') {
                    data.prefer_lang = enc_dec.cjs_encrypt("1");
                } else {
                    let table_name = 'customers';
                    let selection = 'prefer_lang';
                    let lang_resp = await merchantOrderModel.selectOne(selection, { email: customer_email }, table_name);
                    if (lang_resp)
                        data.prefer_lang = enc_dec.cjs_encrypt(lang_resp.prefer_lang)
                    else
                        data.prefer_lang = enc_dec.cjs_encrypt("1");
                }
                res.status(statusCode.ok).send(successdatamsg(data, 'Details fetch successfully.'));
            }).catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })

        }).catch((error) => {
            console.log(error)
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })

    },
    pay: async (req, res) => {
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        const uuid = new SequenceUUID({
            valid: true,
            dashes: false,
            unsafeBuffer: true
        })
        let payment_id = uuid.generate();
        let status = 'PENDING';
        let card_no = '';
        let enc_customer_id = '';
        if (req.bodyString('card_id') != '') {
            let card_id = enc_dec.cjs_decrypt(req.bodyString('card_id'));
            let card_details = await merchantOrderModel.selectOne('last_4_digit,cid', { id: card_id }, 'customers_cards');
            card_no = card_details.last_4_digit;
            enc_customer_id = card_details.cid;
        } else {
            card_no = req.bodyString('card').slice(-4);
            enc_customer_id = req.customer_id;
        }
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            browser: req.headers.browser,
            os: req.headers.os,
            ip: req.headers.ip,
            payment_id: payment_id,
            status: status,
            payment_mode: req.bodyString('payment_mode'),
            card_no: card_no,
            updated_at: updated_at,
            cid: enc_customer_id,


        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {

            let res_order_data = await merchantOrderModel.selectOne("*", { order_id: req.bodyString('order_id') }, table_name)
            let browser_token_enc = req.browser_fingerprint;
            if (!browser_token_enc) {
                let browser_token = {
                    os: req.headers.os,
                    browser: req.headers.browser,
                    browser_version: req.headers.browser_version,
                    email: req.bodyString('email'),
                }
                browser_token_enc = enc_dec.cjs_encrypt(JSON.stringify(browser_token))
            }
            let res_obj = {
                order_status: status,
                payment_id: payment_id,
                order_id: res_order_data.order_id,
                amount: res_order_data.amount,
                currency: res_order_data.currency,
                token: browser_token_enc
            }
            // Adding event base charges update in payment
            ee.once('ping', async (arguments) => {
                try {
                    let charges = {
                        sell_charges: 0.0,
                        buy_charges: 0.0,
                        sell_tax: 0.0,
                        buy_tax: 0.0
                    }
                    let qb = await pool.get_connection();
                    let response = await qb
                        .select('transaction_setup_id')
                        .where({ id: req.order.merchant_id })
                        .get(config.table_prefix + 'master_merchant');
                    let transaction_setup_id = response[0].transaction_setup_id;
                    let payment_amount = req.order.amount;
                    let selection = "cmm.currency,cmm.charges_type,cmm.payment_mode,cts.buy_per_charges,cts.buy_fix_amount,buy_min_charge_amount,cts.buy_max_charge_amount,cts.buy_tax,cts.sell_per_charges,cts.sell_min_charge_amount,cts.sell_max_charge_amount,cts.sell_fixed_amount,cts.sell_tax";
                    let transaction_slab_response = await qb.select(selection)
                        .from(config.table_prefix + 'charges_transaction_setup cmm')
                        .join(config.table_prefix + 'charges_transaction_slab cts', 'cmm.id=cts.transaction_setup_id', 'inner')
                        .where({ 'cmm.id': transaction_setup_id })
                        .where({ 'cts.buy_from_amount <=': payment_amount })
                        .where({ 'cts.buy_to_amount >=': payment_amount })
                        .get();
                    // meta part
                    let charges_data = transaction_slab_response[0];
                    if (charges_data) {
                        let allowed_currency = charges_data.currency;
                        let allowed_payment_mode = charges_data.payment_mode.replace(/'/g, "");
                        let charges_type = charges_data.charges_type;
                        let payment_currency = req.order.currency;
                        let payment_mode_array = allowed_payment_mode.split(",");
                        let currency_array = allowed_currency.split(",");
                        let payment_mode = req.bodyString('payment_mode');
                        // amounts part
                        if (charges_type != 'Volume_Base') {
                            if (currency_array.includes(payment_currency) && payment_mode_array.includes(payment_mode)) {
                                // sell charges 
                                let sell_charge_per = charges_data.sell_per_charges;
                                let sell_fix_amount = charges_data.sell_fixed_amount;
                                let sell_min_charge = charges_data.sell_min_charge;
                                let sell_max_charge_amount = charges_data.sell_max_charge_amount;
                                let sell_charge_tax = charges_data.sell_tax;
                                // sell charge by percentage
                                let sell_charge = sell_charge_per / 100 * payment_amount;
                                //add fix amount to it
                                sell_charge = sell_charge + sell_fix_amount;
                                //check if its less than min
                                if (sell_charge <= sell_min_charge) {
                                    sell_charge = sell_min_charge;
                                }
                                //check if its greater than max
                                if (sell_charge >= sell_max_charge_amount) {
                                    sell_charge = sell_max_charge_amount;
                                }
                                //calculate tax
                                
                                let sell_tax = sell_charge_tax / 100 * sell_charge;
                               
                                //Buy Charges
                                let buy_charge_per = charges_data.buy_per_charges;
                                let buy_fix_amount = charges_data.buy_fix_amount;
                                let buy_min_charge = charges_data.buy_min_charge_amount;
                                let buy_max_charge_amount = charges_data.buy_max_charge_amount;
                                let buy_charge_tax = charges_data.buy_tax;
                                // sell charge by percentage
                                let buy_charge = buy_charge_per / 100 * payment_amount;
                                //add fix amount to it
                                buy_charge = buy_charge_per + buy_fix_amount;
                                //check if its less than min
                                if (buy_charge <= buy_min_charge) {
                                    buy_charge = buy_min_charge;
                                }
                                //check if its greater than max
                                if (buy_charge >= buy_max_charge_amount) {
                                    buy_charge = buy_max_charge_amount;
                                }
                                //calculate tax
                                let buy_tax = buy_charge_tax / 100 * buy_charge;
                                charges.sell_charges = sell_charge;
                                charges.buy_charges = buy_charge;
                                charges.sell_tax = sell_tax;
                                charges.buy_tax = buy_tax;
                                let updateCharges = {
                                    sale_charge: charges.sell_charges,
                                    sale_tax: charges.sell_tax,
                                    buy_charge: charges.buy_charges,
                                    buy_tax: charges.buy_tax
                                }
                                await merchantOrderModel.updateDynamic(updateCharges, { order_id: req.bodyString('order_id') }, table_name);
                            } else {
                                let updateCharges = {
                                    sale_charge: charges.sell_charges,
                                    sale_tax: charges.sell_tax,
                                    buy_charge: charges.buy_charges,
                                    buy_tax: charges.buy_tax
                                }
                                await merchantOrderModel.updateDynamic(updateCharges, { order_id: req.bodyString('order_id') }, table_name);
                            }
                        } else {
                            let updateCharges = {
                                sale_charge: charges.sell_charges,
                                sale_tax: charges.sell_tax,
                                buy_charge: charges.buy_charges,
                                buy_tax: charges.buy_tax
                            }
                            await merchantOrderModel.updateDynamic(updateCharges, { order_id: req.bodyString('order_id') }, table_name);
                        }
                    } else {
                        let updateCharges = {
                            sale_charge: charges.sell_charges,
                            sale_tax: charges.sell_tax,
                            buy_charge: charges.buy_charges,
                            buy_tax: charges.buy_tax
                        }
                        await merchantOrderModel.updateDynamic(updateCharges, { order_id: req.bodyString('order_id') }, table_name);
                    }
                } catch (error) {
                    console.log(error); // this is the main part. Use the response property from the error object
                    return error.response;
                }

            });
            ee.emit('ping', { message: 'hello' });
            // event base charges update end
            res.status(statusCode.ok).send(successdatamsg(res_obj, 'Paid successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    addOrUpdateCustomer: async (req, res, next) => {

        if (req.bodyString('card_id') == '') {
            let email = req.bodyString('email')

            if (req.bodyString('browserFP') != '') {
                let browserFP = JSON.parse(enc_dec.cjs_decrypt(req.bodyString('browserFP')));
                if (browserFP.email != email) {
                    email = browserFP.email;
                } else {
                    email = req.bodyString('email')
                }
            }
            merchantOrderModel.selectOne('id', { email: email }, "customers").then((result) => {
                let customer_id = '';
                if (result) {
                    customer_id = result.id;
                    /** Update Customer*/
                    let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let customer = {
                        email: req.bodyString('email'),
                        name: req.bodyString('name'),
                        dial_code: req.bodyString('dial_code'),
                        mobile_no: req.bodyString('mobile_no'),
                        prefer_lang: enc_dec.cjs_decrypt(req.bodyString('prefer_lang')),
                        updated_at: updated_at
                    }
                    merchantOrderModel.updateDynamic(customer, { id: result.id }, 'customers').then((update_result) => {

                        req.customer_id = customer_id;
                        next();
                    }).catch((error) => {
                        res.status(statusCode.internalError).send(response.errormsg(error.message));
                    })
                } else {
                    let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let customer = {
                        name: req.bodyString('name'),
                        email: req.bodyString('email'),
                        dial_code: req.bodyString('dial_code'),
                        mobile_no: req.bodyString('mobile_no'),
                        prefer_lang: enc_dec.cjs_decrypt(req.bodyString('prefer_lang')),
                        created_at: created_at,
                        updated_at: updated_at
                    }
                    merchantOrderModel.addDynamic(customer, 'customers').then(async (result) => {
                        req.customer_id = result.insertId
                        next()
                    }).catch((error) => {
                        res.status(statusCode.internalError).send(response.errormsg(error.message));
                    })
                }
            }).catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
        } else {
            next()
        }
    },
    saveCard: async (req, res, next) => {
        if (req.bodyString('card_id') == '') {
            let save_card = req.bodyString('save_card');
            let browser_token = {
                os: req.headers.os,
                browser: req.headers.browser,
                browser_version: req.headers.browser_version,
                email: req.bodyString('email'),
            }
            let browser_token_enc = enc_dec.cjs_encrypt(JSON.stringify(browser_token))
            let card_exits = await merchantOrderModel.selectOne('id', { card_number: enc_dec.cjs_encrypt(req.bodyString('card')), browser_token: browser_token_enc }, 'customers_cards')
            
            if (save_card == '1' && typeof card_exits == 'undefined') {
                let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');

                let card = {
                    name_on_card: req.bodyString('name'),
                    card_number: enc_dec.cjs_encrypt(req.bodyString('card')),
                    card_expiry: req.bodyString('expiry_date'),
                    card_nw: "VISA",
                    last_4_digit: req.bodyString('card').slice(-4),
                    browser_token: browser_token_enc,
                    cid: enc_dec.cjs_encrypt(req.customer_id),
                    created_at: created_at,
                    updated_at: updated_at
                }
                req.browser_fingerprint = browser_token_enc;
                merchantOrderModel.addDynamic(card, 'customers_cards').then((result) => {
                    next();
                }).catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(response.errormsg(error.message));
                })
            } else {
                next()
            }
        } else {
            next()
        }
    },
    cardList: async (req, res, next) => {
        let dec_token = req.bodyString('token');
        if (dec_token) {
            // let customer_data = JSON.parse(dec_token);
            // let email = customer_data.email;
            // let customer = await merchantOrderModel.selectOne('*', { email: email }, 'customers')
            let customer_cards = await merchantOrderModel.selectDynamic('*', { browser_token: dec_token, deleted: 0 }, 'customers_cards')
            if (customer_cards[0]) {
                let cards = []
                for (let card of customer_cards) {
                    let card_obj = {
                        'card_id': enc_dec.cjs_encrypt(card.id),
                        'Name': card.name_on_card,
                        'ExpiryDate': card.card_expiry,
                        'CardNetwork': card.card_nw,
                        'Card': card.last_4_digit,
                        'Image': server_addr + ':' + port + "/static/images/visa-image.png"
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
    cancel: async (req, res) => {
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let status = "Cancelled";
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            status: status,
            updated_at: updated_at,
        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {
            let order_res = {
                order_status: status,
                order_id: req.bodyString('order_id'),
                amount: req.order.amount,
                currency: req.order.currency,
            }
            res.status(statusCode.ok).send(successdatamsg(order_res, 'Cancelled successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    mobile_cancel: async (req, res) => {
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let status = "Cancelled";
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            status: status,
            updated_at: updated_at,
            cid: enc_dec.cjs_encrypt(req.user.id)
        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {
            let order_res = {
                order_status: status,
                order_id: req.bodyString('order_id'),
                amount: req.order.amount,
                currency: req.order.currency,
            }
            res.status(statusCode.ok).send(successdatamsg(order_res, 'Cancelled successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    failed: async (req, res) => {
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let status = "Failed";
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            status: status,
            updated_at: updated_at
        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {
            let order_res = {
                order_status: status,
                order_id: req.bodyString('order_id'),
                amount: req.order.amount,
                currency: req.order.currency,
            }
            res.status(statusCode.ok).send(successdatamsg(order_res, 'Order failed.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    mobile_failed: async (req, res) => {
        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let status = "Failed";
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            status: status,
            updated_at: updated_at,
            cid: enc_dec.cjs_encrypt(req.user.id)
        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {
            let order_res = {
                order_status: status,
                order_id: req.bodyString('order_id'),
                amount: req.order.amount,
                currency: req.order.currency,
            }
            res.status(statusCode.ok).send(successdatamsg(order_res, 'Order failed.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    remove_card: async (req, res) => {
        let table_name = 'customers_cards';
        let card_data = { deleted: 1 };
        let condition = { id: enc_dec.cjs_decrypt(req.bodyString('card_id')) }
        merchantOrderModel.updateDynamic(card_data, condition, table_name).then((result) => {
            res.status(statusCode.ok).send(successmsg('Card deleted successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    send_notification_for_pay_with_vault: async (req, res) => {
        let customer_email = req.browser_fingerprint.email;
        let fcm_fetch = await merchantOrderModel.selectOne('fcm_id,name', { email: customer_email }, 'customers');
        if (typeof fcm_fetch == 'undefined') {
            res.status(statusCode.badRequest).send(response.validationResponse('Invalid browser fingerprint'));
        } else {
            let result = await helpers.pushNotification(fcm_fetch.fcm_id, title = "Make Payment", message = "Pay with vault for order id #" + req.bodyString('order_id'), url_ = "testing url", type = "Payment", payload = { "token": req.bodyString('token'), "order_id": req.bodyString('order_id') }, user = fcm_fetch.name)
            res.status(statusCode.ok).send(response.successmsg('Notification send successfully.'));
        }
    },
    pay_with_vault: async (req, res) => {

        let updated_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        const uuid = new SequenceUUID({
            valid: true,
            dashes: false,
            unsafeBuffer: true
        })
        let payment_id = uuid.generate();
        let status = 'Completed';
        let card_no = '';
        let enc_customer_id = '';
        let card_id = enc_dec.cjs_decrypt(req.bodyString('card_id'));
        let card_details = await merchantOrderModel.selectOne('last_4_digit,cid', { id: card_id }, 'customers_cards');
        card_no = card_details.last_4_digit;
        enc_customer_id = card_details.cid;
        table_name = '';
        if (req.order.env == 'test') {
            table_name = "orders_test"
        } else {
            table_name = "orders"
        }
        let order_data = {
            payment_id: payment_id,
            status: status,
            card_no: card_no,
            updated_at: updated_at,
            cid: enc_customer_id

        }
        merchantOrderModel.updateDynamic(order_data, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {

            let res_order_data = await merchantOrderModel.selectOne("*", { order_id: req.bodyString('order_id') }, table_name)
            let res_obj = {
                order_status: status,
                payment_id: payment_id,
                order_id: res_order_data.order_id,
                amount: res_order_data.amount,
                currency: res_order_data.currency,
            }
            res.status(statusCode.ok).send(successdatamsg(res_obj, 'Paid successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    status: async (req, res) => {

        if (req.order.env == 'test') {
            table_name = 'orders_test'
        } else {
            table_name = 'orders'
        }

        let selection = "status,payment_id,order_id,amount,currency";
        merchantOrderModel.selectOne(selection, { order_id: req.bodyString('order_id') }, table_name).then(async (result) => {
            let data = {
                order_status: result.status,
                payment_id: result.payment_id,
                order_id: result.order_id,
                currency: result.currency,
                amount: result.amount
            }
            res.status(statusCode.ok).send(successdatamsg(data, 'Details fetch successfully.'));
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
    },
    order_details_for_mobile: async (req, res) => {
        let selection = "order_id,customer_name as name,customer_email as email,customer_mobile as mobile,amount,currency,status";
        merchantOrderModel.selectOne(selection, { order_id: req.bodyString('order_id') }, 'orders_test').then(async (result) => {
            let data = { order_details: {} }
            data.order_details = result;
            res.status(statusCode.ok).send(successdatamsg(data, 'Details fetch successfully.'));
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        })

    },
    add_subscription: async (req, res) => {
        let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        let updated_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        record_id = req.bodyString("token");
        id = `'${req.bodyString("token")}'`;
        let find = await subs_plan_model.selectMail("*", { token: record_id });
        let subs_order_data = await merchantOrderModel.selectDynamicONE(
            "*",
            { id: find.plan_id, deleted: 0, status: 0 },
            "subs_plans"
        );
        let get_count = await merchantOrderModel.get_count(
            { payment_id: id, status: 0 },
            "subscription"
        );
        if (get_count == 0) {
            const uid = new ShortUniqueId({ length: 10 });
            let subs_id = uid();
            let qr_ins_body = {
                subscription_id: "SUB" + subs_id.toUpperCase(),
                payment_id: record_id,
                email: find.emails,
                plan_name: subs_order_data.plan_name,
                plan_description: subs_order_data.plan_description,
                plan_billing_frequency: subs_order_data.plan_billing_frequency,
                plan_currency: subs_order_data.plan_currency,
                plan_billing_amount: subs_order_data.plan_billing_amount,
                payment_interval: subs_order_data.payment_interval,
                initial_payment_amount: subs_order_data.initial_payment_amount,
                final_payment_amount: subs_order_data.final_payment_amount,
                start_date: moment(subs_order_data.start_date).format(
                    "YYYY-MM-DD H:mm:ss"
                ),
                terms: subs_order_data.terms,
                status: subs_order_data.status,
                super_merchant: subs_order_data.merchant_id
                    ? subs_order_data.merchant_id
                    : 0,
                added_date: created_at,
            };
            merchantOrderModel
                .addDynamic(qr_ins_body, "subscription")
                .then((result) => {
                    let res_order_details = {
                        status: subs_order_data.status,
                    };
                    res.status(statusCode.ok).send({ status: "success" });
                })
                .catch((error) => {
                    res.status(statusCode.internalError).send(
                        response.errormsg(error.message)
                    );
                });
        } else {
            res.status(statusCode.ok).send({ status: "success" });
        }
    },
    create_subs_order: async (req, res) => {
        let client = {
            os: req.headers.os,
            browser: req.headers.browser ? req.headers.browser : "",
            ip: req.headers.ip ? req.headers.ip : "",
        };
        let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        let updated_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        record_id = req.bodyString("token");
        let find = await subs_plan_model.selectMail("*", { token: record_id });
        let subs_order_data = await merchantOrderModel.selectSubsData(
            record_id
        );
        // console.log(subs_order_data);
        const uid = new ShortUniqueId({ length: 10 });
        let order_id = await helpers.make_sequential_no('ORD');
        let mode = "live";
        let status = "PENDING";
        let token_payload = {
            order_id: order_id,
            amount: subs_order_data.plan_billing_amount,
            currency: subs_order_data.plan_currency,
            return_url: return_url,
            env: mode,
            merchant_id: subs_order_data.merchant_id,
        };
        let token = accessToken(token_payload);
        let ins_body = {
            merchant_id: subs_order_data.merchant_id,
            payment_id: "",
            mcc: subs_order_data.mcc_id ? subs_order_data.mcc_id : 0,
            mcc_category: subs_order_data.mcc_cat_id
                ? subs_order_data.mcc_cat_id
                : 0,
            super_merchant: subs_order_data.super_merchant_id
                ? subs_order_data.super_merchant_id
                : 0,
            customer_name: "",
            customer_email: subs_order_data.emails,
            customer_code: "",
            customer_mobile: "",
            billing_address_line_1: "",
            billing_address_line_2: "",
            billing_city: "",
            billing_pincode: "",
            billing_province: "",
            billing_country: "",
            shipping_address_line_1: "",
            shipping_address_line_2: "",
            shipping_city: "",
            shipping_country: "",
            shipping_province: "",
            shipping_pincode: "",
            amount: subs_order_data.plan_billing_amount,
            currency: subs_order_data.plan_currency,
            return_url: return_url,
            status: status,
            origin: "INVOICE",
            order_id:order_id,
            browser: client.browser,
            ip: client.ip,
            os: client.os,
            created_at: created_at,
            updated_at: updated_at,
        };
        let qr_ins_body = {
            subscription_id: subs_order_data.subscription_id,
            merchant_id: subs_order_data.merchant_id,
            order_no: order_id,
            subs_email: subs_order_data.emails,
            mode_of_payment: "",
            payment_status: status,

            remark: "",
            mcc: subs_order_data.mcc_id ? subs_order_data.mcc_id : 0,
            mcc_category: subs_order_data.mcc_cat_id
                ? subs_order_data.mcc_cat_id
                : 0,
            super_merchant: subs_order_data.super_merchant_id
                ? subs_order_data.super_merchant_id
                : 0,
            added_date: created_at,
            transaction_date: created_at,
        };
        let add_qr_data = await merchantOrderModel.addDynamic(
            qr_ins_body,
            "subs_payment"
        );
        merchantOrderModel
            .add(ins_body, mode)
            .then((result) => {
                let res_order_details = {
                    status: status,
                    message: "Order created",
                    token: token,
                    order_id: order_id,
                    amount:
                        subs_order_data.plan_currency +
                        " " +
                        subs_order_data.plan_billing_amount.toFixed(2),
                    payment_link:
                        process.env.PAYMENT_URL +
                        "initiate/" +
                        order_id+
                        "/" +
                        token,
                };
                res.status(statusCode.ok).send(res_order_details);
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
}
module.exports = MerchantOrder;