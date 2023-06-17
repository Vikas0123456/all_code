var validateIP = require('validate-ip-node');
const ServerResponse = require("../response/ServerResponse");
const StatusCode = require("../statuscode/index");
const path = require('path')
require('dotenv').config({ path: "../.env" });
const env = process.env.ENVIRONMENT
const config = require('../../config/config.json')[env];
const pool = require('../../config/database');
var ip = require('ip');
var geoip = require('geoip-country');

module.exports = async (req, res, next) => {
    let ip = req.headers.ip;
    if (validateIP(ip)) {
        let qb = await pool.get_connection();
        let response = await qb
            .select('suspicious_emails,suspicious_ips')
            .where({ id: 1 })
            .get(config.table_prefix + 'fraud_detections');
        qb.release();

        let suspicious = response[0];
        let order_email = req.bodyString('email');
        let suspicious_ip = suspicious.suspicious_ips.split(',');
        let suspicious_email = suspicious.suspicious_emails.split(",");
        //table on basis of environment
        let order_table = ''
        if (req.order.env == 'test') {
            order_table = config.table_prefix + 'orders_test';
        } else {
            order_table = config.table_prefix + 'orders';
        }
        // for suspicious emails
        if (suspicious_email.includes(order_email)) {
            let result = await updateOrderDetails(req.bodyString('order_id'), { status: 'Failed', block_for_suspicious_email: 1, remark: 'Payment block transaction from suspicious email' }, order_table)
            res.status(StatusCode.badRequest)
                .send(ServerResponse.fraudDetectionResponse('Payment block transaction from suspicious email', {
                    order_id: req.bodyString('order_id'),
                    order_status: 'Failed',
                    amount: req.order.amount,
                    currency: req.order.currency
                }));
            return true;

        }
        console.log(`after email`)
        //for suspicious ip
        if (suspicious_ip.includes(ip)) {
            let result = await updateOrderDetails(req.bodyString('order_id'), { status: 'Failed', block_for_suspicious_ip: 1, remark: 'Block because of suspicious ip found' }, order_table)
            res.status(StatusCode.badRequest)
                .send(ServerResponse.fraudDetectionResponse(`Payment block transaction from suspicious ip`, {
                    order_id: req.bodyString('order_id'),
                    order_status: 'Failed',
                    amount: req.order.amount,
                    currency: req.order.currency
                }));
            return true;
        }
        console.log(`after ip`)
        // for high risk country
        let high_risk_country_iso2 = await selectDetails('iso2', { is_high_risk: 1 }, 'country')

        let country_iso = geoip.lookup(ip);
        if (country_iso) {
            let is_high_risk_country = high_risk_country_iso2.find(country => country.iso2 === country_iso.country);
            if (is_high_risk_country) {
                let result = await updateOrderDetails(req.bodyString('order_id'), { high_risk_country: 1 }, order_table)
            }
        }
        console.log(`after hi risk country`)
        //for transaction limit and risk transaction
        let type_of_business_result = await selectDetails('mcc_codes as type_of_business', { merchant_id: req.order.merchant_id }, 'master_merchant_details');
        console.log(type_of_business_result);
        if (typeof type_of_business_result[0] != 'undefined') {
            console.log(`inside if`);
            if (type_of_business_result[0].type_of_business > 0) {
                console.log(`inside type of business result`);
                let transaction_limit = await selectDetails('currency,max_limit,high_risk_limit', { mcc: type_of_business_result[0].type_of_business }, 'transaction_limit');
                console.log(transaction_limit);
                if (transaction_limit.length > 0) {
                    let mcc_transaction_limit = transaction_limit[0];
                    console.log(`mcc currency`);
                    console.log(mcc_transaction_limit.currency);
                    console.log(req.order.currency);
                    console.log(`order currency`);
                    console.log(mcc_transaction_limit.currency === req.order.currency);
                    if (mcc_transaction_limit.currency === req.order.currency) {
                        console.log(`here in transaction limit checking`)
                        console.log(req.order.amount > mcc_transaction_limit.max_limit);
                        console.log(req.order.amount)
                        console.log(mcc_transaction_limit.max_limit);
                        if (parseInt(mcc_transaction_limit.max_limit) <= parseInt(req.order.amount)) {
                            console.log(`order amount is greater than limit`)
                            let result = await updateOrderDetails(req.bodyString('order_id'), { status: 'Failed', block_for_transaction_limit: 1, remark: 'Block because of higher transaction limit' }, order_table)
                            res.status(StatusCode.badRequest)
                                .send(ServerResponse.fraudDetectionResponse(`Payment block transaction limit exceed`, {
                                    order_id: req.bodyString('order_id'),
                                    order_status: 'Failed',
                                    amount: req.order.amount,
                                    currency: req.order.currency
                                }));
                            return true;
                        }
                        if (parseInt(req.order.amount) > parseInt(mcc_transaction_limit.high_risk_limit)) {
                            let result = await updateOrderDetails(req.bodyString('order_id'), { high_risk_transaction: 1,remark: 'Amount is above high risk' }, order_table)
                        }
                    }
                }
            }
        } else {
            next();
        }
        next();



    } else {
        res.status(StatusCode.badRequest)
            .send(ServerResponse.fraudDetectionResponse(`Invalid IP address`));
    }
}
updateOrderDetails = async (order_id, payload, order_table) => {
    let db_table = config.table_prefix + order_table;
    let qb = await pool.get_connection();
    let response = await qb
        .set(payload)
        .where({ order_id: order_id })
        .update(order_table);
    qb.release();
    return response;
}
selectDetails = async (selection, condition, table_name) => {
    table_name = config.table_prefix + table_name;
    let qb = await pool.get_connection();
    let response = await qb
        .select(selection)
        .where(condition)
        .get(table_name);
    qb.release();
    console.log(qb.last_query());
    return response;
}