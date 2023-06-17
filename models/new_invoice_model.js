const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const helpers = require('../utilities/helper/general_helper')
const inv_master = config.table_prefix + 'invoice_master';
const inv_items = config.table_prefix + 'invoice_items';
const inv_totals = config.table_prefix + 'invoice_totals';
const dbtable_config = config.table_prefix + 'invoice_configs'

const new_invoice_model = {
    add : async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(inv_master, data);
        qb.release();
        return response;
    },

    itemAdd: async (data,table_name) => {
        let qb = await pool.get_connection()
        let response
        for(let item of data){
            response = await qb.returning('id').insert(config.table_prefix + table_name, item)
        }
        qb.release()
        return response;
    },
    select: async(selection, condition, table)=> {
        let qb = await pool.get_connection()
        let condition_str = await helpers.get_and_conditional_string(condition)
        let response
        if(table == "invoice_master"){
            response = await qb.select(selection).where(condition_str).order_by('title','asc').get(config.table_prefix + table)
        }else{
            response = await qb.select(selection).where(condition_str).get(config.table_prefix + table)
        }
        qb.release()
        return response
    },

    updateDetails: async (condition,data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(inv_master);
        qb.release();
        return response;
    },

    selectList: async (andCondition, dateCondition,limit,table) => {
        let qb = await pool.get_connection();
        let response;
    
        let finalCondition = '';
        if (Object.keys(andCondition).length) {
          let condition = await helpers.get_and_conditional_string(andCondition);
          finalCondition = ' where ' + condition;
        }
    
        if (Object.keys(dateCondition).length) {
          let dateConditionStr = await helpers.get_date_between_condition(dateCondition.from_date, dateCondition.to_date, 'added_date');
          finalCondition += (finalCondition !== '')?' AND '+dateConditionStr:' where '+dateConditionStr;
        }
    
        let query = 'select * from ' + inv_master + finalCondition + ' order BY updated_at DESC limit ' + limit.start + ',' + limit.perpage;
        response = await qb
          .query(query);
        qb.release();   
        return response;
      },

      get_count: async (andCondition, dateCondition) => {
        let qb = await pool.get_connection();
        let response;
    
        let finalCondition = '';
        if (Object.keys(andCondition).length) {
          let condition = await helpers.get_and_conditional_string(andCondition);
          finalCondition = ' where ' + condition;
        }
    
        if (Object.keys(dateCondition).length) {
          let dateConditionStr = await helpers.get_date_between_condition(dateCondition.from_date, dateCondition.to_date, 'added_date');
    
          finalCondition += (finalCondition !== '')?' AND '+dateConditionStr:' where '+dateConditionStr;
        }
        let query = 'select count(id) as count from ' + inv_master + finalCondition;
        response = await qb
          .query(query);
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

}

module.exports = new_invoice_model