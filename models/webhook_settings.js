const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'webhook_settings';
const helpers = require('../utilities/helper/general_helper')

const webhook = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
        return response;
    },
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
                .select(selection)
                .where(condition).order_by('id','asc')
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
}

module.exports = webhook;