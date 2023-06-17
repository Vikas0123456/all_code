require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'store_status_master';

var dbModel = {
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbtable);
        qb.release();
        return response[0];
    },
    select: async (limit) => {
        let qb = await pool.get_connection();
        let response;
        if(limit.perpage){
            response = await qb
                .select('*')
                .order_by('id','asc').limit(limit.perpage, limit.start)
                .get(dbtable);
            qb.release();
        }else{
            response = await qb
                .select('*')
                .order_by('id','asc')
                .get(dbtable);
            qb.release();
        }
        return response;
    },
    get_count: async () => {
        let qb = await pool.get_connection();
        response = await qb
            .query("select count('id') as count from " + dbtable);
        qb.release();
        return response[0].count;
    },
}
module.exports = dbModel;