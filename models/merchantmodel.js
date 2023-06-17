const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'master_merchant';
const super_merchant_table = config.table_prefix + 'master_super_merchant';
const merchant_details = config.table_prefix + 'master_merchant_details';
const merchant_key_and_secret = config.table_prefix + 'master_merchant_key_and_secret';
const helpers = require('../utilities/helper/general_helper')

var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select1: async (condition_obj, filter, limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        let response;
        if (limit.perpage) {
            if (Object.keys(filter).length) {
                response = await qb
                    .query("select * from " + dbtable + " where " + condition + " and (" + search_text + ") LIMIT " + limit.perpage + limit.start);
            } else {

                response = await qb
                    .select('*')
                    .where(condition).order_by('name', 'asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
            }
            qb.release();
        } else {
            if (Object.keys(filter).length) {
                response = await qb
                    .query("select * from " + dbtable + " where " + condition + " and (" + search_text + ")");
            } else {
                response = await qb
                    .select('*')
                    .where(condition).order_by('name', 'asc')
                    .get(dbtable);
            }
            qb.release();
        }

        return response;
    },
    select: async (condition_obj, filter, limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_join_conditional_string(condition_obj);
        let response;

        let select = "s.super_merchant_id,s.id,m.company_name,m.merchant_id,s.mobile_no"

        response = await qb
            .query("select " + select + " from " + dbtable + " s INNER JOIN " + merchant_details + " m ON s.id=m.merchant_id where " + condition + "and m.company_name!=''");


        qb.release();

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

    selectOneSuperMerchant: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(super_merchant_table);
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
    updatePassword: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(super_merchant_table);
        qb.release();
       
        return response;
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
    get_count: async (condition_obj, filter) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        let search_text = await helpers.get_conditional_or_like_string(filter);
        if (Object.keys(filter).length) {
            response = await qb
                .query("select count('id') as count from " + dbtable + " where " + condition + "and (" + search_text + ")");
        } else {
            response = await qb
                .query("select count('id') as count from " + dbtable + " where " + condition);
        }
        qb.release();
        return response[0].count;
    },

    get_sub_merchant_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);

        response = await qb
            .query("select count('id') as count from " + dbtable + " where super_merchant != 0 and  " + condition);

        qb.release();
        return response[0].count;
    },
    get_sub_merchant_count_by_merchant: async (condition_obj, search_date) => {
    
        let qb = await pool.get_connection();
        // if (!search_date){
            response = await qb
                .query("select count('id') as count from " + dbtable + " where   " + condition_obj);
        // }
        // else {
        //     let date_condition_str = await helpers.get_date_between_condition(search_date.from_date, search_date.to_date, "register_at");
        //     final_cond = condition_obj + " and " + date_condition_str;
        //     response = await qb.query("select count('id') as count from " + dbtable + " where   " + condition_obj + ' and ' + date_condition_str)
           
        // }
      
        qb.release();
        return response[0].count;
    },

    main_merchant_details: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("mm.id,mm.super_merchant_id,mm.email,md.company_name,mm.mode")
            .from(config.table_prefix + "master_merchant mm")
            .join(config.table_prefix + "master_merchant_details md", "mm.id=md.merchant_id", "left")
            .where(condition).order_by('mm.id', 'asc').limit(1)
            .get();
        qb.release();
        return response[0];
    },

    add_key: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchant_key_and_secret, data);
        qb.release();
        return response;
    },
    get_merchant_key_and_secret: async(selection,mer_id) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where({'merchant_id':mer_id}).get(merchant_key_and_secret)
        qb.release();
        return response;
    },
    addTempCustomer: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + 'customer_temp', data);
        qb.release();
        return response;
    },
    selectCustomerDetails: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix + 'customer_temp');
        qb.release();
        return response[0];
    },
    addCustomer: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + 'customers', data);
        qb.release();
        return response;
    },
    updateCustomerTempToken: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(config.table_prefix + 'customer_temp');
        qb.release();
        return response;
    },
    selectOneDynamic: async (selection, condition,table) => {
        let table_name = config.table_prefix+table;
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(table_name);
        qb.release();
        return response[0];
    },
    selectOneDynamicWithJoin: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .from(config.table_prefix+'master_merchant_details md')
            .join(config.table_prefix+'master_merchant mm', 'md.merchant_id=mm.id', 'inner')
            .where(condition)
            .get();
        qb.release();
        return response[0];
    },
    updateDynamic: async (condition, data,table) => {
        let table_name = config.table_prefix+table;
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(table_name);
        qb.release();
       
        return response;
    },
    getAllActivatedMerchant: async () =>{
        let qb = await pool.get_connection();
        response = await qb
            .query("select GROUP_CONCAT(mm.id SEPARATOR ',') as ids from "+dbtable+" mm WHERE ekyc_done = 2 and activation_date != '0000-00-00'");
        qb.release();
        return response[0].ids;
    }
}
module.exports = dbModel;