const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const enc_dec = require("../utilities/decryptor/decryptor")
const MerchantModel = require("../models/merchantmodel");
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const helpers = require("../utilities/helper/general_helper")
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
const moment = require('moment');

var data_set = {
    add: async (req, res) => {
        
        try {
            let country_id = await enc_dec.cjs_decrypt(req.bodyString("country_id"));
            let hashPassword = await encrypt_decrypt('encrypt',req.bodyString("password"));
            let username = await encrypt_decrypt('encrypt',req.bodyString("username"));
            
            userData = {
                merchant_name: req.bodyString("merchant_name"),
                partner_id: req.user.id,
                business_name: req.bodyString("business_name"),
                pg_mid: req.bodyString("api_key"),
                pg_merchant_key: req.bodyString("merchant_key"),
                currency: req.bodyString("currency"),
                username: username,
                password: hashPassword,
                business_email: req.bodyString("email"),
                mobile_code: req.bodyString("country_code"),
                business_contact: req.bodyString("mobile_no"),
                country: country_id,
                business_address: req.bodyString("business_address"),
                added_by: req.user.id,
                added_date: new Date().toJSON().substring(0, 19).replace('T', ' '),
                ip:await helpers.get_ip(req),
            };

           
            if(req.bodyString("state")){
                userData.state = req.bodyString("state");
            }
            if(req.bodyString("city")){
                userData.city = req.bodyString("city");
            }
            if(req.bodyString("zipcode")){
                userData.zipcode = req.bodyString("zipcode");
            }
            
            ins_id = await MerchantModel.add(userData);
            res.status(statusCode.ok).send(response.successmsg('Merchant registered successfully'));
        } catch(error) {
            console.log(error)
            res.status(statusCode.internalError).send(response.errormsg(error));
        }
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
        const search_text = req.bodyString('search');
        const status = await helpers.get_status(req.bodyString('status'));
        const country = await helpers.get_country_id_by_name(req.bodyString('country'));
        const state = `'${req.bodyString('state')}'`;
        const city =`'${req.bodyString('city')}'`;
        const search = { "deleted": 0 }
        const filter = {}
        if (req.bodyString('country')) { search.country = country }
        if (req.bodyString('city')) { search.city = city }
        if (req.bodyString('state')) { search.state = state }
        if (req.bodyString('status')) { search.status = status }
        if (search_text) { filter.name = search_text;
            filter.email= search_text;            
            filter.mobile_no = search_text;
        }
       
        MerchantModel.select(search,filter,limit)
            .then(async (result) => {
                let send_res = [];
                for (let val of result){
                    let res = {
                        merchant_id: enc_dec.cjs_encrypt(val.id),
                        super_merchant:enc_dec.cjs_encrypt(val.super_merchant_id),
                        merchant_name : val.company_name,
                        email:val.email,
                        country_code:val.code,
                        mobile_no:val.mobile_no,
                        status:(val.status==1)?"Deactivated":"Active",
                       
                    };
                    send_res.push(res);
                };

                total_count = await MerchantModel.get_count(search,filter)
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'List fetched successfully.',total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },

    filter_list: async(req, res) => {
        let search = { "deleted": 0,"super_merchant":0 }
        if(req.user.type == 'partner'){
            if(req.user.id)
            {search.partner_id=req.user.id}
        }else if(req.user.type == 'admin'){
            if(req.bodyString('partner_id')){
                search.partner_id= await encrypt_decrypt('decrypt',req.bodyString('partner_id'))
            }
        }
        
        MerchantModel.selectSpecific("id,merchant_name",search)
            .then(async (result) => {
                
                let send_res = [];
                for (let val of result) {
                    let res = {
                        id: await encrypt_decrypt('encrypt',val.id),
                        merchant_name: val.merchant_name
                    };
                    send_res.push(res);
                };
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'List fetched successfully.'));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    details: async(req, res) => {
        let rec_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
        MerchantModel.selectOne("*",{ id:rec_id,deleted:0 })
            .then(async (result) => {
                
              let send_res = [];
                let val = result
                    let resp = {
                        
                        merchant_id: enc_dec.cjs_encrypt(val.id),
                        merchant_name: val.merchant_name,
                        api_key: val.pg_mid,
                        merchant_name : await helpers.get_merchant_name_by_id(val.id ),
                        merchant_key: val.pg_merchant_key,
                        business_name:val.business_name,
                        username:await encrypt_decrypt('decrypt',val.username),
                        email:val.business_email,
                        currency: val.currency,
                        country_code:val.mobile_code,
                        mobile_no:val.business_contact,
                        country_id:  enc_dec.cjs_encrypt(val.country),
                        country_name:  await helpers.get_country_name_by_id(val.country),
                        business_address: val.business_address,
                        state: val.state,
                        city: val.city,
                        zipcode: val.zipcode,
                        status:(val.status==1)?"Deactivated":"Active",
                        blocked_status:(val.is_blocked==1)?"Blocked":"Active",
                    };
                    send_res = resp;
               

                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    update: async (req, res) => {
        try {
            
            let data_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            let country_id = await enc_dec.cjs_decrypt(req.bodyString("country_id"));
            
            let username = await encrypt_decrypt('encrypt',req.bodyString("username"));

            userData = {
                merchant_name: req.bodyString("merchant_name"),
                
                business_name: req.bodyString("business_name"),
                pg_mid: req.bodyString("api_key"),
                pg_merchant_key: req.bodyString("merchant_key"),
                currency: req.bodyString("currency"),
                username: username,
                business_email: req.bodyString("email"),
                mobile_code: req.bodyString("country_code"),
                business_contact: req.bodyString("mobile_no"),
                country: country_id,
                business_address: req.bodyString("business_address"),
            };

            
            if(req.bodyString("password")){
                userData.password = await encrypt_decrypt('encrypt',req.bodyString("password"));
            }
            if(req.bodyString("state")){
                userData.state = req.bodyString("state");
            }
            if(req.bodyString("city")){
                userData.city = req.bodyString("city");
            }
            if(req.bodyString("zipcode")){
                userData.zipcode = req.bodyString("zipcode");
            }

            $ins_id = await MerchantModel.updateDetails({id:data_id},userData);
            res.status(statusCode.ok).send(response.successmsg('Merchant updated successfully'));
           
        } catch(error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

    deactivate: async (req, res) => {
        try {
            
             let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            var insdata = {
                'status':1
            };

            $ins_id = await MerchantModel.updateDetails({id:user_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant deactivated successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    activate: async (req, res) => {
        try {
            
             let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            var insdata = {
                'status':0
            };

            
            $ins_id = await MerchantModel.updateDetails({id:user_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant activated successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    delete: async (req, res) => {
        try {
            
             let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            var insdata = {
                'deleted':1
            };

            
            $ins_id = await MerchantModel.updateDetails({id:user_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant deleted successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    blocked: async (req, res) => {
        try {
            
             let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            var insdata = {
                'is_blocked':1
            };

            
            $ins_id = await MerchantModel.updateDetails({id:user_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant blocked successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    unblocked: async (req, res) => {
        try {
            
             let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
            var insdata = {
                'is_blocked':0
            };

            
            $ins_id = await MerchantModel.updateDetails({id:user_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant unblocked successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    password: async(req, res) => {
        let user_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
        MerchantModel.selectOne("password",{ id:user_id,deleted:0 })
            .then(async (result) => {
                
              let send_res = [];
                let val = result
                    let res1 = {
                        password:await encrypt_decrypt('decrypt',val.password),
                    };
                    send_res = res1;
               

                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Password fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    branding_update: async (req, res) => {
        try {
        
            let merchant_id = req.user.id;
         
            insdata = {
                use_logo: req.bodyString("use_logo_instead_icon"),
                brand_color: req.bodyString("brand_color"),
                accent_color: req.bodyString("accent_color"),
            };
            if(req.all_files){
                if(req.all_files.icon){
                    insdata.icon=req.all_files.icon
                }
                if(req.all_files.logo){
                    insdata.logo=req.all_files.logo
                }
             
            }
            $ins_id = await MerchantModel.updateDetails({id:merchant_id},insdata);
            res.status(statusCode.ok).send(response.successmsg('Merchant branding updated successfully'));
           
        } catch(error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },
    branding_details: async(req, res) => {
      
        let merchant_id = req.user.id;
        MerchantModel.selectOne("*",{ id:merchant_id,deleted:0 })
            .then(async (result) => {
              let send_res = [];
                let val = result
                    let resp = {   
                        merchant_id: enc_dec.cjs_encrypt(val.id),
                        merchant_name: val.merchant_name,
                        icon:server_addr+':'+port+"/static/files/"+val.icon,
                        logo:server_addr+':'+port+"/static/files/"+val.logo,
                        use_logo_instead_icon:val.use_logo,
                        brand_color:val.brand_color,
                        accent_color:val.accent_color
                    };
                    send_res = resp;
               

                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    store_get: async(req, res) => {
        let rec_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
        MerchantModel.selectOneDynamicWithJoin("md.authorised_url,md.decline_url,md.cancelled_url,md.enable_refund,md.enable_partial_refund,md.payout_currency,md.payout_method,md.interval_days,md.next_payout_date,md.min_payout_amount,md.max_payout_amount,md.payout_fee,md.free_payout_from,md.max_per_txn_limit,md.high_risk_txn_limit,md.rolling_reserve_limit,md.mcc_codes,mm.status",{ 'md.merchant_id':rec_id})
            .then(async (result) => {
              let send_res = [];
                let val = result
                
                    let resp = {
                        authorised_url:val.authorised_url,
                        decline_url:val.decline_url,
                        cancelled_url:val.cancelled_url,
                        enable_refund:val.enable_refund,
                        enable_partial_refund:val.enable_partial_refund,
                        payout_currency:val.payout_currency,
                        payout_method:val.payout_method?val.payout_method:"TELR Payout",
                        interval_days:val.interval_days,
                        next_payout_date:val.next_payout_date=='0000-00-00'?moment().format('YYYY-MM-DD'):moment(val.next_payout_date).format('YYYY-MM-DD'),
                        min_payout_amount:val.min_payout_amount,
                        max_payout_amount:val.max_payout_amount,
                        payout_fee:val.payout_fee,
                        free_payout_from:val.free_payout_from,
                        max_per_txn_limit:val.max_per_txn_limit,
                        high_risk_txn_limit:val.high_risk_txn_limit,
                        rolling_reserve_limit:val.rolling_reserve_limit,
                        status:val.status,
                        mcc:enc_dec.cjs_encrypt(val.mcc_codes)
                    };
                    send_res = resp;
                res.status(statusCode.ok).send(response.successdatamsg(send_res,'Details fetched successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    store_update: async(req, res) => {
        let rec_id = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
        let resp = {
            authorised_url:req.bodyString('authorised_url'),
            decline_url:req.bodyString('decline_url'),
            cancelled_url:req.bodyString('cancelled_url'),
            enable_refund:req.bodyString('enable_refund'),
            enable_partial_refund:req.bodyString('enable_partial_refund'),
            payout_currency:req.bodyString('payout_currency'),
            payout_method:req.bodyString('payout_method'),
            interval_days:req.bodyString('interval_days'),
            next_payout_date:moment(req.bodyString('next_payout_date')).format('YYYY-MM-DD'),
            min_payout_amount:req.bodyString('min_payout_amount'),
            max_payout_amount:req.bodyString('max_payout_amount'),
            payout_fee:req.bodyString('payout_fee'),
            free_payout_from:req.bodyString('free_payout_from'),
            max_per_txn_limit:req.bodyString('max_per_txn_limit'),
            high_risk_txn_limit:req.bodyString('high_risk_txn_limit'),
            rolling_reserve_limit:req.bodyString('rolling_reserve_limit'),
            mcc_codes:enc_dec.cjs_decrypt(req.bodyString('mcc'))
        };
        
        MerchantModel.updateDynamic({ merchant_id:rec_id},resp,'master_merchant_details')
            .then(async (result) => {
                await MerchantModel.updateDynamic({id:rec_id},{status:req.bodyString("store_status")},'master_merchant')
                res.status(statusCode.ok).send(response.successmsg('Store Details updated successfully.'));
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
}
module.exports = data_set;