"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var nodemailer = require("nodemailer");

require('dotenv').config({
  path: "../../.env"
});

var welcome_template = require('../mail-template/welcome');

var welcome_admin_template = require('../mail-template/admin-welcome');

var forgot_template = require('../mail-template/forget');

var forgot_admin_template = require('../mail-template/forget_admin');

var PSPMail_template = require('../mail-template/PSPMail');

var otp_mail_template = require('../mail-template/otp_sent_mail');

var owners_ekyc_template = require('../mail-template/ownersMail');

var reset_password_template = require('../mail-template/reset_password');

var payout_mail = require('../mail-template/payout_mail');

var ekyc_done_mail = require('../mail-template/ekyc_done_mail');

var password_expire = require('../mail-template/password_expire');

var password_expire_before = require('../mail-template/password_expire_before');

var password_expire_before_day = require('../mail-template/password_expire_before_day');

var helpers = require('../helper/general_helper');

var invoice_template_1 = require("../mail-template/invoice_template_1");

var compliance_mail_template = require("../mail-template/compliance_mail_template");

require('dotenv').config({
  path: "../../.env"
});

var server_addr = process.env.SERVER_LOAD;
var port = process.env.SERVER_PORT;
var mailSender = {
  welcomeMail: function welcomeMail(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function welcomeMail$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context.sent;
            _context.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: welcome_template({
                url: url,
                name: name
              }, logo, title) // html body

            }));

          case 11:
            info = _context.sent;

          case 12:
          case "end":
            return _context.stop();
        }
      }
    });
  },
  welcomeAdminMail: function welcomeAdminMail(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function welcomeAdminMail$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context2.sent;
            _context2.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context2.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context2.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: welcome_admin_template({
                url: url,
                name: name
              }, logo, title) // html body

            }));

          case 11:
            info = _context2.sent;

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    });
  },
  forgotMail: function forgotMail(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function forgotMail$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context3.sent;
            _context3.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context3.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context3.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: forgot_template({
                url: url,
                user_name: name,
                mail: mail
              }, logo, title) // html body

            }));

          case 11:
            info = _context3.sent;

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    });
  },
  forgotAdminMail: function forgotAdminMail(mail, subject, data) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function forgotAdminMail$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context4.sent;
            _context4.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context4.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context4.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: forgot_admin_template(data, logo, title) // html body

            }));

          case 11:
            info = _context4.sent;

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    });
  },
  PSPMail: function PSPMail(mail, mail_cc, subject, table, para) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function PSPMail$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context5.sent;
            _context5.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context5.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context5.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              cc: mail_cc,
              subject: subject,
              // Subject line
              html: PSPMail_template({
                table: table
              }, logo, title, para) // html body

            }));

          case 11:
            info = _context5.sent;

          case 12:
          case "end":
            return _context5.stop();
        }
      }
    });
  },
  otpMail: function otpMail(mail, subject, otp) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function otpMail$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context6.sent;
            _context6.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context6.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context6.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: otp_mail_template(otp, logo, title) // html body

            }));

          case 11:
            info = _context6.sent;

          case 12:
          case "end":
            return _context6.stop();
        }
      }
    });
  },
  ekycOwnersMail: function ekycOwnersMail(mail, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function ekycOwnersMail$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context7.sent;
            _context7.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context7.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context7.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: owners_ekyc_template({
                url: url
              }, logo, title) // html body

            }));

          case 11:
            info = _context7.sent;

          case 12:
          case "end":
            return _context7.stop();
        }
      }
    });
  },
  resetPasswordMail: function resetPasswordMail(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function resetPasswordMail$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context8.sent;
            _context8.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context8.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context8.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: reset_password_template({
                url: url,
                name: name,
                email: mail
              }, logo, title) // html body

            }));

          case 11:
            info = _context8.sent;

          case 12:
          case "end":
            return _context8.stop();
        }
      }
    });
  },
  payoutMail: function payoutMail(mail, name, subject, url, date) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function payoutMail$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context9.sent;
            _context9.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context9.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context9.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: payout_mail({
                url: url,
                name: name,
                date: date
              }, logo, title) // html body

            }));

          case 11:
            info = _context9.sent;

          case 12:
          case "end":
            return _context9.stop();
        }
      }
    });
  },
  sendPasswordExpireMail: function sendPasswordExpireMail(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function sendPasswordExpireMail$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context10.sent;
            _context10.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context10.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context10.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: password_expire({
                url: url,
                name: name,
                email: mail
              }, logo, title) // html body

            }));

          case 11:
            info = _context10.sent;

          case 12:
          case "end":
            return _context10.stop();
        }
      }
    });
  },
  sendPasswordExpireMailBefore: function sendPasswordExpireMailBefore(mail, name, subject, url, expire_on) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function sendPasswordExpireMailBefore$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context11.sent;
            _context11.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context11.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context11.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: password_expire_before({
                url: url,
                name: name,
                email: mail,
                expiry_date: expire_on
              }, logo, title) // html body

            }));

          case 11:
            info = _context11.sent;

          case 12:
          case "end":
            return _context11.stop();
        }
      }
    });
  },
  sendPasswordExpireMailBeforeDay: function sendPasswordExpireMailBeforeDay(mail, name, subject, url) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function sendPasswordExpireMailBeforeDay$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context12.sent;
            _context12.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title());

          case 5:
            title = _context12.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context12.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: mail,
              // list of receivers
              subject: subject,
              // Subject line
              html: password_expire_before_day({
                url: url,
                name: name,
                email: mail
              }, logo, title) // html body

            }));

          case 11:
            info = _context12.sent;

          case 12:
          case "end":
            return _context12.stop();
        }
      }
    });
  },
  sendEkycDoneMail: function sendEkycDoneMail(data, subject) {
    var _ref, _ref2, admin_name_emails, smtp_details, _transporter, image_path, logo, email_res, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, admin, promise;

    return regeneratorRuntime.async(function sendEkycDoneMail$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.next = 2;
            return regeneratorRuntime.awrap(Promise.all([helpers.get_admins_with_role(), helpers.company_details({
              id: 1
            })]));

          case 2:
            _ref = _context13.sent;
            _ref2 = _slicedToArray(_ref, 2);
            admin_name_emails = _ref2[0];
            smtp_details = _ref2[1];

            if (!(admin_name_emails.length > 0)) {
              _context13.next = 33;
              break;
            }

            _transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            email_res = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context13.prev = 14;

            for (_iterator = admin_name_emails[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              admin = _step.value;
              promise = _transporter.sendMail({
                from: smtp_details.smtp_from,
                // sender address
                to: admin.email,
                // list of receivers
                subject: subject,
                // Subject line
                html: ekyc_done_mail(admin.name, data.email, data.url) // html body

              });
              email_res.push(promise);
            }

            _context13.next = 22;
            break;

          case 18:
            _context13.prev = 18;
            _context13.t0 = _context13["catch"](14);
            _didIteratorError = true;
            _iteratorError = _context13.t0;

          case 22:
            _context13.prev = 22;
            _context13.prev = 23;

            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }

          case 25:
            _context13.prev = 25;

            if (!_didIteratorError) {
              _context13.next = 28;
              break;
            }

            throw _iteratorError;

          case 28:
            return _context13.finish(25);

          case 29:
            return _context13.finish(22);

          case 30:
            if (!email_res[0]) {
              _context13.next = 33;
              break;
            }

            _context13.next = 33;
            return regeneratorRuntime.awrap(Promise.all(email_res));

          case 33:
          case "end":
            return _context13.stop();
        }
      }
    }, null, null, [[14, 18, 22, 30], [23,, 25, 29]]);
  },
  InvoiceMail: function InvoiceMail(data, email_details) {
    var smtp_details, title, transporter, image_path, logo, info;
    return regeneratorRuntime.async(function InvoiceMail$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context14.sent;
            _context14.next = 5;
            return regeneratorRuntime.awrap(helpers.get_title({
              id: 1
            }));

          case 5:
            title = _context14.sent;
            transporter = nodemailer.createTransport({
              host: smtp_details.smtp_name,
              port: smtp_details.smtp_port,
              secure: false,
              // true for 465, false for other ports
              auth: {
                user: smtp_details.smtp_username,
                // generated ethereal user
                pass: smtp_details.smtp_password // generated ethereal password

              }
            });
            image_path = server_addr + ":" + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context14.next = 11;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              // sender address
              to: email_details.email_address,
              // list of receivers
              subject: data.title,
              // Subject line
              html: invoice_template_1(data, logo, title.title) // html body

            }));

          case 11:
            info = _context14.sent;

          case 12:
          case "end":
            return _context14.stop();
        }
      }
    });
  },
  sendComplienceMail: function sendComplienceMail(mail_to, mail_cc, mail_subject, mail_body) {
    var smtp_details, image_path, logo, info;
    return regeneratorRuntime.async(function sendComplienceMail$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return regeneratorRuntime.awrap(helpers.company_details({
              id: 1
            }));

          case 2:
            smtp_details = _context15.sent;
            image_path = server_addr + ':' + port + "/static/images/";
            logo = image_path + smtp_details.company_logo;
            _context15.next = 7;
            return regeneratorRuntime.awrap(transporter.sendMail({
              from: smtp_details.smtp_from,
              to: mail_to,
              cc: mail_cc,
              subject: mail_subject,
              html: compliance_mail_template(mail_body, logo) // html body

            })["catch"](function (error) {
              return console.log(error);
            }));

          case 7:
            info = _context15.sent;
            return _context15.abrupt("return", info);

          case 9:
          case "end":
            return _context15.stop();
        }
      }
    });
  }
};
module.exports = mailSender;