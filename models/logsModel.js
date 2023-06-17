const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'admin_logs';
const helpers = require('../utilities/helper/general_helper')
var dbModel = {
   
    select: async (and_condition,search_condition,date_condition,limit) => {
        let qb = await pool.get_connection();
        let response;
        
        let final_cond = " where ";
        if(Object.keys(and_condition).length ){
            let condition = await helpers.get_and_conditional_string(and_condition);
             final_cond = final_cond + condition;
        }
        if(Object.keys(search_condition).length ){
            let or_condition = await helpers.get_conditional_or_like_string(search_condition);
            if(final_cond == " where "){
                final_cond = final_cond + " (" + or_condition + ")";
             }else{
                final_cond = final_cond + "and (" + or_condition + ")";
             }
             
        }
        if(Object.keys(date_condition).length ){
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date,date_condition.to_date,"added_at");
            if(final_cond == " where "){
                final_cond = final_cond + date_condition_str;
             }else{
                final_cond = final_cond + " and " + date_condition_str;
             }
             
        }
      
        if(final_cond == " where "){
            final_cond = ""
        }
        
        let query = "select * from "+dbtable+final_cond+" order BY ID DESC limit "+ limit.start + "," + limit.perpage
        response = await qb
        .query(query);
 
        console.log(query);
            qb.release();
        return response;
    },
    get_count: async (and_condition,search_condition,date_condition) => {
        let qb = await pool.get_connection();
        let response;
        

        let final_cond = " where ";
        if(Object.keys(and_condition).length ){
            let condition = await helpers.get_and_conditional_string(and_condition);
             final_cond = final_cond + condition;
        }
        if(Object.keys(search_condition).length ){
            let or_condition = await helpers.get_conditional_or_like_string(search_condition);
            if(final_cond == " where "){
                final_cond = final_cond + " (" + or_condition + ")";
             }else{
                final_cond = final_cond + "and (" + or_condition + ")";
             }
             
        }
        if(Object.keys(date_condition).length ){
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date,date_condition.to_date,"added_at");
            if(final_cond == " where "){
                final_cond = final_cond + date_condition_str;
             }else{
                final_cond = final_cond + " and " + date_condition_str;
             }
             
        }
    
        if(final_cond == " where "){
            final_cond = ""
        }
        
        let query = "select count('id') as count from "+dbtable+final_cond
        response = await qb
        .query(query);
      
            qb.release();
        
        return response[0].count;
    },
}
module.exports = dbModel;