const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'master_merchant';
const merchant_details = config.table_prefix + 'master_merchant_details';
const merchant_psp = config.table_prefix + 'merchant_psp_status';
const merchant_key_and_secret = config.table_prefix + 'master_merchant_key_and_secret';
const mid_dbtable = config.table_prefix + 'mid';
const onboarding_logs_table = config.table_prefix + 'onboarding_logs';
const helpers = require('../utilities/helper/general_helper')

var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    add_key: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchant_key_and_secret, data);
        qb.release();
        return response;
    },
    add_merchant_details: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchant_details, data);
        qb.release();
        return response;
    },
    add_mid: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(mid_dbtable, data);
        qb.release();
        return response;
    },
    update_mid: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(mid_dbtable);
        qb.release();
        return response;
    },
    delete_mid: async (data_id,submerchant_id) => {
     
        let qb = await pool.get_connection();
        response = await qb
        .query("delete from "+mid_dbtable+" where id="+data_id);
        qb.release();
        return response;
    },
    selectOneMID: async (selection, condition) => {

        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(mid_dbtable);
        qb.release();
        return response; 
    },
    selectdata: async (condition) => {
        let qb = await pool.get_connection();
        let response = qb.where({'s.id':condition,'s.deleted':0,'m.deleted':0}).select('m.id,m.submerchant_id,m.currency_id,m.psp_id,m.MID').from(dbtable +' s')
        .join(mid_dbtable + ' m', 's.id=m.submerchant_id')
        .get();

        qb.release();
        return response;
    },
    selectKeyData: async (condition) => {
        let qb = await pool.get_connection();
        let response = qb.where({'s.id':condition,'s.deleted':0}).select('m.id,m.type,m.merchant_id,m.merchant_key,m.merchant_secret,m.created_at').from(dbtable +' s')
        .join(merchant_key_and_secret + ' m', 's.id=m.merchant_id')
        .get();

        qb.release();
        return response;
    },
    select: async (condition_obj,limit,like_condition_arr) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_and_conditional_string(condition_obj);

        let and = "", response, query;
        let final_cond = " where "
        for (let likeCondition of like_condition_arr) {
            let or_condition = await helpers.get_conditional_or_like_string(likeCondition);
             final_cond = final_cond + and + " (" + or_condition + " )";
            if (and == ""){ and = " and ";}
          }

        if(condition){
            condition = and+condition;
        }

        let select = "s.super_merchant_id,s.id,s.store_id,s.ekyc_done,s.onboarding_done,s.ekyc_required,s.psp_mail_send,s.status,s.live,s.video_kyc_done,s.name,s.email,s.mobile_no,m.register_business_country,m.settlement_currency,m.settlement_currency,m.transaction_currencies,m.payout_method,m.payout_currency,m.company_name,m.fin_name,m.fin_email,m.fin_mobile,m.tech_name,m.tech_email,m.tech_mobile,m.poc_name,m.poc_email,m.poc_mobile,m.bank_currency,m.bank_name,m.branch_name,m.home_address_line_1,m.home_address_line_2,m.home_phone_number,m.personal_id_number,m.legal_person_first_name,m.legal_person_last_name,m.legal_person_email,m.address_line1,m.address_line2,m.business_phone_number,m.register_business_country,m.vat_number,m.type_of_business,m.company_name,m.business_phone_number,m.legal_person_email,m.company_registration_number,m.merchant_id,m.payment_status,s.ekyc_stage,m.payment_date"
        
        if(limit.perpage){
            query= "select " + select+" from "+dbtable+ " s LEFT JOIN "+ merchant_details +" m ON s.id=m.merchant_id  " + final_cond+ " " +condition+ " order BY s.id DESC LIMIT " + limit.start +","+ limit.perpage
           
            response = await qb
                .query(query);
           
            qb.release();
        }else{
            query= "select " + select+" from "+dbtable+ " s LEFT JOIN "+ merchant_details +" m ON s.id=m.merchant_id  " + final_cond +" "+ condition+ " order BY s.id DESC  " 
           
            response = await qb
                .query(query);
       
            qb.release();
        }

        console.log(query);
        return response;
    },
    selectSpecific: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        return response;
    },
    
    selectOneDetails: async (condition) => {
        let qb = await pool.get_connection();
       let response =await  qb.where(condition).select('id,merchant_id,company_name,payout_fee').from(merchant_details).get();
        qb.release();
        return response[0];
    },
    selectpspList: async (condition) => {
        let qb = await pool.get_connection();
       let response =await  qb.where(condition).select('id,merchant_id,psp_id,status').from(merchant_psp).get();
        qb.release();
        return response;
    },
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
           
        qb.release();

        return response[0];
    },
    selectUserDetails: async (selection,condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        return response[0];
    },
    update_merchant: async (condition,data) => {
  
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable);
        qb.release();
        return response;
    },
    updateDetails: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(merchant_details);
        qb.release();
        return response;
    },
    get_count: async (condition_obj,filter) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        let search_text = await helpers.get_conditional_or_like_string(filter);
        if(Object.keys(filter).length){
            response = await qb
            .query("select count('id') as count from "+dbtable+" where "+condition +"and (" + search_text + ")");
        }else{
        response = await qb
        .query("select count('id') as count from "+dbtable+" where "+condition);
        }
            qb.release();
        return response[0].count;
    },

    get_sub_merchant_count: async (condition_obj,like_condition_arr) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_and_conditional_string(condition_obj);

        let and = "", response, query;
        let final_cond = " where "
        for (let likeCondition of like_condition_arr) {
            let or_condition = await helpers.get_conditional_or_like_string(likeCondition);
             final_cond = final_cond + and + " (" + or_condition + " )";
            if (and == ""){ and = " and ";}
          }

        if(condition){
            condition = and+condition;
        }

        let select = " count(s.id) as count "

        query= "select " + select+" from "+dbtable+ " s LEFT JOIN "+ merchant_details +" m ON s.id=m.merchant_id  " + final_cond +" "+ condition
       
        response = await qb
             .query(query);
            qb.release();
        return response[0].count;
    },
    get_mid_count: async (condition_obj,data_id) => {
     
        let condition = await helpers.get_conditional_string(condition_obj);
        let qb = await pool.get_connection();
        response = await qb
        .query("select count('id') as count from "+mid_dbtable+" where id !="+data_id+" and  "+ condition);
        qb.release();
      
        return response[0].count;
    },
    fetchCurrencyName:async(currency_id)=>{
        let qb = await pool.get_connection();
        let response = await qb
            .select('code')
            .where({id:currency_id})
            .get(config.table_prefix+'master_currency');
        qb.release();
        return response[0];
    },
    selectmidList: async (condition) => {
        let qb = await pool.get_connection();
       let response =await  qb.where(condition).select('*').from(mid_dbtable).order_by('id', 'desc').get();
        qb.release();
        return response;
    },
    getOneMerchantDetails: async (select,condition) => {
        let qb = await pool.get_connection();
        response = await qb.where(condition).select(select).from(dbtable +' s')
        .join(merchant_details + ' m', 's.id=m.merchant_id','LEFT').get();
        qb.release();
        return response[0];
    },

    getOnboardingCompletionStatus: async (submerchantIds) => {
        if(!submerchantIds[0]){ return {};}
        let qb = await pool.get_connection();
        response = await qb
        .query("SELECT count(DISTINCT(sub_section)) as count,submerchant_id, GROUP_CONCAT(sub_section) as sub_section,GROUP_CONCAT(section) as section FROM "
        +onboarding_logs_table+" WHERE submerchant_id IN("+submerchantIds.join()+") GROUP BY submerchant_id;");
        qb.release();
        
        if (response) {
            var result = {}
            response.map(function(entity) {
                result[entity.submerchant_id]=entity;
            });
            return result;
        } else {
            return {};
        }
    },

    joinlistmdm: async () => {
        let qb = await pool.get_connection();
        let response = qb.query("SELECT * FROM pg_master_merchant_details LEFT JOIN pg_master_merchant ON pg_master_merchant.id = pg_master_merchant_details.merchant_id  WHERE pg_master_merchant.ekyc_done = 1 AND pg_master_merchant_details.payment_status = 1 ;")
        qb.release();
        return response;
    },
    
}
module.exports = dbModel;