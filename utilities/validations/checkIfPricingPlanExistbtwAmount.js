const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');

module.exports = async (from_amount,to_amount,table_name,exclude_id) => {
    let qb = await pool.get_connection();
    let query;
    if(exclude_id){
        query = `select * from ${config.table_prefix}${table_name} 
        WHERE ((${from_amount} BETWEEN from_amount AND to_amount)
        OR (${to_amount} BETWEEN from_amount AND to_amount)) AND (id != ${exclude_id})`
    } else {
        query = `select * from ${config.table_prefix}${table_name} 
        WHERE (${from_amount} BETWEEN from_amount AND to_amount)
        OR ((${to_amount} BETWEEN from_amount AND to_amount))` 
    }

    let response = await qb
        .query(query);
    qb.release();
    if (response.length > 0) {
        return true;
    } else {
        return false;
    }
}