const nodemailer = require("nodemailer");
require('dotenv').config({ path: "../../.env" });
const welcome_template = require('../mail-template/welcome');
const welcome_admin_template = require('../mail-template/admin-welcome');
const forgot_template = require('../mail-template/forget');
const forgot_admin_template = require('../mail-template/forget_admin');
const PSPMail_template = require('../mail-template/PSPMail');
const otp_mail_template = require('../mail-template/otp_sent_mail');
const owners_ekyc_template = require('../mail-template/ownersMail');
const reset_password_template = require('../mail-template/reset_password');
const payout_mail = require('../mail-template/payout_mail');
const ekyc_done_mail = require('../mail-template/ekyc_done_mail');
const password_expire = require('../mail-template/password_expire');
const password_expire_before = require('../mail-template/password_expire_before');
const password_expire_before_day = require('../mail-template/password_expire_before_day');
const helpers = require('../helper/general_helper');
const invoice_template_1 = require("../mail-template/invoice_template_1");
const compliance_mail_template = require("../mail-template/compliance_mail_template");
require('dotenv').config({ path: "../../.env" });
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT

var mailSender = {
    welcomeMail: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: welcome_template({ url: url, name: name }, logo, title) // html body
        });
    },
    welcomeAdminMail: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: welcome_admin_template({ url: url, name: name }, logo, title) // html body
        });
    },

    forgotMail: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo

        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: forgot_template({ url: url, user_name: name, mail: mail }, logo, title) // html body
        });
    },

    forgotAdminMail: async (mail, subject, data) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: forgot_admin_template(data, logo, title) // html body
        });
    },

    PSPMail: async (mail, mail_cc, subject, table, para) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            cc: mail_cc,
            subject: subject, // Subject line
            html: PSPMail_template({ table: table }, logo, title, para) // html body
        });
    },
    otpMail: async (mail, subject, otp) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: otp_mail_template(otp, logo, title) // html body
        });
    },
    ekycOwnersMail: async (mail, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: owners_ekyc_template({ url: url }, logo, title) // html body
        });
    },
    resetPasswordMail: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: reset_password_template({ url: url, name: name, email: mail }, logo, title) // html body
        });
    },
    payoutMail: async (mail, name, subject, url, date) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: payout_mail({ url: url, name: name, date: date }, logo, title) // html body
        });
    },
    sendPasswordExpireMail: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: password_expire({ url: url, name: name, email: mail }, logo, title) // html body
        });
    },
    sendPasswordExpireMailBefore: async (mail, name, subject, url, expire_on) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: password_expire_before({ url: url, name: name, email: mail, expiry_date: expire_on }, logo, title) // html body
        });
    },
    sendPasswordExpireMailBeforeDay: async (mail, name, subject, url) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title();
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ':' + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: mail, // list of receivers
            subject: subject, // Subject line
            html: password_expire_before_day({ url: url, name: name, email: mail }, logo, title) // html body
        });
    },
    sendEkycDoneMail: async (data, subject) => {
        let [admin_name_emails,smtp_details] = await Promise.all([helpers.get_admins_with_role(),helpers.company_details({ id: 1 })])
        //let title = await helpers.get_title();
        if (admin_name_emails.length > 0) {
            let transporter = nodemailer.createTransport({
                host: smtp_details.smtp_name,
                port: smtp_details.smtp_port,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: smtp_details.smtp_username, // generated ethereal user
                    pass: smtp_details.smtp_password, // generated ethereal password
                },
            });
            let image_path = server_addr + ':' + port + "/static/images/";
            let logo = image_path + smtp_details.company_logo
            let email_res = []
            for (let admin of admin_name_emails) {
                
                let promise = transporter.sendMail({
                    from: smtp_details.smtp_from, // sender address
                    to: admin.email, // list of receivers
                    subject: subject, // Subject line
                    html: ekyc_done_mail(admin.name,data.email,data.url) // html body
                });
                email_res.push(promise)
            }
            if(email_res[0]){
                await Promise.all(email_res)
            }
            
        }
    },


    InvoiceMail: async (data,email_details) => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title({ id: 1 });

        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });

        let image_path = server_addr + ":" + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo;
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, // sender address
            to: email_details.email_address, // list of receivers
            subject: data.title, // Subject line
            html: invoice_template_1(data, logo, title.title), // html body
        });
    },

    sendComplienceMail: async (mail_to,mail_subject,mail_body,mail_cc,attachments = " ") => {
        let smtp_details = await helpers.company_details({ id: 1 });
        let title = await helpers.get_title({ id: 1 });
        let transporter = nodemailer.createTransport({
            host: smtp_details.smtp_name,
            port: smtp_details.smtp_port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtp_details.smtp_username, // generated ethereal user
                pass: smtp_details.smtp_password, // generated ethereal password
            },
        });
        let image_path = server_addr + ":" + port + "/static/images/";
        let logo = image_path + smtp_details.company_logo;
        let info = await transporter.sendMail({
            from: smtp_details.smtp_from, 
            to: mail_to,
            cc:mail_cc,
            subject: mail_subject, 
            attachments:attachments,
            html: compliance_mail_template(mail_body,logo),
        }).then(result =>{console.log(result)}).catch(error =>{console.log(error)});
    },

}
module.exports = mailSender;