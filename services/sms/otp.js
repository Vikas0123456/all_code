const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);
const otpModel = require('../../models/otp');
const moment = require("moment");

const sendOtp = (req, res, next) => {
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
};

module.exports = sendOtp;







// const twilio = require("twilio");
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
// const client = twilio(accountSid, authToken);

// const sendOtp = (req, res, next) => {
//   // Generate a random 8-digit OTP
//   const otp = Math.floor(1000 + Math.random() * 9000);

//   // Send the OTP via SMS
//   client.messages
//     .create({
//       body: `${otp} is your One Time Password (OTP) for mobile number verification to login into laxmi chit fund. Do not share this code with anyone. If not requested, please contact +91 7999 75 6235`,
//       from: twilioPhoneNumber,
//       to: "+917999756235",
//     })
//     .then((message) => {
//       console.log(`OTP sent to ${+917999756235}`);
//       // next();
//     })
//     .catch((error) => {
//       console.log(error);
//       next(error);
//     });

//   return otp;
// };

// module.exports = sendOtp;
