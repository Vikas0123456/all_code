const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
module.exports = async (id, table_name) => {
    let qb = await pool.get_connection();
    let response = await qb
        .select('*')
        .where('id', id)
        .get(config.table_prefix + table_name);
    qb.release();
    if (response.length > 0) {
        return true;
    } else {
        return false;
    }
}