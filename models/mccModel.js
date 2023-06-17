const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
const dbtable = config.table_prefix + "mcc_codes";
const helpers = require("../utilities/helper/general_helper");

var dbModel = {
      add: async (data) => {
          let qb = await pool.get_connection();
          let response = await qb.returning('id').insert(dbtable, data);
          qb.release();
          return response;
      },
      select_all: async (condition_obj,filter,limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        let response;
        if(limit.perpage){
            
                if(Object.keys(filter).length){
                    response = await qb
                    .query("select * from "+dbtable+" where "+ condition +" and ("+search_text +") LIMIT " + limit.perpage + limit.start );
                 console.log(qb.last_query())
                }else{
                    response = await qb
                    .select('*')
                    .where(condition).order_by('id','desc').limit(limit.perpage, limit.start)
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
                    .where(condition).order_by('id','desc')
                    .get(dbtable);
                }
             
            qb.release();
        }
        
        return response;
    },

      select: async (limit) => {
          let qb = await pool.get_connection();
          let response;
          if(limit.perpage){
              response = await qb
                  .select('*')
                  .where(condition).order_by('mcc','asc').limit(limit.perpage, limit.start)
                  .get(dbtable);
              qb.release();
          }else{
              response = await qb
                  .select('*')
                  .where(condition).order_by('mcc','asc')
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
          response = await qb
                  .select(selection)
                  .where(condition)
                  .get(dbtable);
              qb.release();
          return response[0];
      },

      selectOnecategory: async (selection, condition) => {
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
      get_count_mcc: async (condition_obj,filter) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
        .query("select count('id') as count from "+dbtable);
        if(Object.keys(filter).length){
            response = await qb
            .query("select count('id') as count from "+dbtable+" where "+ condition +" and ("+search_text +")");
        }else{
            response = await qb
            .query("select count('id') as count from "+dbtable+" where "+ condition );
        }
            qb.release();
        return response[0].count;
    },
      get_count: async () => {
          let qb = await pool.get_connection();
          let condition = await helpers.get_conditional_string();
          response = await qb
          .query("select count('id') as count from "+dbtable);
              qb.release();
          return response[0].count;
      },
  }

module.exports = dbModel;
