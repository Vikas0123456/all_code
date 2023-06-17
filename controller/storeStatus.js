const StoreStatusModel = require("../models/storeStatusModel");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const enc_dec = require("../utilities/decryptor/decryptor")

var StoreStatus = {
    details: async(req, res) => {
        let store_status_id = await enc_dec.cjs_decrypt(req.bodyString("store_status_id"));
        StoreStatusModel.selectOne('*',{ id:store_status_id })
            .then((result) => {
              let send_res = [];
                let val = result
                    let res1 = {
                        store_status_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        status:val.status
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
        StoreStatusModel.select(limit)
            .then(async (result) => {
               
                let send_res = [];
                result.forEach(function(val,key) {
                    
                  
                    let res = {
                        store_status_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        status: val.status
                       
                    };
                    send_res.push(res);
                });
                total_count = await StoreStatusModel.get_count()
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'List fetched successfully.',total_count));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
}
module.exports = StoreStatus;