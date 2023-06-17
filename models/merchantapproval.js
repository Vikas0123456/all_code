require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
const dbtable = config.table_prefix + "master_merchant_approval";
const aptable =  config.table_prefix + "merchant_approval_activity";

var dbModel = {
    // add a merchant
    add: async (data) => {
        // console.log("data => ", data);
        let qb = await pool.get_connection();
        let response = await qb.returning("id").insert(dbtable, data);
        qb.release();
        return response;
    },

    // get all merchants
    select: async (condition, condition2, limit) => {
        let qb = await pool.get_connection();
        let response;
        if (limit.perpage) {
            response = await qb
                .select("*")
                .where(condition)
                .order_by("id", "asc")
                .limit(limit.perpage, limit.start)
                .get(dbtable);
            if (condition.email) {
                response = await qb
                    .select("*")
                    .where(condition)
                    .order_by("id", "asc")
                    .limit(limit.perpage, limit.start)
                    .get(dbtable);
            } else if (condition.mobile_no && condition.mobile_code) {
                response = await qb
                    .select("*")
                    .where(condition)
                    .or_where(condition2)
                    .order_by("id", "asc")
                    .limit(limit.perpage, limit.start)
                    .get(dbtable);
            } else {
                response = await qb
                    .select("*")
                    .where(condition)
                    .order_by("id", "asc")
                    .limit(limit.perpage, limit.start)
                    .get(dbtable);
            }
            qb.release();
        } else {
            response = await qb
                .select("*")
                .where(condition)
                .order_by("id", "asc")
                .get(dbtable);
            if (condition.email) {
                response = await qb
                    .select("*")
                    .where(condition)
                    .order_by("id", "asc")
                    .get(dbtable);
            } else if (condition.mobile_no && condition.code) {
                console.log("hotter3");
                response = await qb
                    .select("*")
                    .where(condition)
                    .or_where(condition2)
                    .order_by("id", "asc")
                    .get(dbtable);
            } else {
                response = await qb
                    .select("*")
                    .where(condition)
                    .order_by("id", "asc")
                    .get(dbtable);
            }
            qb.release();
        }
        return response;
    },

    // get a merchant
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(dbtable);
        qb.release();
        console.log(response);
        return response[0];
    },

     selectList: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(dbtable);
        qb.release();
        console.log(response);
        return response;
    },
    
     selectApprovalList: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(config.table_prefix + "merchant_approval_activity");
        console.log("🚀 ~ file: merchantapproval.js:105 ~ selectApprovalList: ~ response:", response)
        qb.release();
        return response;
    },
    
    
    // get a merchant
    selectAllOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb.select(selection).where(condition).get(dbtable);
        qb.release();
        console.log(response);
        return response;
    },
    // update a merchant details
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb.set(data).returning("id").where(condition).update(dbtable);
        qb.release();
        return response;
    },


    addApprovalActivaty : async(data) =>{
        let qb = await pool.get_connection();
        let response = await qb.returning("id").insert(aptable, data);
        qb.release();
        return response;
    }
};
module.exports = dbModel;