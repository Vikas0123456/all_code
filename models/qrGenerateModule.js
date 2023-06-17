const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const db_table = config.table_prefix + "merchant_qr_codes";
const db_collection = config.table_prefix + "merchant_payment"
const merchant_table = config.table_prefix + "master_merchant_details";
const merchant_deta = config.table_prefix + "master_merchant";
const helpers = require('../utilities/helper/general_helper');
const enc_dec = require("../utilities/decryptor/decryptor");

const qr_module = {
      add: async (data) => {
            let qb = await pool.get_connection();
            let response = await qb.returning('id').insert(db_table, data);
            qb.release();
            return response;
      },
      add_collection: async (data) => {
            let qb = await pool.get_connection();
            let response = await qb.returning('id').insert(db_collection, data);
            qb.release();
            return response;
      },

      update_collection: async (condition, data) => {
            let qb = await pool.get_connection();
            let response = await qb
                  .set(data)
                  .where(condition)
                  .update(db_collection);
            qb.release();
            return response;
      },

      selectOne: async (condition) => {
            let qb = await pool.get_connection();
            response = await qb
                  .select("*")
                  .where(condition)
                  .get(db_table);
            qb.release();

            return response[0];
      },


      selectOneMerchant: async (condition) => {
            let qb = await pool.get_connection();
            response = await qb
                  .select("theme,icon,logo, use_logo,we_accept_image, brand_color, accent_color,branding_language")
                  .where(condition)
                  .get(merchant_deta);
            qb.release();
            return response[0];
      },

      get_company_name: async (where) => {
            const qb = await pool.get_connection();
            const response = await qb.select("merchant_id,company_name").where(where).get(merchant_table);
            qb.release();
            const result = {};
            response.forEach((element) => {
                  result[element.merchant_id] = element.company_name;

            })
            return result;
      },

      selectOne_collection: async (condition) => {
            let qb = await pool.get_connection();
            response = await qb
                  .select("*")
                  .where(condition)
                  .get(merchant_table);
            qb.release();
            return response[0];
      },

      selectOne_payment: async (condition) => {
            let qb = await pool.get_connection();
            response = await qb
                  .select("*")
                  .where(condition)
                  .get(db_collection);
            qb.release();
            return response[0];
      },



      selectOne_type: async (condition) => {
            let qb = await pool.get_connection();
            response = await qb
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

      select: async (selection, condition, limit) => {
            let qb = await pool.get_connection();
            qb.select(selection).order_by("id", "desc").where(condition)
            qb.limit(limit.perpage, limit.start)
            var response = await qb.get(db_table);
            qb.release();
            return response;
      },

      select_qr_list: async (condition_obj, limit, like, and_or_cond) => {
            let qb = await pool.get_connection();
            // let search_text = await helpers.get_conditional_or_like_string(filter);
            let condition = await helpers.get_and_conditional_string(condition_obj);
            let query = "select * from " + db_table + " where " + condition+" "+ (and_or_cond != ''?' AND '+and_or_cond:'');
            
            if(like){
                  query += ' AND description like "' + like + '" ';
            }
            
            if (limit.perpage) {
                  query += " LIMIT " + limit.start +","+ limit.perpage;
            }

            let response = await qb
                  .query(query);

            qb.release();
            console.log(query);
            return response;
      },


      select_payment_list: async (condition_obj, limit) => {


            let qb = await pool.get_connection();
            // let search_text = await helpers.get_conditional_or_like_string(filter);
            let condition = await helpers.get_conditional_string(condition_obj);

            let response;
            if (limit.perpage) {

                  response = await qb
                        .select('*')
                        .where(condition).order_by('id', 'desc').limit(limit.perpage, limit.start)
                        .get(db_collection);

                  qb.release();
            }
            else {
                  response = await qb
                        .select('*')
                        .where(condition).order_by('id', 'desc')
                        .get(db_collection);

                  qb.release();
            }



            return response;

      },


      get_counts: async () => {
            let qb = await pool.get_connection();
            let query = "select count('id') as count from " + db_table + " where  'is_reseted' = 0 and is_expired =0";
            response = await qb
                  .query(query);
            qb.release();
            return response[0].count;
      },

      getMerchantName: async (condition) => {
            const qb = await pool.get_connection();
            let response = await qb
                  .select("mm.`id`,md.`company_name`, md.`merchant_id`")
                  .from(merchant_deta + " mm")
                  .join(merchant_table + " md", "mm.id=md.merchant_id", "left")
                  .where(condition)
                  .get();
            qb.release();

            const result = {};
            response.forEach((element) => {
                  result[element.merchant_id] = element.company_name;
            })
            return result;
      },
      getMerchantcode: async (data) => {
            const qb = await pool.get_connection();
            const response = await qb.select("id,code").from(merchant_deta).get(data);
            qb.release();
            const result = {};
            response.forEach((element) => {
                  result[element.id] = "+" + element.code;

            })
            return result;
      },
      getMerchantmobile: async (data) => {
            const qb = await pool.get_connection();
            const response = await qb.select("id,mobile_no").from(merchant_deta).get(data);
            qb.release();
            const result = {};
            response.forEach((element) => {
                  result[element.id] = element.mobile_no;

            })
            return result;
      },
      getMerchantlogo: async (data) => {
            const qb = await pool.get_connection();
            const response = await qb.select("id,logo").from(merchant_deta).get(data);
            qb.release();
            const result = {};
            response.forEach((element) => {
                  result[element.id] = element.logo;

            })
            return result;
      },


      get_count_search: async (condition_obj, like,and_or_cond) => {


            let qb = await pool.get_connection();
            let condition = await helpers.get_and_conditional_string(condition_obj);
            let query = '';
            
            if (like != '') {
                  query = "select count('id') as count from " + db_table + " where " + condition+" "+ (and_or_cond != ''?' AND '+and_or_cond:'') + ' AND description like "' + like + '"';
            } else {
                  query = "select count('id') as count from " + db_table + " where " + condition +" " + (and_or_cond != ''?' AND '+and_or_cond:'');
            }


            let response = await qb
                  .query(query);
            // }
            qb.release();
            return response[0].count;
      },


      get_count_payment: async (condition_obj) => {
            let qb = await pool.get_connection();
            let condition = await helpers.get_conditional_string(condition_obj);
            let query = "select count('id') as count from " + db_collection + " where " + condition;
            let response = await qb
                  .query(query);

            qb.release();

            return response[0].count;

      },
      get_count_payment_without_condition: async () => {
            let qb = await pool.get_connection();
            // let condition = await helpers.get_conditional_string(condition_obj);
            let query = "select count('id') as count from " + db_collection;
            let response = await qb
                  .query(query);
            qb.release();
            return response[0].count;
      },

      get_count_payment_with_exp: async (condition_obj, ext) => {
            let qb = await pool.get_connection();
            let condition = await helpers.get_conditional_string(condition_obj);
            let query = "select count('id') as count from " + db_collection + " where " + condition + " and transaction_date <= " + "'" + ext + "'";
            let response = await qb
                  .query(query);

            qb.release();
            return response[0].count;

      },

      get_count_payment_for_today: async (condition_obj, ext) => {
            let qb = await pool.get_connection();
            let condition = await helpers.get_conditional_string(condition_obj);
            let query = "select count('id') as count from " + db_collection + " where " + condition + " and transaction_date = " + "'" + ext + "'";
            let response = await qb
                  .query(query);

            qb.release();
            return response[0].count;

      },

      list_of_payment: async (condition) => {
            const qb = await pool.get_connection();
            response = await qb
                  .select("*")
                  .where(condition)
                  .get(db_collection);
            qb.release();

            let result = [];
            response.forEach(async (element) => {
                  result.push({
                        "qr_order_id": enc_dec.cjs_encrypt(element.id),
                        "order_no": element.order_no,
                        "payment_id": element.payment_id == "" ? "not available" : element.payment_id,
                        "name": element.name,
                        "email": element.email,
                        "amount": element.amount,
                        "currency": element.currency,
                        "payment_status": element.payment_status,
                  });

            })
            return result;
      },
}

module.exports = qr_module;

