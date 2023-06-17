const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')
const dbtable = config.table_prefix + 'store_qr_images';
const dbtable_config = config.table_prefix + 'store_configs';

var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (condition, limit) => {
        let qb = await pool.get_connection();
        let response;
        if (limit.perpage) {
            response = await qb
                .select('*')
                .where(condition).limit(limit.perpage, limit.start)
                .order_by('id', 'desc')
                .get(dbtable);
            qb.release();
        } else {
            response = await qb
                .select('*')
                .where(condition)
                .order_by('id', 'desc')
                .get(dbtable);
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
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_like_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + dbtable + " where deleted = 0 " + condition + '');
        qb.release();
        return response[0].count;
    },
    selectOneConfig: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable_config);
        qb.release();
        return response[0];
    },
    updateConfigDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable_config);
        qb.release();
        return response;
    },
    addConfig: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable_config, data);
        qb.release();
        return response;
    },
    selectConfig: async (condition, limit) => {
        let qb = await pool.get_connection();
        let response;
        if (limit.perpage) {
            response = await qb
                .select('*')
                .where(condition).limit(limit.perpage, limit.start)
                .order_by('id', 'desc')
                .get(dbtable_config);
            qb.release();
        } else {
            response = await qb
                .select('*')
                .where(condition)
                .order_by('id', 'desc')
                .get(dbtable_config);
            qb.release();
        }
        return response;
    },
    get_count_config: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_like_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + dbtable_config + " where deleted = 0 " + condition + '');
        qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;