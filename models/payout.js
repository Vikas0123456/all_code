const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')
const payout_master = config.table_prefix + 'payout_master';
const payout_details = config.table_prefix + 'payout_details';
const master_merchant = config.table_prefix + 'master_merchant';
const master_merchant_details = config.table_prefix + 'master_merchant_details';
const orders = config.table_prefix+'orders';
const order_txn  = config.table_prefix+'order_txn';
var dbModel = {
    selectMerchantList: async (condition, filter, limit) => {
        let qb = await pool.get_connection();
        response = await qb
            .select('mm.id as merchant_id,mm.super_merchant_id,md.company_name,mm.email,md.settlement_currency as payout_currency,md.bank_name,md.account_no,md.swift,md.iban,md.interval_days,md.next_payout_date')
            .from(master_merchant + ' mm')
            .join(master_merchant_details + ' md', 'mm.id=md.merchant_id', 'inner')
            .where({ 'mm.onboarding_done': 1, 'mm.video_kyc_done': 1, 'mm.ekyc_done': 2, 'mm.deleted': 0, 'mm.status': 1 }).order_by('mm.id', 'asc')
            .get();
        qb.release();
        return response;
    },
    findLastPayoutDate:async(merchant_id)=>{
        let qb = await pool.get_connection();
        response = await qb
            .select('created_at')
            .from(payout_details)
            .where({merchant_id:merchant_id}).order_by('id', 'desc')
            .limit(1)
            .get();
        qb.release();
        return response[0];
    },
    totalSettlementCalculate:async(merchant_id)=>{
        let qb = await pool.get_connection();
        response = await qb
            .select_sum('txn.amount')
            .from(orders+' ord')
            .join(order_txn+' txn','ord.order_id=txn.order_id','INNER')
            .where({'ord.merchant_id':merchant_id,'ord.is_settled':0,'txn.type':'SALE','txn.status':'APPROVED'})
            .get();
        qb.release();
        console.log(qb.last_query());
        return response[0].amount?response[0].amount:0;
    },
    totalRefundedCalculate:async(merchant_id)=>{
        let qb = await pool.get_connection();
        response = await qb
            .select_sum('txn.amount')
            .from(orders+' ord')
            .join(order_txn+' txn','ord.order_id=txn.order_id','INNER')
            .where({'ord.merchant_id':merchant_id,'ord.is_settled':0,'txn.type':'REFUND','txn.status':'APPROVED'})
            .get();
        qb.release();
        console.log(qb.last_query());
        return response[0].amount?response[0].amount:0;
    },
    addPayout: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(payout_master, data);
        qb.release();
        return response;
    },
    addPayoutDetails:async(data)=>{
            let qb = await pool.get_connection();
            let response = await qb.insert(payout_details, data);
            qb.release();
            console.log(qb.last_query())
            return response;
    },
    updateDetails: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(orders);
        qb.release();
        return response;
    },
    selectMaster: async (date_condition,limit) => {
        let final_cond = " where ";
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "payout_date");
                final_cond = final_cond + " and " + date_condition_str;
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        console.log(limit);
        let query = "select * from " + payout_master + final_cond + " order BY id DESC limit " + limit.start + "," + limit.perpage
        let qb = await pool.get_connection();
        response = await qb
            .query(query);
        qb.release();
        return response;
     },
     master_count:async(date_condition)=>{
        let final_cond = " where ";
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
                final_cond = final_cond + " and " + date_condition_str;
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        let query = "select count(id) as count from " + payout_master + final_cond + "";
        let qb = await pool.get_connection();
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
     },
     selectList:async(and_condition, date_condition,limit,payout_id)=>{
        let qb = await pool.get_connection();
        let response;
        let final_cond = " where payout_id <> ''";
        if(payout_id!=''){
            final_cond = " where payout_id = '"+payout_id+"'";
        }
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " and " + condition;
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
                final_cond = final_cond + " and " + date_condition_str;
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        let query = "select * from " + payout_details + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage
        response = await qb
            .query(query);
        qb.release();
        return response;
     },
     selectListCount:async(and_condition,date_condition,payout_id)=>{
        let qb = await pool.get_connection();
        let response;
        let final_cond = " where payout_id <> ''";
        if(payout_id!=''){
            final_cond = " where payout_id = '"+payout_id+"'";
        }
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " and " + condition;
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
                final_cond = final_cond + " and " + date_condition_str;
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        let query = "select count(id) as count from " + payout_details + final_cond + ""
        response = await qb
            .query(query);
           
        qb.release();
        return response[0].count;
     }
}   
module.exports = dbModel;