const PayoutModel = require("../models/payout");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
const admin_activity_logger = require('../utilities/activity-logger/admin_activity_logger');
const moment = require('moment');
const mailSender = require("../utilities/mail/mailsender");
const submerchantModel = require('../models/submerchantmodel');
const dynamic_pricing_calculation = require("../models/dynamic_pricing_calculation");
const ordersModel = require('../models/merchantOrder');

const excel = require('exceljs');
var Payout = {
    add: async (req, res) => {
        try {
            let merchant_list = await PayoutModel.selectMerchantList();
            let todays_payout = [];
            console.log(merchant_list);
           for (let merchant of merchant_list) {
                let last_payout_details = await PayoutModel.findLastPayoutDate(merchant.merchant_id);
                console.log(merchant.company_name);
                console.log(last_payout_details);
                if (last_payout_details) {
                    let last_date = moment(last_payout_details).format('YYYY-MM-DD');
                    var new_date = moment(last_date, "DD-MM-YYYY").add(merchant.interval_days, 'days');

                    if (moment().isSame(new_date, 'day')) {
                        todays_payout.push(merchant);
                    }
                } else {
                    if (moment().isSame(merchant.next_payout_date, 'day')) {
                        todays_payout.push(merchant);
                    }
                }
            }
            console.log(todays_payout);
          
            let i = 0;
            for (let payout of todays_payout) {
                let total_unsettled_amount = await PayoutModel.totalSettlementCalculate(payout.merchant_id);
                let total_refunded_amount = await PayoutModel.totalRefundedCalculate(payout.merchant_id);
                let total_settlement_amount = parseFloat(total_unsettled_amount) - parseFloat(total_refunded_amount);
                if (total_settlement_amount > 0) {
                    payout.total_settlement_amount = total_settlement_amount;
                } else {
                    todays_payout.splice(i, 1);
                }
                i++;
            }
            console.log(todays_payout)
             
            let payout_id = 0;
            if (todays_payout.length > 0) {
                let payout_insert_res = await PayoutModel.addPayout({ payout_date: moment().format('YYYY-MM-DD'), status: 'Processed', payout_no: await helpers.make_order_number('PO') });
                payout_id = payout_insert_res.insert_id;
            }
            console.log(todays_payout);
            if (payout_id != 0) {
                let batch_payout_details_insert = []
                for (let payout of todays_payout) {
                    if (payout) {
                        let temp = {
                            payout_id: payout_id,
                            merchant_id: payout.merchant_id,
                            super_merchant_id: payout.super_merchant_id,
                            amount: payout.total_settlement_amount,
                            currency: payout.payout_currency,
                            bank_name: payout.bank_name,
                            account_no: payout.account_no,
                            swift: payout.swift,
                            iban: payout.iban,
                            status: 'Processed',
                            created_at: moment().format('YYYY-MM-DD HH:mm:ss')
                        }
                        batch_payout_details_insert.push(temp);
                        await PayoutModel.updateDetails({ merchant_id: payout.merchant_id, is_settled: 0 }, { is_settled: 1 })
                        await Payout.add_dynamic_charges_payout(payout.merchant_id, payout.total_settlement_amount);
                    }
                }
                if (batch_payout_details_insert.length > 0) {
                    let updated_res = await PayoutModel.addPayoutDetails(batch_payout_details_insert);
                }

                let email_promise = []
                for (let email_data of todays_payout) {
                    if (email_data) {
                        email_promise.push(mailSender.payoutMail(email_data.email, email_data.company_name, 'Payout Notification', process.env.FRONTEND_URL + 'reports/payouts', moment().format('YYYY-MM-DD')))
                    }
                }

                if (email_promise) {
                    await Promise.all(email_promise)
                }
            } 
            res.send("okay done")
        } catch (error) {
            console.log(error);
        }
    },

    add_dynamic_charges_payout_test: async (req, res) => {
        await Payout.add_dynamic_charges_payout(50, 999.9);
        res.status(statusCode.ok).send(response.successmsg('success.'))
    },
    add_dynamic_charges_payout: async (merchant_id, payout_amount) => {
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let [merchant_details, monthly_txn_sum] = await Promise.all([
            submerchantModel.getOneMerchantDetails('s.id,s.activation_date,s.super_merchant_id,m.payout_fee', { 's.id': merchant_id }),
            dynamic_pricing_calculation.currentMonthTxnSum(merchant_id),
        ])

        let pricing_plans = await ordersModel.selectDynamic('*', { 'from_amount <=': monthly_txn_sum, 'to_amount >=': monthly_txn_sum }, 'pricing_plan');

        let payout_charges = merchant_details?.payout_fee ? merchant_details.payout_fee : 0;
        let percentage_vat = parseFloat(await helpers.percentage(parseFloat(pricing_plans[0].vat_percentage), parseFloat(payout_charges)))
        let debit_credit = parseFloat(payout_charges) + parseFloat(percentage_vat)

        let payout_charges_obj = {
            added_date: added_date,
            value_date: added_date,
            merchant_id: merchant_id,
            super_merchant_id: merchant_details.super_merchant_id,
            txn_type: 'Payout Charges',
            no_of_txn: 0,
            volume: 0,
            monthly_fees: 0,
            payout_charges: (-payout_charges),
            mdr: 0,
            txn_fees: 0,
            percentage_vat: (-percentage_vat),
            debit_credit: (-debit_credit),
            balance: parseFloat(await dynamic_pricing_calculation.getBalance(merchant_id)) + parseFloat(-debit_credit),
            update_date: added_date,
        }

        let payout = {
            added_date: added_date,
            merchant_id: merchant_id,
            value_date: added_date,
            super_merchant_id: merchant_details.super_merchant_id,
            txn_type: 'Payout',
            no_of_txn: 0,
            volume: (-(parseFloat(payout_amount))),
            monthly_fees: 0,
            payout_charges: 0,
            mdr: 0,
            txn_fees: 0,
            percentage_vat: 0,
            debit_credit: (-(parseFloat(payout_amount))),
            balance: parseFloat(await dynamic_pricing_calculation.getBalance(merchant_id)) + (-(parseFloat(payout_amount))),
            update_date: added_date,
        }
        await dynamic_pricing_calculation.insert([payout_charges_obj, payout]);
        return;
    },

    master_list: async (req, res) => {
        try {
            let limit = {
                perpage: 10,
                start: 0,
                page: 1,
            }
            let date_condition = {};
            if (req.bodyString('from_date')) {
                date_condition.from_date = req.bodyString('from_date')
            }
            if (req.bodyString('to_date')) {
                date_condition.to_date = req.bodyString('to_date')
            }

            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))
                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }
            PayoutModel.selectMaster(date_condition, limit).then(async (result) => {
                let res_p = [];
                for (let payout of result) {
                    let temp = {
                        payout_id: enc_dec.cjs_encrypt(payout.id),
                        payout_no: payout.payout_no,
                        status: payout.status,
                        created_at: moment(payout.payout_date).format('YYYY-MM-DD')
                    }
                    res_p.push(temp);
                }
                let total_records = await PayoutModel.master_count(date_condition);
                res.status(statusCode.ok).send(response.successdatamsg(res_p, 'Payouts fetch successfully.', total_records))
            }).catch((error) => {
                console.log(error);
            })

        } catch (error) {
            console.log(error);
        }
    },
    list: async (req, res) => {
        try {
            let limit = {
                perpage: 10,
                start: 0,
                page: 1,
            }
            let date_condition = {};
            let and_filter_obj = {};
            if (req.bodyString('merchant')) {
                and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
            }
            let payout_id = '';
            if (req.user.type == 'merchant') {
                and_filter_obj.super_merchant_id = req.user.id;
            } else {
                if (req.bodyString('super_merchant')) {
                    and_filter_obj.super_merchant_id = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
                }
                payout_id = enc_dec.cjs_decrypt(req.bodyString('payout_id'));
            }
            if (req.bodyString('currency')) {
                and_filter_obj.currency = req.bodyString('currency')
            }
            if (req.bodyString('from_date')) {
                date_condition.from_date = req.bodyString('from_date')
            }
            if (req.bodyString('to_date')) {
                date_condition.to_date = req.bodyString('to_date')
            }

            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))
                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }

            PayoutModel.selectList(and_filter_obj, date_condition, limit, payout_id).then(async (result) => {
                console.log(result);
                let res_p = [];
                for (let payout of result) {
                    let temp = {
                        payout_details_id: enc_dec.cjs_encrypt(payout.id),
                        payout_id: enc_dec.cjs_encrypt(payout.payout_id),
                        status: payout.status,
                        amount: payout.amount.toFixed(2),
                        currency: payout.currency,
                        bank_name: payout.bank_name,
                        account_no: payout.account_no,
                        swift: payout.swift,
                        iban: payout.iban,
                        status: payout.status,
                        merchant_id: await helpers.get_merchant_details_name_by_id(payout.merchant_id),
                        created_at: moment(payout.created_at).format('YYYY-MM-DD HH:mm')
                    }
                    res_p.push(temp);
                }
                let total_records = await PayoutModel.selectListCount(and_filter_obj, date_condition, payout_id)
                res.status(statusCode.ok).send(response.successdatamsg(res_p, 'Payouts fetch successfully.', total_records))
            }).catch((error) => {
                console.log(error);
            })

        } catch (error) {
            console.log(error);
        }
    },
    payout_excel: async (req, res) => {
        try {
            let limit = {
                perpage: 10,
                start: 0,
                page: 1,
            }
            let date_condition = {};
            let and_filter_obj = {};
            if (req.bodyString('merchant')) {
                and_filter_obj.merchant_id = encrypt_decrypt('decrypt', req.bodyString('merchant'))
            }
            if (req.user.type == 'merchant') {
                and_filter_obj.super_merchant_id = req.user.id;
            } else {
                if (req.bodyString('super_merchant')) {
                    and_filter_obj.super_merchant_id = encrypt_decrypt('decrypt', req.bodyString('super_merchant'))
                }
            }
            if (req.bodyString('currency')) {
                and_filter_obj.currency = req.bodyString('currency')
            }
            if (req.bodyString('from_date')) {
                date_condition.from_date = req.bodyString('from_date')
            }
            if (req.bodyString('to_date')) {
                date_condition.to_date = req.bodyString('to_date')
            }

            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))
                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }
            let payout_id = enc_dec.cjs_decrypt(req.bodyString('payout_id'));
            PayoutModel.selectList(and_filter_obj, date_condition, limit, payout_id).then(async (result) => {
                console.log(result);
                let res_p = [];
                for (let payout of result) {
                    console.log(payout);
                    let temp = {
                        record_type: 'P',
                        value_date: moment(payout.created_at).format('YYYY-MM-DD'),
                        currency: payout.currency,
                        debit_account_no: '0191001173215',
                        amount: payout.amount.toFixed(2),
                        charge_account_no: '019100131611',
                        charge_type: "OUR",
                        customer_payment_reference_no: '',
                        deal_reference_no: '',
                        deal_rate: '',
                        deal_date: '',
                        account_no: payout.account_no,
                        iban: payout.iban,
                        beneficiary_name: await helpers.get_merchant_details_name_by_id(payout.merchant_id),
                        swift_code: payout.swift,
                        routing_code: "",
                        bank_name: payout.bank_name,
                        bank_address: '',
                        bank_location: "",
                        bank_country: '',
                        purpose: "Settlement to merchant",
                        purpose_of_payment: "FIS",
                        intermediary_bank_swift_code: '',
                        transaction_type_code: "BT",
                        email: await helpers.get_merchantdetails_email_by_id(payout.merchant_id),
                        no_of_invoice: '',
                    }
                    res_p.push(temp);
                }
                // generate excel
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("Invoices");
                worksheet.columns = [
                    { header: "Record Type", key: 'record_type', width: 5 },
                    { header: "Value Date", key: 'value_date', width: 25 },
                    { header: "Transaction Currency", key: 'currency', width: 25 },
                    { header: "Debit Account No.", key: 'debit_account_no', width: 25 },
                    { header: "Payment Amount", key: 'amount', width: 25 },
                    { header: "Charge Account No.", key: 'charge_account_no', width: 25 },
                    { header: "Charge Type", key: "charge_type", width: 25 },
                    { header: "Customer Reference No", key: "customer_payment_reference_no", width: 25 },
                    { header: "Deal Rate", key: "deal_reference_no", width: 10 },
                    { header: "Deal Date", key: "deal_rate", width: 10 },
                    { header: "Beneficiary Name", key: "beneficiary_name", width: 10 },
                    { header: "Beneficiary Account No.", key: "account_no", width: 10 },
                    { header: "IBAN NO", key: 'iban', width: 25 },
                    { header: "Beneficiary Bank Swift Code", key: "swift_code", width: 10 },
                    { header: "Routing Code", key: "routing_code", width: 10 },
                    { header: "Beneficiary Bank Name", key: "bank_name", width: 10 },
                    { header: "Beneficiary Bank Address", key: "bank_address", width: 10 },
                    { header: "Beneficiary Bank Location", key: "bank_location", width: 10 },
                    { header: "Beneficiary Bank Country", key: "bank_country", width: 10 },
                    { header: "Purpose of Payment Additional Info", key: "purpose", width: 10 },
                    { header: "Purpose of Payment", key: "purpose_of_payment", width: 10 },
                    { header: "Intermediary Bank Swift Code", key: "intermediary_bank_swift_code", width: 10 },
                    { header: "Transaction Type Code", key: "transaction_type_code", width: 10 },
                    { header: "Beneficiary E-mail Id", key: "email", width: 10 },
                    { header: "No of Invoices", key: "no_of_invoice", width: 10 },
                ];
                worksheet.addRows(res_p);

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "payouts.xlsx"
                );
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", "attachment; filename=payouts.xlsx");
                workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });

            }).catch((error) => {
                console.log(error);
            })

        } catch (error) {
            console.log(error);
        }
    }
}
module.exports = Payout;