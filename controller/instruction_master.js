const instruction_master = require("../models/instruction_master")
const protector = require("../utilities/decryptor/decryptor")
const ServerResponse = require("../utilities/response/ServerResponse")
const statusCode = require("../utilities/statuscode")

const instructionMaster = {
    add : async (req,res) => {
        try{

            let language_id = await protector.cjs_decrypt(req.bodyString('language'))
            ins_body = {
                language: language_id,
                instructions:  req.bodyString('instruction')
            }

            instruction_master.add(ins_body).then( data => {
                res.status(statusCode.ok).send(ServerResponse.successmsg("Language instructions addedd successfully"))
            })
            .catch((err)=> {
                res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
            })

        }catch(err){
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    }, 

    update: async (req,res) => {
        try{
            let language = await protector.cjs_decrypt(req.bodyString('language'))
            update_data = {
                language: language,
                instructions: req.bodyString('instruction')
            }
            instruction_master.update({language: language }, update_data ).then(resp => {
                res.status(statusCode.ok).send(ServerResponse.successmsg("Language instructions updated successfully"))
            })
            .catch(err => {
                res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
            })
        }catch(err){
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    details: async (req,res) => {
        let language_id = await protector.cjs_decrypt(req.bodyString('language'))
        let row_id  = await protector.cjs_decrypt(req.bodyString('id'))
        let condition  = {}
        if(row_id){
            condition.id = row_id
        }
        if(language_id){
            condition.language = language_id 
        }
        instruction_master.selectOne('*', condition).then(async resp => {
            let val = resp
            let resp_data = {
                instruction_id : await protector.cjs_encrypt(val.id),
                language : await protector.cjs_encrypt(val.language),
                insstructions: val.instructions
            }

            res.status(statusCode.ok).send(ServerResponse.successdatamsg(resp_data, "Details fetched successfully"))
        })
        .catch(err => {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }) 
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

        instruction_master.select(limit)
            .then(async (result) => {
               
                let send_res = [];
                result.forEach(function(val,key) {
                    let res = {
                        instruction_id: protector.cjs_encrypt(val.id),
                        language:  protector.cjs_encrypt(val.language),
                        instructions : val.instructions
                    };
                    send_res.push(res);
                });
                total_count = await instruction_master.get_count()
                
                res.status(statusCode.ok).send(ServerResponse.successdatamsg(send_res,'List fetched successfully.',total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(ServerResponse.errormsg(error.message));
            });
    },
}


module.exports = instructionMaster