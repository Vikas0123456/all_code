const payment_mode = require("../models/payment_mode")
const protector = require("../utilities/decryptor/decryptor")
const ServerResponse = require("../utilities/response/ServerResponse")
const statusCode = require("../utilities/statuscode")

const paymentMode = {

    list: async (req,res) => {
        try{
            let limit = {
                perpage: 0,
                page: 0
            }
            if(req.bodyString('perpage') && req.bodyString('page')){
                perpage =parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))
    
                limit.perpage = perpage
                limit.start = ((start-1)*perpage)
            }
            payment_mode.selectAll({deleted: 0},limit).then( async (result) => {
                let res_data = []
                for(val of result) {
                    let resp = {
                        payment_mode_id: protector.cjs_encrypt(val.id),
                        payment_mode: val.payment_mode
                    }
                    res_data.push(resp)
                }
                let count = await payment_mode.get_count({deleted: 0})
                res.status(statusCode.ok).send(ServerResponse.successdatamsg(res_data, "payment mode list fetched successfully", count))
            })
            .catch((err) => {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
            })
        }catch(err){
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    }
}

module.exports = paymentMode