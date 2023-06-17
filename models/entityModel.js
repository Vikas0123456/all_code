const console = require('console');
const path = require('path');
require('dotenv').config({ path: '../.env' });
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbtable = config.table_prefix + 'master_entity_type';
const doctable = config.table_prefix + 'master_entity_document';
const masterEntityDocumentNameTable = config.table_prefix + 'master_entity_document_name';
const helpers = require('../utilities/helper/general_helper');

let dbModel = {
  add: async (data) => {
    let qb = await pool.get_connection();
    let response = await qb.returning('id').insert(dbtable, data);
    qb.release();
    return response;
  },
  addDocument: async (data) => {
    let qb = await pool.get_connection();
    let response = await qb.insert(doctable, data);
    qb.release();
    return response;
  },
  select: async (condition, limit) => {
    let qb = await pool.get_connection();
    let response;
    if (limit.perpage) {
      response = await qb
        .select('*')
        .where(condition).order_by('entity', 'asc').limit(limit.perpage, limit.start)
        .get(dbtable);
      qb.release();
    } else {
      response = await qb
        .select('*')
        .where(condition).order_by('entity', 'asc')
        .get(dbtable);
      qb.release();
    }
    
    return response;
  },
  select_document: async (condition, limit) => {
    let qb = await pool.get_connection();
    let response;
    if (limit.perpage) {
      response = await qb.select('e.id, e.entity,e.status,d.document,d.required, d.issue_date_required, d.expiry_date_required').where(condition).from(config.table_prefix + 'master_entity_type e').join(config.table_prefix + 'master_entity_document  d', 'd.entity_id = e.id').limit(limit.perpage, limit.start);
      qb.release();
    } else {
      response = await qb.select('e.id, e.entity,e.status,d.document,d.required, d.issue_date_required, d.expiry_date_required').where(condition).from(config.table_prefix + 'master_entity_type e').join(config.table_prefix + 'master_entity_document  d', 'd.entity_id = e.id');
    }
    return response;
  },

  list_of_document: async (condition) => {
    const qb = await pool.get_connection();
    let response = await qb
      .select('*')
      .where(condition)
      .get(doctable);
    qb.release();  
    return response;
  },
  document_name_list: async () => {
    const qb = await pool.get_connection();
    let response = await qb
      .select('document_name')
      .get(masterEntityDocumentNameTable);
    qb.release();
    return response;
  },

  selectSpecific: async (selection, condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select(selection)
      .where(condition)
      .get(dbtable);
    qb.release();
    return response;
  },
  selectOne: async (selection, condition) => {
    let qb = await pool.get_connection();
    let response = await qb
      .select(selection)
      .where(condition)
      .get(dbtable);
    qb.release();
    return response[0];
  },

  updateDetails: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb
      .set(data)
      .where(condition)
      .update(dbtable);
    qb.release();
    return response;
  },

  update_document: async (condition, data) => {
    let qb = await pool.get_connection();
    let response = await qb
      .set(data)
      .where(condition)
      .update(doctable);
    qb.release();
    return response;
  },

  get_count: async (conditionObj) => {
    let qb = await pool.get_connection();
    let condition = await helpers.get_conditional_string(conditionObj);
    let response = await qb
      .query('select count(\'id\') as count from ' + dbtable + ' where ' + condition);
    qb.release();
    return response[0].count;
  },
};

module.exports = dbModel;
