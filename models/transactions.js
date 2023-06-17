const { findSourceMap } = require('module');
const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'orders';
const helpers = require('../utilities/helper/general_helper')
var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    select: async (and_condition, date_condition, or_condition, limit, table_name) => {
        table_name = config.table_prefix + table_name
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where status <> 'PENDING'";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " and " + condition;
        }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + "and " + or_cond + "";

        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");

            final_cond = final_cond + " and " + date_condition_str;


        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select * from " + table_name + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage


        response = await qb
            .query(query);
        qb.release();

        return response;
    },
    selectTxn: async (and_condition, like_condition, date_condition, or_condition, limit, table_name, mode, like_condition_arr) => {
        table_name = config.table_prefix + table_name;
        let table_txn = 'order_txn';

        if (mode === "test") {
            table_txn = 'order_txn_test'
        }


        let qb = await pool.get_connection();
        let response;
        let final_cond = " where ";
        let and = "";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " "+and+" " + condition;
            if(and == ""){ and = " and "}
        }
        if (Object.keys(like_condition).length) {
            let condition = await helpers.get_conditional_or_like_string(like_condition);
            final_cond = final_cond +and+" (" + condition +" )";
            if(and == ""){ and = " and "}
        }    
        for (let likeCondition of like_condition_arr) {
            let condition = await helpers.get_conditional_or_like_string(likeCondition);
            final_cond = final_cond + and + " (" + condition + " )";
            if (and == ""){ and = " and ";}
          }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + " "+and+" " + or_cond + "";
            if(and == ""){ and = " and "}
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "txn.created_at");

            final_cond = final_cond + " "+and+" " + date_condition_str;
            if(and == ""){ and = " and "}
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
       let query = "select txn.id as txn_id, txn.txn,txn.created_at,txn.status,txn.amount,txn.currency,txn.type,ord.description as description,ord.class,ord.customer_name,ord.order_id,ord.card_type,ord.payment_mode,ord.payment_id,ord.billing_address_line_1,ord.billing_address_line_2,ord.billing_city,ord.billing_pincode,ord.billing_province,ord.billing_country,ord.shipping_address_line_1,ord.shipping_address_line_2,ord.shipping_city,ord.shipping_country,ord.shipping_province,ord.shipping_pincode,ord.funding_method,ord.status as order_status,ord.amount as order_amount,ord.acquirer,txn.created_at from " + config.table_prefix + table_txn + ' txn INNER JOIN ' + table_name + ' ord ON txn.order_id=ord.order_id ' + final_cond + " order BY txn.id DESC limit " + limit.start + "," + limit.perpage
        response = await qb.query(query);
        qb.release();
        return response;
    },
    selectAll: async (and_condition, date_condition, or_condition, table_name) => {
        table_name = config.table_prefix + table_name
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where status <> 'PENDING' ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + condition;
        }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + "and " + or_cond + "";

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

        let query = "select * from " + table_name + final_cond + " order BY ID DESC "


        response = await qb
            .query(query);
        qb.release();
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
    selectOne: async (selection, condition, table_name) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix + table_name);
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
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbtable);
        qb.release();
        return response;
    },
    get_transactions: async () => {
        let qb = await pool.get_connection();
        let query = "select count('id') as count from " + dbtable;
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
    },
    get_count: async (and_condition, date_condition, or_condition, table_name) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let response;


        let final_cond = " where status <> 'PENDING' ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " and " + condition;
        }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + "and " + or_cond + "";

        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");

            final_cond = final_cond + " and " + date_condition_str;


        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select count('id') as count from " + table_name + final_cond
        response = await qb
            .query(query);
        qb.release();

        return response[0].count;
    },
    get_txn_count: async (and_condition, like_condition, date_condition, or_condition, table_name, mode,like_condition_arr) => {
        table_name = config.table_prefix + table_name
        let table_txn = 'order_txn';
        if (mode === "test") {
            table_txn = 'order_txn_test'
        }


        let qb = await pool.get_connection();
        let response;
        let final_cond = " where ";
        let and = "";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " "+and+" " + condition;
            if(and == ""){ and = " and "}
        }
        if (Object.keys(like_condition).length) {
            let condition = await helpers.get_conditional_or_like_string(like_condition);
            final_cond = final_cond +and+" (" + condition +" )";
            if(and == ""){ and = " and "}
        }    
        for (let likeCondition of like_condition_arr) {
            let condition = await helpers.get_conditional_or_like_string(likeCondition);
            final_cond = final_cond + and + " (" + condition + " )";
            if (and == ""){ and = " and ";}
          }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + " "+and+" " + or_cond + "";
            if(and == ""){ and = " and "}
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "txn.created_at");

            final_cond = final_cond + " "+and+" " + date_condition_str;
            if(and == ""){ and = " and "}
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        let query = "select count(txn.id) as count from " + config.table_prefix + table_txn + ' txn INNER JOIN ' + table_name + ' ord ON txn.order_id=ord.order_id ' + final_cond ;
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
    },
    get_volume: async (and_condition, date_condition) => {
        let qb = await pool.get_connection();
        let final_cond = " where status = 'Completed' "

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            final_cond = final_cond + " and " + date_condition_str;
        }

        let query = "select SUM(amount) as total from " + dbtable + final_cond
        response = await qb
            .query(query);
        qb.release();

        return response[0].total ? response[0].total.toFixed(2) : "0.00";
    },

    get_mode_wise_volume: async (and_condition, date_condition) => {
        let qb = await pool.get_connection();
        let final_cond = " where status = 'Completed' "

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            final_cond = final_cond + " and " + date_condition_str;
        }

        //let query = "select SUM(amount) as total from "+dbtable+final_cond
        let query = "SELECT SUM(amount) as total,COUNT(id) as count FROM " + dbtable + final_cond + " GROUP BY customer_email";
        response = await qb
            .query(query);
        qb.release();

        return response;
    },

    status_wise_transactions: async (and_condition, date_condition) => {
        let qb = await pool.get_connection();
        let final_cond = " where "

        if (Object.keys(and_condition).length) {
            if (final_cond == " where ") {
                final_cond = final_cond + await helpers.get_and_conditional_string(and_condition);
            } else {
                final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
            }

        }


        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }

        }

        //let query = "select SUM(amount) as total from "+dbtable+final_cond
        let query = "SELECT status,COUNT(status) as count FROM " + dbtable + final_cond + " GROUP BY status";
        response = await qb
            .query(query);
        qb.release();

        return response;
    },

    get_last_day_wise_amount: async (date, and_condition, table) => {
        table = config.table_prefix + table;
        let qb = await pool.get_connection();
        let final_cond = " DATE(created_at) >= '" + date + "' "

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + "  and " + await helpers.get_and_conditional_string(and_condition);
        }
        let query = "SELECT SUM(amount) as total,created_at FROM " + table + " WHERE " + final_cond + " GROUP BY DATE(created_at)";
        response = await qb
            .query(query);
        qb.release();

        return response;
    },
    get_blocked_last_day_wise_amount: async (date, or_condition, table) => {
        table = config.table_prefix + table;
        let qb = await pool.get_connection();
        let final_cond = " DATE(created_at) >= '" + date + "' "
        final_cond = final_cond + ' AND ' + or_condition;
        let query = "SELECT SUM(amount) as total,created_at FROM " + table + " WHERE " + final_cond + " GROUP BY DATE(created_at)";
        response = await qb
            .query(query);
        qb.release();

        return response;
    },
    get_high_risk_last_day_wise_amount: async (date, or_condition, table) => {
        table = config.table_prefix + table;
        let qb = await pool.get_connection();
        let final_cond = " DATE(created_at) >= '" + date + "' "
        final_cond = final_cond + ' AND ' + or_condition;
        let query = "SELECT SUM(amount) as total,created_at FROM " + table + " WHERE " + final_cond + " GROUP BY DATE(created_at)";
        response = await qb
            .query(query);
        qb.release();

        return response;
    },
    get_week_wise_amount: async (date, and_condition, table) => {
        table = config.table_prefix + table;
        let qb = await pool.get_connection();
        let final_cond = await helpers.get_date_between_condition(date.from_date, date.to_date, "created_at")

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
        }
        let query = "SELECT SUM(amount) as total FROM " + table + " WHERE status = 'Completed' and " + final_cond;

        response = await qb
            .query(query);
        qb.release();

        return response[0].total ? response[0].total : 0;
    },
    get_dynamic_count: async (and_condition, date_condition, dbtable) => {
        dbtable = config.table_prefix + dbtable;
        let qb = await pool.get_connection();
        let response;


        let final_cond = " where (status='Completed' or status='Created' or status='Failed' or status='Cancelled') ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + 'and ' + condition;
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

        let query = "select count('id') as count from " + dbtable + "  " + final_cond;
        response = await qb
            .query(query);
        qb.release();

        return response[0].count;
    },
    get_volume_dynamic: async (and_condition, date_condition, dbtable) => {
        dbtable = config.table_prefix + dbtable;
        let qb = await pool.get_connection();
        let final_cond = " where (status='Completed' or status='Created' or status='Failed' or status='Cancelled') "

        if (Object.keys(and_condition).length) {
            final_cond = final_cond + " and " + await helpers.get_and_conditional_string(and_condition);
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");
            final_cond = final_cond + " and " + date_condition_str;
        }

        let query = "select SUM(amount) as total from " + dbtable + final_cond
        response = await qb
            .query(query);
        qb.release();

        return response[0].total ? response[0].total.toFixed(2) : "0.00";
    },
    selectTenTransactions: async (condition, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('ord.order_id,ord.amount,ord.currency,ord.status,ord.updated_at as transaction_date,mm.email,mm.mobile_no,mmd.company_name,ord.customer_name,ord.customer_email,ord.customer_mobile,ord.high_risk_country,ord.high_risk_transaction,ord.block_for_suspicious_ip, block_for_suspicious_email, block_for_transaction_limit')
            .from(config.table_prefix + table_name + ' ord')
            .join(config.table_prefix + 'master_merchant mm', 'ord.merchant_id=mm.id', 'left')
            .join(config.table_prefix + 'master_merchant_details mmd', 'mm.id=mmd.merchant_id', 'left')
            .where(condition)
            .limit(10)
            .order_by('ord.created_at', 'desc')
            .get();
        qb.release();
        return response;
    },
    get_fraud_transaction_counter: async (table_name) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let query = "select count('id') as total_block_payments from " + table_name + " WHERE block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1";
        response = await qb
            .query(query);
        qb.release();
        return response[0].total_block_payments;
    },
    get_fraud_volume: async (table_name) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let query = "SELECT sum(amount) as total_amount FROM " + table_name + " WHERE block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1";
        response = await qb
            .query(query);
        qb.release();
        return response[0].total_amount;
    },
    get_fraud_transaction_counter_merchant: async (table_name, merchant_condition) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let query = "select count('id') as total_block_payments from " + table_name + " WHERE    (block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1) AND " + merchant_condition + "";
        response = await qb
            .query(query);
        qb.release();
        return response[0].total_block_payments;
    },
    get_fraud_volume_merchant: async (table_name, merchant_condition) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let query = "SELECT sum(amount) as total_amount FROM " + table_name + " WHERE ( block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1) AND " + merchant_condition;

        response = await qb
            .query(query);
        qb.release();
        return response[0].total_amount;
    },
    select_highrisk: async (and_condition, date_condition, or_condition, limit, table_name) => {
        table_name = config.table_prefix + table_name
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where (block_for_suspicious_ip=1 or block_for_transaction_limit=1 or block_for_suspicious_email=1 or high_risk_country=1 or high_risk_transaction=1)";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + "and " + condition;
        }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + "and " + or_cond + "";

        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");

            final_cond = final_cond + " and " + date_condition_str;


        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select * from " + table_name + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage


        response = await qb
            .query(query);
        qb.release();

        return response;
    },
    get_count_risk: async (and_condition, date_condition, risk, table_name) => {
        table_name = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let response;


        let final_cond = " where (block_for_suspicious_ip=1 or block_for_transaction_limit=1 or block_for_suspicious_email=1 or high_risk_country=1 or high_risk_transaction=1)";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + condition;
        }
        if (risk.length > 0) {
            let or_cond = risk + "= 1";

            final_cond = final_cond + "and " + or_cond + "";

        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_at");

            final_cond = final_cond + " and " + date_condition_str;


        }

        if (final_cond == " where ") {
            final_cond = ""
        }

        let query = "select count('id') as count from " + table_name + final_cond
        response = await qb
            .query(query);
        qb.release();

        return response[0].count;
    },
    getRefundedSum: async (order_id, mode) => {
        let table_name = 'order_txn'
        if (mode === "test") {
            table_name = 'order_txn_test'
        }
        let qb = await pool.get_connection();
        let query = "select SUM(amount) as total from " + config.table_prefix +table_name +  " where type='REFUND' AND status='APPROVED' AND order_id='" + order_id + "'";
        response = await qb
            .query(query);
        qb.release();

        return response[0].total ? response[0].total.toFixed(2) : "0.00";
    },
    selectTxnImport: async (and_condition, date_condition, or_condition, table_name) => {
        table_name = config.table_prefix + table_name
        let qb = await pool.get_connection();
        let response;
        let final_cond = "";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = final_cond + " and " + condition;
        }
        if (or_condition.length > 0) {
            let or_cond = or_condition + "= 1";

            final_cond = final_cond + "and " + or_cond + "";
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "txn.created_at");

            final_cond = final_cond + " and " + date_condition_str;
        }
        if (final_cond == " where ") {
            final_cond = ""
        }
        let query = "select txn.id as txn_id, txn.txn,txn.created_at,txn.status,txn.amount,txn.currency,txn.type,ord.class,ord.customer_name,ord.customer_email,ord.order_id,ord.status as order_status,ord.amount as order_amount from " + config.table_prefix + 'order_txn txn INNER JOIN ' + config.table_prefix + 'orders ord ON txn.order_id=ord.order_id ' + final_cond + " order BY txn.id DESC limit 1000"
        response = await qb
            .query(query);
        qb.release();

        return response;
    },
}
module.exports = dbModel;