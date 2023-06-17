const path = require('path')
require('dotenv').config({
    path: "../.env"
});
const env = process.env.ENVIRONMENT
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const mcc_dbtable = config.table_prefix + 'mcc_codes';
const psp_table = config.table_prefix + 'psp';
const rates_table = config.table_prefix + 'master_acquirer_direct_rate';
const terminalRatesTable = config.table_prefix + 'terminal_acquirer_rate';
const helpers = require('../utilities/helper/general_helper')
let PspModel = {
    selectAll: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(mcc_dbtable);
        qb.release();
        return response;
    },
    add: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(psp_table, data);
        qb.release();
        return response;
    },
    select: async (selection, limit, and_conditions, and_or_condtions, like_conditions) => {

        let qb = await pool.get_connection();

        let limit_cond = ''
        if(limit.perpage){
            limit_cond = " limit "+limit.start+","+limit.perpage+" ";
        }

        if (Object.keys(like_conditions).length && Object.keys(and_or_condtions).length) {
            let condition = await helpers.get_and_conditional_string(and_conditions);
            let search_text = await helpers.get_conditional_or_like_string(like_conditions);
            let psp = await helpers.get_conditional_like_string(and_or_condtions);

            var response = await qb.query("select " + selection + " from " + psp_table + " where " + condition + psp + " and (" + search_text + ") "+limit_cond);
            qb.release();

        } else if (Object.keys(like_conditions).length) {
            let condition = await helpers.get_and_conditional_string(and_conditions);
            let search_text = await helpers.get_conditional_or_like_string(like_conditions);
            var response = await qb.query("select " + selection + " from " + psp_table + " where " + condition + " and (" + search_text + ") "+limit_cond);

            qb.release();
            // qb.select(selection)
            // if(Object.keys(and_conditions).length ){
            //     qb.where(and_conditions)  
            // }
            // let j =0;
            // for (var key in and_or_condtions) {
            //     var value = and_or_condtions[key];
            //     qb.like('mcc','%'+value+'%');
            // }
            // let i =0;
            // for (var key in like_conditions) {
            //     var value = like_conditions[key];
            //     if(i==0)
            //     qb.like({[key]:value})
            //     else
            //     qb.or_like({[key]:value});
            //     i++;
            // }

            // qb.limit(limit.perpage, limit.start)
            // var response = await qb.get(psp_table);
            // console.log(qb.last_query())
            // qb.release();
        } else if (Object.keys(and_or_condtions).length) {
            let condition = await helpers.get_and_conditional_string(and_conditions);
            let search_text = await helpers.get_conditional_or_like_string(like_conditions);
            let psp = await helpers.get_conditional_like_string(and_or_condtions);

            var response = await qb.query("select " + selection + " from " + psp_table + " where " + condition + psp+limit_cond);
            qb.release();
        } else {
            let condition = await helpers.get_and_conditional_string(and_conditions);
            let search_text = await helpers.get_conditional_or_like_string(like_conditions);
            let psp = await helpers.get_conditional_like_string(and_or_condtions);

            var response = await qb.query("select " + selection + " from " + psp_table + " where " + condition+limit_cond);
            qb.release();
        }

        return response;
    },
    selectOne: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .get(psp_table);
        qb.release();
        return response[0];
    },
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(psp_table);
        qb.release();
        return response;
    },
    get_psp: async () => {
        let qb = await pool.get_connection();
        let query = "select count('id') as count from " + psp_table + ' where deleted=0 and status=0';
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
    },
    get_count: async (and_conditions, and_or_condtions, like_conditions) => {
        let qb = await pool.get_connection();
        let query = "select count('id') as count from " + psp_table + ' where deleted=0';
        let j = 0;
        for (var key in and_or_condtions) {
            var value = and_or_condtions[key];
            query += ' and ' + key + ' like "%' + value + '%" ';
        }
        let i = 0;
        for (var key in like_conditions) {
            var value = like_conditions[key];
            if (i == 0) {
                query += ' and ' + key + ' like "%' + value + '%" ';
            } else {
                query += ' or ' + key + ' like "%' + value + '%" ';
            }
            i++;
        }
        response = await qb
            .query(query);
        qb.release();
        return response[0].count;
    },
    get_psp_by_merchant: async (condition) => {
        let qb = await pool.get_connection();
        let query = "select psp.name from " + config.table_prefix + "merchant_psp_status mps INNER JOIN " + config.table_prefix + "psp  psp on mps.psp_id= psp.id  where   " + condition;

        response = await qb
            .query(query);
        qb.release();
        return response;
    },
    get_psp_by_merchant_admin: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('name')
            .from(config.table_prefix + 'psp')
            .where({
                deleted: 0,
                status: 0
            })
            .get();
        qb.release();
        return response;
    },
    getMccName: async (mcc_codes) => {
        let mcc_codes_array = mcc_codes.split(',');
        let new_mcc_codes_array = [];
        for (i of mcc_codes_array) {
            new_mcc_codes_array.push('"' + i + '"')
        }
        let qb = await pool.get_connection();
        response = await qb.query("select GROUP_CONCAT(description) as name from " + mcc_dbtable + " where id in (" + new_mcc_codes_array.join(',') + ")");
        qb.release();
        return response[0].name;
    },

    getPspName: async (psp_codes) => {

        let psp_codes_array = psp_codes.split(',');
        let new_psp_codes_array = [];
        for (i of psp_codes_array) {
            new_psp_codes_array.push('"' + i + '"')
        }
        let qb = await pool.get_connection();
        response = await qb.query("select GROUP_CONCAT(name) as name from " + psp_table + " where id in (" + new_psp_codes_array.join(',') + ")");
        qb.release();

        return response[0].name;
    },

    addRates: async (data) => {
        let qb = await pool.get_connection();
        let response_array = []
        for (let i = 0; i < data.length; i++) {
            let response = await qb.returning('id').insert(rates_table, data[i]);
            response_array.push(response);
        }
        qb.release();
        return response_array;
    },

    selectRates: async (selection, condition) => {
        let qb = await pool.get_connection();
        response = await qb
            .select(selection)
            .where(condition)
            .get(rates_table);
        qb.release();
        return response;
    },

    updateRates: async (data, condition) => {
        let qb = await pool.get_connection();
        response = await qb.set(data).where(condition).update(rates_table);
        qb.release();
        return response;
    },
  addTerminalRates: async (data) => {
    let qb = await pool.get_connection();
    let responseArray = [];
    for (let i = 0; i < data.length; i++) {
      let response = await qb.returning('id').insert(terminalRatesTable, data[i]);
      responseArray.push(response);
    }
    qb.release();
    return responseArray;
  },
  selectTerminalRates: async (selection, condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select(selection)
      .where(condition)
      .get(terminalRatesTable);
    qb.release();
    return response;
  },
  updateTerminalRates: async (data, condition) => {
    let qb = await pool.get_connection();
    let response = await qb.set(data).where(condition).update(terminalRatesTable);
    qb.release();
    return response;
  },
  // deleteRates: async()

};
module.exports = PspModel;