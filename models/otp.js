const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
const helpers = require("../utils/helper/general_helper");
const dbtable = config.table_prefix + "otp";
const crypto = require('crypto');
const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);
const moment = require("moment");

let otpModel = {
  add: async (data) => {
    let qb = await pool.get_connection();
    let response = await qb.returning("id").insert(dbtable, data);
    qb.release();
    return response;
  },
  select: async (condition, limit) => {
    let qb = await pool.get_connection();
    let response;
    if (limit.perpage) {
      response = await qb
        .select("*")
        .where(condition)
        .order_by("email", "asc")
        .limit(limit.perpage, limit.start)
        .get(dbtable);
      qb.release();
    } else {
      response = await qb
        .select("*")
        .where(condition)
        .order_by("email", "asc")
        .get(dbtable);
      qb.release();
    }
    return response;
  },
  selectOne: async (selection, condition) => {
    let qb = await pool.get_connection();
    response = await qb
      .select(selection)
      .where(condition)
      .order_by("mobile_number", "asc")
      .get(dbtable);
    qb.release();
    return response[0];
  },
  updateDetails: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb.set(data).where(condition).update(dbtable);
    qb.release();
    return response;
  },
  get_count: async (condition_obj) => {
    let qb = await pool.get_connection();
    let condition = await helpers.get_conditional_string(condition_obj);
    response = await qb.query(
      "select count('id') as count from " + dbtable + " where " + condition
    );
    qb.release();
    return response[0].count;
  },
  updatePassword: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb.set(data).where(condition).update(dbtable);
    qb.release();

    return response;
  },
  select2fa: async (condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select("t.token,t.merchant_id,t.created_at,m.code,m.mobile_no")
      .from(two_fa_table + " t")
      .join(super_merchant_table + " m", "t.merchant_id=m.id", "inner")
      .where(condition)
      .get();
    qb.release();
    return response[0];
  },
  select2faWithOtp: async (condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select(
        "t.otp,t.ref_no,t.token,t.merchant_id,t.created_at,m.code,m.mobile_no"
      )
      .from(two_fa_table + " t")
      .join(super_merchant_table + " m", "t.merchant_id=m.id", "inner")
      .where(condition)
      .get();
    qb.release();
    return response[0];
  },
  update2fa: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb.set(data).where(condition).update(two_fa_table);
    qb.release();
    return response;
  },
  generateOtp: () => {
    const otp = crypto.randomInt(10000000, 99999999);
    return otp.toString();
  },

sendOtp: (req, res, next) => {
    // Generate a random 8-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    const otp_generated_at = moment().format("YYYY-MM-DD HH:mm:SS");
  
    // Send the OTP via SMS
    client.messages
      .create({
        body: `${otp} is your One Time Password (OTP) for mobile number verification to login into laxmi chit fund. Do not share this code with anyone. If not requested, please contact +91 7999 75 6235`,
        from: twilioPhoneNumber,
        to: "+917999756235",
      })
      .then((message) => {
        console.log(`OTP sent to ${+917999756235}`);
        const user = {
          mobile_number: "+917999756235",
          otp,
          otp_generated_at,
        };
        otpModel.add(user);
      })
     .catch((error) => {
        console.log(error);
        next(error);
      });
  
    return otp;
  },

  isOtpValid: async ({ mobile_number, otp }) => {
    const userOtp = await otpModel.selectOne("*", { mobile_number });
    if (!userOtp) {
      return false;
    }
    const validOtp = userOtp.otp;
    return otp === validOtp;
  },
};
module.exports = otpModel;
