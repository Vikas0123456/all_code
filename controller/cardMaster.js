const CardMasterModel = require("../models/cardMasterModel");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const enc_dec = require("../utilities/decryptor/decryptor")

var CardMaster = {
    details: async(req, res) => {
        let card_id = await enc_dec.cjs_decrypt(req.bodyString("card_id"));
        CardMasterModel.selectOne('*',{ id:card_id })
            .then((result) => {
              let send_res = [];
                let val = result
                    let res1 = {
                        card_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        card:val.card
                    };
                    send_res = res1;
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });

    },
    list: async(req, res) => {   
        let limit = {
            perpage:0,
            page:0,
        }
        if(req.bodyString('perpage') && req.bodyString('page')){
            perpage =parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start-1)*perpage)
        }
        CardMasterModel.select(limit)
            .then(async (result) => {
               
                let send_res = [];
                result.forEach(function(val,key) {
                    
                  
                    let res = {
                        card_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        card: val.card
                       
                    };
                    send_res.push(res);
                });
                total_count = await CardMasterModel.get_count()
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'List fetched successfully.',total_count));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
}
module.exports = CardMaster;