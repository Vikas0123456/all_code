const registrationModel = require("../models/registration");
const enc_dec = require("../utils/decryptor/decryptor");
const StatusCode = require("../utils/statuscode/statusCode");
const serverResponse = require("../utils/response/serverResponse");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const activityLogsController = require("../controller/activityLoggerController");
const encryptDecrypt = require("../utils/decryptor/encrypt_decrypt");
const helpers = require("../utils/helper/general_helper");
const otp = require("../services/sms/otp");

let registration = {
  signUp: async (req, res) => {
    try {
      const { name, email, mobile_number, password } = req.body;
      const encryptedPassword = enc_dec.cjs_encrypt(password);
      const created_at = moment().format("YYYY-MM-DD HH:mm:SS");
      const existingUser = await registrationModel.selectOne("id", { email });
      if (existingUser && existingUser.length > 0) {
        return res
          .status(StatusCode.ok)
          .send(serverResponse.AlreadyExist(email));
      }

      const user = {
        name,
        email,
        mobile_number,
        password: encryptedPassword,
        created_at: created_at,
      };
      await registrationModel.add(user);

      const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);
      activityLogsController.activityLogs(
        req.body.email,
        "Registration",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      res.status(StatusCode.ok).send(
        serverResponse.successMessage("User signup successfully...", {
          accessToken,
        })
      );
      console.log(accessToken);
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "Registration",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  loginWithPassword: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await registrationModel.selectOne("*", { email });
      if (!user) {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found."));
      }

      const decryptedPassword = enc_dec.cjs_decrypt(user.password);
      if (password !== decryptedPassword) {
        return res
          .status(StatusCode.unauthorized)
          .send(serverResponse.errorMessage("Invalid password."));
      }

      const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);
      res.status(StatusCode.ok).send(serverResponse.loginSuccess(accessToken));
    } catch (error) {
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  generate_otp: async (req, res) => {
    try {
      const { mobile_number } = req.body;
      const user = await registrationModel.selectOne("*", { mobile_number });
      if (!user) {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("Mobile number not registered."));
      }
      otp();
      res
        .status(StatusCode.ok)
        .send(serverResponse.successMessage(`OTP sent to ${mobile_number}.`));
    } catch (error) {
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  verify_otp: async (req, res) => { 
    try {
      await otp();
    }
    catch(error){

    }
  },
  detail: async (req, res) => {
    let email = await req.body.email;
    registrationModel
      .selectOne("id,name,email,status", { email: email })
      .then((result) => {
        let send_res = [];
        let val = result;
        let res1 = {
          id: enc_dec.cjs_encrypt(val.id),
          email: val.email,
          name: val.name,
          status: val.status ? "Deactivated" : "Active",
        };
        send_res = res1;

        res
          .status(StatusCode.ok)
          .send(
            serverResponse.successDataMessage(
              send_res,
              "Details fetched successfully..."
            )
          );
      })
      .catch((error) => {
        res
          .status(StatusCode.internalError)
          .send(serverResponse.errorMessage(error.message));
      });
  },
  list: async (req, res) => {
    try {
      let limit = {
        perpage: 0,
        offset: 0,
      };
      if (req.body.perpage && req.body.page) {
        limit.perpage = parseInt(req.body.perpage);
        limit.offset = parseInt(req.body.page) - 1;
        limit.offset *= limit.perpage;
      }

      let filter_arr = { deleted: 0 };

      if (req.body.status == "Active") {
        filter_arr.status = 0;
      }
      if (req.body.status == "Deactivated") {
        filter_arr.status = 1;
      }

      let total_count = await registrationModel.get_count(filter_arr);

      if (limit.perpage > 0 && limit.offset >= total_count) {
        limit.offset = Math.floor(total_count / limit.perpage) * limit.perpage;
      }

      let result = await registrationModel.select(filter_arr, limit);
      let send_res = [];
      result.forEach((val, key) => {
        let res = {
          id: enc_dec.cjs_encrypt(val.id),
          name: val.name,
          email: val.email,
          created_at: val.created_at,
          status: val.status == 1 ? "Deactivated" : "Active",
        };
        send_res.push(res);
      });

      let response = serverResponse.successDataMessage(
        send_res,
        "List fetched successfully...",
        total_count
      );
      res.status(StatusCode.ok).send(response);
    } catch (error) {
      console.log(error);
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  delete: async (req, res) => {
    try {
      let email = await req.body.email;
      let insdata = {
        deleted: 1,
      };

      const user = await registrationModel.selectOne("*", { email });
      if (!user || typeof user.deleted == "undefined") {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found..."));
      }

      $ins_id = await registrationModel.updateDetails(
        { email: email },
        insdata
      );
      activityLogsController.activityLogs(
        req.body.email,
        "Delete",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      res
        .status(StatusCode.ok)
        .send(serverResponse.successMessage("User deleted successfully..."));
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "Delete",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  deactivate: async (req, res) => {
    try {
      const email = req.body.email;
      const insdata = {
        status: 1,
      };

      const user = await registrationModel.selectOne("*", { email });
      if (!user || typeof user.deleted == "undefined") {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found..."));
      }

      const ins_id = await registrationModel.updateDetails(
        { email: email },
        insdata
      );
      activityLogsController.activityLogs(
        req.body.email,
        "Deactivate",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      return res
        .status(StatusCode.ok)
        .send(
          serverResponse.successMessage("User deactivated successfully...")
        );
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "Deactivate",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      return res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  activate: async (req, res) => {
    try {
      let email = await req.body.email;
      let insdata = {
        status: 0,
      };

      const user = await registrationModel.selectOne("*", { email });
      if (!user || typeof user.deleted == "undefined") {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found..."));
      }

      $ins_id = await registrationModel.updateDetails(
        { email: email },
        insdata
      );
      activityLogsController.activityLogs(
        req.body.email,
        "Activate",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      res
        .status(StatusCode.ok)
        .send(serverResponse.successMessage("User activated successfully..."));
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "Activate",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  update: async (req, res) => {
    try {
      let email = await req.body.email;
      let name = req.body.name;

      let insdata = {
        name: name,
      };

      const user = await registrationModel.selectOne("*", { email });
      if (!user || typeof user.deleted == "undefined") {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found..."));
      }

      $ins_id = await registrationModel.updateDetails(
        { email: email },
        insdata
      );
      activityLogsController.activityLogs(
        req.body.email,
        "Update",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      res
        .status(StatusCode.ok)
        .send(serverResponse.successMessage("User updated successfully..."));
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "Update",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  logout: (req, res) => {
    try {
      res.clearCookie("accessToken");
      return res
        .status(StatusCode.ok)
        .send(serverResponse.successMessage("User logged out successfully..."));
    } catch (error) {
      console.log(error);
      return res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await registrationModel.selectOne("*", { email });
      if (!user) {
        return res
          .status(StatusCode.notFound)
          .send(serverResponse.errorMessage("User not found..."));
      }

      // Generate password reset token
      const resetToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      console.log(resetToken);

      // Send password reset email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: "Password Reset Request",
        html: `
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}">Reset Password</a>
          <p>If you did not request a password reset, please ignore this email.</p>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Password reset email failed: ${error}`);
          return res
            .status(StatusCode.internalError)
            .send(
              serverResponse.errorMessage("Password reset email failed...")
            );
        } else {
          activityLogsController.activityLogs(
            req.body.email,
            "forgot Password",
            JSON.stringify(req.body),
            null,
            "SUCCESS"
          );
          console.log(`Password reset email sent: ${info.response}`);
          return res
            .status(StatusCode.ok)
            .send(
              serverResponse.successMessage(
                `Password reset email sent to: ${email}, and the reset token is: ${resetToken}`
              )
            );
        }
      });
    } catch (error) {
      activityLogsController.activityLogs(
        req.body.email,
        "forgot Password",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      console.log(error);
      return res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { resetToken, password, confirmPassword } = req.body;

      if (password != confirmPassword) {
        return res
          .status(StatusCode.badRequest)
          .send(serverResponse.errorMessage("Passwords do not match"));
      }

      const decodedToken = jwt.verify(
        resetToken,
        process.env.ACCESS_TOKEN_SECRET
      );
      const email = decodedToken.email;

      const encryptedPassword = enc_dec.cjs_encrypt(password);

      const result = await registrationModel.updateDetails(
        { email },
        { password: encryptedPassword }
      );
      if (result.affectedRows == 0) {
        return res
          .status(StatusCode.internalError)
          .send(serverResponse.errorMessage("Password reset failed..."));
      }

      // Send email to user
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: "Password Reset Successful",
        text: `Your password has been successfully reset.`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      activityLogsController.activityLogs(
        email,
        "Reset Password",
        JSON.stringify(req.body),
        null,
        "SUCCESS"
      );
      return res
        .status(StatusCode.ok)
        .send(
          serverResponse.successMessage(
            `Password reset successful for email: ${email}`
          )
        );
    } catch (error) {
      activityLogsController.activityLogs(
        email,
        "Reset Password",
        JSON.stringify(req.body),
        JSON.stringify(error),
        "ERROR"
      );
      console.log(error);
      return res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
  password: async (req, res) => {
    let userId = await enc_dec.cjs_decrypt(req.body.id);
    registrationModel
      .selectOne("password", { id: userId, deleted: 0 })
      .then(async (result) => {
        let sendRes = [];
        let val = result;
        let res1 = {
          encryptedPassword: await enc_dec.cjs_encrypt(val.password),
          decryptedPassword: await enc_dec.cjs_decrypt(val.password),
        };
        sendRes = res1;

        res
          .status(StatusCode.ok)
          .send(
            serverResponse.successDataMessage(
              sendRes,
              "Password fetched successfully."
            )
          );
      })
      .catch((error) => {
        res
          .status(StatusCode.internalError)
          .send(serverResponse.errorMessage(error.message));
      });
  },
};

module.exports = registration;





























// const registrationModel = require("../models/registration");
// const otpModel = require('../models/otp');
// const enc_dec = require("../utils/decryptor/decryptor");
// const StatusCode = require("../utils/statuscode/statusCode");
// const serverResponse = require("../utils/response/serverResponse");
// const moment = require("moment");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const activityLogsController = require("../controller/activityLoggerController");
// const encryptDecrypt = require("../utils/decryptor/encrypt_decrypt");
// const helpers = require("../utils/helper/general_helper");
// const otp = require("../services/sms/otp");

// let registration = {


//   generate_otp: async (req, res) => {
//     try {
//       const { mobile_number } = req.body;
//       const user = await registrationModel.selectOne("*", { mobile_number });
//       if (!user) {
//         return res
//          .status(StatusCode.notFound)
//          .send(serverResponse.errorMessage("Mobile number not registered."));
//       }
//       const otp = await otpModel.sendOtp();
//       await otpModel.add({ mobile_number, otp });
//       res
//        .status(StatusCode.ok)
//        .send(serverResponse.successMessage(`OTP sent to ${mobile_number}.`));
//     } catch (error) {
//       res
//        .status(StatusCode.internalError)
//        .send(serverResponse.errorMessage(error.message));
//     }
//   },

//   verify_otp: async (req, res) => { 
//     try {
//       await otp();
//     }
//     catch(error){

//     }
//   },


// };

// module.exports = registration;
