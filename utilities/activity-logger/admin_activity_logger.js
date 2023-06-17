const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');

var AdminActivityLogger = {

    add:async(module_and_user,title,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Added new '+module_and_user.sub_module+" : "+title,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at,
            department:module_and_user.department
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    edit:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Updated '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at,
            department:module_and_user.department
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    delete:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Deleted '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    activate:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Activated '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    deactivate:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Deactivated '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    block:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Blocked '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    },
    unblock:async(module_and_user,id,headers)=>{
        let added_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let data = {
            user:module_and_user.user,
            admin_type:module_and_user.admin_type,
            module:module_and_user.module,
            sub_module:module_and_user.sub_module,
            activity:'Unblock '+module_and_user.sub_module+" : "+id,
            os:headers.os,
            browser:headers.browser,
            browser_version:headers.browser_version,
            ip:headers.ip,
            is_mobile:headers.ismobile,
            mobile_brand:headers.mobile_brand,
            is_robot:headers.isrobot,
            is_referral:headers.isreferral,
            added_at:added_at
        }
        let qb = await pool.get_connection();
        let response = await qb.returning('id').insert(config.table_prefix+"admin_logs", data);
        qb.release();
        return response;
    }
}
module.exports = AdminActivityLogger;