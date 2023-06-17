const card_variant = require("../models/card_variant")
const protector = require("../utilities/decryptor/decryptor")
const ServerResponse = require("../utilities/response/ServerResponse")
const statusCode = require("../utilities/statuscode")
cardMaster = require('../models/cardMasterModel')
const cardVariantMaster = {
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
        card_id = protector.cjs_decrypt(req.bodyString('card_id'))
        card_variant.selectAll("*",{card_id : card_id, deleted: 0}, limit).then(async (result) => {
            let res_data = []
            let card_name = await cardMaster.selectOne("card", {id: card_id})
            for(val of result ){
                let resp = {
                    variant_id : await protector.cjs_encrypt(val.id),
                    card_id: await protector.cjs_encrypt(val.card_id),
                    card: card_name.card,
                    variant: val.variant
                }
                res_data.push(resp)
            }
            let count = await card_variant.get_count({card_id : card_id, deleted: 0})
            res.status(statusCode.ok).send(ServerResponse.successdatamsg(res_data, "card variant list fetched successfully", count))
        })
        .catch(error=> {
            console.log(error);
            res.status(statusCode.internalError).send(ServerResponse.errormsg(error.message))
        })
    }catch(err){
        res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
    }

    }
}

module.exports = cardVariantMaster