const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const encDec = require('../utilities/decryptor/decryptor');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const helpers = require('../utilities/helper/general_helper');
const MerchantRegistrationModel = require('../models/merchant_registration');
const MerchantModel = require('../models/merchantmodel');
const shortid = require('shortid');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });
const uuid = require('uuid');
const mailSender = require('../utilities/mail/mailsender');
const axios = require('axios');
let MerchantRegistration = {
    register: async (req, res) => {
        let registerAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
        // let password = shortid.generate();
        // let passwordHash = encDec.cjs_encrypt(password.toString());
        let pspData = {
            name: req.bodyString('name'),
            email: req.bodyString('email'),
            mobile_no: req.bodyString('mobile_no'),
            code: req.bodyString('code'),
            referral_code_used: req.bodyString('referral_code'),
            company_name: req.bodyString('company_name'),
            // password: passwordHash,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            deleted: 0,
            status: 0,
            register_at: registerAt,
            auth_2fa_token: '',
            address_line_1: '',
            address_line_2: '',
            address_line_3: '',
            country: 0,
            state: 0,
            city: 0,
            zip_code: 0,
            alt_code: 0,
            alt_mobile: 0,
            roles: '',
            allow_stores: '',
        };

        MerchantRegistrationModel.register(pspData).then(async (result) => {
            let createdAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let tcObj = {
                'merchant_id': result.insert_id,
                'tc_id': await helpers.get_latest_tc_version_id(),
                'added_date': createdAt,
                'type': 'merchant',
                'deleted': 0
            };

            await helpers.create_activatylog({ merchant_id: result.insert_id, activity: "registeration process initated" }, req, res);
            await MerchantRegistrationModel.addTC(tcObj);
            await helpers.create_activatylog({ merchant_id: result.insert_id, activity: "Merchant Accepted terms and condition" }, req, res);
            let token = uuid.v1();
            let resetData = {
                merchant_id: result.insert_id,
                token: token,
                is_expired: 0,
                created_at: createdAt
            };
            MerchantRegistrationModel.addResetPassword(resetData)
                .then(async (resultAddReset) => {
                    // let merchant_details = {
                    // merchant_id: result.insert_id,
                    // }
                    // let merchant_details_insert_result = 
                    //await MerchantRegistrationModel.addDetails(merchant_details)
                    let verifyUrl = process.env.FRONTEND_URL + 'auth/create-password/' + token;
                    let title = await helpers.get_title();
                    let subject = 'Welcome to ' + title;

                    await mailSender.welcomeMail(req.bodyString('email'), req.bodyString('name'), subject, verifyUrl);
                    await helpers.create_activatylog({ merchant_id: result.insert_id, activity: "link Send For Password" }, req, res);
                    res.status(statusCode.ok).send(response.successmsg('Register successfully, please verify your email.'));
                });
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(response.errormsg(error));
        });
    },
    signup: async (req, res) => {
        let registerAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
        // let password = shortid.generate();
        // let passwordHash = encDec.cjs_encrypt(password.toString());
        let pspData = {
            name: req.bodyString('name'),
            email: req.bodyString('email'),
            mobile_no: req.bodyString('mobile_no'),
            code: req.bodyString('code'),
            referral_code_used: req.bodyString('referral_code'),
            company_name: req.bodyString('company_name'),
            // password: passwordHash,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            deleted: 0,
            status: 0,
            register_at: registerAt,
            auth_2fa_token: '',
            address_line_1: '',
            address_line_2: '',
            address_line_3: '',
            country: 0,
            state: 0,
            city: 0,
            zip_code: 0,
            alt_code: 0,
            alt_mobile: 0,
            roles: '',
            allow_stores: '',
        };

        MerchantRegistrationModel.register(pspData).then(async (result) => {
            let createdAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let tcObj = {
                'merchant_id': result.insert_id,
                'tc_id': await helpers.get_latest_tc_version_id(),
                'added_date': createdAt,
                'type': 'merchant',
                'deleted': 0
            };

            await MerchantRegistrationModel.addTC(tcObj);

            let token = uuid.v1();
            let resetData = {
                merchant_id: result.insert_id,
                token: token,
                is_expired: 0,
                created_at: createdAt
            };
            MerchantRegistrationModel.addResetPassword(resetData).then(
                async (resultAddReset) => {
                    // let merchant_details = {
                    // merchant_id: result.insert_id,
                    // }
                    // let merchant_details_insert_result = 
                    //await MerchantRegistrationModel.addDetails(merchant_details)
                    let verifyUrl = process.env.FRONTEND_URL + 'auth/create-password/' + token;
                    let title = await helpers.get_title();
                    let subject = 'Welcome to ' + title;

                    await mailSender.welcomeMail(req.bodyString('email'), req.bodyString('name'), subject, verifyUrl);
                    res.status(statusCode.ok).send(response.successmsg('The email verification link is send to the lead\'s email id.'));
                });
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(response.errormsg(error));
        });
    },
    resend_link: async (req, res) => {
        let condition = { email: req.bodyString('email'), deleted: 0, status: 0 }
        MerchantRegistrationModel.selectWithSelection('id,email,name', condition).then((result) => {
            if (result) {
                let reset_condition = { merchant_id: result.id }
                let reset_data = { is_expired: 1 }
                MerchantRegistrationModel.updateResetPassword(reset_condition, reset_data).then((result_reset) => {
                    let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let token = uuid.v1()
                    let resetData = {
                        merchant_id: result.id,
                        token: token,
                        is_expired: 0,
                        created_at: created_at
                    }
                    MerchantRegistrationModel.addResetPassword(resetData).then(async (result_reset_password) => {
                        let verify_url = process.env.FRONTEND_URL + 'reset-password/' + token;
                        let title = await helpers.get_title();
                        let subject = 'Welcome to ' + title;
                        await mailSender.welcomeMail(req.bodyString('email'), result.name, subject, verify_url);
                        res.status(statusCode.ok).send(response.successmsg('Email sent successfully, please verify your email.'));
                    })
                }).catch((error) => {
                    res.status(statusCode.internalError).send(response.errormsg(error));
                })
            } else {
                res.status(statusCode.ok).send(response.errormsg('Account is not active or deleted.'));
            }

        }).catch((err) => {
            res.status(statusCode.internalError).send(response.errormsg(error));
        })
    },

    reset_forgot_password: async (req, res) => {
        let condition = { email: req.bodyString('email'), deleted: 0, status: 0 }
        MerchantRegistrationModel.selectWithSelection('id,email,name', condition).then((result) => {
            if (result) {
                let reset_condition = { merchant_id: result.id }
                let reset_data = { is_expired: 1 }
                MerchantRegistrationModel.updateResetPassword(reset_condition, reset_data).then((result_reset) => {
                    let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let token = uuid.v1()
                    let resetData = {
                        merchant_id: result.id,
                        token: token,
                        is_expired: 0,
                        created_at: created_at
                    }
                    MerchantRegistrationModel.addResetPassword(resetData).then(async (result_pass_reset) => {
                        let verify_url = process.env.FRONTEND_URL + 'auth/reset-password/' + token;
                        let title = await helpers.get_title();
                        let subject = 'Reset your ' + title + ' password';
                        await mailSender.forgotMail(req.bodyString('email'), result.name, subject, verify_url);
                        res.status(statusCode.ok).send(response.successmsg('If your account is identified, you will be receiving an email to change your password.'));
                    })
                }).catch((error) => {
                    res.status(statusCode.internalError).send(response.errormsg(error));
                })
            } else {
                res.status(statusCode.ok).send(response.errormsg('If your account is identified, you will be receiving an email to change your password.'));
            }

        }).catch((err) => {
            res.status(statusCode.internalError).send(response.errormsg(error));
        })
    },
    reset_password: async (req, res) => {
        MerchantRegistrationModel.select({ token: req.bodyString('token') }).then(async (result_password_reset) => {
            let passwordHash = await encryptDecrypt('encrypt', req.bodyString('password'));
            let is_recent_password = await helpers.check_in_last_five_password('merchant', passwordHash, result_password_reset.merchant_id)
            if (!is_recent_password) {
                let merchant_data = {
                    password: passwordHash
                }
                let condition = {
                    id: result_password_reset.merchant_id
                }
                MerchantRegistrationModel.update_super_merchant(condition, merchant_data).then(async (result) => {
                    let merchant_data = {
                        is_expired: 1
                    }
                    let condition = {
                        token: req.bodyString('token')
                    }
                    let result1 = await MerchantRegistrationModel.updateResetPassword(condition, merchant_data);

                    let two_fa_token = uuid.v1();
                    let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                    let two_fa_data = {
                        token: two_fa_token,
                        merchant_id: result_password_reset.merchant_id,
                        created_at: created_at
                    }
                    let result_2fa = await MerchantRegistrationModel.add_two_fa(two_fa_data);
                    let password_data = {
                        password: passwordHash,
                        super_merchant_id: result_password_reset.merchant_id,
                        created_at: created_at
                    }
                    let password_add = await MerchantRegistrationModel.add_password(password_data);
                    let add_password_update = await helpers.updatePasswordChanged('merchant', passwordHash, result_password_reset.merchant_id)
                    await helpers.create_activatylog({ merchant_id: result_password_reset.merchant_id, activity: "new  Password created" }, req, res);
                    res.status(statusCode.ok).send(response.successdatamsg({ token: two_fa_token }, 'Password reset successfully.'));
                }).catch((error) => {
                    res.status(statusCode.internalError).send(response.errormsg(error));
                })
            } else {
                res.status(statusCode.internalError).send(response.errormsg('This password is recently use, please choose another one.'));
            }
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error));
        })
    },
    generate_otp: async (req, res) => {
        const token = req.bodyString('token');
        MerchantRegistrationModel.select2fa({ token: token }).then(async (result) => {
            if (result) {
                let title = await helpers.get_title()
                let otp = '123456'; //generateOTP();
                let ref_no = shortid.generate();
                MerchantRegistrationModel.update2fa({ token: result.token }, { otp: otp, ref_no: ref_no }).then(async (result_update) => {
                    let body = otp + " is your one time password for mobile number verification. This code expires in 5 minutes. Do not share this code with anyone. If not requested, please contact +971 4 314 6999 Telr Ref No. " + ref_no;
                    axios.get('https://api.smsglobal.com/http-api.php?action=sendsms&user=' + process.env.SMS_USERNAME + '&password=' + process.env.SMS_PASSWORD + '&from=Test&to=' + result.code + result.mobile_no + '&text=' + body).then((result_sms) => {
                        res.status(statusCode.ok).send(response.successmsg('OTP sent to your registered mobile no with Ref No. ' + ref_no + ' and will expire in 5 minutes.'));
                    }).catch((error) => {
                        res.status(statusCode.internalError).send(response.errormsg('Unable to send sms'));
                    })
                }).catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
                })


            } else {

                res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
            }
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error));
        })

    },
    resend_otp: async (req, res) => {
        const token = req.bodyString('token');
        MerchantRegistrationModel.select2faWithOtp({ token: token }).then(async (result) => {
            if (result) {
                let title = await helpers.get_title()
                let otp = result.otp; //generateOTP();
                let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
                let ref_no = result.ref_no;
                MerchantRegistrationModel.update2fa({ token: result.token }, { created_at: created_at }).then(async (result_update) => {
                    let body = otp + " is your one time password for mobile number verification. This code expires in 5 minutes. Do not share this code with anyone. If not requested, please contact +971 4 314 6999 Telr Ref No. " + ref_no;
                    axios.get('https://api.smsglobal.com/http-api.php?action=sendsms&user=' + process.env.SMS_USERNAME + '&password=' + process.env.SMS_PASSWORD + '&from=Test&to=' + result.code + result.mobile_no + '&text=' + body).then((result_sms) => {
                        res.status(statusCode.ok).send(response.successmsg('OTP sent to your registered mobile no with Ref No. ' + ref_no + ' and will expire in 5 minutes.'));
                    }).catch((error) => {
                        res.status(statusCode.internalError).send(response.errormsg('Unable to send sms'));
                    })
                }).catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
                })


            } else {

                res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
            }
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error));
        })

    },
    verify_otp: async (req, res) => {
        const token = req.bodyString('token');
        const otp = req.bodyString('otp');
        MerchantRegistrationModel.select2fa({ token: token, otp: otp, is_expired: 0 }).then(async (result) => {
            if (result) {
                var date1 = new Date().getTime();
                var date2 = new Date(result.created_at).getTime();

                if (date1 - date2 <= 5 * 60 * 1000) {
                    let condition = { token: token };
                    let data = { is_expired: 1 };
                    await MerchantRegistrationModel.update2fa(condition, data);
                    let mer_condition = { id: result.merchant_id }
                    let mer_data = { email_verified: 0, mobile_no_verified: 0, 'auth_2fa_token': result.secret }
                    await MerchantRegistrationModel.update_super_merchant(mer_condition, mer_data);

                    let super_merchant = await MerchantRegistrationModel.selectWithSelection('*', { id: result.merchant_id })

                    let mer_obj = {
                        'email': super_merchant.email,
                        'super_merchant_id': super_merchant.id,
                        'code': super_merchant.code,
                        'mobile_no': super_merchant.mobile_no,
                        'referral_code_used': super_merchant.referral_code_used,
                        'mode': 'test',
                        'status': 0
                    }

                    let merchant_id = await MerchantModel.add(mer_obj);
                    let store_id = 100000 + merchant_id.insertId;
                    await MerchantModel.updateDetails({ id: merchant_id.insertId }, { store_id: store_id });

                    let kayData = {
                        merchant_id: merchant_id.insertId,
                        type: 'test',
                        merchant_key: await helpers.make_order_number('test-'),
                        merchant_secret: await helpers.make_order_number('sec-'),
                        created_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
                    };
                    await MerchantModel.add_key(kayData);

                    let super_merchant_data = {};

                    for (var key in super_merchant) {
                        if (super_merchant.hasOwnProperty(key)) {
                            if (['id'].includes(key)) { continue }
                            if (key == 'last_password_updated') {
                                super_merchant_data[key] = moment(super_merchant[key]).format(
                                    "YYYY-MM-DD H:mm:ss"
                                );
                            } else if (key == 'register_at') {
                                super_merchant_data[key] = moment(super_merchant[key]).format(
                                    "YYYY-MM-DD H:mm:ss"
                                );
                            } else {
                                super_merchant_data[key] = super_merchant[key];
                            }
                        }
                    }

                    let options = {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', 'xusername': process.env.X_Username, 'xpassword': process.env.X_Password },
                        data: { super_merchant_data: super_merchant_data, kay_data: kayData },
                        url: process.env.UAE_OR_KSA_NODE_API_URL + 'duplicate_super_merchant',
                    };

                    await axios(options);
                    res.status(statusCode.ok).send(response.successmsg('Verified successfully, please login.'));
                } else {
                    res
                        .status(statusCode.ok)
                        .send(response.errormsg('OTP expired'));
                }
            } else {
                res
                    .status(statusCode.ok)
                    .send(response.errormsg('Invalid OTP'));
            }
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(response.errormsg(error));
        })
    }


}
module.exports = MerchantRegistration;

// Function to generate OTP
function generateOTP() {

    // Declare a digits variable 
    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}