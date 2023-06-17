const wallet_master = require("../models/wallet_master")
const protector = require("../utilities/decryptor/decryptor")
const ServerResponse = require("../utilities/response/ServerResponse")
const statusCode = require("../utilities/statuscode")

const walletMaster = {

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
            wallet_master.selectAll({deleted: 0},limit).then( async (result) => {
                let res_data = []
                for(val of result) {
                    let resp = {
                        wallet_id: protector.cjs_encrypt(val.id),
                        wallet: val.wallet
                    }
                    res_data.push(resp)
                }
                let count = await  wallet_master.get_count({deleted: 0})
                res.status(statusCode.ok).send(ServerResponse.successdatamsg(res_data, "Wallet list fetched successfully", count))
            })
            .catch((err) => {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
            })
        }catch(err){
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    }
}

module.exports = walletMaster