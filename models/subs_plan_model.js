const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
const dbtable = config.table_prefix + "subs_plans";
const mailtable = config.table_prefix + "subs_plan_mail";
const paytable = config.table_prefix + "subs_payment";
const subscriptiontable = config.table_prefix + "subscription";
const merchant_table = config.table_prefix + "master_merchant_details";
const merchant_deta = config.table_prefix + "master_merchant";
const helpers = require("../utilities/helper/general_helper");
var dbModel = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning("id").insert(dbtable, data);
        qb.release();
        return response;
    },

    selectSome: async (condition) => {
        let qb = await pool.get_connection();
        let response;
        qb.select("*");
        qb.where(condition);
        response = await qb.get(dbtable);
        qb.release();
        return response;
    },
    select: async (condition, limit, search) => {
        console.log(search != "");
        let qb = await pool.get_connection();
        let response;
        if (limit.perpage) {
            qb.select("*");
            qb.where(condition).order_by("id", "asc");
            if (search != "") {
                qb.like({ plan_name: search }, null, "before", "after");
                qb.or_like(
                    { plan_billing_frequency: search },
                    null,
                    "before",
                    "after"
                );
                qb.or_like({ plan_currency: search }, null, "before", "after");
            }
            qb.limit(limit.perpage, limit.start);
            response = await qb.get(dbtable);
            qb.release();
            return response;
        } else {
            qb.select("*");
            qb.where(condition).order_by("id", "asc");
            if (search != "") {
                qb.like({ plan_name: search }, null, "before", "after");
                qb.or_like(
                    { plan_billing_frequency: search },
                    null,
                    "before",
                    "after"
                );
                b.or_like({ plan_currency: search }, null, "before", "after");
            }
            response = await qb.get(dbtable);
            qb.release();
            return response;
        }
    },
    selectSpecific: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(dbtable);
        qb.release();
        return response;
    },
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .order_by("plan_currency", "asc")
            .get(dbtable);
        qb.release();
        //console.log(response[0])
        return response[0];
    },
    selectMail: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb.select(selection).where(condition).get(mailtable);
        qb.release();
        //console.log(response[0])
        return response[0];
    },
    selectUserDetails: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(dbtable);
        qb.release();
        return response[0];
    },
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb.set(data).where(condition).update(dbtable);
        qb.release();
        return response;
    },
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb.query(
            "select count('id') as count from " +
                dbtable +
                " where " +
                condition
        );
        qb.release();
        return response[0].count;
    },
    get_count_pay: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);

        response = await qb.query(
            "select count('id') as count from " +
                subscriptiontable +
                " where " +
                condition
        );
        qb.release();
        return response[0].count;
    },
    get_count_all_conditions: async (
        condition_obj,
        like_condition,
        date_condition
    ) => {
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where ";
        if (Object.keys(condition_obj).length) {
            let condition = await helpers.get_and_conditional_string(
                condition_obj
            );
            final_cond = final_cond + condition;
        }
        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(
                date_condition.from_date,
                date_condition.to_date,
                "added_date"
            );
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }
        }
        if (final_cond == " where ") {
            final_cond = "";
        }

        let query =
            "select count('id') as count from " +
            subscriptiontable +
            final_cond +
            " AND `email` LIKE '%" +
            like_condition.email +
            "%' AND `plan_name` LIKE '%" +
            like_condition.plan_name +
            "%'" +
            " order BY ID DESC";

        console.log(query);

        response = await qb.query(query);
        qb.release();

        return response[0].count;
    },

    getMerchantName: async (data) => {
        const qb = await pool.get_connection();
        const response = await qb
            .select("merchant_id,company_name")
            .from(merchant_table)
            .get(data);
        qb.release();
        const result = {};
        response.forEach((element) => {
            result[element.merchant_id] = element.company_name;
        });
        return result;
    },
    getMerchantlogo: async (data) => {
        const qb = await pool.get_connection();
        const response = await qb
            .select("logo")
            .from(merchant_deta)
            .limit(1)
            .where(data)
            .get();
        qb.release();
        return response[0].logo;
    },
    addMail: async (data) => {
        console.log(data);
        let qb = await pool.get_connection();
        let response = await qb.returning("id").insert(mailtable, data);
        qb.release();
        console.log(qb.last_query());
        return response;
    },
    selectOneMerchant: async (condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(
                "id,theme,icon,logo, use_logo,we_accept_image, brand_color, accent_color,branding_language"
            )
            .where(condition)
            .get(merchant_deta);
        qb.release();

        return response[0];
    },
    get_company_name: async (data) => {
        const qb = await pool.get_connection();
        const response = await qb
            .select("merchant_id,company_name")
            .from(merchant_table)
            .get(data);
        qb.release();
        const result = {};
        response.forEach((element) => {
            result[element.merchant_id] = element.company_name;
        });
        return result;
    },

    select_pay: async (
        and_condition,
        date_condition,
        limit,
        like_condition
    ) => {
        let qb = await pool.get_connection();
        let response;

        let final_cond = " where ";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(
                and_condition
            );
            final_cond = final_cond + condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(
                date_condition.from_date,
                date_condition.to_date,
                "added_date"
            );
            if (final_cond == " where ") {
                final_cond = final_cond + date_condition_str;
            } else {
                final_cond = final_cond + " and " + date_condition_str;
            }
        }

        if (final_cond == " where ") {
            final_cond = "";
        }

        let query =
            "select id,subscription_id,payment_id,plan_name,plan_billing_frequency,payment_interval,email,status,plan_currency,plan_billing_amount,start_date,added_date from " +
            subscriptiontable +
            final_cond +
            " AND `email` LIKE '%" +
            like_condition.email +
            "%' AND `plan_name` LIKE '%" +
            like_condition.plan_name +
            "%'" +
            " order BY ID DESC limit " +
            limit.start +
            "," +
            limit.perpage;

        console.log("query => ", query);

        response = await qb.query(query);
        //   console.log("select * from " + paytable + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage);
        qb.release();

        return response;
    },

    selectSubscriber: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .order_by("added_date", "asc")
            .get(subscriptiontable);
        qb.release();
        //console.log(response[0])
        return response[0];
    },
    selectSubsPay: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .order_by("added_date", "asc")
            .get(paytable);
        qb.release();
        // console.log(qb.last_query())
        return response;
    },
    updateDynamic: async (condition, data, table_name) => {
        let db_table = config.table_prefix + table_name;
        let qb = await pool.get_connection();
        let response = await qb.set(data).where(condition).update(db_table);
        qb.release();
        console.log(qb.last_query());
        return response;
    },

    get_needed_info: async (subs_id) => {
        let qb = await pool.get_connection();
        let response;

        let query = `SELECT  s.subscription_id, o.amount AS last_payment_amount, o.updated_at AS last_payment_date, COUNT(o.order_id) AS last_payment_term FROM  pg_subscription AS s INNER JOIN pg_subs_payment AS sp ON s.subscription_id = sp.subscription_id INNER JOIN pg_orders AS o ON sp.order_no = o.order_id WHERE s.subscription_id = '${subs_id}' GROUP BY s.subscription_id ORDER BY o.updated_at DESC LIMIT 1;`;

        response = await qb.query(query);

        qb.release();

        return response;
    },
};

module.exports = dbModel;
