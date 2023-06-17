const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')
const admin_table = config.table_prefix + 'adm_user';
const merchant_table = config.table_prefix + 'master_super_merchant';
const merchant_password_reset_table = config.table_prefix + "master_merchant_password_reset";
const admin_password_reset_table = config.table_prefix + "admin_reset_password";

var dbModel = {
    selectMerchantList: async (days) => {
        let qb = await pool.get_connection();
        response = await qb
            .query('select id,name,email,company_name from ' + merchant_table + ' where last_password_updated == (NOW() - INTERVAL '+days+' DAY)')
        qb.release();
        return response;
    },
    selectAdminList: async (days) => {
        let qb = await pool.get_connection();
        response = await qb
            .query('select id,name,email from ' + admin_table + ' where last_password_updated == (NOW() - INTERVAL '+days+' DAY)')
        qb.release();
        return response;
    },
    addMerchantPasswordReset: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.insert(merchant_password_reset_table, data);
        qb.release();
        console.log(qb.last_query());
        return response;
    },
    updateMerchantPasswordExpire:async(data,condition)=>{
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(merchant_table);
        qb.release();
        console.log(qb.last_query());
        return response;
    },
    addAdminPasswordReset: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.insert(admin_password_reset_table, data);
        qb.release();
        console.log(qb.last_query());
        return response;
    },
    updateAdminPasswordExpire:async(data,condition)=>{
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(admin_table);
        qb.release();
        console.log(qb.last_query());
        return response;
    },

}
module.exports = dbModel;