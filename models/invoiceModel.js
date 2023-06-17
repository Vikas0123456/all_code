const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const db_table = config.table_prefix + "inv_customer";
const inv_table = config.table_prefix + "inv_invoice_master";
const item_table = config.table_prefix + "inv_invoice_items"
const master_item_table = config.table_prefix+"master_items";
const helpers = require('../utilities/helper/general_helper');
const enc_dec = require("../utilities/decryptor/decryptor");


const qbModel = {

   add: async (data) => {
      let qb = await pool.get_connection();
      let response = await qb.returning('id').insert(db_table, data);
      qb.release();
      return response;
   },
   select: async (limit,condition) => {
      let qb = await pool.get_connection();
      let response;

      if (limit.perpage) {
         response = await qb
            .select('*')
            .order_by('id', 'desc').limit(limit.perpage, limit.start)
            .where(condition)
            .get(db_table);
         qb.release();
      } else {
         response = await qb
            .select('*')
            .order_by('id', 'desc')
            .where(condition)
            .get(db_table);
         qb.release();
      }
      return response;
   },

   selectOne: async (condition) => {
      let qb = await pool.get_connection();
      let response = await qb
         .select("*")
         .where(condition)
         .get(db_table);
      qb.release();
      return response[0];
   },
   updateDetails: async (condition, data) => {
      let qb = await pool.get_connection();
      let response = await qb
         .set(data)
         .where(condition)
         .update(db_table);
      qb.release();
      return response;
   },

   get_count: async () => {
      let qb = await pool.get_connection();
      response = await qb
         .query("select count('id') as count from " + db_table);
      qb.release();
      return response[0].count;
   },

   add_inv: async (data) => {
      let qb = await pool.get_connection();
      let response = await qb.returning('id').insert(inv_table, data);
      qb.release();
      console.log(qb.last_query())
      return response;
   },
   add_inv_items: async (data) => {
      let qb = await pool.get_connection();
      let response = await qb.insert(item_table, data);
      qb.release();
      console.log(qb.last_query())
      return response;
   },

   selectInv: async (and_condition, limit) => {
     
      let qb = await pool.get_connection();
      let response;

      let final_cond = " where ";
      if (Object.keys(and_condition).length) {
         let condition = await helpers.get_and_conditional_string(and_condition);
         final_cond = final_cond + condition;
         console.log(condition)
      }
    

      if (final_cond == " where ") {
         final_cond = ""
      }

      
      let query = "select * from " + inv_table + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage


      response = await qb
         .query(query);
      qb.release();
      
      return response;
   },

   selectOneInv: async (condition) => {
      let qb = await pool.get_connection();
      let response = await qb
         .select("*")
         .where(condition)
         .get(inv_table);
      qb.release();
      return response[0];
   },


   updateDetailsInv: async (condition, data) => {
      let qb = await pool.get_connection();
      let response = await qb
         .set(data)
         .where(condition)
         .update(inv_table);
      qb.release();
      return response;
   },

   get_countInv: async (and_condition, date_condition) => {
      let qb = await pool.get_connection();
      let response;


      let final_cond = " where ";
      if (Object.keys(and_condition).length) {
         let condition = await helpers.get_and_conditional_string(and_condition);
         final_cond = final_cond + condition;
      }

      if (Object.keys(date_condition).length) {
         let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "issue_date");
         if (final_cond == " where ") {
            final_cond = final_cond + date_condition_str;
         } else {
            final_cond = final_cond + " and " + date_condition_str;
         }

      }

      if (final_cond == " where ") {
         final_cond = ""
      }

      let query = "select count('id') as count from " + inv_table + final_cond
      response = await qb
         .query(query);
      qb.release();

      return response[0].count;
   },


   add_item: async (data) => {
      let qb = await pool.get_connection();
      let response = await qb.returning('id').insert(item_table, data);
      qb.release();
      return response;
   },


   select_item: async (limit) => {

      let qb = await pool.get_connection();
      let response;


      if (limit.perpage) {
         response = await qb
            .select('*')
            .order_by('id', 'desc').limit(limit.perpage, limit.start)
            .get(item_table);
         qb.release();
      } else {
         response = await qb
            .select('*')
            .order_by('id', 'desc')
            .get(item_table);
         qb.release();
      }

      console.log(qb.last_query())
      return response;
   },
   selectOne_item: async (condition) => {
      let qb = await pool.get_connection();
      let response = await qb
         .select("*")
         .where(condition)
         .get(item_table);
      qb.release();
      return response[0];
   },

   list_of_item: async (condition) => {
      console.log(condition);
      const qb = await pool.get_connection();
      response = await qb
         .select("*")
         .where(condition)
         .get(item_table);
      qb.release();

      let result = [];
      response.forEach(async (element) => {
         result.push({
            "item_id": enc_dec.cjs_encrypt(element.id),
            "item_rate": element.item_rate,
            "quantity": element.quantity,
            "tax_per": element.tax_per,
            "discount_per": element.discount_per,
            "total_amount": element.total_amount,
         });

      })
      return result;
   },

   update_item: async (condition, data) => {
      let qb = await pool.get_connection();
      let response = await qb
         .set(data)
         .where(condition)
         .update(item_table);
      qb.release();
      return response;
   },
   item_master_add: async (data) => {
      let qb = await pool.get_connection();
      let response = await qb.returning('id').insert(master_item_table, data);
      qb.release();
      return response;
   },
   item_master_list: async (limit,condition) => {
      let qb = await pool.get_connection();
      let response;
      if (limit.perpage) {
         response = await qb
            .select('id,item_name,item_rate')
            .order_by('id', 'desc').limit(limit.perpage, limit.start)
            .get(master_item_table);
         qb.release();
      } else {
         response = await qb
            .select('id,item_name,item_rate')
            .order_by('id', 'desc')
            .get(master_item_table);
         qb.release();
      }
      console.log(qb.last_query())
      return response;
   },
   selectOneItem: async (condition) => {
      let qb = await pool.get_connection();
      let response = await qb
         .select("item_rate,item_name,item_description,status")
         .where(condition)
         .get(master_item_table);
      qb.release();
      console.log(qb.last_query());
      return response[0];
   },
   getMerchantDetails:async(condition)=>{
      let qb = await pool.get_connection();
      let response = await qb
         .select("register_business_address_country as country,company_name,address_line1,province,co_email,co_mobile_code,co_mobile")
         .where(condition)
         .get(config.table_prefix+'master_merchant_details');
      qb.release();
      console.log(qb.last_query());
      return response[0];
   }
}
module.exports = qbModel;