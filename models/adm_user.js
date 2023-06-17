const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'adm_user';
const reset_table = config.table_prefix + 'admin_reset_password'
const admin_password_table = config.table_prefix + 'adm_last_passwords'
const MasterMerchantTable = config.table_prefix + 'master_merchant'
const helpers = require('../utilities/helper/general_helper')

var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    addResetPassword: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(reset_table, data);
        qb.release();
        return response;
    },
    select_password_reset: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('admin_id')
            .where(condition)
            .get(reset_table);
        qb.release();
        return response[0];
    },
    select: async (condition_obj, filter, limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        let response;
        if (limit.perpage) {
            if (filter.name != "") {
                response = await qb
                    .query("select * from " + dbtable + " where " + condition + " and (" + search_text + ") LIMIT " + limit.perpage + limit.start);
            } else {
                response = await qb
                    .select('*')
                    .where(condition).order_by('name', 'asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
            }
            qb.release();
        }
        else {
            if (filter.name != "") {
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
    updateResetPassword: async (condition, data) => {

    },
    get_count: async (condition_obj, filter) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        let search_text = await helpers.get_conditional_or_like_string(filter);
        if (filter.name != '') {
            response = await qb
                .query("select count('id') as count from " + dbtable + " where " + condition + "and (" + search_text + ")");
        } else {
            response = await qb
                .query("select count('id') as count from " + dbtable + " where " + condition);
        }
        qb.release();
        return response[0].count;
    },
    add_token_check: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + "password_token_check", data);
        qb.release();
        return response;
    },

    delete_token: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.delete(config.table_prefix + "password_token_check", data)
        qb.release();
        return response;
    },
    updateResetPassword: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(reset_table);
        qb.release();
        return response;
    },
    addAdminResetPassword: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + 'admin_reset_password', data);
        qb.release();
        return response;
    },
    add_password: async (data) => {
        console.log(data);
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(admin_password_table, data);
        qb.release();
        return response;
    },

    delete_user_by_EMail: async (email) => {
        let qb = await pool.get_connection();
        let response = await qb.query("DELETE FROM pg_adm_user WHERE email = '" + email + "'");
        qb.release();
        return response;
    },


    get_password_data: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(admin_password_table);
        qb.release();
        console.log(qb.last_query());
        return response[0];
    },

    get_form_commaseperated: async (type) => {
        let qb = await pool.get_connection();
        let response = await qb
            .query(`SELECT * FROM pg_adm_user WHERE FIND_IN_SET('${type}', role);`);
        qb.release();
        return response;
    },

    checkcomplianceuser : async (user) => {
        let qb = await pool.get_connection();
        let response = await qb
            .query(`SELECT * FROM pg_adm_user WHERE (FIND_IN_SET('cm_01', role) OR FIND_IN_SET('cm_02', role)) AND id = ${user}`);
        qb.release();
        return response;
    },

    get_username: async (condition, selection) => {
        const qb = await pool.get_connection();
        const response = await qb.query(`SELECT pg_adm_user.name  FROM pg_adm_user LEFT JOIN pg_master_merchant  ON pg_master_merchant.super_merchant_id = pg_adm_user.id WHERE  pg_master_merchant.id = ${condition}`);
        console.log(response);
        return response[0];
    }

}
module.exports = dbModel;