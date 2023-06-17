const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const db_table = config.table_prefix + 'master_merchant';
const super_merchant_table = config.table_prefix + 'master_super_merchant';
const details_table = config.table_prefix +'master_merchant_details';
const reset_table = config.table_prefix+'master_merchant_password_reset';
const two_fa_table = config.table_prefix+'twofa_authenticator';
const merchant_password_table = config.table_prefix+"merchant_last_passwords";
const tc_accepted = config.table_prefix+'tc_accepted';
const helpers = require('../utilities/helper/general_helper')
var MerchantRegistrationModel = {
    register: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(super_merchant_table, data);
        qb.release();
        return response;
    },
    addDetails: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(details_table, data);
        qb.release();
        return response;
    },
    addTC: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(tc_accepted, data);
        qb.release();
        return response;
    },
    addResetPassword: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(reset_table, data);
        qb.release();
        return response;
    },
    select: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('merchant_id')
            .where(condition)
            .get(reset_table);
        qb.release();
        return response[0];
    }, 
    selectWithSelection: async (selection,condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(super_merchant_table);
        qb.release();
        return response[0];
    }, 
    update: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(db_table);
        qb.release();
        return response;
    },
    update_super_merchant: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(super_merchant_table);
        qb.release();
        return response;
    },
    updateResetPassword:async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(reset_table);
        qb.release();
        return response;
    },
    add_two_fa:async(data)=>{
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(two_fa_table, data);
        qb.release();
        return response;
    },
    select2fa: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('t.token,t.merchant_id,t.created_at,m.code,m.mobile_no')
            .from(two_fa_table+' t')
            .join(super_merchant_table+' m','t.merchant_id=m.id','inner')
            .where(condition)
            .get();
        qb.release();
        return response[0];
    },
    select2faWithOtp: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('t.otp,t.ref_no,t.token,t.merchant_id,t.created_at,m.code,m.mobile_no')
            .from(two_fa_table+' t')
            .join(super_merchant_table+' m','t.merchant_id=m.id','inner')
            .where(condition)
            .get();
        qb.release();
        return response[0];
    },
    update2fa: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(two_fa_table);
        qb.release();
        return response;
    },
    add_password:async(data)=>{
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchant_password_table, data);
        qb.release();
        return response;
    }, 
}
module.exports = MerchantRegistrationModel;