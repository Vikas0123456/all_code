const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')
const dbtable = config.table_prefix + 'country';
var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (condition,filter,limit) => {
        let qb = await pool.get_connection();
        let response;
        if(limit.perpage){
            response = await qb
                .select('*')
                .where(condition).order_by('country_code','asc').limit(limit.perpage, limit.start)
                .get(dbtable);
                if(filter.country_name !=''){
                    response = await qb
                    .select('*')
                    .where(condition).like(filter).order_by('country_code','asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
                }
            qb.release();
        }else{
            response = await qb
                .select('*')
                .where(condition).order_by('country_code','asc')
                .get(dbtable);
                if(filter.country_name!=''){
                    response = await qb
                    .select('*')
                    .where(condition).like(filter).order_by('country_code','asc').get(dbtable);
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
      
        if(filter.country_name !=''){
            let condition = await helpers.get_conditional_like_string(condition_obj);
            response = await qb
            .query("select count('id') as count from "+dbtable+" where deleted = 0 " + condition +' AND country_name LIKE "%'+filter.country_name+'%"');
        }else{
            response = await qb
            .query("select count('id') as count from "+dbtable+" where deleted = 0 ");
        }
     
            qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;