const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");

const helpers = require("../utilities/helper/general_helper");

var dbModel = {
    analytics: async (user, date_condition, table_name) => {
        const dbtable = config.table_prefix + table_name;

        // console.log(user);
        // console.log("date_condition", date_condition);

        let qb = await pool.get_connection();

        let query = `SELECT temp_dates.date, COALESCE(SUM(${dbtable}.amount), 0) as sum_amount
                      FROM (
                          SELECT DATE_ADD('${date_condition.from_date}', INTERVAL n.n DAY) AS date
                          FROM (
                              SELECT a.N + b.N * 10 + c.N * 100 AS n
                              FROM (
                                  SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
                              ) a
                              ,(SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
                              ,(SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
                          ) n
                          WHERE DATE_ADD('${date_condition.from_date}', INTERVAL n.n DAY) <= '${date_condition.to_date}'
                      ) AS temp_dates
                      LEFT JOIN (
                          SELECT DATE(created_at) as date, amount 
                          FROM ${dbtable} 
                          WHERE super_merchant = '${user}'
                              AND DATE(created_at) BETWEEN '${date_condition.from_date}' AND '${date_condition.to_date}'
                      ) AS ${dbtable} ON temp_dates.date = ${dbtable}.date
                      GROUP BY temp_dates.date`;
        console.log("query", query);
        let response = await qb.query(query);
        qb.release();
        // console.log("response => ", response);
        return response;
    },
    analytics_payment: async (user, date_condition, table_name) => {
        console.log("date_condition", date_condition);
        const dbtable = config.table_prefix + table_name;

        let qb = await pool.get_connection();

        let query = `SELECT ${dbtable}.payment_mode, COALESCE(SUM(${dbtable}.amount), 0) as sum_amount
                      FROM ${dbtable}
                      WHERE super_merchant = '${user}'
                      AND DATE(created_at) BETWEEN '${date_condition.from_date}' AND '${date_condition.to_date}'
                      GROUP BY payment_mode
                      ORDER BY payment_mode DESC;`;
        // console.log("query", query);
        let response = await qb.query(query);
        qb.release();
        // console.log("response => ", response);
        return response;
    },
    status_payment: async (user, date_condition, table_name) => {
        console.log("date_condition", date_condition);
        const dbtable = config.table_prefix + table_name;

        let qb = await pool.get_connection();

        let query = `SELECT ${dbtable}.status, COALESCE(SUM(${dbtable}.amount), 0) as sum_amount
                      FROM ${dbtable}
                      WHERE super_merchant = '${user}'
                      AND DATE(created_at) BETWEEN '${date_condition.from_date}' AND '${date_condition.to_date}'
                      AND (status='REFUNDED' OR status='CANCELLED' OR status='AUTHORISED' )
                      GROUP BY status
                      ORDER BY status DESC;`;
        console.log("query", query);
        let response = await qb.query(query);
        qb.release();
        // console.log("response => ", response);
        return response;
    },
};

module.exports = dbModel;
