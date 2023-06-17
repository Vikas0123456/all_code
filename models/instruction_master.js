const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'instruction_master';
const helpers = require('../utilities/helper/general_helper')

const instruction_master = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    }, 

    update : async (condition, data ) => {
        let qb = await pool.get_connection();
        let response  = await  qb.set(data).where(condition).update(dbtable);
        qb.release();
        return response;
    },

    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
                .select(selection)
                .where(condition)
                .get(dbtable);
            qb.release();
        return response[0];
    },
    select: async (limit) => {
        let qb = await pool.get_connection();
        let response;
        if(limit.perpage){
            response = await qb
                .select('*')
                .order_by('language','asc').limit(limit.perpage, limit.start)
                .get(dbtable);
            qb.release();
        }else{
            response = await qb
                .select('*')
                .order_by('langauge','asc')
                .get(dbtable);
            qb.release();
        }
        return response;
    },

    get_count: async () => {
        let qb = await pool.get_connection();
        // let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
        .query("select count('id') as count from "+dbtable);
            qb.release();
        return response[0].count;
    },

}

module.exports = instruction_master;