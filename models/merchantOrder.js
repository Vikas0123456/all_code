const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')

var merchantOrderModel = {
    add: async (data,mode) => {
        let db_table='';
        if(mode=='test'){
            db_table = config.table_prefix + 'orders_test';
        }else{
            db_table = config.table_prefix + 'orders';
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(db_table, data);
        qb.release();
        return response;
    },
    selectOne: async (selection, condition,table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix+table);
        qb.release();
        return response[0];
    },
    selectDynamic: async (selection, condition,table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix+table);
        qb.release();
        return response;
    },
    addDynamic:async(data,table_name) => {
        let db_table= config.table_prefix+table_name;
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(db_table, data);
        qb.release();
        return response;
    },
    updateDynamic:async(data,condition,table_name)=>{
        let db_table= config.table_prefix+table_name;
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(db_table);
        qb.release();
        return response;
    },

    monthlyTxnSum:async(merchant_id,date,table_name)=>{
        let db_table= config.table_prefix+table_name;
        let query = "SELECT SUM(amount) as amount FROM "+db_table+" WHERE merchant_id = "+merchant_id+" AND MONTH(created_at) = MONTH('"+date+"') AND YEAR(created_at) = YEAR("+date+") AND status = 'AUTHORISED'";
        let qb = await pool.get_connection();
        let response = await qb.query(query);
        qb.release();
        return response[0]?.amount?response[0].amount:0;
    },
    selectDynamicONE: async (selection, condition,table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix+table);
        qb.release();
        console.log(qb.last_query())
        return response[0];
    },
    get_count: async (condition_obj,table_name) => {
        let db_table= config.table_prefix+table_name;
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + db_table + " where " + condition);
        qb.release();
        console.log("select count('id') as count from " + db_table + " where " + condition);
        return response[0].count;
    },
    selectSubsData: async (paymentlink_id) => {
        let qb = await pool.get_connection();
        let response = await qb
        .select('sp.id,sm.emails,s.subscription_id,sp.plan_name,sp.payment_interval,sp.plan_billing_frequency,sp.plan_billing_amount,sp.plan_description,sp.terms,sp.final_payment_amount,sp.initial_payment_amount,sp.start_date,sp.plan_currency,md.super_merchant_id,md.id as merchant_id,mcc.id as mcc_id,mcc_cat.id as mcc_cat_id')
        .from(config.table_prefix + 'subs_plan_mail sm')
        .join(config.table_prefix+"subs_plans sp",'sm.plan_id=sp.id','inner')
        .join(config.table_prefix+"subscription s",'sm.token=s.payment_id','inner')
        .join(config.table_prefix+"master_merchant md",'sm.merchant_id=md.super_merchant_id','inner')
        .join(config.table_prefix+"master_merchant_details mde","sm.id=mde.merchant_id","left")
        .join(config.table_prefix+"mcc_codes mcc","mde.mcc_codes=mcc.id","left")
        .join(config.table_prefix+"master_mcc_category mcc_cat","mcc.category=mcc_cat.id","left")
        .where({'sm.token':paymentlink_id,'sp.deleted':0,'s.status':0})
        .get();
      
        qb.release();
        return response[0];
    }
}   
module.exports = merchantOrderModel;