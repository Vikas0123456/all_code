const PricingModel = require("../models/pricingModel");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
const admin_activity_logger = require('../utilities/activity-logger/admin_activity_logger');

var Pricing = {
    add: async(req, res) => {
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let name = req.bodyString("plan_name");
        let from_amount = req.bodyString("from_amount");
        let to_amount = req.bodyString("to_amount");
        let monthly_fee = req.bodyString("monthly_fee");
        let percentage_value = req.bodyString("percentage_value");
        let fixed_amount = req.bodyString("fixed_amount");
        let feature = req.bodyString("feature");

        let ins_body  ={
            name,
            from_amount,
            to_amount,
            monthly_fee,
            percentage_value,
            fixed_amount,
            feature,
            added_at,
        }
        PricingModel.add(ins_body).then((result) => {
            let module_and_user = {
                user:req.user.id,
                admin_type:req.user.type,
                module:'Settings',
                sub_module:'Pricing Plan'
            }
            let added_name = req.bodyString('name');
            let headers = req.headers;
            admin_activity_logger.add(module_and_user,added_name,headers).then((result)=>{
                res.status(statusCode.ok).send(response.successmsg('Pricing Plan Added successfully.'));
            }).catch((error)=>{
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
        }).catch((error) => {
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
        
       
        PricingModel.select(limit)
            .then(async (result) => {
               
                let send_res = [];
                result.forEach(function(val,key) {
                    
                  
                    let res = {
                        pricing_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        plan_name:val.name,
                        plan_from_amount:val.from_amount.toFixed(2),
                        plan_to_amount:val.to_amount.toFixed(2),
                        plan_monthly_fee:val.monthly_fee,
                        plan_percentage_value:val.percentage_value,
                        plan_fixed_amount:val.fixed_amount.toFixed(2),
                        features:val.feature
                       
                    };
                    send_res.push(res);
                });
                total_count = await PricingModel.get_count()
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'List fetched successfully.',total_count));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    get: async(req, res) => {
        let pricing_plan_id = await enc_dec.cjs_decrypt(req.bodyString("pricing_plan_id"));
        PricingModel.selectOne('*',{ id:pricing_plan_id })
            .then((result) => {
              let send_res = [];
                let val = result
                    let res1 = {
                        pricing_id: val.id,
                        enc_id: enc_dec.cjs_encrypt(val.id),
                        plan_name:val.name,
                        plan_from_amount:val.from_amount.toFixed(2),
                        plan_to_amount:val.to_amount.toFixed(2),
                        plan_monthly_fee:val.monthly_fee,
                        plan_percentage_value:val.percentage_value,
                        plan_fixed_amount:val.fixed_amount.toFixed(2),
                        features:val.feature,
                        status:(val.status==1)?"Deactivated":"Active",
                    };
                    send_res = res1;
               

                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    update: async (req, res) => {
        try {
            
             let plan_id = await enc_dec.cjs_decrypt(req.bodyString("id"));
             let name = req.bodyString("name");
             let from_amount = req.bodyString("from_amount");
             let to_amount = req.bodyString("to_amount");
             let monthly_fee = req.bodyString("monthly_fee");
             let percentage_value = req.bodyString("percentage_value");
             let fixed_amount = req.bodyString("fixed_amount");
             let feature = req.bodyString("feature");

             let insData  ={
                name,
                from_amount,
                to_amount,
                monthly_fee,
                percentage_value,
                fixed_amount,
                feature,
            }

            
            $ins_id = await PricingModel.updateDetails({id:plan_id},insData);
            let module_and_user = {
                user:req.user.id,
                admin_type:req.user.type,
                module:'Settings',
                sub_module:'Pricing Plan'
            }
            let headers = req.headers;
            admin_activity_logger.edit(module_and_user,plan_id,headers).then((result)=>{
                res.status(statusCode.ok).send(response.successmsg('Pricing Plan updated successfully'));
            }).catch((error)=>{
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
           
        } catch(error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    deactivate: async (req, res) => {
        try {
            
             let designation_id = await enc_dec.cjs_decrypt(req.bodyString("designation_id"));
            var insdata = {
                'status':1
            };

            
            $ins_id = await PricingModel.updateDetails({id:designation_id},insdata);
            let module_and_user = {
                user:req.user.id,
                admin_type:req.user.type,
                module:'Users',
                sub_module:'Designation'
            }
            let headers = req.headers;
            admin_activity_logger.deactivate(module_and_user,designation_id,headers).then((result)=>{
                res.status(statusCode.ok).send(response.successmsg('Designation deactivated successfully'));
            }).catch((error)=>{
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
        } catch(error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    activate: async (req, res) => {
        try {
            
             let designation_id = await enc_dec.cjs_decrypt(req.bodyString("designation_id"));
            var insdata = {
                'status':0
            };

            
            $ins_id = await PricingModel.updateDetails({id:designation_id},insdata);
            let module_and_user = {
                user:req.user.id,
                admin_type:req.user.type,
                module:'Users',
                sub_module:'Designation'
            }
            let headers = req.headers;
            admin_activity_logger.activate(module_and_user,designation_id,headers).then((result)=>{
                res.status(statusCode.ok).send(response.successmsg('Designation activated successfully'));
            }).catch((error)=>{
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
        } catch(error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    delete: async (req, res) => {
        try {
            
             let designation_id = await enc_dec.cjs_decrypt(req.bodyString("designation_id"));
            var insdata = {
                'deleted':1
            };

            
            $ins_id = await PricingModel.updateDetails({id:designation_id},insdata);
            let module_and_user = {
                user:req.user.id,
                admin_type:req.user.type,
                module:'Users',
                sub_module:'Designation'
            }
            let headers = req.headers;
            admin_activity_logger.delete(module_and_user,designation_id,headers).then((result)=>{
                res.status(statusCode.ok).send(response.successmsg('Designation deleted successfully'));
            }).catch((error)=>{
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            })
        } catch(error){
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

}
module.exports = Pricing;