const enc_dec = require("../utilities/decryptor/decryptor")
const MerchantModel = require("../models/merchantmodel")
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse")

const MerchantKeyAndSecret = {
    details: async (req, res) => {
        let merchant_id  = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"))
        MerchantModel.get_merchant_key_and_secret('*',merchant_id).then(data => {
            let send_res = []
            data && data.forEach(val => {
                send_res.push({
                    merchant_id:merchant_id,
                    type:val.type,
                    merchant_key:val.merchant_key,
                    merchant_secret:val.merchant_secret
                })
            })
            res.status(statusCode.ok).send(response.successdatamsg(send_res,'Merchant Key and Secret fetched successfully.'));
        }).catch((error) => {
            console.log(error)
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        });

    } 
}

module.exports = MerchantKeyAndSecret;