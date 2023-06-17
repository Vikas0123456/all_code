require('dotenv').config({
    path: "../.env"
});
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require("../config/database");
const helpers = require('../utilities/helper/general_helper');
const dbTable = config.table_prefix + 'card_variant_master'

const card_variant = {

    selectAll: async (selection, condition, limit) => {
        let qb = await pool.get_connection()
        let response
        if (limit.perpage) {
            response = await qb
                .select(selection)
                .where(condition).order_by('id', 'asc').limit(limit.perpage, limit.start)
                .get(dbTable);
            qb.release();
        } else {
            response = await qb
                .select(selection)
                .where(condition).order_by('id', 'asc')
                .get(dbTable);
            qb.release();
        }
        return response
    },
    
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + dbTable + " where " + condition);
        qb.release();
        return response[0].count;
    },

}

module.exports = card_variant