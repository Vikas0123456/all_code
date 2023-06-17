const path = require('path');
require('dotenv').config({ path: '../.env' });
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const pool = require('../config/database');
const dbTable = config.table_prefix + 'master_merchant';
const onboardingLogsTable = config.table_prefix + 'onboarding_logs';
const superMerchantTable = config.table_prefix + 'master_super_merchant';
const merchantDetailTable = config.table_prefix + 'master_merchant_details';
const merchantPSPStatus = config.table_prefix + 'merchant_psp_status';
const merchantKeyAndSecret = config.table_prefix + 'master_merchant_key_and_secret';
const businessOwnerTable = config.table_prefix + 'merchant_business_owners';
const executiveTable = config.table_prefix + 'merchant_business_executives';
const merchantDocTable = config.table_prefix + 'merchant_entity_document';
const helpers = require('../utilities/helper/general_helper');

var MerchantEkycModel = {
    select: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(dbTable);
        qb.release();
        return response[0];
    },
    
    select_first: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition).order_by('id', 'asc')
            .get(dbTable);
        qb.release();
        return response[0];
    },
    select_super_merchant: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(superMerchantTable);
        qb.release();
        return response[0];
    },
    selectMcc: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,mcc_category')
            .where({ deleted: 0, status: 0 })
            .get(config.table_prefix + 'master_mcc_category');
        qb.release();
        return response;
    },
    fetchChild: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('`id`, `mcc`, `description`,')
            .from(config.table_prefix + 'mcc_codes')
            .where(condition)
            .get();
        qb.release();
        return response;
    },
    selectPspByMcc: async (mcc_code) => {
        let qb = await pool.get_connection();
        let query = 'SELECT id,name,status FROM ' + config.table_prefix + 'psp WHERE FIND_IN_SET("' + mcc_code + '",mcc) AND status=0 AND deleted=0';
        let response = await qb.query(query);
        return response;
    },
    merchantDetails: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id')
            .from(config.table_prefix + 'master_merchant_details')
            .where(condition)
            .get();
        qb.release();
        return response[0];
    },
    insertMerchantDetails: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchantDetailTable, data);
        qb.release();
        return response;

    },
    insertPspStatus: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(merchantPSPStatus, data);
        qb.release();
        return response;

    },
    updateMerchantDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(merchantDetailTable);
        qb.release();
        return response;
    },
    update: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(dbTable);
        qb.release();
        return response;
    },
    updateDetails: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(superMerchantTable);
        qb.release();
        return response;
    },
    updateDynamic: async (condition, data, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(table_name);
        qb.release();
        return response;
    },
    updateOwner: async (condition, data) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(businessOwnerTable);
        qb.release();
        return response;
    },
    addBusinessOwner: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(businessOwnerTable, data);
        qb.release();
        return response;
    },
    selectBusiness: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(businessOwnerTable);
        qb.release();

        return response;
    },
    addExecutive: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(executiveTable, data);
        qb.release();
        return response;
    },
    selectDynamic: async (selection, condition, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(table_name);
        qb.release();
        return response;
    },
    selectDynamicOwnerData: async (selection, condition, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(table_name);
        qb.release();
        return response[0];
    },
    selectDynamicSingle: async (selection, condition, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(table_name);
        qb.release();
        return response[0];
    },
    selectMerchantDetails: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(merchantDetailTable);
        qb.release();
        return response[0];
    },
    selectFullProfile: async (condition) => {

        let qb = await pool.get_connection();
        let response = await qb
            .select("mm.`id`,mm.store_id,sm.company_name as business_name, sm.name,sm.mobile_no,sm.code,sm.email,mm.referral_code,mm.`ekyc_done`,mm.`video_kyc_done`,mm.`onboarding_done`,mm.`ekyc_required`,mm.`main_step`,mm.live,md.`register_business_country`, md.`type_of_business`, md.`is_business_register_in_free_zone`, md.`company_name`, md.`company_registration_number`, md.`vat_number`, md.`doing_business_as`, md.`register_business_address_country`, md.`address_line1`, md.`address_line2`, md.`province`, md.`business_phone_code`, md.`business_phone_number`, md.`mcc_codes`,md.`other_mcc_title`, md.`psp_id`, md.`business_website`, md.`product_description`, md.`legal_person_first_name`, md.`legal_person_last_name`, md.`legal_person_email`, md.`job_title`, md.`nationality`, md.`dob`, md.`home_address_country`, md.`home_address_line_1`, md.`home_address_line_2`, md.`home_province`, md.`home_phone_code`, md.`home_phone_number`, md.`personal_id_number`, md.`statement_descriptor`, md.`shortened_descriptor`, md.`customer_support_phone_code`, md.`customer_support_phone_number`, md.`iban`, md.`bank_name`,md.`branch_name`,md.bank_country,md.bank_currency,md.bank_document_type,md.bank_document,md.account_no,md.swift, md.`poc_name`, md.`poc_email`, md.`poc_mobile_code`,md.`poc_mobile`,md.`tech_name`,md.`tech_email`,md.`tech_mobile_code`,md.`tech_mobile`, md.`fin_name`,md.`fin_email`,md.`fin_mobile_code`,md.fin_mobile,md.`link_tc`,md.`link_pp`,md.`link_refund`,md.`link_cancellation`,md.`link_delivery_policy`,md.`last_updated`,md.transaction_currencies,md.settlement_currency,md.estimated_revenue_amount,c1.country_name as register_business_country_name,c2.country_name as register_business_address_country_name,c3.country_name as legal_person_home_address_country_name,et.entity as type_of_business_name,mc.description as mcc_codes_name,p.name as psp_name,s1.state_name as province_name,s2.state_name as legal_person_home_province_name,md.estimated_revenue_amount,md.settlement_currency,md.transaction_currencies,md.payment_status,md.payment_id,mm.mode")
            .from(config.table_prefix + "master_super_merchant sm")
            .join(config.table_prefix + "master_merchant mm", "sm.id=mm.super_merchant_id", "left")
            .join(config.table_prefix + "master_merchant_details md", "mm.id=md.merchant_id", "left")
            .join(config.table_prefix + "country c1", "md.register_business_country=c1.id", "left")
            .join(config.table_prefix + "country c2", "md.register_business_country=c2.id", "left")
            .join(config.table_prefix + "country c3", "md.register_business_country=c3.id", "left")
            .join(config.table_prefix + "master_entity_type et", "md.type_of_business=et.id", "left")
            .join(config.table_prefix + "mcc_codes mc", "md.mcc_codes=mc.id", 'left')
            .join(config.table_prefix + "psp p", "md.psp_id=p.id", "left")
            .join(config.table_prefix + "states s1", "md.province=s1.id", "left")
            .join(config.table_prefix + "states s2", "md.home_province=s2.id", "left")
            .where(condition)
            .get();
        qb.release();
        
        return response[0];
    },
    addMerchantDocs: async (data) => {
        let qb = await pool.get_connection();
        let response = await qb.insert(merchantDocTable, data);
        qb.release();
        return response;
    },
    updateMerchantDocs: async (data, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(merchantDocTable);
        qb.release();
        return response;
    },
    addDynamic: async (data, table) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(table, data);
        qb.release();
        return response;
    },
    getSelfieDocs: async (merchant_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("me.id as master_entity_id,med.document_name,med.sequence,med.id,med.entity_id,med.merchant_id,med.document_id,med.document_num")
            .from(config.table_prefix + "master_entity_document me")
            .join(config.table_prefix + "merchant_entity_document med", "me.document = med.sequence", "inner")
            .where({ 'med.merchant_id': merchant_id, 'me.match_with_selfie': 1, 'me.deleted': 0, 'med.deleted': 0 })
            .order_by('med.id', 'desc')
            .get();
        qb.release();
        if (response[0]) {
            return response[0];
        } else {
            return [];
        }

    },
    getSelfieDocsByEmiratesId: async (merchant_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("emirates_id,type_of_owner,first_name,last_name,emirates_id_no,country_of_residence,city_of_residence")
            .from(config.table_prefix + "merchant_business_owners")
            .where({ 'merchant_id': merchant_id, 'deleted': 0 })
            .order_by('id', 'desc')
            .get();
        qb.release();
        let authorized_owner = [];
        for (let owner of response) {
            let type_of_owner = owner.type_of_owner.split(',');
            if (type_of_owner[1] == 'authorized signatory') {
                authorized_owner.push(owner);
            }
        }
        
        if (authorized_owner.length > 0) {
            return authorized_owner[0];
        } else {
            return response[0];
        }
    },
    selectKeyData: async (condition) => {
        let qb = await pool.get_connection();
        let response = qb.where({ 's.id': condition, 's.deleted': 0 }).select('m.id,m.type,m.merchant_id,m.merchant_key,m.merchant_secret,m.created_at').from(dbTable + ' s')
            .join(merchantKeyAndSecret + ' m', 's.id=m.merchant_id')
            .get();

        qb.release();
        return response;
    },
    selectAll: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(superMerchantTable);
        qb.release();
        return response;
    },
    get_count: async (condition_obj) => {
        let qb = await pool.get_connection();
        let condition = await helpers.get_conditional_string(condition_obj);
        response = await qb
            .query("select count('id') as count from " + executiveTable + " where " + condition);
        qb.release();
        return response[0].count;
    },
    removeEntityDoc: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb.delete(merchantDocTable, condition);
        return response;
    },
    selectDynamicSingleOrderBy: async (selection, condition, table_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .order_by('id', 'desc')
            .get(table_name);
        qb.release();
        return response[0];
    },
    selectBusinessTypeDocument: async (selection, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection)
            .where(condition)
            .get(config.table_prefix + 'merchant_entity_document');
        qb.release();
        return response;
    },
    updateMerchantBusinessTypeDocument: async (data, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(merchantDocTable);
        qb.release();
        return response;
    },
    get_onboarding_logs: async(and_condition,date_condition,limit)=>{
        let qb = await pool.get_connection();
        let response;

        let final_cond = "";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = " where " + condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_date");
            final_cond += (final_cond != "")?" AND "+date_condition_str:" where "+date_condition_str
        }

        let query = "select id,submerchant_id,section,sub_section,created_date from " + onboardingLogsTable + final_cond + " order BY ID DESC limit " + limit.start + "," + limit.perpage;
        response = await qb
            .query(query);
        qb.release();
        return response;
    },
    get_logs_count: async (and_condition, date_condition) => {
        let qb = await pool.get_connection();
        let response;

        let final_cond = "";
        if (Object.keys(and_condition).length) {
            let condition = await helpers.get_and_conditional_string(and_condition);
            final_cond = " where " + condition;
        }

        if (Object.keys(date_condition).length) {
            let date_condition_str = await helpers.get_date_between_condition(date_condition.from_date, date_condition.to_date, "created_date");
            final_cond += (final_cond != "")?" AND "+date_condition_str:" where "+date_condition_str
        }
        let query = "select count(id) as count from " + onboardingLogsTable + final_cond;
        response = await qb
            .query(query);
        qb.release();

        return response[0].count;
    },
};
module.exports = MerchantEkycModel;