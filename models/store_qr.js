const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper');
const qr_validation = require('../utilities/validations/qr_validation');
const dbtable = config.table_prefix + 'store_qrs';
var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (condition, amount, amount_condition, limit,date_condition) => {
        let qb = await pool.get_connection();
        let response;
        if (limit.perpage) {
            await qb.select('*');
            qb.where(condition);
            if (amount != 0 && amount_condition != '') {
                qb.where('amount ' + amount_condition, amount)
            }
            if(date_condition?.from_date && date_condition?.to_date){
                qb.where('created_at >=', date_condition?.from_date);
                qb.where('created_at <=', date_condition?.to_date)
            }
            qb.order_by('id','desc')
            qb.limit(limit.perpage, limit.start);
            response = qb.get(dbtable);
            qb.release();
        } else {
            await qb.select('*')
            qb.where(condition)
            if (amount != 0 && amount_condition != '') {
                qb.where('amount ' + amount_condition, amount)
            }
            if(date_condition?.from_date && date_condition?.to_date){
                qb.where('created_at >=', date_condition?.from_date);
                qb.where('created_at <=', date_condition?.to_date)
            }
            qb.order_by('id','desc')
            response = qb.get(dbtable);
            qb.release();
        }
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
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        return response[0];
    },
    selectUserDetails: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        return response[0];
    },
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable);
        qb.release();
        return response;
    },
    get_count: async (condition_obj,amount, amount_condition, limit,date_condition) => {
       
        let qb = await pool.get_connection();
        let condition = await helpers.get_and_conditional_string(condition_obj);
        let query = "select count('id') as count from " + dbtable + " where " + condition + '';
        if(amount!=0 && amount_condition!=''){
            query += (amount_condition=='<' || amount_condition=='>'?' and amount '+amount_condition:' and amount =')+' '+amount;
        }
        if(date_condition?.from_date && date_condition?.to_date){
            query += ' and created_at >= '+date_condition?.from_date+' and '+' created_at <= '+date_condition?.to_date;
        }
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;