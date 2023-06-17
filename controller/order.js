const TransactionsModel = require("../models/transactions.js");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor");
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const moment = require('moment');
const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const excel = require("exceljs");
const efr_exportdata = require("../models/efr_reportdata.js");
const ServerResponse = require("../utilities/response/ServerResponse");

var res_data = {
    add: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let amount = req.bodyString("amount");
        let currency = req.bodyString("currency");
        let payment_method = req.bodyString("payment_method");
        let artha_order_no = await helpers.make_order_number("ORD")
        let ip = await helpers.get_ip(req)
        let ins_body = {
            'merchant_id': req.user.id,
            'super_merchant': req.user.super_merchant,
            'partner_id': req.user.partner_id,
            'artha_order_no': artha_order_no,
            'payment_method': payment_method,
            'amount': amount,
            'order_status': "Created",
            'order_currency': currency,
            'transaction_date': added_date,
            'ip': ip,
        };

        if (req.bodyString("description")) {
            ins_body.description = req.bodyString("description");
        }
        if (req.bodyString("customer_name")) {
            ins_body.customer_name = req.bodyString("customer_name");
        }
        if (req.bodyString("customer_mobile")) {
            ins_body.customer_mobile = req.bodyString("customer_mobile");
        }
        if (req.bodyString("customer_email")) {
            ins_body.customer_email = req.bodyString("customer_email");
        }

        let data = {
            'artha_order_no': artha_order_no,
            'amount': amount,
        }

        TransactionsModel.add(ins_body).then((result) => {
            res.status(statusCode.ok).send(response.successdatamsg(data, 'Order Created successfully.'));
        }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        });

    },
    list: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        }

        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        let and_filter_obj = {};
        let date_condition = {};
        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        let table_name = 'orders'
        if (req.bodyString('merchant')) {
            and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj.super_merchant = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status') != "all" && req.bodyString('status') != "") {
            and_filter_obj.status = req.bodyString('status')
        }
        if (req.bodyString('currency')) {
            and_filter_obj.currency = req.bodyString('currency')
        }
        if (req.bodyString('order_no')) {
            and_filter_obj.order_id = req.bodyString('order_no')
        }
        if (req.bodyString('customer_name')) {
            and_filter_obj.customer_name = req.bodyString('customer_name')
        }

        if (req.bodyString('email')) {
            and_filter_obj.customer_email = req.bodyString('email')
        }

        if (req.bodyString('mobile')) {
            and_filter_obj.customer_mobile = req.bodyString('mobile')
        }

        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        if (req.bodyString('class')) {
            and_filter_obj.class = req.bodyString('class')
        }
        let get_risk = '';
        if (req.bodyString('fraud_rule')) {

            get_risk = await helpers.get_high_risk(req.bodyString('fraud_rule'));

        }
        TransactionsModel.select(and_filter_obj, date_condition, get_risk, limit, table_name)
            .then(async (result) => {
                let send_res = [];
                for (let val of result) {
                    let refunded_amt = await helpers.get_refunded_amount(val.order_id);
                    let res = {
                        transactions_id: await enc_dec.cjs_encrypt(val.id),
                        merchant_id: await enc_dec.cjs_encrypt(val.merchant_id),
                        order_id: val.order_id,
                        payment_id: val.payment_id,
                        merchant_name: await helpers.get_merchant_details_name_by_id(val.merchant_id),
                        order_amount: val.amount.toFixed(2),
                        order_currency: val.currency,
                        customer_name: val.customer_name,
                        customer_email: val.customer_email,
                        customer_mobile: val.customer_mobile,
                        class: val.class,
                        mode: '',
                        type: await helpers.get_latest_type_of_txn(val.order_id),
                        status: val.status,
                        can_be_void: val.status == 'AUTHORISED' ? true : false,
                        refunded_amount: refunded_amt ? refunded_amt : 0.0,
                        high_risk_country: val.high_risk_country ? val.high_risk_country : 0,
                        high_risk_transaction: val.high_risk_transaction ? val.high_risk_transaction : 0,
                        block_for_suspicious_ip: val.block_for_suspicious_ip ? val.block_for_suspicious_ip : 0,
                        block_for_suspicious_email: val.block_for_suspicious_email ? val.block_for_suspicious_email : 0,
                        block_for_transaction_limit: val.block_for_transaction_limit ? val.block_for_transaction_limit : 0,
                        buy_charges: val.buy_charge.toFixed(2),
                        sell_charges: val.sale_charge.toFixed(2),
                        sell_tax: val.sale_tax.toFixed(2),
                        buy_tax: val.buy_tax.toFixed(2),
                        settlement_amount: val.settlement_amount.toFixed(2),
                        transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss')
                    };
                    send_res.push(res);
                }
                total_count = await TransactionsModel.get_count(and_filter_obj, date_condition, get_risk, table_name)

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    exportPdf: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        }

        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        let and_filter_obj = {};
        let date_condition = {};

        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        let table_name = 'orders';

        if (req.bodyString('merchant')) {
            and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj.super_merchant = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status')) {
            and_filter_obj.status = req.bodyString('status')
        }
        if (req.bodyString('currency')) {
            and_filter_obj.currency = req.bodyString('currency')
        }
        if (req.bodyString('order_no')) {
            and_filter_obj.order_id = req.bodyString('order_no')
        }
        if (req.bodyString('customer_name')) {
            and_filter_obj.customer_name = req.bodyString('customer_name')
        }

        if (req.bodyString('email')) {
            and_filter_obj.customer_email = req.bodyString('email')
        }

        if (req.bodyString('mobile')) {
            and_filter_obj.customer_mobile = req.bodyString('mobile')
        }

        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        let get_risk = '';
        if (req.bodyString('fraud_rule')) {

            get_risk = await helpers.get_high_risk(req.bodyString('fraud_rule'));

        }
        TransactionsModel.selectAll(and_filter_obj, date_condition, get_risk, table_name)
            .then(async (result) => {
                let send_res = [];
                let i = 1;
                for (let val of result) {
                    let res = {
                        sr_no: i,
                        order_id: val.order_id,
                        payment_id: val.payment_id,
                        merchant_name: await helpers.get_merchant_details_name_by_id(val.merchant_id),
                        order_amount: val.currency + ' ' + val.amount.toFixed(2),
                        customer_name: val.customer_name,
                        customer_email: val.customer_email,
                        customer_mobile: val.customer_mobile,
                        status: val.status,
                        transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss')
                    };
                    send_res.push(res);
                    i++;
                }
                const table = {
                    subtitle: "Invoices",
                    headers: [
                        { label: "Sr. No.", property: 'sr_no', width: 60 },
                        { label: "Merchant", property: 'merchant_name', width: 100 },
                        { label: "Customer", property: 'customer_name', width: 100 },
                        { label: "Email", property: 'customer_email', width: 100 },
                        { label: "Mobile", property: 'customer_mobile', width: 100 },
                        { label: "Order Id", property: 'order_id', width: 80 },
                        { label: "Net Amount", property: "order_amount", width: 80 },
                        { label: "Date", property: "transaction_date", width: 80 },
                        { label: "Status", property: "status", width: 80 }
                    ],
                    divider: {
                        label: { disabled: false, width: 2, opacity: 1 },
                        horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                    },
                    datas: send_res,

                };
                var myDoc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { top: 50, left: 50, right: 50, bottom: 50 }, size: 'A4' });
                // myDoc.pipe(res);
                myDoc.font('Times-Roman')
                    .fontSize(12)
                    .table(table);
                myDoc.end();
                const stream = res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=transactions.pdf`,
                });
                myDoc.on('data', (chunk) => stream.write(chunk));
                myDoc.on('end', () => stream.end());
                // res.setHeader("Content-Type", "application/pdf");
                // res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
                // myDoc.pipe(res)
                // myDoc.pdf.write(res).then(function () {
                //     res.status(200).end();
                // });
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    exportExcel: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        }

        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        let and_filter_obj = {};
        let date_condition = {};

        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        let table_name = 'orders';

        if (req.bodyString('merchant')) {
            and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj.super_merchant = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status')) {
            and_filter_obj.status = req.bodyString('status')
        }
        if (req.bodyString('currency')) {
            and_filter_obj.currency = req.bodyString('currency')
        }
        if (req.bodyString('order_no')) {
            and_filter_obj.order_id = req.bodyString('order_no')
        }
        if (req.bodyString('customer_name')) {
            and_filter_obj.customer_name = req.bodyString('customer_name')
        }

        if (req.bodyString('email')) {
            and_filter_obj.customer_email = req.bodyString('email')
        }

        if (req.bodyString('mobile')) {
            and_filter_obj.customer_mobile = req.bodyString('mobile')
        }

        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        let get_risk = '';
        if (req.bodyString('fraud_rule')) {

            get_risk = await helpers.get_high_risk(req.bodyString('fraud_rule'));

        }
        TransactionsModel.selectAll(and_filter_obj, date_condition, get_risk, table_name)
            .then(async (result) => {
                let send_res = [];
                let i = 1;
                for (let val of result) {
                    let res = {
                        sr_no: i,
                        order_id: val.order_id,
                        payment_id: val.payment_id,
                        merchant_name: await helpers.get_merchant_details_name_by_id(val.merchant_id),
                        order_amount: val.currency + ' ' + val.amount.toFixed(2),
                        customer_name: val.customer_name,
                        customer_email: val.customer_email,
                        customer_mobile: val.customer_mobile,
                        status: val.status,
                        transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss')
                    };
                    send_res.push(res);
                    i++;
                }
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("Invoices");
                worksheet.columns = [
                    { header: "Sr. No.", key: 'sr_no', width: 5 },
                    { header: "Merchant", key: 'merchant_name', width: 25 },
                    { header: "Customer", key: 'customer_name', width: 25 },
                    { header: "Email", key: 'customer_email', width: 25 },
                    { header: "Mobile", key: 'customer_mobile', width: 25 },
                    { header: "Order Id", key: 'order_id', width: 25 },
                    { header: "Net Amount", key: "order_amount", width: 25 },
                    { header: "Date", key: "transaction_date", width: 25 },
                    { header: "Status", key: "status", width: 10 }
                ];
                worksheet.addRows(send_res);

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );

                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "invoice.xlsx"
                );

                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

                res.setHeader("Content-Disposition", "attachment; filename=transactions.xlsx");

                workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    details: async (req, res) => {
        let id = enc_dec.cjs_decrypt(req.bodyString("id"));
        let table = 'orders'
        if (req.bodyString('mode') == 'test') {
            table = 'orders_test';
        }
        TransactionsModel.selectOne("*", { id: id }, table)
            .then(async (result) => {
                let send_res = [];
                let val = result
                let res1 = {
                    transactions_id: await enc_dec.cjs_encrypt(val.id),
                    merchant_id: await enc_dec.cjs_encrypt(val.merchant_id),
                    order_id: val.order_id,
                    payment_id: val.payment_id,
                    merchant_name: await helpers.get_merchant_details_name_by_id(val.merchant_id),
                    customer_name: val.customer_name,
                    customer_email: val.customer_email,
                    customer_mobile: val.customer_mobile,
                    order_amount: val.amount.toFixed(2),
                    order_currency: val.currency,
                    status: val.status,
                    billing_address_1: val.billing_address_line_1,
                    billing_address_2: val.billing_address_line_2,
                    billing_city: val.billing_city,
                    billing_pincode: val.billing_pincode,
                    billing_province: val.billing_province,
                    billing_country: val.billing_country,
                    shipping_address_1: val.shipping_address_line_1,
                    shipping_address_2: val.shipping_address_line_2,
                    shipping_city: val.shipping_city,
                    shipping_province: val.shipping_province,
                    shipping_country: val.shipping_country,
                    shipping_pincode: val.shipping_pincode,
                    card_no: val.card_no,
                    block_for_suspicious_ip: val.block_for_suspicious_ip,
                    block_for_suspicious_email: val.block_for_suspicious_email,
                    high_risk_country: val.high_risk_country,
                    block_for_transaction_limit: val.block_for_transaction_limit,
                    high_risk_transaction: val.high_risk_transaction,
                    remark: val.remark ? val.remark : '-',
                    transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss'),
                    url: val.return_url,
                    browser: val.browser,
                    os: val.os,
                    updated_at: moment(val.updated_at).format('DD-MM-YYYY H:mm:ss')
                };
                send_res = res1;


                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Transaction details fetched successfully.'));
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    update: async (req, res) => {
        try {

            let department_id = await enc_dec.cjs_decrypt(req.bodyString("department_id"));
            let department = req.bodyString("department");

            var insdata = {
                'department': department
            };
            $ins_id = await TransactionsModel.updateDetails({ id: department_id }, insdata);
            res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
        } catch {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },


    payment_status: async (req, res) => {

        let payment_status = await helpers.get_data_list('*', 'payment_status', { "deleted": 0 });
        let payment_modes = await helpers.get_data_list('*', 'payment_mode', { "deleted": 0 });


        let send_res = { payment_status: [], payment_mode: [] };
        payment_status.forEach(function (val, key) {
            let res = {
                id: enc_dec.cjs_encrypt(val.id),
                payment_status: val.status
            };
            send_res.payment_status.push(res);
        });
        payment_modes.forEach(function (val, key) {
            let res1 = {
                id: enc_dec.cjs_encrypt(val.id),
                payment_mode: val.payment_mode
            };
            send_res.payment_mode.push(res1);
        });

        res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.'));

    },
    highrisk_list: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        }

        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        let and_filter_obj = {};
        let date_condition = {};
        let or_filter_obj = {};
        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        let table_name = '';
        if (req.bodyString('mode') == 'test') {
            table_name = 'orders_test'
        } else {
            table_name = 'orders'
        }
        if (req.bodyString('merchant')) {
            and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }

        let get_risk = 0;
        if (req.bodyString('type')) {
            get_risk = await helpers.get_high_risk(req.bodyString('type'));
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj.super_merchant = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status')) {
            and_filter_obj.status = req.bodyString('status')
        }
        if (req.bodyString('currency')) {
            and_filter_obj.currency = req.bodyString('currency')
        }
        if (req.bodyString('order_no')) {
            and_filter_obj.order_id = req.bodyString('order_no')
        }
        if (req.bodyString('customer_name')) {
            and_filter_obj.customer_name = req.bodyString('customer_name')
        }

        if (req.bodyString('email')) {
            and_filter_obj.customer_email = req.bodyString('email')
        }

        if (req.bodyString('mobile')) {
            and_filter_obj.customer_mobile = req.bodyString('mobile')
        }

        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }

        TransactionsModel.select_highrisk(and_filter_obj, date_condition, get_risk, limit, table_name)
            .then(async (result) => {
                let send_res = [];
                for (let val of result) {

                    let refunded_amt = await helpers.get_refunded_amount(val.order_id);
                    let res = {
                        transactions_id: await enc_dec.cjs_encrypt(val.id),
                        merchant_id: await enc_dec.cjs_encrypt(val.merchant_id),
                        order_id: val.order_id,
                        payment_id: val.payment_id,
                        merchant_name: await helpers.get_merchant_details_name_by_id(val.merchant_id),
                        order_amount: val.amount.toFixed(2),
                        order_currency: val.currency,
                        customer_name: val.customer_name,
                        customer_email: val.customer_email,
                        customer_mobile: val.customer_mobile,
                        class: val.class,
                        mode: '',
                        type: await helpers.get_latest_type_of_txn(val.order_id),
                        status: val.status,
                        can_be_void: val.status == 'APPROVED' ? true : false,
                        refunded_amount: refunded_amt ? refunded_amt : 0.0,
                        // reason: get_risk.val,
                        reason: val.high_risk_transaction == 1 ? "block for transaction" : val.block_for_suspicious_ip == 1 ? "block for suspicious ip" : val.block_for_suspicious_email == 1 ? "block for suspicious email" : val.block_for_transaction_limit == 1 ? "block for transaction limit" : val.high_risk_country == 1 ? "block for high risk country" : "",
                        risk_rating: val.high_risk_transaction + val.block_for_suspicious_ip + val.block_for_suspicious_email + val.block_for_transaction_limit + val.high_risk_country,
                        high_risk_country: val.high_risk_country ? val.high_risk_country : 0,
                        high_risk_transaction: val.high_risk_transaction ? val.high_risk_transaction : 0,
                        block_for_suspicious_ip: val.block_for_suspicious_ip ? val.block_for_suspicious_ip : 0,
                        block_for_suspicious_email: val.block_for_suspicious_email ? val.block_for_suspicious_email : 0,
                        block_for_transaction_limit: val.block_for_transaction_limit ? val.block_for_transaction_limit : 0,
                        transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss')
                    };
                    send_res.push(res);
                }
                total_count = await TransactionsModel.get_count_risk(and_filter_obj, date_condition, get_risk, table_name)

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    txn_list: async (req, res) => {
        let limit = {
            perpage: 10,
            start: 0,
            page: 1,
        }

        if (req.bodyString('perpage') && req.bodyString('page')) {
            perpage = parseInt(req.bodyString('perpage'))
            start = parseInt(req.bodyString('page'))

            limit.perpage = perpage
            limit.start = ((start - 1) * perpage)
        }
        let and_filter_obj = {};
        let date_condition = {};
        let like_condition = {};
        let like_condition_arr = [];
        let get_risk = 0
        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }


        let table_name = 'orders'
        if(req.body.mode === 'test'){
            table_name = 'orders_test'
        }
        if (req.bodyString('merchant')) {
            and_filter_obj['ord.merchant_id'] = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj['ord.super_merchant'] = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status') && req.bodyString('status')!='all') {
            and_filter_obj['txn.status'] = req.bodyString('status')
        }
        if (req.bodyString('type') && req.bodyString('type')!='all') {
            and_filter_obj['txn.type'] = req.bodyString('type')
        }
        if (req.bodyString('class') && req.bodyString('class')!='all') {
            and_filter_obj['ord.class'] = req.bodyString('class')
        }
        if (req.bodyString('order_id')) {
            and_filter_obj['ord.order_id'] = req.bodyString('order_id')
        }
        if (req.bodyString('acquirer')) {
            and_filter_obj['ord.acquirer'] = req.bodyString('acquirer')
        }
        if (req.bodyString('payment_id')) {
            and_filter_obj['ord.payment_id'] = req.bodyString('payment_id')
        }
        if (req.bodyString('card_type')) {
            and_filter_obj['ord.card_type'] = req.bodyString('card_type')
        }
        if (req.bodyString('funding_method')) {
            and_filter_obj['ord.funding_method'] = req.bodyString('funding_method')
        }
        if (req.bodyString('payment_mode')) {
            and_filter_obj['ord.payment_mode'] = req.bodyString('payment_mode')
        }


        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }

        if (req.bodyString('description') && req.bodyString('description')!='all') {
            like_condition['ord.description'] = req.bodyString('description')
        }

        if (req.bodyString('billing_address')) {
            like_condition_arr.push({
                'ord.billing_address_line_1': req.bodyString('billing_address'),
                'ord.billing_address_line_2': req.bodyString('billing_address'),
                'ord.billing_city': req.bodyString('billing_address'),
                'ord.billing_pincode': req.bodyString('billing_address'),
                'ord.billing_province': req.bodyString('billing_address'),
                'ord.billing_country': req.bodyString('billing_address'),
            })
        }
        if (req.bodyString('shipping_address')) {
            like_condition_arr.push({
                'ord.shipping_address_line_1': req.bodyString('shipping_address'),
                'ord.shipping_address_line_2': req.bodyString('shipping_address'),
                'ord.shipping_city': req.bodyString('shipping_address'),
                'ord.shipping_country': req.bodyString('shipping_address'),
                'ord.shipping_province': req.bodyString('shipping_address'),
                'ord.shipping_pincode': req.bodyString('shipping_address'),
            })
        }
        if (req.bodyString('transaction_search')) {
            like_condition_arr.push({
                'ord.customer_name': req.bodyString('transaction_search'),
                'ord.customer_email': req.bodyString('transaction_search'),
                'ord.customer_mobile': req.bodyString('transaction_search'),
            })
        }
        TransactionsModel.selectTxn(and_filter_obj, like_condition, date_condition, get_risk, limit, table_name, req.body.mode, like_condition_arr)
            .then(async (result) => {
                let send_res = [];

                for (let val of result) {
                    let can_be_refunded = 'No';
                    let can_be_void= 'No';
                    let total_refunded=0;
                    if(val.acquirer!='URPAY'){
                        if(val.order_status=='AUTHORISED' || val.order_status=='REFUNDED'){
                            if(val.type=='SALE' && val.status=='APPROVED'){
                                total_refunded = await TransactionsModel.getRefundedSum(val.order_id,req.body.mode)
                                can_be_refunded=parseInt(total_refunded)==parseInt(val.amount)?'No':'Yes';

                            }
                        }

                        let today = moment().format('YYYY-MM-DD');
                        let txn_date = moment(val.created_at).format('YYYY-MM-DD');
                        if(val.order_status=='AUTHORISED' && val.type=='SALE' && val.status=='APPROVED' &&val.acquirer!='TABBY' && moment(val.created_at).isSame(moment(),'day')){
                            can_be_void='Yes';
                        }
                    }


                    let temp = {
                        txn_id: enc_dec.cjs_encrypt(val.txn_id),
                        order_id: val.order_id,
                        order_status: val.order_status,
                        can_be_void: can_be_void,
                        can_be_refunded:can_be_refunded,
                        txn: val.txn,
                        date: moment(val.created_at).format('YYYY-MM-DD'),
                        time: moment(val.created_at).format('HH:mm'),
                        type: val.type,
                        class: val.class,
                        amount: val.currency + ' ' + val.amount,
                        remaining_refund:parseFloat(val.amount)-parseFloat(total_refunded),
                        customer: val.customer_name,
                        status: val.status,
                        acquirer: val.acquirer,
                        card_type: val.card_type,
                        payment_mode: val.payment_mode,
                        payment_id: val.payment_id,
                        funding_method: val.funding_method,
                        description: val.description,
                        // billing_address_line_1: val.billing_address_line_1,
                        // billing_address_line_2: val.billing_address_line_2,
                        // billing_city: val.billing_city,
                        // billing_pincode: val.billing_pincode,
                        // billing_province: val.billing_province,
                        // billing_country: val.billing_country,
                        // shipping_address_line_1: val.shipping_address_line_1,
                        // shipping_address_line_2: val.shipping_address_line_2,
                        // shipping_city: val.shipping_city,
                        // shipping_country: val.shipping_country,
                        // shipping_province: val.shipping_province,
                        // shipping_pincode: val.shipping_pincode
                    }
                    send_res.push(temp);
                }
                total_count = await TransactionsModel.get_txn_count(and_filter_obj,like_condition, date_condition, get_risk, table_name,req.body.mode,like_condition_arr)
                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    txn_list_pdf:async(req,res)=>{
        let and_filter_obj = {};
        let date_condition = {};
        let get_risk = 0
        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        table_name = 'orders'
        if (req.bodyString('merchant')) {
            and_filter_obj['ord.merchant_id'] = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj['ord.super_merchant'] = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status')) {
            and_filter_obj['txn.status'] = req.bodyString('status')
        }
        if (req.bodyString('type')) {
            and_filter_obj['txn.type'] = req.bodyString('type')
        }
        if (req.bodyString('class')) {
            and_filter_obj['ord.class'] = req.bodyString('class')
        }


        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }

        TransactionsModel.selectTxnImport(and_filter_obj, date_condition, get_risk, table_name)
            .then(async (result) => {
                let send_res = [];

                for (let val of result) {
                    let can_be_refunded = 'No';
                    if(val.order_status=='REFUNDED'){
                        let total_refunded = await TransactionsModel.getRefundedSum(val.order_id,req.body.mode);
                        if(total_refunded<val.order_amount){
                            can_be_refunded="Yes";
                        }
                    }
                    let temp = {
                        // txn_id: enc_dec.cjs_encrypt(val.txn_id),
                        // order_id: val.order_id,
                        // order_status: val.order_status,
                        // can_be_void: val.order_status == 'AUTHORISED' ? "Yes" : "No",
                        // can_be_refunded:can_be_refunded,
                        txn: val.txn,
                        date: moment(val.created_at).format('YYYY-MM-DD HH:mm'),
                        // time: moment(val.created_at).format('HH:mm'),
                        type: val.type,
                        class: val.class,
                        amount: val.currency + ' ' + val.amount,
                        customer: val.customer_name,
                        email: val.customer_email,
                        status: val.status
                    }
                    send_res.push(temp);
                }
                const table = {
                    subtitle: "",
                    headers: [
                        { label: "Trans Ref.", property: 'txn', width: 100 },
                        { label: "Date", property: 'date', width: 110 },
                        // { label: "Time", property: 'time', width: 100 },
                        { label: "Type", property: 'type', width: 80 },
                        { label: "Class", property: 'class', width: 80 },
                        { label: "Amount", property: 'amount', width: 80 },
                        { label: "Customer", property: "customer", width: 80 },
                        { label: "Customer Email", property: "email", width: 110 },
                        { label: "Status", property: "status", width: 80 }
                    ],
                    divider: {
                        label: { disabled: false, width: 2, opacity: 1 },
                        horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                    },
                    datas: send_res,

                };
                var myDoc = new PDFDocument({ bufferPages: true, layout: 'landscape', margins: { top: 50, left: 50, right: 50, bottom: 50 }, size: 'A4' });
                // myDoc.pipe(res);
                myDoc.font('Times-Roman')
                    .fontSize(12)
                    .table(table);
                myDoc.end();
                const stream = res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-disposition': `attachment;filename=transactions.pdf`,
                });
                myDoc.on('data', (chunk) => stream.write(chunk));
                myDoc.on('end', () => stream.end());
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },

    txn_list_excel:async(req,res)=>{
        let and_filter_obj = {};
        let date_condition = {};
        let get_risk = 0
        if (req.user.type == "merchant") {
            and_filter_obj.super_merchant = req.user.id
        }
        table_name = 'orders'
        if (req.bodyString('merchant')) {
            and_filter_obj['ord.merchant_id'] = encrypt_decrypt('decrypt', req.bodyString('merchant'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj['ord.super_merchant'] = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
        }
        if (req.bodyString('status')) {
            and_filter_obj['txn.status'] = req.bodyString('status')
        }
        if (req.bodyString('type')) {
            and_filter_obj['txn.type'] = req.bodyString('type')
        }
        if (req.bodyString('class')) {
            and_filter_obj['ord.class'] = req.bodyString('class')
        }


        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }

        TransactionsModel.selectTxnImport(and_filter_obj, date_condition, get_risk, table_name)
            .then(async (result) => {
                let send_res = [];

                for (let val of result) {
                    let can_be_refunded = 'No';
                    if(val.order_status=='REFUNDED'){
                        let total_refunded = await TransactionsModel.getRefundedSum(val.order_id,req.body.mode);
                        if(total_refunded<val.order_amount){
                            can_be_refunded="Yes";
                        }
                    }
                    let temp = {
                        // txn_id: enc_dec.cjs_encrypt(val.txn_id),
                        // order_id: val.order_id,
                        // order_status: val.order_status,
                        // can_be_void: val.order_status == 'AUTHORISED' ? "Yes" : "No",
                        // can_be_refunded:can_be_refunded,
                        txn: val.txn,
                        date: moment(val.created_at).format('YYYY-MM-DD HH:mm'),
                        // time: moment(val.created_at).format('HH:mm'),
                        type: val.type,
                        class: val.class,
                        amount: val.currency + ' ' + val.amount,
                        customer: val.customer_name,
                        email: val.customer_email,
                        status: val.status
                    }
                    send_res.push(temp);
                }
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("Invoices");
                worksheet.columns = [
                    { header: "Trans Ref.", key: 'txn', width: 30 },
                    { header: "Date", key: 'date', width: 30 },
                    // { header: "Time", key: 'time', width: 25 },
                    { header: "Type", key: 'type', width: 25 },
                    { header: "Class", key: 'class', width: 25 },
                    { header: "Amount", key: 'amount', width: 25 },
                    { header: "Customer", key: "customer", width: 25 },
                    { header: "Email", key: "email", width: 25 },
                    { header: "Status", key: "status", width: 25 },
                ];

                worksheet.addRows(send_res);

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );

                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "invoice.xlsx"
                );

                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

                res.setHeader("Content-Disposition", "attachment; filename=transactions.xlsx");

                workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            })

            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },


    exceptionlogs: async (req, res) => {
        let limit = "";
        let filter = "";
        if (req.bodyString('merchant_id') || req.bodyString('from_date') || req.bodyString('to_date')) {
            filter += ' WHERE ';
        }
        if (req.bodyString('merchant_id')) {
            filter += 'merchant_id = ' + enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
        }
        if (req.bodyString('merchant_id') && req.bodyString('from_date')  && req.bodyString('to_date')) {
            filter += ' AND ';
        }
        if (req.bodyString('from_date') && req.bodyString('to_date')) {
            filter += 'DATE(date_time)  BETWEEN  "' + req.bodyString('from_date') + '" AND "' + req.bodyString('to_date') + ' " ORDER BY id ASC '
        }
        else {
            if (req.bodyString('from_date')) {
                filter += 'DATE(date_time) <= "' + req.bodyString('from_date') + '" ORDER BY id ASC';
            };
            if (req.bodyString('to_date')) {
                filter += 'DATE(date_time)  >=  "' + req.bodyString('to_date') + '" ORDER BY id ASC ';
            }
        }
        if (req.bodyString('perpage') && req.bodyString('page')) {
            let perpage = parseInt(req.bodyString('perpage'));
            let start = parseInt(req.bodyString('page'));
            start = (start - 1) * perpage;
            limit =  ' LIMIT ' + start + ',' + perpage;
        }


        efr_exportdata.exception_select(filter, limit)
            .then(async (result) => {
                const response = result;
                response.forEach((data, index) => {
                    response[index].merchant_id = enc_dec.cjs_encrypt(data.merchant_id)
                })
                const count_response = await efr_exportdata.countexc_eptiondata(filter)
                return res.status(statusCode.ok).send(ServerResponse.successdatamsg(result, "Fetched Successfully",count_response.TOTAL_COUNT));
            })
            .catch((error) => {
                return res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
}
module.exports = res_data;