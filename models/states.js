const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'states';
const helpers = require('../utilities/helper/general_helper')
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
         
                if(filter.state_name !=''){
                    response = await qb
                    .select('*')
                    .where(condition).like(filter).order_by('state_name','asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
                }else{
                    response = await qb
                    .select('*')
                    .where(condition).order_by('state_name','asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
                }
                console.log(qb.last_query())
            qb.release();
        }else{
                if(filter.state_name !=''){
                    response = await qb
                    .select('*')
                    .where(condition).like(filter).order_by('state_name','asc').get(dbtable);
                }else{
                    response = await qb
                    .select('*')
                    .where(condition).order_by('state_name','asc')
                    .get(dbtable);
                }
              console.log(qb.last_query())
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
    get_count: async (condition_obj,search_state) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        if(search_state.state_name !=''){
            let state_condition = await helpers.get_conditional_like_string(search_state);
            response = await qb
            .query("select count('id') as count from "+dbtable+" where " + condition + state_condition );
        }else{
        response = await qb
        .query("select count('id') as count from "+dbtable+" where "+condition);
        }
            qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;