const path = require('path');
require('dotenv').config({ path: '../.env'});
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const pool = require('../config/database');
let dbTable= config.table_prefix+'dynamic_pricing_calculation';
const helpers = require('../utilities/helper/general_helper');
let dynamicPricingCalculation = {
  checkLastMonthlyChargesTaken:async(merchantId)=>{
    let query = 'SELECT * FROM '+dbTable+' WHERE merchant_id = '+merchantId+' AND txn_type = \'Monthly fees\' ORDER BY ID DESC LIMIT 1';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?.id?response[0]:0;
  },
  selectOne: async (selection, condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select(selection)
      .where(condition)
      .get(dbTable);
    qb.release();
    return response[0];
  },
  getCurrentMonthChargesTaken:async(merchantId)=>{
    let query = 'SELECT * FROM '+dbTable+' WHERE merchant_id = '+merchantId+' AND MONTH(added_date) = MONTH(CURRENT_DATE()) AND YEAR(added_date) = YEAR(CURRENT_DATE()) AND txn_type = \'Monthly fees\' ORDER BY ID DESC LIMIT 1';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?.id?response[0]:0;
  },
  update:async(data, condition)=>{
    let qb = await pool.get_connection();
    let response = await qb
      .set(data)
      .where(condition)
      .update(dbTable);
    qb.release();
    return response;
  },
  insert: async (data) => {
    let qb = await pool.get_connection();
    let response = await qb.returning('id').insert(dbTable, data);
    qb.release();
    return response;
  },
  getBalance: async(merchantId)=>{
    let query = 'SELECT balance FROM '+dbTable+' WHERE merchant_id = '+merchantId+' ORDER BY ID DESC LIMIT 1';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?.balance?response[0].balance:0;
  },
  mdr_credit_for_slab_changes: async(merchantId, lastMonthlyId)=>{
    let query = 'SELECT SUM(mdr) as mdr_credit,SUM(txn_fees) as txn_fees FROM '+dbTable+' WHERE merchant_id = '+merchantId+' and id > '+lastMonthlyId;
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0];
  },
  mdr_for_slab_changes: async(merchantId, lastMonthlyId)=>{
    let query = 'SELECT SUM(volume) as volume,SUM(no_of_txn) as no_of_txn FROM '+dbTable+' WHERE merchant_id = '+merchantId +' and id > '+lastMonthlyId+' AND MONTH(added_date) = MONTH(CURRENT_DATE()) AND YEAR(added_date) = YEAR(CURRENT_DATE()) AND txn_type = \'Sales\'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0];
  },
  select: async (andCondition, dateCondition, limit) => {
    let qb = await pool.get_connection();
    let response;

    let finalCondition = '';
    if (Object.keys(andCondition).length) {
      let condition = await helpers.get_and_conditional_string(andCondition);
      finalCondition = ' where ' + condition;
    }

    if (Object.keys(dateCondition).length) {
      let dateConditionStr = await helpers.get_date_between_condition(dateCondition.from_date, dateCondition.to_date, 'added_date');
      finalCondition += (finalCondition !== '')?' AND '+dateConditionStr:' where '+dateConditionStr;
    }

    let query = 'select * from ' + dbTable + finalCondition + ' order BY ID DESC limit ' + limit.start + ',' + limit.perpage;
    response = await qb
      .query(query);
    qb.release();

    return response;
  },
  get_count: async (andCondition, dateCondition) => {
    let qb = await pool.get_connection();
    let response;

    let finalCondition = '';
    if (Object.keys(andCondition).length) {
      let condition = await helpers.get_and_conditional_string(andCondition);
      finalCondition = ' where ' + condition;
    }

    if (Object.keys(dateCondition).length) {
      let dateConditionStr = await helpers.get_date_between_condition(dateCondition.from_date, dateCondition.to_date, 'added_date');

      finalCondition += (finalCondition !== '')?' AND '+dateConditionStr:' where '+dateConditionStr;
    }
    let query = 'select count(id) as count from ' + dbTable + finalCondition;
    response = await qb
      .query(query);
    qb.release();

    return response[0].count;
  },
  currentMonthTxnSum:async(merchantId)=>{
    let dbTable= config.table_prefix+'order_txn';
    let query = 'SELECT SUM(amount) as amount FROM '+dbTable+' WHERE merchant_id = '+merchantId+' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) AND status = \'APPROVED\' and type = \'SALE\'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?.amount?response[0].amount:0;
  },
  getTxnTotalByDate:async(merchantId, date)=>{
    let dbTable = config.table_prefix + 'order_txn';
    let query = 'SELECT SUM(amount) as total, count(\'id\') as count from '+dbTable+' WHERE merchant_id = '+merchantId+' AND date(`created_at`) =\''+date+'\' AND status = \'APPROVED\' and type = \'SALE\'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?response[0]:0;
  },
  getTxnRefundTotalByDate:async(merchantId, date)=>{
    let dbTable = config.table_prefix + 'order_txn';
    let query = 'SELECT SUM(amount) as total, count(\'id\') as count from '+dbTable+' WHERE merchant_id = '+merchantId+' AND date(`created_at`) =\''+date+'\' AND status = \'APPROVED\' and type = \'REFUND\'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?response[0]:0;
  },
  checkLastTransactionId:async(merchantId)=>{
    let dbTable= config.table_prefix+'order_txn';
    let query = 'SELECT max(id) as id FROM '+dbTable+' WHERE merchant_id = '+merchantId+' AND status = \'APPROVED\' and type = \'SALE\'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0]?.id?response[0].id:0;
  },
  getCountForTxnType:async(merchantId, date)=>{
    let query = 'SELECT merchant_id, GROUP_CONCAT(txn_type) as txn_type from '+dbTable+' WHERE DATE(added_date) = \''+ date +'\' AND merchant_id = '+merchantId+'';
    let qb = await pool.get_connection();
    let response = await qb.query(query);
    qb.release();
    return response[0];
  },
};  
module.exports = dynamicPricingCalculation;