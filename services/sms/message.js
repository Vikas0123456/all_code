require('dotenv').config();
const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

const smsCode = (req, res, next) => {
  client.messages
    .create({
      body: 'You are forcefully registered to unknown technology!',
      from: twilioPhoneNumber,
      to: "+917999756235",
      //whenever want to send sms just remove phoneNumber and passes their actual mobile number.
    })
    .then((message) => {
      console.log('SMS sent. Message SID:', message.sid);
      next();
    })
    .catch((error) => {
      console.error('Error sending SMS:', error);
      next(error);
    });
};

module.exports = smsCode;
