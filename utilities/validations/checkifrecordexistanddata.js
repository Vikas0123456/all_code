const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
module.exports = async (selection,conditions,table_name) => {
    let qb = await pool.get_connection();
    let response = await qb
        .select(selection)
        .where(conditions)
        .get(config.table_prefix + table_name);
       
    qb.release();

    console.log(qb.last_query())
    if (response.length > 0) {
        return response[0];
    } else {
        return false;
    }
}