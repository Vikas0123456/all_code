const path = require('path')
require('dotenv').config({
    path: "../.env"
});
const MerchantActivaty = require('../../models/merchantapproval');
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
const enc_dec = require("../decryptor/decryptor")
const encrypt_decrypt = require('../decryptor/encrypt_decrypt');
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
const fs = require('fs')
const axios = require('axios')
const moment = require('moment');
const statusCode = require('../statuscode');
function randomString(length, capslock = 0) {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    if (capslock == 1) {
        return result.toUpperCase();
    } else {
        return result;
    }

}
function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}

var helpers = {
    make_random_key: async (pre) => {
        let today = new Date();
        let day = today.getDate();
        let month = today.getMonth();
        let year = today.getFullYear();
        let str = pre + '_';
        str += randomString(4) + year + randomString(4) + month + randomString(4) + day + randomString(4);
        return str
    },
    make_order_number: async (pre) => {
        let today = new Date();
        let day = today.getDate();
        let month = today.getMonth();
        let year = today.getFullYear();
        let str = pre;
        str += randomString(2, 1) + month + randomString(3, 1) + day + randomString(2, 1);
        return str
    },
    make_reference_number: async (pre, length) => {
        let str = pre;
        str += randomString(length, 1);
        return str
    },
    get_ip: async (req) => {
        return req.socket.remoteAddress
    },
    generateOtp: async (size) => {
        const zeros = '0'.repeat(size - 1);
        const x = parseFloat('1' + zeros);
        const y = parseFloat('9' + zeros);
        const confirmationCode = String(Math.floor(x + Math.random() * y));
        return confirmationCode;
    },
    get_merchant_api_key: async (mer_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('api_key').where({
                'merchant_id': mer_id,
                'deactivated': 0
            })
            .get(config.table_prefix + 'merchant_api_key');
        qb.release();

        if (response[0]) {
            return response[0].api_key;
        } else {
            return '';
        }
    },
    get_question_by_id: async (question_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('question').where({
                'id': question_id
            })
            .get(config.table_prefix + 'master_security_questions');
        qb.release();

        if (response[0]) {
            return response[0].question;
        } else {
            return '';
        }
    },
    get_country_name_by_iso: async (iso) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('country_name').where({
                'iso3': iso
            })
            .get(config.table_prefix + 'country');
        qb.release();

        if (response[0]) {
            return response[0].country_name;
        } else {
            return '';
        }
    },
    add_days_date: async (days) => {
        let day = parseInt(days);
        var result = new Date();
        result.setDate(result.getDate() + day);
        return new Date(result).toJSON().substring(0, 19).replace('T', ' ');
    },
    date_format: async (date) => {
        var date_format = new Date(date);
        formatted_date = pad2(date_format.getDate()) + '-' + pad2(parseInt(date_format.getMonth()) + 1) + '-' + date_format.getFullYear();
        return formatted_date;
    },
    get_country_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('country_name').where({
                'id': id
            })
            .get(config.table_prefix + 'country');
        qb.release();
        //console.log(qb.last_query());
        if (response[0]) {
            return response[0].country_name;
        } else {
            return '';
        }
    },
    get_country_name_by_ids: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,country_name').where({
                'id': idsArr
            })
            .get(config.table_prefix + 'country');
        qb.release();
        //console.log(qb.last_query());
        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.country_name;
            });
            return result;
        } else {
            return {};
        }
    },

    get_state_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('state_name').where({
                'id': id
            })
            .get(config.table_prefix + 'states');
        qb.release();

        if (response[0]) {
            return response[0].state_name;
        } else {
            return '';
        }
    },

    get_state_name_by_ids: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,state_name').where({
                'id': idsArr
            })
            .get(config.table_prefix + 'states');
        qb.release();

        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.state_name;
            });

            return result;

        } else {
            return {};
        }
    },


    get_city_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('city_name').where({
                'id': id
            })
            .get(config.table_prefix + 'city');
        qb.release();

        if (response[0]) {
            return response[0].city_name;
        } else {
            return '';
        }
    },

    get_city_name_by_ids: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,city_name').where({
                'id': idsArr
            })
            .get(config.table_prefix + 'city');
        qb.release();
        //console.log(qb.last_query());
        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.city_name;
            });
            return result;
        } else {
            return {};
        }
    },
    get_currency_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('code').where({
                'id': id
            })
            .get(config.table_prefix + 'master_currency');
        qb.release();

        if (response[0]) {
            return response[0].code;
        } else {
            return '';
        }
    },
    get_currency_details: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('*').where(condition)
            .get(config.table_prefix + 'master_currency');
        qb.release();

        if (response[0]) {
            return response[0];
        } else {
            return '';
        }
    },
    get_country_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'country_name': name
            })
            .get(config.table_prefix + 'country');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_state_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'state_name': name
            })
            .get(config.table_prefix + 'states');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_city_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'city_name': name
            })
            .get(config.table_prefix + 'city');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_designation_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'designation': name,
                deleted: 0
            })
            .get(config.table_prefix + 'master_designation');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_department_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'department': name,
                deleted: 0
            })
            .get(config.table_prefix + 'master_department');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_business_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'type_of_business': name
            })
            .get(config.table_prefix + 'master_type_of_business');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_status: async (name) => {
        if (name === 'Deactivated') {
            return 1;
        }
        if (name === 'Active') {
            return 0;
        }
    },
    get_high_risk: async (name) => {
        console.log(name)
        if (name === 'suspicious_ip') {
            return "block_for_suspicious_ip";

        }
        if (name === 'high_risk_country') {
            return "high_risk_country";
        }
        if (name === 'high_risk_transaction') {
            return "high_risk_transaction";
        }
        if (name === 'high_volume_transaction') {
            return "block_for_transaction_limit";
        }
        if (name === 'suspicious_emails') {
            return "block_for_suspicious_email";
        }

    },
    get_risk_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += ", " + key;
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_conditional_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "and " + key + " = " + obj[key] + " ";
            }
        }
        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_join_conditional_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "and " + key + " = " + obj[key] + " ";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_and_conditional_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                let sign = '='
                let key1 = key
                if (key.indexOf(' ') >= 0) {
                    let key_arr = key.split(' ')
                    key1 = key_arr[0]
                    sign = key_arr[1]
                }
                output_string += "and " + key1 + sign + " '" + obj[key] + "' ";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_or_conditional_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "or " + key + " = '" + obj[key] + "' ";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },

    get_date_between_condition: async (from_date, to_date, db_date_field) => {
        return ("DATE(" + db_date_field + ") BETWEEN '" + from_date + "' AND '" + to_date + "'");
    },
    get_greater_than_equal_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "and " + key + " >= '" + obj[key] + "' ";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_less_than_equal_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "and " + key + " <= '" + obj[key] + "' ";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");

        return output_string1
    },
    get_conditional_like_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "and " + key + " LIKE '%" + obj[key] + "%'";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(0).join(" ");
        return output_string1
    },
    get_conditional_or_like_string: async (obj) => {
        var output_string = '';
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                output_string += "or " + key + " LIKE '%" + obj[key] + "%'";
            }
        }

        let words = output_string.split(" ");
        let output_string1 = words.slice(1).join(" ");
        return output_string1
    },
    get_language_json: async (condition) => {

        let qb = await pool.get_connection();
        let response = await qb
            .select('file,direction,flag,name').where(condition)
            .get(config.table_prefix + 'master_language');
        qb.release();
        const data = fs.readFileSync(path.resolve('public/language/' + response[0].file));
        return {
            data: JSON.parse(data),
            name: response[0].name,
            direction: response[0].direction,
            flag: server_addr + ':' + port + "/static/language/" + response[0].flag
        }
    },
    get_first_active_language_json: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('file,direction,flag,name').where(condition).limit(1)
            .get(config.table_prefix + 'master_language');
        qb.release();
        // const data  = fs.readFileSync(path.resolve('public/language/'+response[0].file));
        return {
            /*data:JSON.parse(data),*/
            name: response[0].name,
            direction: response[0].direction,
            flag: server_addr + ':' + port + "/static/language/" + response[0].flag,
            file_url: server_addr + ':' + port + "/static/language/" + response[0].file
        }
    },
    get_designation_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('designation').where({
                'id': id
            })
            .get(config.table_prefix + 'master_designation');
        qb.release();

        if (response[0]) {
            return response[0].designation;
        } else {
            return '';
        }
    },
    get_department_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('department').where({
                'id': id
            })
            .get(config.table_prefix + 'master_department');
        qb.release();

        if (response[0]) {
            return response[0].department;
        } else {
            return '';
        }
    },
    company_details: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('*')
            .where(condition)
            .get(config.table_prefix + 'company_master');
        qb.release();

        if (response[0]) {
            return response[0];
        } else {
            return '';
        }
    },
    updateDetails: async (condition, data, dbtable) => {
        let qb = await pool.get_connection();
        let response = await qb
            .set(data)
            .where(condition)
            .update(config.table_prefix + dbtable);
        qb.release();
        return response;
    },
    get_type_of_business: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('type_of_business').where({
                'id': id
            })
            .get(config.table_prefix + 'master_type_of_business');
        qb.release();

        if (response[0]) {
            return response[0].type_of_business;
        } else {
            return '';
        }
    },
    get_type_of_business_arr: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,type_of_business').where({
                'id': idsArr
            })
            .get(config.table_prefix + 'master_type_of_business');
        qb.release();
        //console.log(qb.last_query());
        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.type_of_business;
            });
            return result;
        } else {
            return {};
        }
    },
    get_entity_type: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('entity').where({
                'id': id
            })
            .get(config.table_prefix + 'master_entity_type');
        qb.release();

        if (response[0]) {
            return response[0].entity;
        } else {
            return '';
        }
    },
    get_psp_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('name').where({
                'id': id
            })
            .get(config.table_prefix + 'psp');
        qb.release();

        if (response[0]) {
            return response[0].name;
        } else {
            return '';
        }
    },
    get_admin_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('name').where({
                'id': id
            })
            .get(config.table_prefix + 'adm_user');
        qb.release();

        if (response[0]) {
            return response[0].name;
        } else {
            return '';
        }
    },
    get_psp_details_by_id: async (selection, id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection).where({
                'id': id
            })
            .get(config.table_prefix + 'psp');
        qb.release();

        if (response[0]) {
            return response[0];
        } else {
            return '';
        }
    },
    get_merchant_partner: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('partner_id').where({
                'id': id
            })
            .get(config.table_prefix + 'master_merchant');
        qb.release();

        if (response[0]) {
            return response[0].partner_id;
        } else {
            return '';
        }
    },
    get_merchant_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('mercahnt_name').where({
                'id': id
            })
            .get(config.table_prefix + 'master_merchant');
        qb.release();

        if (response[0]) {
            return response[0].mercahnt_name;
        } else {
            return '';
        }
    },
    get_merchant_details_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('company_name').where({
                'merchant_id': id
            })
            .get(config.table_prefix + 'master_merchant_details');
        qb.release();

        if (response[0]) {
            return response[0].company_name;
        } else {
            return '';
        }
    },

    get_merchant_details_name_by_ids: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('md.merchant_id,md.company_name,mm.store_id')
            .from(config.table_prefix + 'master_merchant_details md')
            .join(config.table_prefix + 'master_merchant mm', 'md.merchant_id=mm.id', 'inner')
            .where({
                'md.merchant_id': idsArr
            })
            .get();
        qb.release();

        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.merchant_id] = {
                    company_name: entity.company_name,
                    store_id: entity.store_id,
                };
            });
            return result;
        } else {
            return {};
        }
    },

    get_merchantdetails_email_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('email').where({
                'id': id
            })
            .get(config.table_prefix + 'master_merchant');
        qb.release();

        if (response[0]) {
            return response[0].email;
        } else {
            return '';
        }
    },
    get_title: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('title')
            .get(config.table_prefix + 'title');
        qb.release();

        if (response[0]) {
            return response[0].title;
        } else {
            return '';
        }
    },
    get_partner_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('name').where({
                'id': id
            })
            .get(config.table_prefix + 'master_partners');
        qb.release();

        if (response[0]) {
            return response[0].name;
        } else {
            return '';
        }
    },
    get_latest_type_of_txn: async (order_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('type').where({
                'order_id': order_id
            })
            .order_by('created_at')
            .limit(1)
            .get(config.table_prefix + 'order_txn');
        qb.release();

        if (response[0]) {
            return response[0].type;
        } else {
            return '';
        }
    },
    insert_data: async (data, dbtable) => {
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix + dbtable, data);
        qb.release();
        return response;
    },

    get_data_list: async (selection, dbtable, condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select(selection).where(condition)
            .get(config.table_prefix + dbtable);
        qb.release();
        console.log(qb.last_query());
        return response;
    },

    get_merchant_currency: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('currency').where({
                'id': id
            })
            .get(config.table_prefix + 'master_merchant');
        qb.release();

        if (response[0]) {
            return response[0].currency;
        } else {
            return '';
        }
    },
    get_token_check: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("*")
            .where(condition).order_by('id', "DESC").limit(1)
            .get(config.table_prefix + "password_token_check");
        qb.release();
        return response[0];
    },
    get_otp_check: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("*")
            .where(condition).order_by('id', "DESC").limit(1)
            .get(config.table_prefix + "email_otp_sent");
        qb.release();
        return response[0];
    },
    get_mobile_otp_check: async (condition) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("*")
            .where(condition).order_by('id', "DESC").limit(1)
            .get(config.table_prefix + "mobile_otp");
        qb.release();
        return response[0];
    },
    get_mcc_category_name_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('mcc_category').where({
                'id': id
            })
            .get(config.table_prefix + 'master_mcc_category');
        qb.release();

        if (response[0]) {
            return response[0].mcc_category;
        } else {
            return '';
        }
    },
    get_mcc_category_id_by_name: async (name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id').where({
                'mcc_category': name
            })
            .get(config.table_prefix + 'master_mcc_category');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },


    get_mcc_code_description: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('description').where({
                'id': id
            })
            .get(config.table_prefix + 'mcc_codes');
        qb.release();
        if (response[0]) {
            return response[0].description;
        } else {
            return '';
        }
    },

    get_mcc_category_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('mcc_category').where({
                'id': id
            })
            .get(config.table_prefix + 'master_mcc_category');
        qb.release();
        if (response[0]) {
            return response[0].mcc_category;
        } else {
            return '';
        }
    },



    get_document_by_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('document_name').where({
                'id': id
            })
            .get(config.table_prefix + 'master_entity_document');
        qb.release();

        if (response[0]) {
            return response[0].document_name;
        } else {
            return '';
        }
    },

    get_multiple_ids_encrypt: (ids_cs) => {
        let ids_css = String(ids_cs)
        let code_array = ids_css.split(',');
        let new_codes_array = []
        for (i of code_array) {
            new_codes_array.push(encrypt_decrypt('encrypt', i))
        }
        return new_codes_array.join();
    },

    complete_kyc_step: async (merchant_id, step) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('step_completed').where({
                'id': merchant_id
            })
            .get(config.table_prefix + 'master_merchant');
        let sequence;
        if (response[0]) {
            let sequence_arr = response[0].step_completed.split(",")

            if (sequence_arr.includes(step.toString())) {
                qb.release();
                return;
            } else {
                sequence_arr.push(step)
            }
            sequence_arr.sort();
            sequence = sequence_arr.join(",")

        } else {
            sequence = step
        }


        await qb
            .set({
                step_completed: sequence
            })
            .where({
                id: merchant_id
            })
            .update(config.table_prefix + 'master_merchant');
        qb.release();

        return;
    },

    doc_names: (seq) => {
        let req = {
            1: "Trade license",
            2: "ID proof",
            3: "ID proof auth sign",
            4: "MOA",
            5: "Proof of bank account",
        }
        return req[seq]
    },
    ekyc_steps: (seq) => {
        let req = {
            1: "Business Type",
            2: "Business details",
            3: "Business representative",
            4: "Business owners",
            5: "Business executives",
            6: "Public details",
            7: "Bank details",
        }
        return req[seq]
    },
    pushNotification: async (gcmid, title, message, url_, type, payload, user) => {
        let apiKey = "ZTMyMWI4MGEtYWJjNy00MjZmLWE4MGEtODcwMTc5MTliYWQz";
        url = 'https://onesignal.com/api/v1/notifications';

        let content = {
            "en": message
        }
        let headings = {
            "en": title
        }

        let fields = JSON.stringify({
            "include_player_ids": [gcmid],
            "app_id": "c8fd8633-83a0-4018-b482-04391429f80d",
            "body": message,
            "headings": headings,
            "contents": content,
            "title": title,
            "small_icon": "",
            "large_icon": "",
            "content_available": true,
            "data": {
                "title": title,
                "message": message,
                "type": type,
                "payload": payload
            }
        })

        function makeRequest(res_data, p_url, apiKey) {

            try {
                const config = {
                    method: 'post',
                    data: res_data,
                    url: p_url,
                    headers: {
                        'Authorization': 'Basic ' + apiKey,
                        'Content-Type': 'application/json'
                    }
                }

                let res = axios(config)
                console.log(res);
                return res.data
            } catch (error) {
                console.log(error);

            }
        }
        makeRequest(fields, url, apiKey)
    },


    pushNotificationtesting: async (gcmid = "6d422d5d-2dbf-4d44-a21d-6a3eb3594a31", title = "testing-title", message = "testing message", url_ = "testing url", type = "testing type", payload = {
        "abc": "payload object"
    }, user = "test user") => {
        let apiKey = "MGRhMzM5N2YtNWFkYS00NjgxLTk2OTQtMDBiZjMyNTgzM2Nj";
        url = 'https://onesignal.com/api/v1/notifications';

        let content = {
            "en": message
        }
        let headings = {
            "en": title
        }

        let fields = JSON.stringify({
            "include_player_ids": [gcmid],
            "app_id": "3fcfcc5c-70f4-4645-8035-1b71a790e4ce",
            "body": message,
            "headings": headings,
            "contents": content,
            "title": "title",
            "small_icon": "",
            "large_icon": "",
            "content_available": true,
            "data": {
                "title": title,
                "message": message,
                "type": type,
                "payload": payload
            }
        })

        function makeRequest(res_data, p_url, apiKey) {

            try {
                const config = {
                    method: 'post',
                    data: res_data,
                    url: p_url,
                    headers: {
                        'Authorization': 'Basic ' + apiKey,
                        'Content-Type': 'application/json'
                    }
                }

                let res = axios(config)

                return res.data
            } catch (error) {
                console.log(error);

            }
        }
        makeRequest(fields, url, apiKey)
    },

    get_latest_tc_version_id: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,version').where({
                'deleted': 0
            }).order_by('id', 'DESC')
            .get(config.table_prefix + 'tc');
        qb.release();

        if (response[0]) {
            return response[0].id;
        } else {
            return '';
        }
    },
    get_refunded_amount: async (order_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select_sum('amount').where({
                'order_id': order_id,
                'type': 'REFUNDED',
                'status': 'APPROVED'
            })
            .get(config.table_prefix + 'order_txn');
        qb.release();
        if (response[0]) {
            return response[0].amount;
        } else {
            return 0.0;
        }
    },
    check_in_last_five_password: async (user_type, password, id) => {
        if (user_type == 'merchant') {
            let qb = await pool.get_connection();
            let response = await qb
                .select('password').where({
                    'super_merchant_id': id
                })
                .order_by('id', 'desc')
                .limit(5)
                .get(config.table_prefix + 'merchant_last_passwords');
            qb.release();
            let password_exits = response.find(row => row['password'] === password);
            if (password_exits) {
                return true;
            } else {
                return false;
            }
        } else {
            let qb = await pool.get_connection();
            let response = await qb
                .select('password').where({
                    'admin_id': id
                })
                .order_by('id', 'desc')
                .limit(5)
                .get(config.table_prefix + 'adm_last_passwords');
            qb.release();
            let password_exits = response.find(row => row['password'] === password);
            if (password_exits) {
                return true;
            } else {
                return false;
            }
        }
    },
    updatePasswordChanged: async (user_type, password, id) => {
        if (user_type == 'merchant') {
            let qb = await pool.get_connection();
            let response = await qb.returning("id").insert(config.table_prefix + "merchant_last_passwords", {
                password: password,
                super_merchant_id: id,
                created_at: moment().format('YYYY-MM-DD')
            });
            let response1 = await qb.set({
                password_expired: 0,
                last_password_updated: moment().format("YYYY-MM-DD")
            }).where({
                id: id
            }).update(config.table_prefix + 'master_super_merchant');
            qb.release();
            return response;
        } else {
            let qb = await pool.get_connection();
            let response = await qb.returning("id").insert(config.table_prefix + "adm_last_passwords", {
                password: password,
                admin_id: id,
                created_at: moment().format('YYYY-MM-DD')
            });
            let response1 = await qb.set({
                password_expired: 0,
                last_password_updated: moment().format("YYYY-MM-DD")
            }).where({
                id: id
            }).update(config.table_prefix + 'adm_user');
            console.log(qb.last_query());
            qb.release();
            return response;
        }
    },
    get_store_status_by_number: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('id,status')
            .get(config.table_prefix + 'store_status_master');
        qb.release();

        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.status;
            });
            return result;
        } else {
            return {};
        }

    },
    get_admins_with_role: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb.query("SELECT `name`,`email` FROM " + config.table_prefix + "adm_user  WHERE FIND_IN_SET('activate_store',role)<>0 AND status=0")
        qb.release();
        return response
    },
    get_business_name_by_merchant_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('s.company_name')
            .from(config.table_prefix + 'master_merchant mm')
            .join(config.table_prefix + 'master_super_merchant s', 'mm.super_merchant_id=s.id', 'inner')
            .where({
                'mm.id': id
            })
            .get();
        qb.release();

        if (response[0]) {
            return response[0].company_name;
        } else {
            return '';
        }
    },

    get_business_name_by_merchant_ids: async (idsArr) => {

        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select('mm.id,s.company_name')
            .from(config.table_prefix + 'master_merchant mm')
            .join(config.table_prefix + 'master_super_merchant s', 'mm.super_merchant_id=s.id', 'inner')
            .where({
                'mm.id': idsArr
            })
            .get();
        qb.release();
        //console.log(qb.last_query());
        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity.company_name;
            });
            return result;
        } else {
            return {};
        }
    },
    make_sequential_no: async (pre) => {
        let qb = await pool.get_connection();
        let response = '';
        switch (pre) {
            case 'ORD':
                response = await qb
                    .select("id")
                    .order_by("id", "desc")
                    .limit(1)
                    .get(config.table_prefix + "orders");

                break;
            case 'TXN':
                response = await qb
                    .select("id")
                    .order_by("id", "desc")
                    .limit(1)
                    .get(config.table_prefix + "order_txn");
                break;
        }
        qb.release();
        let id = response ? response[0].id : 0
        return parseInt(id) + 1000000001
    },
    get_merchant_id: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("id")
            .where({
                super_merchant_id: id
            })
            .limit(1)
            .order_by("id", "asc")
            .get(config.table_prefix + "master_merchant");
        qb.release();
        if (response[0]) {
            return response[0].id;
        } else {
            return "";
        }
    },
    get_super_merchant_id: async (submerchant_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("super_merchant_id")
            .where({
                id: submerchant_id
            })
            .get(config.table_prefix + "master_merchant");
        qb.release();
        if (response[0]) {
            return response[0].super_merchant_id;
        } else {
            return 0;
        }
    },
    get_super_merchant_name: async (id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("name")
            .where({
                id: id
            })
            .limit(1)
            .order_by("id", "asc")
            .get(config.table_prefix + "master_super_merchant");
        qb.release();
        if (response[0]) {
            return response[0].name;
        } else {
            return "";
        }
    },
    get_super_merchant_details: async (idsArr) => {
        if (!idsArr[0]) {
            return {}
        }
        let qb = await pool.get_connection();
        let response = await qb
            .select("id,name,email,code,mobile_no")
            .where({
                id: idsArr
            })
            .order_by("id", "asc")
            .get(config.table_prefix + "master_super_merchant");
        qb.release();
        //console.log(qb.last_query());
        if (response) {
            var result = {}
            response.map(function (entity) {
                result[entity.id] = entity;
            });
            return result;
        } else {
            return {};
        }
    },
    percentage: async (percent, total) => {
        return parseFloat(((parseFloat(percent) / 100) * parseFloat(total)).toFixed(2))
    },
    getMerchantDocumentByName: async (merchant_id, entity_id, document_name) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select("document")
            .where({
                entity_id: entity_id,
                document_name: document_name
            })
            .limit(1)
            .get(config.table_prefix + "master_entity_document");
        let sequence = response[0]?.document;
        let data_obj = {
            entity_id: entity_id,
            merchant_id: merchant_id
        };
        if (sequence) {
            data_obj.sequence = sequence
        }
        let response_1 = await qb
            .select("document_num")
            .where(data_obj)
            .limit(1)
            .get(config.table_prefix + "merchant_entity_document");
        return response_1[0]?.document_num;
    },
    keyByArr: async (obj, key, skip_zero = 1) => {
        var result = []
        obj.map(function (entity) {
            if (!result.includes(entity[key])) {
                if (skip_zero && !entity[key]) {
                    return;
                } else {
                    return result.push(entity[key]);
                }

            }
        });
        return result;
    },
    subsection_completion: async (completed) => {
        let completed_section = completed.split(',');
        let res = {}
        let all_section = ['Business type', 'Business details', 'Business owners', 'Bank details', 'Summary']
        let lang_section = {
            'Business type': 'business_type',
            'Business details': 'business_details',
            'Business owners': 'business_owners',
            'Bank details': 'bank_details',
            'Summary': 'summary'
        };
        all_section.map(function (entity) {
            if (!completed_section.includes(entity)) {
                res[lang_section[entity]] = "Pending"
            } else {
                res[lang_section[entity]] = "Completed"
            }
        });
        return res;
    },

    base64toimage: (image) => {
        const imageData = image.replace(/^data:image\/\w+;base64,/, '');
        const filename = Date.now() + '.png';
        fs.writeFile(path.join(__dirname, '../', '../', 'public/Ekyc/images/') + filename, imageData, { encoding: 'base64' }, function (err) {
            if (err) {
                return new Error(err);
            }
        });

        return `static/Ekyc/images/${filename}`
    },
    get_store_qr_ref_no: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select_max('id')
            .get(config.table_prefix + 'store_qrs');
        qb.release();
        if (response[0]) {
            return response[0].id + 100000000;
        } else {
            return 100000000 + 1;
        }
    },
    get_store_id_by_merchant_id: async () => {
        let qb = await pool.get_connection();
        let response = await qb
            .select_max('store_id')
            .get(config.table_prefix + 'master_merchant');
        qb.release();
        if (response[0]) {
            return response[0].store_id;
        } else {
            return '';
        }
    },

    get_invoice_number: async () => {
        let qb = await pool.get_connection()
        let response = "";
        response = await qb
            .select("id")
            .order_by("id", "desc")
            .limit(1)
            .get(config.table_prefix + "invoice_master");
        qb.release();
        let id = response.length == 0 ? 0 : response[0]?.id
        return parseInt(id)
    },

    get_image_name_by_id: async (image_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select('file')
            .where('id', image_id)
            .get(config.table_prefix + 'store_qr_images');
        qb.release();
        if (response[0]) {
            return response[0].file;
        } else {
            return '';
        }
    },
    get_total_qty_amt_paid_for_qr: async (qr_id) => {
        let qb = await pool.get_connection();
        let response = await qb
            .select_sum('total_amount')
            .select_sum('quantity')
            .where('merchant_qr_id', qr_id)
            .where('payment_status', 'APPROVED')
            .get(config.table_prefix + 'qr_payment');
        qb.release();
        console.log(qb.last_query());
        if (response[0]) {
            return response[0];
        } else {
            return { total_amount: 0, quantity: 0 };
        }
    },
    getWorldCheckCountryCode: (country) => {
        let object = {
            "ABW": "Aruba",
            "AFG": "Afghanistan",
            "AGO": "Angola",
            "AIA": "Anguilla",
            "ALA": "Åland Islands",
            "ALB": "Albania",
            "AND": "Andorra",
            "ARE": "United Arab Emirates",
            "ARG": "Argentina",
            "ARM": "Armenia",
            "ASM": "American Samoa",
            "ATA": "Antarctica",
            "ATF": "French Southern Territories",
            "ATG": "Antigua and Barbuda",
            "AUS": "Australia",
            "AUT": "Austria",
            "AZE": "Azerbaijan",
            "BDI": "Burundi",
            "BEL": "Belgium",
            "BEN": "Benin",
            "BES": "Bonaire, Sint Eustatius and Saba",
            "BFA": "Burkina Faso",
            "BGD": "Bangladesh",
            "BGR": "Bulgaria",
            "BHR": "Bahrain",
            "BHS": "Bahamas",
            "BIH": "Bosnia and Herzegovina",
            "BLM": "Saint Barthélemy",
            "BLR": "Belarus",
            "BLZ": "Belize",
            "BMU": "Bermuda",
            "BOL": "Bolivia, Plurinational State of",
            "BRA": "Brazil",
            "BRB": "Barbados",
            "BRN": "Brunei Darussalam",
            "BTN": "Bhutan",
            "BVT": "Bouvet Island",
            "BWA": "Botswana",
            "CAF": "Central African Republic",
            "CAN": "Canada",
            "CCK": "Cocos (Keeling) Islands",
            "CHE": "Switzerland",
            "CHL": "Chile",
            "CHN": "China",
            "CIV": "Côte dIvoire",
            "CMR": "Cameroon",
            "COD": "Congo, the Democratic Republic of the",
            "COG": "Congo",
            "COK": "Cook Islands",
            "COL": "Colombia",
            "COM": "Comoros",
            "CPV": "Cape Verde",
            "CRI": "Costa Rica",
            "CUB": "Cuba",
            "CUW": "Curaçao",
            "CXR": "Christmas Island",
            "CYM": "Cayman Islands",
            "CYP": "Cyprus",
            "CZE": "Czech Republic",
            "DEU": "Germany",
            "DJI": "Djibouti",
            "DMA": "Dominica",
            "DNK": "Denmark",
            "DOM": "Dominican Republic",
            "DZA": "Algeria",
            "ECU": "Ecuador",
            "EGY": "Egypt",
            "ERI": "Eritrea",
            "ESH": "Western Sahara",
            "ESP": "Spain",
            "EST": "Estonia",
            "ETH": "Ethiopia",
            "FIN": "Finland",
            "FJI": "Fiji",
            "FLK": "Falkland Islands (Malvinas)",
            "FRA": "France",
            "FRO": "Faroe Islands",
            "FSM": "Micronesia, Federated States of",
            "GAB": "Gabon",
            "GBR": "United Kingdom",
            "GEO": "Georgia",
            "GGY": "Guernsey",
            "GHA": "Ghana",
            "GIB": "Gibraltar",
            "GIN": "Guinea",
            "GLP": "Guadeloupe",
            "GMB": "Gambia",
            "GNB": "Guinea-Bissau",
            "GNQ": "Equatorial Guinea",
            "GRC": "Greece",
            "GRD": "Grenada",
            "GRL": "Greenland",
            "GTM": "Guatemala",
            "GUF": "French Guiana",
            "GUM": "Guam",
            "GUY": "Guyana",
            "HKG": "Hong Kong",
            "HMD": "Heard Island and McDonald Mcdonald Islands",
            "HND": "Honduras",
            "HRV": "Croatia",
            "HTI": "Haiti",
            "HUN": "Hungary",
            "IDN": "Indonesia",
            "IMN": "Isle of Man",
            "IND": "India",
            "IOT": "British Indian Ocean Territory",
            "IRL": "Ireland",
            "IRN": "Iran, Islamic Republic of",
            "IRQ": "Iraq",
            "ISL": "Iceland",
            "ISR": "Israel",
            "ITA": "Italy",
            "JAM": "Jamaica",
            "JEY": "Jersey",
            "JOR": "Jordan",
            "JPN": "Japan",
            "KAZ": "Kazakhstan",
            "KEN": "Kenya",
            "KGZ": "Kyrgyzstan",
            "KHM": "Cambodia",
            "KIR": "Kiribati",
            "KNA": "Saint Kitts and Nevis",
            "KOR": "Korea, Republic of",
            "KWT": "Kuwait",
            "LAO": "Lao Peoples Democratic Republic",
            "LBN": "Lebanon",
            "LBR": "Liberia",
            "LBY": "Libya",
            "LCA": "Saint Lucia",
            "LIE": "Liechtenstein",
            "LKA": "Sri Lanka",
            "LSO": "Lesotho",
            "LTU": "Lithuania",
            "LUX": "Luxembourg",
            "LVA": "Latvia",
            "MAC": "Macao",
            "MAF": "Saint Martin (French part)",
            "MAR": "Morocco",
            "MCO": "Monaco",
            "MDA": "Moldova, Republic of",
            "MDG": "Madagascar",
            "MDV": "Maldives",
            "MEX": "Mexico",
            "MHL": "Marshall Islands",
            "MKD": "North Macedonia",
            "MLI": "Mali",
            "MLT": "Malta",
            "MMR": "Myanmar",
            "MNE": "Montenegro",
            "MNG": "Mongolia",
            "MNP": "Northern Mariana Islands",
            "MOZ": "Mozambique",
            "MRT": "Mauritania",
            "MSR": "Montserrat",
            "MTQ": "Martinique",
            "MUS": "Mauritius",
            "MWI": "Malawi",
            "MYS": "Malaysia",
            "MYT": "Mayotte",
            "NAM": "Namibia",
            "NCL": "New Caledonia",
            "NER": "Niger",
            "NFK": "Norfolk Island",
            "NGA": "Nigeria",
            "NIC": "Nicaragua",
            "NIU": "Niue",
            "NLD": "Netherlands",
            "NOR": "Norway",
            "NPL": "Nepal",
            "NRU": "Nauru",
            "NZL": "New Zealand",
            "OMN": "Oman",
            "PAK": "Pakistan",
            "PAN": "Panama",
            "PCN": "Pitcairn",
            "PER": "Peru",
            "PHL": "Philippines",
            "PLW": "Palau",
            "PNG": "Papua New Guinea",
            "POL": "Poland",
            "PRI": "Puerto Rico",
            "PRK": "Korea, Democratic Peoples Republic of",
            "PRT": "Portugal",
            "PRY": "Paraguay",
            "PSE": "Palestine, State of",
            "PYF": "French Polynesia",
            "QAT": "Qatar",
            "REU": "Réunion",
            "ROU": "Romania",
            "RUS": "Russian Federation",
            "RWA": "Rwanda",
            "SAU": "Saudi Arabia",
            "SDN": "Sudan",
            "SEN": "Senegal",
            "SGP": "Singapore",
            "SGS": "South Georgia and the South Sandwich Islands",
            "SHN": "Saint Helena, Ascension and Tristan da Cunha",
            "SJM": "Svalbard and Jan Mayen",
            "SLB": "Solomon Islands",
            "SLE": "Sierra Leone",
            "SLV": "El Salvador",
            "SMR": "San Marino",
            "SOM": "Somalia",
            "SPM": "Saint Pierre and Miquelon",
            "SRB": "Serbia",
            "SSD": "South Sudan",
            "STP": "Sao Tome and Principe",
            "SUR": "Suriname",
            "SVK": "Slovakia",
            "SVN": "Slovenia",
            "SWE": "Sweden",
            "SWZ": "Eswatini",
            "SXM": "Sint Maarten (Dutch part)",
            "SYC": "Seychelles",
            "SYR": "Syrian Arab Republic",
            "TCA": "Turks and Caicos Islands",
            "TCD": "Chad",
            "TGO": "Togo",
            "THA": "Thailand",
            "TJK": "Tajikistan",
            "TKL": "Tokelau",
            "TKM": "Turkmenistan",
            "TLS": "Timor-Leste",
            "TON": "Tonga",
            "TTO": "Trinidad and Tobago",
            "TUN": "Tunisia",
            "TUR": "Turkey",
            "TUV": "Tuvalu",
            "TWN": "Taiwan, Province of China",
            "TZA": "Tanzania, United Republic of",
            "UGA": "Uganda",
            "UKR": "Ukraine",
            "UMI": "United States Minor Outlying Islands",
            "URY": "Uruguay",
            "USA": "United States",
            "UZB": "Uzbekistan",
            "VAT": "Holy See (Vatican City State)",
            "VCT": "Saint Vincent and the Grenadines",
            "VEN": "Venezuela, Bolivarian Republic of",
            "VGB": "Virgin Islands, British",
            "VIR": "Virgin Islands, U.S.",
            "VNM": "Viet Nam",
            "VUT": "Vanuatu",
            "WLF": "Wallis and Futuna",
            "WSM": "Samoa",
            "YEM": "Yemen",
            "ZAF": "South Africa",
            "ZMB": "Zambia",
            "ZWE": "Zimbabwe",
            "ZZZ": "Unknown"
        }
        return Object.keys(object).find(key => object[key] === country);
    },


    create_activatylog: async ({ merchant_id = 0, activity, user = 0, remark = '' }, req, res) => {
        try {
            const approvalactivaty = {
                merchant_id: merchant_id,
                activity: activity,
                user: user,
                added_date: moment().format('YYYY-MM-DD'),
                added_time: moment().format('HH:mm:ss'),
                remark: remark,
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
            }
            const result = await MerchantActivaty.addApprovalActivaty(approvalactivaty);
            return true
        } catch (error) {
            return res.status(statusCode.internalError).send(response.errormsg(error));
        }
    }
}
module.exports = helpers;