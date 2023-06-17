const AdminModel = require('../models/adm_user');
const MerchantModel = require("../models/merchantmodel");
const statusCode = require("../utilities/statuscode/index");
const MerchantEkycModel = require("../models/merchant_ekycModel");
const response = require("../utilities/response/ServerResponse");
const bcrypt = require("bcrypt");
const accessToken = require("../utilities/tokenmanager/token");
const customaccessToken = require("../utilities/tokenmanager/customtoken");
const checkCustomToken = require("../utilities/tokenmanager/checkCustomToken")
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const PartnerModel = require("../models/partner");
const helpers = require('../utilities/helper/general_helper');
const moment = require('moment');
const mailSender = require('../utilities/mail/mailsender');
const SequenceUUID = require('sequential-uuid');
const path = require('path');
require('dotenv').config({ path: "../.env" });
const server_addr = process.env.SERVER_LOAD
const region = process.env.REGION
const port = process.env.SERVER_PORT
const admin_link = process.env.ADMIN_LINK
const admin_kyc_url = process.env.ADMIN_KYC_URL
const switch_region_url = process.env.UAE_OR_KSA_NODE_API_URL

const CustomerModel = require("../models/customers");
const uuid = require('uuid');
const { successmsg, errormsg } = require("../utilities/response/ServerResponse");
require("dotenv").config({ path: "../.env" });
let Auth = {
    login: async (req, res) => {
        let email = req.bodyString("username");
        let password = req.bodyString("password");
        let enc_password = await encrypt_decrypt('encrypt', password)
        let foundUser = await AdminModel.selectOne("*", { 'email': email, 'password': enc_password, 'deleted': 0 });

        if (foundUser) {
            let user = foundUser;
            if (user.is_blocked == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is blocked."));
            } else if (user.status == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is not active."));
            }else if(user.password_expired){
                res.status(statusCode.ok).send(response.errormsg("Password is expired, please reset your password."));
            } 
            else {
                payload = {
                    username: user.username,
                    id: user.id,
                    name: user.name,
                    email: email,
                    type: 'admin'
                };

                const aToken = accessToken(payload);

                let condition = {}
                if (user.language) {
                    condition.id = user.language
                } else {
                    condition.status = 0,
                        condition.deleted = 0
                }

                let language = await helpers.get_first_active_language_json(condition)
                let user_id = await encrypt_decrypt('encrypt', user.id);
                //const rToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
                res.status(statusCode.ok).send(response.loginSuccess({
                    accessToken: aToken, 
                    name: payload.name,
                    'roles': user.role, 
                    'language': language, 
                    'theme': user.theme, 
                    'user_type': 'admin', 
                    user_id: user_id, 
                    region: region,
                    email: email,
                    admin_kyc_url: admin_kyc_url,
                    switch_region_url: switch_region_url
                 }));
            }
        } else {

            res.status(statusCode.ok).send(response.errormsg("Invalid email or password"));
        }
    },
    partnerlogin: async (req, res) => {
        let username = req.bodyString("username");
        let password = req.bodyString("password");

        let enc_username = await encrypt_decrypt('encrypt', username)
        let enc_password = await encrypt_decrypt('encrypt', password)

        let foundUser = await PartnerModel.selectOne("*", { 'username': enc_username, 'password': enc_password, 'deleted': 0 });

        if (foundUser) {
            let user = foundUser;
            if (user.is_blocked == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is blocked."));
            } else if (user.status == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is not active."));
            } else {
                payload = {
                    username: user.username,
                    id: user.id,
                    name: user.name,
                    company_name: user.company_name,
                    type: 'partner'
                };

                const aToken = accessToken(payload);
                let condition = {}
                if (user.language) {
                    condition.id = user.language
                } else {
                    condition.status = 0,
                        condition.deleted = 0
                }

                let language = await helpers.get_first_active_language_json(condition)

                //const rToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
                res.status(statusCode.ok).send(response.loginSuccess({ accessToken: aToken, name: payload.name, 'language': language, 'theme': user.theme, 'type': 'partner' }));
            }
        } else {

            res.status(statusCode.ok).send(response.errormsg("Invalid username or password"));
        }
    },
    merchantlogin: async (req, res) => {
        let username = req.bodyString("username");
        let password = req.bodyString("password");

        let enc_username = await encrypt_decrypt('encrypt', username)
        let enc_password = await encrypt_decrypt('encrypt', password)

        let foundUser = await MerchantModel.selectOne("*", { 'username': enc_username, 'password': enc_password, 'deleted': 0 });

        if (foundUser) {
            let user = foundUser;
            if (user.is_blocked == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is blocked."));
            } else if (user.status == 1) {
                res.status(statusCode.ok).send(response.errormsg("User is not active."));
            } else {
                payload = {
                    username: user.username,
                    id: user.id,
                    name: user.merchant_name,
                    type: 'merchant',
                    super_merchant: user.super_merchant,
                    partner_id: user.partner_id,
                };



                const aToken = accessToken(payload);

                let currency_merchant;
                let user_type;
                if (user.super_merchant) {
                    user_type = "sub-merchant"
                    currency_merchant = await helpers.get_merchant_currency({ id: user.super_merchant });
                } else {
                    user_type = "merchant"
                    currency_merchant = user.currency;
                }

                let user_data = {
                    merchant_name: user.merchant_name,
                    email: user.business_email,
                    country_code: user.mobile_code,
                    mobile_no: user.business_contact,
                };

                if (user.super_merchant && user.image) {
                    user_data.image = server_addr + ':' + port + "/static/images/" + user.image
                }

                const currency_details = await helpers.get_currency_details({ 'code': currency_merchant });
                let currency = { currency_name: currency_details.currency, currency_code: currency_details.code }

                let condition = {}
                if (user.language) {
                    condition.id = user.language
                } else {
                    condition.status = 0,
                        condition.deleted = 0
                }

                let language = await helpers.get_first_active_language_json(condition)
                res.status(statusCode.ok).send(response.loginSuccess({ accessToken: aToken, name: payload.name, 'language': language, 'theme': user.theme, 'type': user_type, 'currency': currency, data: user_data }));
            }
        } else {

            res.status(statusCode.ok).send(response.errormsg("Invalid username or password"));
        }
    },
    profile: async (req, res) => {
        res.status(statusCode.ok).send(response.successmsg());
    },
    changepassword: async (req, res) => {
        let new_password = req.bodyString("new_password");
        let hashPassword =  encrypt_decrypt('encrypt', new_password)
        if (req.user.type == "admin") {
            let check_if_recent_password = await helpers.check_in_last_five_password('admin',hashPassword,req.user.id);
            if(!check_if_recent_password){
                await AdminModel.updateDetails({ id: req.user.id }, { password: hashPassword });
                await helpers.updatePasswordChanged('admin',hashPassword,req.user.id);
                res.status(statusCode.ok).send(response.successmsg("Password updated successfully"));
            }else{
                res.status(statusCode.ok).send(response.errormsg("This password is recently use, please choose another one."));
            }
        }
        else if (req.user.type == "merchant") {
            let check_if_recent_password = await helpers.check_in_last_five_password('merchant',hashPassword,req.user.id);
            if(!check_if_recent_password){
                await MerchantModel.updatePassword({ id: req.user.id }, { password: hashPassword })
                await helpers.updatePasswordChanged('merchant',hashPassword,req.user.id);
                res.status(statusCode.ok).send(response.successmsg("Password updated successfully"));
            }else{
                res.status(statusCode.ok).send(response.errormsg("This password is recently use, please choose another one."));
            }
        }
       
    },


    updatePassword: async (req, res) => {
        let email = req.bodyString("email");
        let foundUser = await AdminModel.findsingle({ email: email });
        if (foundUser) {
            let hashPassword = await bcrypt.hash(req.bodyString("password"), 10);
            let updateData = {
                otp: '',
                updated_at: new Date().toJSON().substring(0, 19).replace('T', ' '),
                password: hashPassword
            }
            AdminModel.update(updateData, foundUser.id)
                .then((result) => {
                    res.status(statusCode.ok).send(response.successmsg('Password Changed Successfully, please login with your new credentials'));
                })
                .catch((error) => {
                    res
                        .status(statusCode.internalError)
                        .send(response.errormsg(error.message));
                });
        } else {
            res
                .status(statusCode.ok)
                .send(response.errormsg("Malicious Activity Performed"));
        }
    },

    forget_password: async (req, res) => {
        let email = req.bodyString("email");
        let type = req.bodyString("user");
        let foundUser;
        let admin_type;
        foundUser = await AdminModel.selectOne("id,email,name", { email: email, deleted: 0, is_blocked: 0 });

        if (foundUser) {
            let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let token = uuid.v1()
            let resetData = {
                admin_id: foundUser.id,
                token: token,
                is_expired: 0,
                created_at: created_at
            }
            AdminModel.addResetPassword(resetData).then(async (result_pass_reset) => {
                let verify_url = process.env.FRONTEND_URL + 'auth/admin/create-password/' + token;
                let title = await helpers.get_title();
                let subject = 'Reset your ' + title + ' password';
                await mailSender.forgotMail(req.bodyString('email'), foundUser.name, subject, verify_url);
            })

        }
        res.status(statusCode.ok).send(response.successmsg("If your account is identified, you will be receiving an email to change your password."));
        
    },

    updateForgetPassword: async (req, res) => {
        let authtoken = req.bodyString("authtoken");
        let check_auth_token = await checkCustomToken(authtoken);
        if (check_auth_token.status == "Success") {
            let password = req.bodyString("password");
            let enc_password = await encrypt_decrypt('encrypt', password)
            if (check_auth_token.data.type == "admin") {
                await AdminModel.updateDetails({ id: check_auth_token.data.id }, { password: enc_password })
            } else {
                await PartnerModel.updateDetails({ id: check_auth_token.data.id }, { password: enc_password })
            }
            await AdminModel.delete_token({ user_id: check_auth_token.data.id, user_type: check_auth_token.data.type })
            data = { "type": check_auth_token.data.type }
            res.status(statusCode.ok).send(response.successdatamsg(data, "Password update successfully."));
        } else {
            if (check_auth_token.message) {
                res.status(statusCode.ok).send(response.errormsg(check_auth_token.message));
            } else {
                res.status(statusCode.ok).send(response.errormsg("Malicious Activity Performed"));
            }

        }
    },
    encrypt_mobile_no_and_code: async (req, res) => {
        let data = {
            mobile_no: encrypt_decrypt('encrypt', req.bodyString('mobile_code') + ' ' + req.bodyString('mobile_no') + ' ' + req.bodyString('fcm_id')),
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
        if (from == code + no) {
            let foundCust = await CustomerModel.selectActualCustomerDetails("*", { dial_code: code, mobile_no: no });
            let is_existing_customer = 0;
            if (foundCust) {
                is_existing_customer = 1;
            }
            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            const uuid = new SequenceUUID({
                valid: true,
                dashes: false,
                unsafeBuffer: true
            })
            let token = uuid.generate();
            let data = {
                token: token,
                mobile_code: code,
                mobile_no: no,
                created_at: added_date,
                twiloi_sms_id: req.body.MessageSid,
                fcm_id: fcm_id
            }
            MerchantModel.addTempCustomer(data).then(async (result) => {

                let title = await helpers.get_title()
                let message = 'Mobile verified';
                let url_ = ''
                let type = ''
                let payload = { "token": token, "message": message, "status": true, is_existing: is_existing_customer }
                helpers.pushNotification(fcm_id, title, message, url_, type, payload, user = "")
                res.status(statusCode.ok).send(response.successdatamsg({ token: token }, "Mobile no verified successfully."));
            }).catch((error) => {
                console.log(error)
                res
                    .status(statusCode.internalError)
                    .send(response.errormsg(error.message));
            })
            // let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            // const uuid = new SequenceUUID({
            //     valid: true,
            //     dashes: false,
            //     unsafeBuffer: true
            // })
            // let token = uuid.generate();
            // let data = {
            //     token: token,
            //     mobile_code: code,
            //     mobile_no: no,
            //     twiloi_sms_id:req.body.MessageSid,
            //     fcm_id:fcm_id,
            //     created_at: added_date,
            // } 
            // CustomerModel.updateDynamic({ id: foundCust.id },data,'customer_temp').then(async (result) => {

            //     let title = await helpers.get_title()
            //     let message="Mobile verified"
            //     let url_ = ""
            //     let type = ""
            //     let payload = {"token":token,"message":message,"status":true}
            //     helpers.pushNotification(fcm_id,title, message,url_,type,payload,user="")
            //     res.status(statusCode.ok).send(response.successmsg("Mobile no verified successfully."));
            // }).catch((error) => {
            //     console.log(error)
            //     res
            //         .status(statusCode.internalError)
            //         .send(response.errormsg(error.message));
            // })
            // }else{



            // } 
        }
        else {
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
        console.log(req.body, "Message Fail")
        res.status(statusCode.internalError).send(response.errormsg("SMS Fail"));
    },
    registerCustomer: async (req, res) => {
        let is_existing = req.bodyString('is_existing');
        if (is_existing == 1) {
            let foundCust = await CustomerModel.selectOne("email,name,id", { 'dial_code': req.bodyString('mobile_code'), 'mobile_no': req.bodyString('mobile_no') });
            if (foundCust.email == req.bodyString("email")) {
                payload = {
                    id: foundCust.id,
                    name: foundCust.name,
                    email: foundCust.email,
                    type: 'customer'
                };

                const aToken = accessToken(payload);
                res.status(statusCode.ok).send(response.loginSuccess({ accessToken: aToken, name: payload.name, cid: encrypt_decrypt('encrypt', payload.id), 'user_type': 'customer' }));
            } else {
                res
                    .status(statusCode.ok)
                    .send(response.errormsg('Not valid email id linked with mobile no'));
            }
        } else {
            let selection = "id,mobile_code,mobile_no";
            let condition = { token: req.bodyString('token') };
            MerchantModel.selectCustomerDetails(selection, condition).then(async (result) => {

                let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
                let customerData = {
                    name: req.bodyString('name'),
                    email: req.bodyString('email'),
                    //is_invalid:1
                    // dial_code: result.mobile_code,
                    // mobile_no: result.mobile_no,
                    created_at: added_date
                }
                let updateTaken = await MerchantModel.updateCustomerTempToken({ token: req.bodyString('token') }, customerData);

                res.status(statusCode.ok).send(response.successdatamsg({ cid: encrypt_decrypt('encrypt', result.id) }, "Register successfully."));
            }).catch((error) => {
                console.log(error)
                res
                    .status(statusCode.internalError)
                    .send(response.errormsg(error.message));
            })
        }
    },
    customerPin: async (req, res) => {
        let selection = "id,mobile_code,mobile_no";
        let condition = { id: encrypt_decrypt('decrypt', req.bodyString('cid')) };
        MerchantModel.selectCustomerDetails(selection, condition).then(async (result) => {

            let customerData = {
                pin: encrypt_decrypt('encrypt', req.bodyString('pin'))
            }
            let updateTaken = await MerchantModel.updateCustomerTempToken({ id: result.id }, customerData);
            res.status(statusCode.ok).send(response.successdatamsg({ cid: encrypt_decrypt('encrypt', result.id) }, "PIN added successfully."));

        }).catch((error) => {
            console.log(error)
            res.status(statusCode.internalError)
                .send(response.errormsg(error.message));
        })
    },
    customer_login: async (req, res) => {
        let cid = encrypt_decrypt('decrypt', req.bodyString('cid'));
        let pin = encrypt_decrypt('encrypt', req.bodyString('pin'))
        let foundCust = await CustomerModel.selectOne("*", { 'id': cid, 'pin': pin });
        if (foundCust) {
            let cust = foundCust;

            payload = {
                id: cust.id,
                name: cust.name,
                email: cust.email,
                type: 'customer'
            };

            const aToken = accessToken(payload);
            let customer_id = await encrypt_decrypt('encrypt', cust.id);

            res.status(statusCode.ok).send(response.loginSuccess({ accessToken: aToken, name: payload.name, 'user_type': 'customer' }));
        } else {

            res.status(statusCode.ok).send(response.errormsg("Invalid cid or pin"));
        }
    },
    reset_password: async (req, res) => {
        let token = uuid.v1();
        let reset_data = {
            admin_id: encrypt_decrypt('decrypt', req.bodyString('admin_id')),
            token: token,
            is_expired: 0,
            created_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
        }
        AdminModel.addAdminResetPassword(reset_data).then(async (result) => {
            let admin_user_details = await AdminModel.selectOne('id,email,name', { id: encrypt_decrypt('decrypt', req.bodyString('admin_id')) });
            let verify_url = process.env.FRONTEND_URL + 'auth/admin/create-password/' + token;
            await mailSender.resetPasswordMail(admin_user_details.email,admin_user_details.name,'Reset password.',verify_url);
            res.status(statusCode.ok).send(
                successmsg(
                    "To reset password the link is sent to the registered email id"
                )
            );
        }).catch((error) => {
            res.status(statusCode.ok).send(errormsg('Unable to reset password.'))
        })
    }
};

module.exports = Auth;