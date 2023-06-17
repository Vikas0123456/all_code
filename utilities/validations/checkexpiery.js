const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
module.exports = async (condition,type, table_name) => {
let date = new Date().toJSON().slice(0, 10);
    let qb = await pool.get_connection();
    let query = "select * from " + config.table_prefix + table_name + " where id =" + condition + " and end_date >= " +"'"+ date +"'" + " and type_of_qr_code =" +"'" +type+"'";
    let response = await qb
        .query(query);
    qb.release();

    console.log(query)
    if (response.length > 0) {
        return true;
    } else {
        return false;
    }
}
