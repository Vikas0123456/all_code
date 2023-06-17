const PasswordModel = require("../models/password");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
const moment = require('moment');
const mailSender = require("../utilities/mail/mailsender");
const excel = require('exceljs')
const uuid = require('uuid');
var Password = {
    start: async (req, res) => {
        try {
            let merchant_list = await PasswordModel.selectMerchantList(90);
            let admin_list = await PasswordModel.selectAdminList(90);
            //For Merchant Password Expired
            let merchant_id_list = [];
            let merchant_password_reset_token_record = [];
            let merchant_mail = [];

            for (let merchant of merchant_list) {
                merchant_id_list.push(merchant.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    merchant_id: merchant.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                merchant_password_reset_token_record.push(temp);
                let temp_email = {
                    name: merchant.name,
                    email: merchant.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                merchant_mail.push(temp_email);
            }
            //bulk insert
            if (merchant_password_reset_token_record.length > 0) {
                await PasswordModel.addMerchantPasswordReset(merchant_password_reset_token_record);
            }
            //bulk update 
            if (merchant_id_list.length > 0) {
                await PasswordModel.updateMerchantPasswordExpire({ password_expired: 1 }, { id: merchant_id_list })
            }
            if (merchant_mail.length > 0) {
                for (let mail_data of merchant_mail) {
                    let mail = await mailSender.sendPasswordExpireMail(mail_data.email, mail_data.name, 'Password expiry notification', mail_data.url)
                    console.log(mail);
                }
            }

            //Form Admin Password Expired
            let admin_id_list = [];
            let admin_password_reset_token_record = [];
            let admin_mail = [];
            for (let admin of admin_list) {
                admin_id_list.push(admin.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    admin_id: admin.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                admin_password_reset_token_record.push(temp);
                let temp_email = {
                    name: admin.name,
                    email: admin.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                admin_mail.push(temp_email);
            }
            //bulk insert
            if (admin_password_reset_token_record.length > 0) {
                await PasswordModel.addAdminPasswordReset(admin_password_reset_token_record);
            }
            //bulk update 
            if (admin_id_list.length > 0) {
                await PasswordModel.updateAdminPasswordExpire({ password_expired: 1 }, { id: admin_id_list })
            }
            if (admin_mail.length > 0) {
                for (let mail_data of admin_mail) {
                    let mail = await mailSender.sendPasswordExpireMail(mail_data.email, mail_data.name, 'Password expiry notification', mail_data.url)
                    console.log(mail);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },
    start_before_week:async(req,res)=>{
        try {
            let merchant_list = await PasswordModel.selectMerchantList(83);
            let admin_list = await PasswordModel.selectAdminList(83);
            //For Merchant Password Expired
            let merchant_id_list = [];
            let merchant_password_reset_token_record = [];
            let merchant_mail = [];

            for (let merchant of merchant_list) {
                merchant_id_list.push(merchant.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    merchant_id: merchant.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                merchant_password_reset_token_record.push(temp);
                let temp_email = {
                    name: merchant.name,
                    email: merchant.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                merchant_mail.push(temp_email);
            }
            //bulk insert
            if (merchant_password_reset_token_record.length > 0) {
                await PasswordModel.addMerchantPasswordReset(merchant_password_reset_token_record);
            }
            //bulk update 
          
            if (merchant_mail.length > 0) {
                for (let mail_data of merchant_mail) {
                    let mail = await mailSender.sendPasswordExpireMailBefore(mail_data.email, mail_data.name, 'Password expiry notification', mail_data.url,moment().add(7,'days').format('YYYY-MM-DD'))
                    console.log(mail);
                }
            }

            //Form Admin Password Expired
            let admin_id_list = [];
            let admin_password_reset_token_record = [];
            let admin_mail = [];
            for (let admin of admin_list) {
                admin_id_list.push(admin.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    admin_id: admin.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                admin_password_reset_token_record.push(temp);
                let temp_email = {
                    name: admin.name,
                    email: admin.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                admin_mail.push(temp_email);
            }
            //bulk insert
            if (admin_password_reset_token_record.length > 0) {
                await PasswordModel.addAdminPasswordReset(admin_password_reset_token_record);
            }
          
            if (admin_mail.length > 0) {
                for (let mail_data of admin_mail) {
                    let mail = await mailSender.sendPasswordExpireMailBefore(mail_data.email, mail_data.name, 'Password expiry notification', mail_data.url,moment().add(7,'days').format('YYYY-MM-DD'))
                    console.log(mail);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },
    start_before_day:async(req,res)=>{
        try {
            let merchant_list = await PasswordModel.selectMerchantList(89);
            let admin_list = await PasswordModel.selectAdminList(89);
            //For Merchant Password Expired
            let merchant_id_list = [];
            let merchant_password_reset_token_record = [];
            let merchant_mail = [];

            for (let merchant of merchant_list) {
                merchant_id_list.push(merchant.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    merchant_id: merchant.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                merchant_password_reset_token_record.push(temp);
                let temp_email = {
                    name: merchant.name,
                    email: merchant.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                merchant_mail.push(temp_email);
            }
            //bulk insert
            if (merchant_password_reset_token_record.length > 0) {
                await PasswordModel.addMerchantPasswordReset(merchant_password_reset_token_record);
            }
           
            if (merchant_mail.length > 0) {
                for (let mail_data of merchant_mail) {
                    let mail = await mailSender.sendPasswordExpireMailBeforeDay(mail_data.email, mail_data.name, 'Password expiry notification')
                    console.log(mail);
                }
            }

            //Form Admin Password Expired
            let admin_id_list = [];
            let admin_password_reset_token_record = [];
            let admin_mail = [];
            for (let admin of admin_list) {
                admin_id_list.push(admin.id);
                let token = uuid.v1();
                let temp = {
                    token: token,
                    admin_id: admin.id,
                    is_expired: 0,
                    created_at: moment().format('YYYY-MM-DD HH:mm')
                }
                admin_password_reset_token_record.push(temp);
                let temp_email = {
                    name: admin.name,
                    email: admin.email,
                    url: process.env.FRONTEND_URL + '/auth/create-password/' + token
                }
                admin_mail.push(temp_email);
            }
            //bulk insert
            if (admin_password_reset_token_record.length > 0) {
                await PasswordModel.addAdminPasswordReset(admin_password_reset_token_record);
            }
          
            if (admin_mail.length > 0) {
                for (let mail_data of admin_mail) {
                    let mail = await mailSender.sendPasswordExpireMailBeforeDay(mail_data.email, mail_data.name, 'Password expiry notification')
                    console.log(mail);
                }
            }
        } catch (error) {
            console.log(error);
        }
    },

}
module.exports = Password;