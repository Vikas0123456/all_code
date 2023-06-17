const webhook_settings = require("../models/webhook_settings");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
const SequenceUUID = require('sequential-uuid');
const uuid = require("uuid");
const { errorMsg } = require("../utilities/response/ServerResponse");


const webHook = {
    get: async (req, res) => {
        try {
            const uuid = new SequenceUUID({
                valid: true,
                dashes: false,
                unsafeBuffer: true
            })
            let token = uuid.generate();

            res.status(statusCode.ok).send(response.successdatamsg(token, 'New Notification secret generted'))
        } catch (error) {
            res.status(statusCode.badRequest).send(response.errormsg(error.message))
        }
    },

    add_update: async  (req,res) => {
        try{
            let merchant_id = req.user.id
            let enabled = req.bodyString('enabled')
            let notification_url = req.bodyString('notification_url')
            let notification_secret = req.bodyString('notification_secret')

            let merchant = await webhook_settings.selectOne('*', {merchant_id: merchant_id})
            if(merchant){
                var insdata = {
                    enabled: enabled,
                    merchant_id: merchant_id,
                    notification_secret: notification_secret,
                    notification_url: notification_url,
                };
                $ins_id = await webhook_settings.updateDetails({id:merchant.id},insdata);
                res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
            }else{
                let ins_body  ={
                    enabled: enabled,
                    merchant_id: merchant_id,
                    notification_secret: notification_secret,
                    notification_url: notification_url,
                }
                webhook_settings.add(ins_body).then((result) => {
                    res.status(statusCode.ok).send(response.successmsg('Added successfully.'));
                }).catch((error) => {
                    res.status(statusCode.badRequest).send(response.errormsg(error.message));
                });
            }
        }catch (error) {
            res.status(statusCode.badRequest).send(response.errormsg(error.message))
        }
    }
}

module.exports = webHook