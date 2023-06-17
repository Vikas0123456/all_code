const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const tctable = config.table_prefix + 'tc';
const helpers = require('../utilities/helper/general_helper')
var dbModel = {
    addtc: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(tctable, data);
        qb.release();
        return response;
    },
    select: async (condition,limit) => {
        let qb = await pool.get_connection();
        let response;
        if(limit.perpage){
            response = await qb
                .select('*')
                .where(condition).order_by('id','asc').limit(limit.perpage, limit.start)
                .get(tctable);
            qb.release();
        }else{
            response = await qb
                .select('*')
                .where(condition).order_by('id','asc')
                .get(tctable);
            qb.release();
        }
        return response;
    },
    selectSpecific: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(tctable);
        qb.release();
        return response;
    },
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
                .select(selection)
                .where(condition).order_by('id','asc')
                .get(tctable);
            qb.release();
        return response[0];
    },
    selectOneLatest: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
                .select(selection)
                .where(condition).order_by('id','DESC')
                .get(tctable);
            qb.release();
        return response[0];
    },
    selectUserDetails: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(tctable);
        qb.release();
        return response[0];
    },
    updateDetails: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(tctable);
        qb.release();
        return response;
    },
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
        .query("select count('id') as count from "+tctable+" where "+condition);
            qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;