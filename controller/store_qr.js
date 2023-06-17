const StoreQrModel = require("../models/store_qr");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper");
const enc_dec = require("../utilities/decryptor/decryptor");
const admin_activity_logger = require("../utilities/activity-logger/admin_activity_logger");
const SequenceUUID = require("sequential-uuid");
const moment = require('moment');
const QRCode = require('qrcode')
const PDFDocument = require("pdfkit-table");
const excel = require("exceljs");
var StoreQRImages = {
    add: async (req, res) => {
        let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        const uuid = new SequenceUUID({
            valid: true,
            dashes: false,
            unsafeBuffer: true,
        });
        let qr_id = uuid.generate();
        let ins_body = {
            store_id: enc_dec.cjs_decrypt(req.bodyString('store_id')),
            ref_no: await helpers.get_store_qr_ref_no('QR'),
            merchant_id: req.user.id,
            qr_id: qr_id,
            title: req.bodyString('title'),
            product_cart_id: req.bodyString('product_or_card_id'),
            currency: req.bodyString('currency'),
            amount: req.bodyString('amount')?parseFloat(req.bodyString('amount'))+0:0,
            min_order_quantity: req.bodyString('variable_value_status') == 0? req.bodyString('min_order_quantity')?parseInt(req.bodyString('min_order_quantity')):1:1,
            max_order_quantity: req.bodyString('variable_value_status') == 0? req.bodyString('max_order_quantity')?parseInt(req.bodyString('max_order_quantity')):1:1,
            full_name: req.bodyString('full_name'),
            address_line_1: req.bodyString('address_line_1'),
            city: req.bodyString('city'),
            country: req.bodyString('country')?enc_dec.cjs_decrypt(req.bodyString('country')):0,
            email: req.bodyString('email'),
            phone_code: req.bodyString('phone_code'),
            phone_number: req.bodyString('phone_no'),

            variable_value_status: (req.bodyString('variable_value_status')==0) ? 1 : 0,

            variable_value_title: req.bodyString('variable_value_title'),
            not_valid_before: req.bodyString('not_valid_before')?moment(req.bodyString('not_valid_before')).format('YYYY-MM-DD'):'0000-00-00',
            not_valid_after:  req.bodyString('not_valid_after')?moment(req.bodyString('not_valid_after')).format('YYYY-MM-DD'):'0000-00-00',

            stock_control: (req.bodyString('variable_value_status') == 1 && req.bodyString('stock_control') == 1) ? 1 : (req.bodyString('stock_control') == 0 ? 1 : 0) ,

            stock_count: req.bodyString('variable_value_status') == 0 ? 0 : parseInt(req.bodyString('stock_count'))?parseInt(req.bodyString('stock_count')):0,
            description: req.bodyString('description'),
            images: req.bodyString('images') ? enc_dec.cjs_decrypt(req.bodyString('images')) : 0,
            tweeter_id: req.bodyString('tweeter_id')?req.bodyString('tweeter_id'):'',
            deleted: 0,
            status: 0,
            created_at: created_at,
            updated_at: created_at,
            mode: req.bodyString('mode')
        }

       

        StoreQrModel.add(ins_body)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg("QR added successfully.")
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    list: async (req, res) => {
        let limit = {
            perpage: 0,
            page: 0,
        };
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));

            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }

        let filter_arr = { deleted: 0, merchant_id: req.user.id, mode: req.bodyString('mode') };
        let amount_condition = '';
        let amount=0;
        let date_condition = {};
        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        if (req.bodyString('store_id')) {
            filter_arr.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
        }

        if (req.bodyString("status") == "0") {
            filter_arr.status = 0;
        }
        if (req.bodyString("status") == "1") {
            filter_arr.status = 1;
        }
        if(req.bodyString("status")=="2"){
            filter_arr.status = 2;
        }
        if(req.bodyString("currency")){
            filter_arr.currency =req.bodyString("currency");
        }
        if(req.bodyString('amount') && req.bodyString('amount_compare_type')){
            if(req.bodyString('amount_compare_type')=='less_than'){
                amount = req.bodyString('amount');
                amount_condition ='<';
            }else if(req.bodyString('amount_compare_type')=='greater_than'){
                amount = req.bodyString('amount');
                amount_condition ='>';
            }else if(req.bodyString('amount_compare_type')=='equal_to'){
                amount = req.bodyString('amount');
                amount_condition ='  ';
            }
        }
        StoreQrModel.select(filter_arr,amount,amount_condition,limit,date_condition)
            .then(async (result) => {
                let send_res = [];
                for (let val of result) {
                    let payment_details_for_qr = await helpers.get_total_qty_amt_paid_for_qr(val.id);
                    
                    let res = {
                        data_id: enc_dec.cjs_encrypt(val.id),
                        reference_no: val.ref_no,
                        payment_url: process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
                        store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
                        title: val.title,
                        description: val.description,
                        amount: val.currency + ' ' + val.amount.toFixed(2),
                        name: val.full_name,
                        status: val.status == 1 ? "Deactivated" : "Active",
                        stock: val.stock_control == 0 ? val.stock_count-payment_details_for_qr.quantity : 'NA',
                        created_at: moment(val.created_at).format('DD-MM-YYYY')
                    };
                    send_res.push(res);
                }
                total_count = await StoreQrModel.get_count(filter_arr,amount,amount_condition,limit,date_condition);
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "List fetched successfully.",
                        total_count
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    list_excel: async (req, res) => {
        let limit = {
            perpage: 0,
            page: 0,
        };
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));

            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }

        let filter_arr = { deleted: 0, merchant_id: req.user.id, mode: req.bodyString('mode') };
        let amount_condition = '';
        let amount=0;
        let date_condition = {};
        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        if (req.bodyString('store_id')) {
            filter_arr.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
        }

        if (req.bodyString("status") == "0") {
            filter_arr.status = 0;
        }
        if (req.bodyString("status") == "1") {
            filter_arr.status = 1;
        }
        if(req.bodyString("status")=="2"){
            filter_arr.status = 2;
        }
        if(req.bodyString("currency")){
            filter_arr.currency =req.bodyString("currency");
        }
        if(req.bodyString('amount') && req.bodyString('amount_compare_type')){
            if(req.bodyString('amount_compare_type')=='less_than'){
                amount = req.bodyString('amount');
                amount_condition ='<';
            }else if(req.bodyString('amount_compare_type')=='greater_than'){
                amount = req.bodyString('amount');
                amount_condition ='>';
            }else if(req.bodyString('amount_compare_type')=='equal_to'){
                amount = req.bodyString('amount');
                amount_condition ='  ';
            }
        }
        StoreQrModel.select(filter_arr,amount,amount_condition,limit,date_condition)
            .then(async (result) => {
                let send_res = [];
                let i=1;
                for (let val of result) {
                    let payment_details_for_qr = await helpers.get_total_qty_amt_paid_for_qr(val.id);
                    
                    let res = {
                        data_id: i,
                        reference_no: val.ref_no,
                        payment_url: process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
                        store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
                        title: val.title,
                        description: val.description,
                        amount: val.currency + ' ' + val.amount.toFixed(2),
                        name: val.full_name,
                        status: val.status == 1 ? "Deactivated" : "Active",
                        stock: val.stock_control == 0 ? val.stock_count-payment_details_for_qr.quantity : 'NA',
                        created_at: moment(val.created_at).format('DD-MM-YYYY')
                    };
                    send_res.push(res);
                    i++;
                }
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("Invoices");
                worksheet.columns = [
                    { header: "Sr. No.", key: 'data_id', width: 5 },
                    { header: "Reference No", key: 'reference_no', width: 25 },
                    { header: "Payment URL", key: 'payment_url', width: 25 },
                    { header: "Store ID", key: 'store_id', width: 25 },
                    { header: "Store Name", key: 'store_name', width: 25 },
                    { header: "Title", key: 'title', width: 25 },
                    { header: "Description", key: 'description', width: 25 },
                    { header: "Amount", key: "amount", width: 25 },
                    { header: "Name", key: "name", width: 25 },
                    { header: "Stock", key: "status", width: 10 },
                    { header: "Created At", key: "created_at", width: 10 }
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

                res.setHeader("Content-Disposition", "attachment; filename=StoreQR.xlsx");

                workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    list_pdf: async (req, res) => {
        let limit = {
            perpage: 0,
            page: 0,
        };
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));

            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }

        let filter_arr = { deleted: 0, merchant_id: req.user.id, mode: req.bodyString('mode') };
        let amount_condition = '';
        let amount=0;
        let date_condition = {};
        if (req.bodyString('from_date')) {
            date_condition.from_date = req.bodyString('from_date')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = req.bodyString('to_date')
        }
        if (req.bodyString('store_id')) {
            filter_arr.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
        }

        if (req.bodyString("status") == "0") {
            filter_arr.status = 0;
        }
        if (req.bodyString("status") == "1") {
            filter_arr.status = 1;
        }
        if(req.bodyString("status")=="2"){
            filter_arr.status = 2;
        }
        if(req.bodyString("currency")){
            filter_arr.currency =req.bodyString("currency");
        }
        if(req.bodyString('amount') && req.bodyString('amount_compare_type')){
            if(req.bodyString('amount_compare_type')=='less_than'){
                amount = req.bodyString('amount');
                amount_condition ='<';
            }else if(req.bodyString('amount_compare_type')=='greater_than'){
                amount = req.bodyString('amount');
                amount_condition ='>';
            }else if(req.bodyString('amount_compare_type')=='equal_to'){
                amount = req.bodyString('amount');
                amount_condition ='  ';
            }
        }
        StoreQrModel.select(filter_arr,amount,amount_condition,limit,date_condition)
            .then(async (result) => {
                let send_res = [];
                let i=1;
                for (let val of result) {
                    let payment_details_for_qr = await helpers.get_total_qty_amt_paid_for_qr(val.id);
                    
                    let res = {
                        data_id: i,
                        reference_no: val.ref_no,
                        payment_url: process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
                        store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
                        title: val.title,
                        description: val.description,
                        amount: val.currency + ' ' + val.amount.toFixed(2),
                        name: val.full_name,
                        status: val.status == 1 ? "Deactivated" : "Active",
                        stock: val.stock_control == 0 ? val.stock_count-payment_details_for_qr.quantity : 'NA',
                        created_at: moment(val.created_at).format('DD-MM-YYYY')
                    };
                    send_res.push(res);
                    i++;
                }
                const table = {
                    subtitle: "QR",
                    headers: [
                        { label: "Sr. No.", property: 'data_id', width: 50 },
                        { label: "Reference No", property: 'reference_no', width: 80 },
                        { label: "Payment URL", property: 'payment_url', width: 100 },
                        { label: "Store ID", property: 'store_id', width: 50 },
                        { label: "Store Name", property: 'store_name', width: 50 },
                        { label: "Title", property: 'title', width: 60 },
                        { label: "Description", property: "description", width: 50 },
                        { label: "Amount", property: "amount", width: 50 },
                        { label: "Name", property: "name", width: 100 },
                        { label: "Status", property: "status", width: 30 },
                        { label: "Stock", property: "stock", width: 30 },
                        { label: "Created AT", property: "created_at", width: 50 },

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
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    details: async (req, res) => {
        
        let qr_id = await enc_dec.cjs_decrypt(
            req.bodyString("qr_id")
        );
        StoreQrModel.selectOne("*", { id: qr_id, deleted: 0 })
            .then(async (result) => {
                let val = result;
                let res1 = {
                    data_id: enc_dec.cjs_encrypt(val.id),
                    reference_no :val.ref_no,
                    payment_url: process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                    store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
                    enc_store_id: enc_dec.cjs_encrypt(val.store_id),
                    store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
                    title: val.title,
                    product_cart_id: val.product_cart_id,
                    currency: val.currency,
                    amount: val.amount.toFixed(2),
                    min_order_quantity: val.min_order_quantity,
                    max_order_quantity: val.max_order_quantity,
                    full_name: val.full_name,
                    address_line_1: val.address_line_1,
                    city: val.city,
                    country_id: val.country?enc_dec.cjs_encrypt(val.country):'',
                    country: val.country? await helpers.get_country_name_by_id(val.country):'',
                    email: val.email,
                    phone_code: val.phone_code,
                    phone_no: val.phone_number,
                    variable_value_status: val.variable_value_status == 1 ? 'Disabled' : 'Enabled',
                    variable_value_title: val.variable_value_title,

                    not_valid_before: moment(val.not_valid_before).isValid() ? moment(val.not_valid_before).format('DD MMM YYYY') : '',

                    not_valid_after: moment(val.not_valid_after).isValid() ? moment(val.not_valid_after).format('DD MMM YYYY') : '',

                    formatted_not_valid_before: moment(val.not_valid_before).isValid() ? moment(val.not_valid_before).format('YYYY-MM-DD') : '',

                    formatted_not_after_before: moment(val.not_valid_after).isValid() ? moment(val.not_valid_after).format('YYYY-MM-DD') : '',

                    stock_control_status: val.stock_control == 1 ? 'Disabled' : 'Enabled',

                    stock_count: val.stock_count,
                    description: val.description,
                    images: val.images?val.images:'',
                    image_id:val.images?enc_dec.cjs_encrypt(val.images):'',
                    tweeter_id: val.tweeter_id,
                    status: val.status == 1 ? "Deactivated" : "Active",
                    created_at:moment(val.created_at).format('DD MMM YYYY hh:mm'),
                    social_links:{
                        whats_app:'https://api.whatsapp.com/send?text=*Payment link:-* Click on the link to make payment.'+ process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        linkedin:'https://www.linkedin.com/shareArticle?mini=true&amp;url='+process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        tweeter:'http://twitter.com/share?text=Payment link., Click on the link and scan the QR code&amp;url='+process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        facebook:'https://www.facebook.com/sharer/sharer.php?u='+process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                    }

                };

                QRCode.toDataURL(res1.payment_url, {}, function (err, url) {
                    if (err) throw err
                    console.log(url);
                    res1.qr_code = url;
                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            res1,
                            "Details fetched successfully."
                        )
                    );

                })
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    qr_code_details: async (req, res) => {
        let qr_id = req.bodyString("qr_id");
        StoreQrModel.selectOne("*", { qr_id: qr_id, deleted: 0 })
            .then(async (qr_details) => {
                let today = moment().format('YYYY-MM-DD');
                let payment_details_for_qr = await helpers.get_total_qty_amt_paid_for_qr(qr_details.id);
                
                if (qr_details.status != 0) {
                   
                    res.status(statusCode.ok).send(
                        response.errormsg('Sorry, this item is not currently available.')
                    );
                } else if (qr_details.stock_control == 0 && qr_details.stock_count-payment_details_for_qr.quantity == 0) {
                    
                    res.status(statusCode.ok).send(
                        response.errormsg('Sorry, this item is not currently available.')
                    );
                } else if (moment(qr_details.not_valid_before).isValid() && moment(today).isBefore(moment(qr_details.not_valid_before), 'day')) {
                    res.status(statusCode.ok).send(
                        response.errormsg('Sorry, this item is not yet available. Please try again later.')
                    );
                }
                else if (moment(qr_details.not_valid_after).isValid() && moment(today).isAfter(moment(qr_details.not_valid_after), 'day')) {
                    res.status(statusCode.ok).send(
                        response.errormsg('Sorry, this item is no longer available.')
                    );
                }
                else {
                    console.log(qr_details)
                    let val = qr_details;
                    let res1 = {
                        data_id: enc_dec.cjs_encrypt(val.id),
                        qr_id: val.qr_id,
                        payment_url: process.env.CHECKOUT_URL + 'qr/' + val.qr_id,
                        store_id: enc_dec.cjs_encrypt(val.store_id),
                        store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
                        title: val.title,
                        product_cart_id: val.product_cart_id,
                        currency: val.currency,
                        amount: val.amount.toFixed(2),
                        min_order_quantity: val.min_order_quantity,
                        max_order_quantity: val.max_order_quantity,
                        full_name: val.full_name,
                        address_line_1: val.address_line_1,
                        city: val.city,
                        country: val.country?await helpers.get_country_name_by_id(val.country):'',
                        email: val.email,
                        phone_code: val.phone_code,
                        phone_no: val.phone_number,
                        variable_value_status: val.variable_value_status == 1 ? 'Disabled' : 'Enabled',
                        variable_value_title: val.variable_value_title,
                        not_valid_before: (val.not_valid_before && val.not_valid_before != '0000-00-00' && moment(val.not_valid_before).isValid()) ? val.not_valid_before : '',
                        not_valid_after: (val.not_valid_after && val.not_valid_after != '0000-00-00' && moment(val.not_valid_after).isValid()) ? val.not_valid_after : '',
                        stock_control_status: val.stock_control == 1 ? 'Disabled' : 'Enabled',
                        stock_count: val.stock_count,
                        description: val.description,
                        images: val.images? process.env.STATIC_URL + '/static/store-qr-images/'+await helpers.get_image_name_by_id(val.images):'',
                        tweeter_id: val.tweeter_id,
                        status: val.status == 1 ? "Deactivated" : "Active",
                        mode: val.mode
                    };

                    
                    send_res = res1;

                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            send_res,
                            "Details fetched successfully."
                        )
                    );
                }
                // res.status(statusCode.ok).send(
                //     response.successdatamsg(
                //         send_res,
                //         "Details fetched successfully."
                //     )
                // );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    update: async (req, res) => {
        try {
            let updated_at = new Date().toJSON().substring(0, 19).replace("T", " ");
            let qr_id = enc_dec.cjs_decrypt(req.bodyString('qr_id'))
            let ins_body = {
                title: req.bodyString('title'),
                product_cart_id: req.bodyString('product_or_card_id'),
                store_id:enc_dec.cjs_decrypt(req.bodyString('store_id')),
                currency: req.bodyString('currency'),
                amount: req.bodyString('amount')?parseFloat(req.bodyString('amount'))+0:0,
                min_order_quantity: req.bodyString('variable_value_status') == 0? req.bodyString('min_order_quantity')?parseInt(req.bodyString('min_order_quantity')):1:1,
                max_order_quantity: req.bodyString('variable_value_status') == 0? req.bodyString('max_order_quantity')?parseInt(req.bodyString('max_order_quantity')):1:1,
                full_name: req.bodyString('full_name'),
                address_line_1: req.bodyString('address_line_1'),
                city: req.bodyString('city'),
                country: req.bodyString('country')?enc_dec.cjs_decrypt(req.bodyString('country')):0,
                email: req.bodyString('email'),
                phone_code: req.bodyString('phone_code'),
                phone_number: req.bodyString('phone_no'),
                variable_value_status: req.bodyString('variable_value_status') == 0? 1 : 0,
                variable_value_title: req.bodyString('variable_value_title'),
                not_valid_before: req.bodyString('not_valid_before')?moment(req.bodyString('not_valid_before')).format('YYYY-MM-DD'):'',
                not_valid_after:  req.bodyString('not_valid_after')?moment(req.bodyString('not_valid_after')).format('YYYY-MM-DD'):'',

                stock_control: (req.bodyString('variable_value_status') == 1 && req.bodyString('stock_control') == 1) ? 1 : (req.bodyString('stock_control') == 0 ? 1 : 0) ,

                stock_count: req.bodyString('variable_value_status') == 0 ? 0 : req.bodyString('stock_count'),
                description: req.bodyString('description'),
                images: req.bodyString('images') ? enc_dec.cjs_decrypt(req.bodyString('images')) : 0,
                tweeter_id: req.bodyString('tweeter_id'),
                updated_at: updated_at
            }
            let result = await StoreQrModel.updateDetails(
                { id: qr_id },
                ins_body
            );
            res.status(statusCode.ok).send(
                response.successmsg("QR updated successfully")
            );
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    activate: async (req, res) => {
        try {
            let qr_id = enc_dec.cjs_decrypt(
                req.bodyString("qr_id")
            );
            var insdata = {
                status: 0,
            };

            $ins_id = await StoreQrModel.updateDetails(
                { id: qr_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("QR activated successfully")
            );
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    deactivate: async (req, res) => {
        try {
            let qr_id = enc_dec.cjs_decrypt(
                req.bodyString("qr_id")
            );
            var insdata = {
                status: 1,
            };

            $ins_id = await StoreQrModel.updateDetails(
                { id: qr_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("QR deactivated successfully")
            );
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    delete: async (req, res) => {
        try {
            let qr_id = await enc_dec.cjs_decrypt(
                req.bodyString("qr_id")
            );
            let insdata = {
                deleted: 1,
            };
            StoreQrModel.updateDetails(
                { id: qr_id },
                insdata
            ).then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg("QR deleted successfully")
                );
            })
                .catch((error) => {
                    res.status(statusCode.internalError).send(
                        response.errormsg(error.message)
                    );
                });
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
};
module.exports = StoreQRImages;
