require('dotenv').config({ path: '../.env' });
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'activity_logs';
const helpers = require('../utils/helper/general_helper');

const activityLogs = {
  add: async (data) => {
    let qb = await pool.get_connection();
    let response = await qb.returning('id').insert(dbtable, data);
    qb.release();
    return response;
  },
  select: async (condition, limit) => {
    let qb = await pool.get_connection();
    let response;
    if (limit.perpage) {
      response = await qb
        .select('*')
        .where(condition)
        .order_by('id', 'desc')
        .limit(limit.perpage, limit.start)
        .get(dbtable);
      qb.release();
    } else {
      response = await qb
        .select('*')
        .where(condition)
        .order_by('id', 'desc')
        .get(dbtable);
      qb.release();
    }
    return response;
  },
  selectOne: async (selection, condition) => {
    let qb = await pool.get_connection();
    response = await qb
      .select(selection)
      .where(condition)
      .order_by('email', 'asc')
      .get(dbtable);
    qb.release();
    return response[0];
  },
  updateDetails: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb.set(data).where(condition).update(dbtable);
    qb.release();
    return response;
  },
  get_count: async (condition_obj) => {
    let qb = await pool.get_connection();
    let condition = await helpers.get_conditional_string(condition_obj);
    response = await qb.query(
      "select count('id') as count from " + dbtable + ' where ' + condition,
    );
    qb.release();
    return response[0].count;
  },
};

module.exports = activityLogs;
