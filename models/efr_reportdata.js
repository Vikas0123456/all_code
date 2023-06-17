const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'efr_reportdata';
const exceptionTable = config.table_prefix + 'exception_log';
const helpers = require('../utilities/helper/general_helper')

const efr_exportdata = {
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(dbtable, data);
        qb.release();
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

    exception_select: async (filter, limit) => {
        let qb = await pool.get_connection();  
        const response = await qb.query('SELECT * FROM ' + exceptionTable + filter + limit);
        console.log(response);
        qb.release();
        return response;
    },

    countexc_eptiondata: async (filter, limit) => {
        let qb = await pool.get_connection();
        let response;
        response = await qb.query('SELECT COUNT(id) AS TOTAL_COUNT FROM ' + exceptionTable + filter);
        console.log(response);
        qb.release();
        return response[0];
    },


}

module.exports = efr_exportdata;