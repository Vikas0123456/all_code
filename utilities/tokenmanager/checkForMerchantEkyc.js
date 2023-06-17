const path = require('path')
require('dotenv').config({ path: "../../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
const enc_dec = require('../decryptor/decryptor');
module.exports = async (req,res,next) => {
    let qb = await pool.get_connection();
    let response = await qb
        .select('super_merchant_id,name,email')
        .where({id:enc_dec.cjs_decrypt(req.bodyString('submerchant_id'))})
        .get(config.table_prefix + 'master_merchant');
    qb.release();
    console.log(qb.last_query());
    if (response.length > 0) {
        let user = {
            id:response[0].super_merchant_id,
            name:response[0].name,
            email:response[0].email,
            type:'merchant'
        }
        console.log(user);
        req.user = user;
        next();
    } else {
        return false;
    }
}