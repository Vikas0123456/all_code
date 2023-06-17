const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'customers';
const logstable = config.table_prefix + 'customer_logs';
const temtable = config.table_prefix + 'customer_temp';
const otptable = config.table_prefix + 'email_otp_sent';
const mobileotptable = config.table_prefix + 'mobile_otp';
const securitytable = config.table_prefix + 'customers_answer';
const transactiontable = config.table_prefix + 'orders_test';
const helpers = require('../utilities/helper/general_helper')
var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(otptable, data);
        qb.release();
        return response;
    },
    addMobileOTP: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(mobileotptable, data);
        qb.release();
        return response;
    },
    addDynamic: async (data, table_name) => {
        let db_table = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(db_table, data);
        qb.release();
        return response;
    },
    addLogs: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(logstable, data);
        qb.release();
        return response;
    },
    add_customer_tem: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(temtable, data);
        qb.release();
        return response;
    },
    add_customer: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (limit, filter, user_type,id,table_name) => {
        console.log(`inside customers`)
        console.log(user_type);
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_like_string(filter);
        let response;
        if (user_type == 'admin') {
            if (limit.perpage) {

                if (Object.keys(filter).length) {
                    response = await qb
                        .query("select * from " + dbtable + " where id!='' " + search_text + "  LIMIT " + limit.start + "," + limit.perpage + "");
                    console.log("select * from " + dbtable + " where id!='' " + search_text + "  LIMIT " + limit.start + "," + limit.perpage + "");
                } else {
                    response = await qb
                        .query("select * from " + dbtable + " where id!='' LIMIT " + limit.start + "," + limit.perpage + "");
                }
                console.log("select * from " + dbtable + " where id!='' LIMIT " + limit.start + "," + limit.perpage + "");
                qb.release();
            }
            else {
                if (Object.keys(filter).length) {
                    response = await qb
                        .query("select * from " + dbtable + " where id!='' " + search_text + "");
                } else {
                    response = await qb
                        .query("select * from " + dbtable + " where id!=''");

                }

                qb.release();
            }
        } else {
            console.log(`in merchants customers`)
            if (limit.perpage) {

                if (Object.keys(filter).length) {
                 

                    response = await qb
                        .query("select c.* from "+config.table_prefix+table_name+" o INNER JOIN "+config.table_prefix+"customers c ON o.customer_email=c.email  "+" where o.super_merchant="+id+" " + search_text + " group by c.id LIMIT " + limit.start + "," + limit.perpage + "");
                       
                   
                } else {
                


                    response = await qb
                    .query("select c.* from "+config.table_prefix+table_name+" o INNER JOIN "+config.table_prefix+"customers c   ON o.customer_email=c.email  "+" where o.super_merchant="+id+" group by c.id LIMIT " + limit.start + "," + limit.perpage + "");
                }
              
            }
            else {
                if (Object.keys(filter).length) {
                    response = await qb
                        .query("select c.* from "+config.table_prefix+table_name+" o JOIN "+config.table_prefix+"customers c  ON o.customer_email=c.email "+" where o.super_merchant="+id+" AND "+search_text+" group by c.id");
                      
                } else {
                    response = await qb
                        .query("select c.* from "+config.table_prefix+table_name+" o JOIN "+config.table_prefix+"customers c  ON o.customer_email=c.email "+" where o.super_merchant="+id)+" group by c.id";

                }

                qb.release();
            }
        }
        return response;
    },
    selectTransaction: async (and_condition, date_condition, limit) => {

        let qb = await pool.get_connection();
        let response;

        let final_cond = " where ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }

        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select * from " + transactiontable + final_cond + " order BY ID DESC  limit " + limit.start + "," + limit.perpage
        response = await qb
            .query(query);
        console.log(qb.last_query());
        return response;
    },
    // selectTransaction: async (selection,condition) => {
    //     let qb = await pool.get_connection();
    //     let response = await qb
    //         .select(selection)
    //         .where(condition)
    //         .get(transactiontable);
    //     qb.release();
    //     return response;
    // },
    selectAnswer: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(securitytable);
        qb.release();

        return response;
    },
    select1: async (condition_obj, filter, limit) => {
        let qb = await pool.get_connection();
        let search_text = await helpers.get_conditional_or_like_string(filter);
        let condition = await helpers.get_conditional_string(condition_obj);
        let response;
        if (limit.perpage) {
            if (filter.name != "") {
                response = await qb
                    .query("select * from " + dbtable + " where " + condition + " and (" + search_text + ") LIMIT " + limit.perpage + limit.start);
            } else {
                response = await qb
                    .select('*')
                    .where(condition).order_by('name', 'asc').limit(limit.perpage, limit.start)
                    .get(dbtable);
            }
            qb.release();
        }
        else {
            if (filter.name != "") {
                response = await qb
                    .query("select * from " + dbtable + " where " + condition + " and (" + search_text + ")");
            } else {
                response = await qb
                    .select('*')
                    .where(condition).order_by('name', 'asc')
                    .get(dbtable);

            }
            qb.release();
        }
        return response;
    },
    selectOtpDAta: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(otptable);
        qb.release();
        return response[0];
    },
    selectMobileOtpDAta: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(mobileotptable);
        qb.release();
        return response[0];
    },
    selectCustomerDetails: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition).order_by('id')
            .get(temtable);
        qb.release();
        return response[0];
    },
    selectActualCustomerDetails:async(selection,condition)=>{
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition).order_by('id')
            .get(dbtable);
        qb.release();
        return response[0];
    },
    selectCustomer: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        //   console.log(qb.last_query())
        return response[0];
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
    updateCustomerTempToken: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(temtable);
        qb.release();
        return response;
    },
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable);
        qb.release();
        return response;
    },
    updateDynamic: async (condition, data, table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(config.table_prefix + table);
        qb.release();
        return response;
    },
    get_count1: async (condition) => {
        let qb = await pool.get_connection();

        response = await qb
            .query("select count('id') as count from " + dbtable + " where id!=" + condition);

        qb.release();
        return response[0].count;
    },
    get_count_logs: async (id, condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + logstable + " where id!=" + id + ' and  ' + condition);

        qb.release();
        return response[0].count;
    },
    selectDynamic: async (selection, condition, table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix + table);
        qb.release();
        //console.log(qb.last_query())
        return response;
    },
    selectDynamicCard: async (selection, condition, table) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition).order_by('primary_card','desc')
            .get(config.table_prefix + table);
        qb.release();
        return response;
    },
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);

        response = await qb
            .query("select count('id') as count from " + securitytable + " where " + condition);
        qb.release();
        return response[0].count;
    },
    add_token_check: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + "password_token_check", data);
        qb.release();
        return response;
    },

    delete_token: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.delete(config.table_prefix + "password_token_check", data)
        qb.release();
        return response;
    },
    get_customer_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_like_string(condition_obj);
        if (Object.keys(condition_obj).length) {
            response = await qb
                .query("select count('id') as count from " + dbtable + " where id!='' " + condition + "");
        } else {

            response = await qb
                .query("select count('id')  as count from " + dbtable + " where id!=''");
        }
        qb.release();
        return response[0].count;
    },
    get_merchant_customer_count: async (condition_obj,id,table_name) => {
        console.log(condition_obj,table_name,id);
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_like_string(condition_obj);
        if (Object.keys(condition_obj).length) {
            response = await qb
                .query("select count('ord.id') as count from " +config.table_prefix+table_name + " ord INNER JOIN "+config.table_prefix+"customers c ON c.id=ord.cid  where ord.super_merchant= "+id +" "+ condition + "");
        } else {
            response = await qb
                .query("select count('ord.id') as count from " +config.table_prefix+table_name + " ord INNER JOIN "+config.table_prefix+"customers c ON c.id=ord.cid  where ord.super_merchant= "+id);
        }
        qb.release();
        return response[0].count;
    },
    selectCustomerTransaction: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix + 'orders');
        qb.release();
        return response;
    },
    selectDynamicTransaction: async (and_condition, date_condition,table) => {
        const table_name = config.table_prefix +table;
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }

        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select * from " + table_name + final_cond + " group BY mcc_category DESC " 
        response = await qb
            .query(query);
     
        return response;
    },
    get_dynamic_count: async (and_condition, date_condition, dbtable) => {
        dbtable = config.table_prefix + dbtable;
        let qb = await pool.get_connection();
        let response;


        let final_cond = " where status='Completed' ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond +'and '+condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }

        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select count('id') as count from "  + dbtable +"  "+final_cond;
        console.log(query);
        response = await qb
            .query(query);
          
        qb.release();

        return response[0].count;
    },
    get_volume_dynamic: async (and_condition, date_condition, dbtable) => {
        dbtable = config.table_prefix + dbtable;
        let qb = await pool.get_connection();
        let final_cond = " where status='Completed' "

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            final_cond = final_cond + " and " + date_condition_str;
        }

        let query = "select currency,SUM(amount) as total from " + dbtable + final_cond
        response = await qb
            .query(query);
          
        qb.release();

        return response[0];
    },
}
module.exports = dbModel;