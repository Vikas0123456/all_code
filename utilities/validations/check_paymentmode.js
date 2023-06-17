const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
module.exports = async (payment_mode, psp, charges_type) => {

    let qb = await pool.get_connection();
    let query = "select * from " + config.table_prefix + "charges_transaction_setup where psp = " + psp + " AND charges_type =" + "'" + charges_type + "'" + " AND payment_mode IN " + "(" + "'" + payment_mode + "'" + ")";
    let response = await qb
        .query(query);
    qb.release();

    console.log(qb.last_query())
    if (response.length > 0) {
        return true;
    } else {
        return false;
    }
}