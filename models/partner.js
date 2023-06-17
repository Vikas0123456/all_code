const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'master_partners';
const helpers = require('../utilities/helper/general_helper')

var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (condition_obj,filter,limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        let response;
        if(limit.perpage){
            if(Object.keys(filter).length){
                response = await qb
                .query("select * from "+dbtable+" where "+ condition +" and ("+search_text +") LIMIT " + limit.perpage + limit.start );
            }else{
            response = await qb
                .select('*')
                .where(condition).order_by('name','asc').limit(limit.perpage, limit.start)
                .get(dbtable);
            }
            qb.release();
        }else{
            if(Object.keys(filter).length){
                response = await qb
                .query("select * from "+dbtable+" where "+ condition +" and ("+search_text +")");
            }else{
            response = await qb
                .select('*')
                .where(condition).order_by('name','asc')
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
    updateDetails: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable);
        qb.release();
        return response;
    },
    get_count: async (condition_obj,filter) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        let search_text = await helpers.get_conditional_or_like_string(filter);
        if(Object.keys(filter).length){
            response = await qb
            .query("select count('id') as count from "+dbtable+" where "+condition +"and (" + search_text + ")");
        }else{
            response = await qb.query("select count('id') as count from "+dbtable+" where "+condition);
        }
            qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;