const TransactionsModel = require("../models/transactions");
const dashboard = require("../models/dashboard");
const MerchantModel = require("../models/merchantmodel");
const PspModel = require("../models/psp");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper");
const enc_dec = require("../utilities/decryptor/decryptor");
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const moment = require("moment");
const e = require("express");
var res_data = {
    dashboard: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");

        let from_date = moment().subtract(7, "day").format("YYYY-MM-DD");
        let to_date = moment(new Date()).format("YYYY-MM-DD");

        if (req.bodyString("from_date") && req.bodyString("to_date")) {
            from_date = req.bodyString("from_date");
            to_date = req.bodyString("to_date");
        }

        let data = {};

        try {
            if (req.user.type == "admin") {
                let mode = req.bodyString("mode");
                let transaction_table = "";
                if (mode == "test") {
                    transaction_table = "orders_test";
                } else {
                    transaction_table = "orders";
                }
                let search_date = { from_date: from_date, to_date: to_date };
                let no_of_transactions =
                    await TransactionsModel.get_dynamic_count(
                        {},
                        req.bodyString("from_date") ? search_date : {},
                        transaction_table
                    );
                let total_revenue = await TransactionsModel.get_volume_dynamic(
                    {},
                    req.bodyString("from_date") ? search_date : {},
                    transaction_table
                );
                let psp = await PspModel.get_psp_by_merchant_admin();
                let total_sub_merchant =
                    await MerchantModel.get_sub_merchant_count_by_merchant(
                        "status=0 and deleted=0 and ekyc_required=0 and onboarding_done=1",
                        req.bodyString("from_date") ? search_date : false
                    );
                //=================Weekly==================//
                let weekly_transactions = [];
                let week_start_date;
                let week_end_date;
                let get_week_wise_amount;
                for (let k = 0; k <= 9; k++) {
                    week_start_date = moment()
                        .subtract(k, "weeks")
                        .startOf("week")
                        .format("YYYY-MM-DD");
                    week_end_date = moment()
                        .subtract(k, "weeks")
                        .endOf("week")
                        .format("YYYY-MM-DD");

                    get_week_wise_amount =
                        await TransactionsModel.get_week_wise_amount(
                            {
                                from_date: week_start_date,
                                to_date: week_end_date,
                            },
                            {},
                            transaction_table
                        );

                    weekly_transactions.push({
                        start_date: week_start_date,
                        end_date: week_end_date,
                        amount: get_week_wise_amount,
                    });
                }
                //=================Weekly END==============//
                //=========== Daily ==============//
                var last_days = 10;
                var date_last_days = moment()
                    .subtract(last_days, "day")
                    .format("YYYY-MM-DD");
                let daily_query_res =
                    await TransactionsModel.get_last_day_wise_amount(
                        date_last_days,
                        {},
                        transaction_table
                    );
                let daily_status_obj = [];
                let daily_transactions = [];
                for (let val of daily_query_res) {
                    daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let daily_date;
                for (let j = 0; j <= last_days; j++) {
                    daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (daily_status_obj[daily_date] !== undefined) {
                        daily_transactions.push(daily_status_obj[daily_date]);
                    } else {
                        daily_transactions.push({ date: daily_date, total: 0 });
                    }
                }

                //=========== Daily END==============//
                let shared_revenue = 0;
                if (psp.length > 0 && total_revenue > 0) {
                    shared_revenue = total_revenue / psp.length;
                }
                let donut_chart = [];
                for (i = 0; i < psp.length; i++) {
                    donut_chart.push(shared_revenue);
                }

                let last_ten_transactions_resp =
                    await TransactionsModel.selectTenTransactions(
                        { "ord.status": "completed" },
                        transaction_table
                    );

                //================Fraud Detections Count===============/
                let block_transaction_count =
                    await TransactionsModel.get_fraud_transaction_counter(
                        transaction_table
                    );

                let block_volume_total =
                    await TransactionsModel.get_fraud_volume(transaction_table);
                //================ Fraud Detection Count End  //
                //=========== Fraud Daily ==============//
                var fraud_last_days = 10;
                var fraud_date_last_days = moment()
                    .subtract(fraud_last_days, "day")
                    .format("YYYY-MM-DD");
                /*Total Transaction for date*/
                let fraud_daily_query_res =
                    await TransactionsModel.get_last_day_wise_amount(
                        date_last_days,
                        {},
                        transaction_table
                    );
                /*Total Blocked Transaction for the date*/

                let fraud_daily_status_obj = [];
                let fraud_daily_transactions = [];
                for (let val of fraud_daily_query_res) {
                    fraud_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_daily_status_obj[fraud_daily_date] !== undefined
                    ) {
                        fraud_daily_transactions.push(
                            fraud_daily_status_obj[fraud_daily_date]
                        );
                    } else {
                        fraud_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }

                let fraud_blocked_daily_query_res =
                    await TransactionsModel.get_blocked_last_day_wise_amount(
                        date_last_days,
                        " block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1",
                        transaction_table
                    );
                let fraud_blocked_daily_status_obj = [];
                let fraud_blocked_daily_transactions = [];
                for (let val of fraud_blocked_daily_query_res) {
                    fraud_blocked_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_blocked_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_blocked_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_blocked_daily_status_obj[
                            fraud_blocked_daily_date
                        ] !== undefined
                    ) {
                        fraud_blocked_daily_transactions.push(
                            fraud_blocked_daily_status_obj[
                                fraud_blocked_daily_date
                            ]
                        );
                    } else {
                        fraud_blocked_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }

                let fraud_high_risk_daily_query_res =
                    await TransactionsModel.get_high_risk_last_day_wise_amount(
                        date_last_days,
                        " high_risk_transaction=1 OR high_risk_country=1 ",
                        transaction_table
                    );
                let fraud_high_risk_daily_status_obj = [];
                let fraud_high_risk_daily_transactions = [];
                for (let val of fraud_high_risk_daily_query_res) {
                    fraud_high_risk_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_high_risk_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_high_risk_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_high_risk_daily_status_obj[
                            fraud_high_risk_daily_date
                        ] !== undefined
                    ) {
                        fraud_high_risk_daily_transactions.push(
                            fraud_high_risk_daily_status_obj[
                                fraud_high_risk_daily_date
                            ]
                        );
                    } else {
                        fraud_high_risk_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }

                let fraud_transactions_array = [];
                for (i = 0; i < fraud_daily_transactions.length; i++) {
                    let obj = {
                        date: fraud_daily_transactions[i].date,
                        total: fraud_daily_transactions[i].total,
                        blocked: fraud_blocked_daily_transactions[i].total,
                        high_risk: fraud_high_risk_daily_transactions[i].total,
                    };
                    fraud_transactions_array.push(obj);
                }

                //=========== Fraud Daily END==============//

                data.recent_transactions = last_ten_transactions_resp;
                data.graph_data = weekly_transactions;
                (data.pie_chart_label = psp),
                    (data.pie_chart_value = donut_chart);
                data.total_revenue = total_revenue;
                data.total_transaction = no_of_transactions;
                data.total_sub_merchant = total_sub_merchant;
                data.total_psp = psp.length;
                data.daily_transactions = daily_transactions;
                data.total_blocked_transactions = block_transaction_count;
                data.total_blocked_volume = block_volume_total;
                data.fraud_daily_transaction = fraud_transactions_array;
                res.status(statusCode.ok).send(
                    response.successdatamsg(data, "Details fetch successfully")
                );
            } else {
                let mode = req.bodyString("mode");
                let transaction_table = "";
                if (mode == "test") {
                    transaction_table = "orders_test";
                } else {
                    transaction_table = "orders";
                }
                let search_date = { from_date: from_date, to_date: to_date };
                let no_of_transactions =
                    await TransactionsModel.get_dynamic_count(
                        { super_merchant: req.user.id },
                        req.bodyString("from_date") ? search_date : {},
                        transaction_table
                    );
                let total_revenue = await TransactionsModel.get_volume_dynamic(
                    { super_merchant: req.user.id },
                    req.bodyString("from_date") ? search_date : {},
                    transaction_table
                );
                let psp = await PspModel.get_psp_by_merchant(
                    "merchant_id=" + req.user.id
                );
                let total_sub_merchant =
                    await MerchantModel.get_sub_merchant_count_by_merchant(
                        " super_merchant_id=" + req.user.id,
                        req.bodyString("from_date") ? search_date : false
                    );

                //=================Weekly==================//
                let weekly_transactions = [];
                let week_start_date;
                let week_end_date;
                let get_week_wise_amount;
                for (let k = 0; k <= 9; k++) {
                    week_start_date = moment()
                        .subtract(k, "weeks")
                        .startOf("week")
                        .format("YYYY-MM-DD");
                    week_end_date = moment()
                        .subtract(k, "weeks")
                        .endOf("week")
                        .format("YYYY-MM-DD");

                    get_week_wise_amount =
                        await TransactionsModel.get_week_wise_amount(
                            {
                                from_date: week_start_date,
                                to_date: week_end_date,
                            },
                            { super_merchant: req.user.id },
                            transaction_table
                        );

                    weekly_transactions.push({
                        start_date: week_start_date,
                        end_date: week_end_date,
                        amount: get_week_wise_amount,
                    });
                }
                //=================Weekly END==============//
                //=========== Daily ==============//
                var last_days = 10;
                var date_last_days = moment()
                    .subtract(last_days, "day")
                    .format("YYYY-MM-DD");
                let daily_query_res =
                    await TransactionsModel.get_last_day_wise_amount(
                        date_last_days,
                        { super_merchant: req.user.id },
                        transaction_table
                    );
                let daily_status_obj = [];
                let daily_transactions = [];
                for (let val of daily_query_res) {
                    daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let daily_date;
                for (let j = 0; j <= last_days; j++) {
                    daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (daily_status_obj[daily_date] !== undefined) {
                        daily_transactions.push(daily_status_obj[daily_date]);
                    } else {
                        daily_transactions.push({ date: daily_date, total: 0 });
                    }
                }

                //=========== Daily END==============//
                let shared_revenue = 0;
                if (psp.length > 0) {
                    shared_revenue = total_revenue / psp.length;
                }
                let donut_chart = [];
                for (i = 0; i < psp.length; i++) {
                    donut_chart.push(shared_revenue);
                }

                let last_ten_transactions_resp =
                    await TransactionsModel.selectTenTransactions(
                        { "ord.super_merchant": req.user.id },
                        transaction_table
                    );
                //================Fraud Detections Count===============/
                let block_transaction_count =
                    await TransactionsModel.get_fraud_transaction_counter_merchant(
                        transaction_table,
                        " super_merchant=" + req.user.id
                    );

                let block_volume_total =
                    await TransactionsModel.get_fraud_volume_merchant(
                        transaction_table,
                        " super_merchant=" + req.user.id
                    );
                //================ Fraud Detection Count End  //
                //=========== Fraud Daily ==============//
                var fraud_last_days = 10;
                var fraud_date_last_days = moment()
                    .subtract(fraud_last_days, "day")
                    .format("YYYY-MM-DD");
                /*Total Transaction for date*/
                let fraud_daily_query_res =
                    await TransactionsModel.get_last_day_wise_amount(
                        date_last_days,
                        { super_merchant: req.user.id },
                        transaction_table
                    );
                /*Total Blocked Transaction for the date*/

                let fraud_daily_status_obj = [];
                let fraud_daily_transactions = [];
                for (let val of fraud_daily_query_res) {
                    fraud_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_daily_status_obj[fraud_daily_date] !== undefined
                    ) {
                        fraud_daily_transactions.push(
                            fraud_daily_status_obj[fraud_daily_date]
                        );
                    } else {
                        fraud_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }
                let fraud_blocked_daily_query_res =
                    await TransactionsModel.get_blocked_last_day_wise_amount(
                        date_last_days,
                        " (block_for_suspicious_ip=1 OR block_for_suspicious_email=1 OR block_for_transaction_limit=1) AND super_merchant=" +
                            req.user.id,
                        transaction_table
                    );
                let fraud_blocked_daily_status_obj = [];
                let fraud_blocked_daily_transactions = [];
                for (let val of fraud_blocked_daily_query_res) {
                    fraud_blocked_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_blocked_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_blocked_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_blocked_daily_status_obj[
                            fraud_blocked_daily_date
                        ] !== undefined
                    ) {
                        fraud_blocked_daily_transactions.push(
                            fraud_blocked_daily_status_obj[
                                fraud_blocked_daily_date
                            ]
                        );
                    } else {
                        fraud_blocked_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }

                let fraud_high_risk_daily_query_res =
                    await TransactionsModel.get_high_risk_last_day_wise_amount(
                        date_last_days,
                        " (high_risk_transaction=1 OR high_risk_country=1) AND super_merchant= " +
                            req.user.id,
                        transaction_table
                    );
                let fraud_high_risk_daily_status_obj = [];
                let fraud_high_risk_daily_transactions = [];
                for (let val of fraud_high_risk_daily_query_res) {
                    fraud_high_risk_daily_status_obj[
                        moment(val.transaction_date).format("DD-MM-YYYY")
                    ] = {
                        date: moment(val.transaction_date).format("DD-MM-YYYY"),
                        total: val.total,
                    };
                }
                let fraud_high_risk_daily_date;
                for (let j = 0; j <= fraud_last_days; j++) {
                    fraud_high_risk_daily_date = moment()
                        .subtract(j, "day")
                        .format("DD-MM-YYYY");
                    if (
                        fraud_high_risk_daily_status_obj[
                            fraud_high_risk_daily_date
                        ] !== undefined
                    ) {
                        fraud_high_risk_daily_transactions.push(
                            fraud_high_risk_daily_status_obj[
                                fraud_high_risk_daily_date
                            ]
                        );
                    } else {
                        fraud_high_risk_daily_transactions.push({
                            date: fraud_daily_date,
                            total: 0,
                        });
                    }
                }

                let fraud_transactions_array = [];
                for (i = 0; i < fraud_daily_transactions.length; i++) {
                    let obj = {
                        date: fraud_daily_transactions[i].date,
                        total: fraud_daily_transactions[i].total,
                        blocked: fraud_blocked_daily_transactions[i].total,
                        high_risk: fraud_high_risk_daily_transactions[i].total,
                    };
                    fraud_transactions_array.push(obj);
                }

                data.recent_transactions = last_ten_transactions_resp;
                data.graph_data = weekly_transactions;
                (data.pie_chart_label = psp),
                    (data.pie_chart_value = donut_chart);
                data.total_revenue = total_revenue;
                data.total_transaction = no_of_transactions;
                data.total_sub_merchant = total_sub_merchant;
                data.total_psp = psp.length;
                data.daily_transactions = daily_transactions;
                data.total_blocked_transactions = block_transaction_count;
                data.total_blocked_volume = block_volume_total
                    ? block_volume_total
                    : 0.0;
                data.fraud_daily_transaction = fraud_transactions_array;
                res.status(statusCode.ok).send(
                    response.successdatamsg(data, "Details fetch successfully")
                );
            }
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },

    analytics: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");
        let from_date = moment().subtract(30, "day").format("YYYY-MM-DD");
        let to_date = moment(new Date()).format("YYYY-MM-DD");

        if (req.bodyString("from_date") && req.bodyString("to_date")) {
            from_date = req.bodyString("from_date");
            to_date = req.bodyString("to_date");
        }
        // let data = {};

        try {
            // if (req.user.type == "admin") {

            let mode = req.bodyString("mode");
            let table_name = "";
            if (mode == "test") {
                table_name = "orders_test";
            } else {
                table_name = "orders";
            }

            let search_date = { from_date: from_date, to_date: to_date };

            let user = req.user.id;

            await dashboard
                .analytics(user, search_date, table_name)
                .then((result) => {
                    console.log("result", result);

                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            result,
                            "Data fetched successfully."
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },

    analytics_payment: async (req, res) => {
        
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");
        let from_date = moment().subtract(30, "day").format("YYYY-MM-DD");
        let to_date = moment(new Date()).format("YYYY-MM-DD");

        if (req.bodyString("from_date") && req.bodyString("to_date")) {
            from_date = req.bodyString("from_date");
            to_date = req.bodyString("to_date");
        }

        try {
            let mode = req.bodyString("mode");
            let table_name = "";
            if (mode == "test") {
                table_name = "orders_test";
            } else {
                table_name = "orders";
            }

            let search_date = { from_date: from_date, to_date: to_date };

            let user = req.user.id;

            await dashboard
                .analytics_payment(user, search_date, table_name)
                .then((result) => {
                    console.log("result", result);

                    let resp = [];
                    result.forEach(element => {
                        if(element.payment_mode == ''){
                            resp.push({'payment_mode':'Others',sum_amount:element.sum_amount});
                        }else{
                            resp.push(element);
                        }
                    });

                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            resp,
                            "Data fetched successfully."
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    analytics_status: async (req, res) => {
        
        let added_date = new Date().toJSON().substring(0, 19).replace("T", " ");
        let from_date = moment().subtract(30, "day").format("YYYY-MM-DD");
        let to_date = moment(new Date()).format("YYYY-MM-DD");

        if (req.bodyString("from_date") && req.bodyString("to_date")) {
            from_date = req.bodyString("from_date");
            to_date = req.bodyString("to_date");
        }

        try {
            let mode = req.bodyString("mode");
            let table_name = "";
            if (mode == "test") {
                table_name = "orders_test";
            } else {
                table_name = "orders";
            }

            let search_date = { from_date: from_date, to_date: to_date };

            let user = req.user.id;

            await dashboard
                .status_payment(user, search_date, table_name)
                .then((result) => {
                    console.log("result", result);

                    let resp = [];
                    result.forEach(element => {
                        resp.push(element);
                    });

                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            resp,
                            "Data fetched successfully."
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
};

module.exports = res_data;
