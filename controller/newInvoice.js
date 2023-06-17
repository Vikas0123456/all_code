const new_invoice_model = require("../models/new_invoice_model");
const enc_dec = require("../utilities/decryptor/decryptor");
const helpers = require("../utilities/helper/general_helper");
const mailSender = require("../utilities/mail/mailsender");
const ServerResponse = require("../utilities/response/ServerResponse");
const statusCode = require("../utilities/statuscode/index");
const EventEmitter = require('events');
const ee = new EventEmitter();
const moment = require('moment');

let send_email = async (invoice_id, email_details) => {
    let id = enc_dec.cjs_decrypt(invoice_id)
    let date = new Date().toJSON().substring(0, 19).replace('T', ' ')
    ins_body = {
        full_name: email_details.title + " " + email_details.first_name + " " + email_details.last_name,
        address_line_1: email_details.address_line_1 ? email_details.address_line_1 : "",
        address_line_2: email_details.address_line_2 ? email_details.address_line_2 : "",
        address_line_3: email_details.address_line_3 ? email_details.address_line_3 : "",
        city: email_details.city ? email_details.city : "",
        state: email_details.state ? email_details.state : "",
        country: email_details.country ? email_details.country : "",
        trn: email_details.trn ? email_details.trn : "",
        email_address: email_details.email_address ? email_details.email_address : "",
        email_address_cc: email_details.email_address_cc ? email_details.email_address_cc : "",
        email_sent: 1,
        updated_at: date
    }
    await new_invoice_model.updateDetails({
        id: id
    }, ins_body)

    let data = await new_invoice_model.select("*", {
        id: id,
    }, 'invoice_master')
    let items = await new_invoice_model.select("*", {
        invoice_no: data[0].invoice_no,
    }, 'invoice_items')
    let totals = await new_invoice_model.select("*", {
        invoice_no: data[0].invoice_no,
    }, 'invoice_totals')
    let items_array = []
    let total_array = []
    for (let item of items) {
        let item_body = {
            // "invoice_no": item.invoice_no,
            "description": item.description ? item.description : "",
            "action": item.action,
            "amount": item.amount,
            "unit_cost": item.unit_cost ? item.unit_cost : "",
            "quantity": item.quantity ? item.quantity : "",
            "discount": item.discount ? item.discount : "",
            "discount_in": items.discount_in ? items.discount_in : "",
            "title": item.title ? item.title : "",
            "price": items.price ? items.price : "",
            "term": item.term ? item.term : "",
            "vat_rate_percentage": items.vat_rate_percentage ? items.vat_rate_percentage : "",
            "taxable_amount": items.taxable_amount ? items.taxable_amount : "",
            "tax_rate_percentage": item.tax_rate_percentage ? item.tax_rate_percentage : ""
        }
        items_array.push(item_body)
    }
    for (let total of totals) {
        let total_body = {
            "name": total.name ? total.name : "",
            "action": total.action,
            "amount": total.amount
        }
        total_array.push(total_body)
    }
    let resp_data = {
        invoice_no: data[0].invoice_no,
        title: data[0].title,
        currency: data[0].currency,
        note: data[0].note ? data[0].note : "",
        sub_total: data[0].sub_total ? data[0].sub_total : "",
        total: data[0].total,
        status: data[0].status,
        item: items_array,
        totals: total_array
    }

    await mailSender.InvoiceMail(resp_data, email_details)
}


const newInvoice = {
    add: async (req, res) => {
        try {
            let title = req.bodyString('title')
            let currency = req.bodyString('currency')
            let inv_no = '7914/3109/' + await helpers.get_invoice_number()
            let dFields = req.bodyString('dFields')
            let items = req.body.items
            let totals = req.body.totals
            let note = req.body.note
            let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
            let email_details = req.body.email_details;
            let store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'));

            ins_body = {
                merchant_id: 0,
                title: title,
                currency: currency,
                invoice_no: inv_no,
                store_id: store_id,
                note: note,
                template_id: enc_dec.cjs_decrypt(req.bodyString('template_id')),
                sub_total: req.bodyString('subtotal') ? req.bodyString('subtotal') : 0,
                total: req.bodyString('total'),
                not_valid_before: req.bodyString('not_valid_before') ? req.bodyString('not_valid_before') : 0,
                not_valid_after: req.bodyString('not_valid_after') ? req.bodyString('not_valid_after') : 0,
                early_pay: req.bodyString('early_pay') ? req.bodyString('early_pay') : 0,
                late_pay: req.bodyString('late_pay') ? req.bodyString('late_pay') : 0,
                is_paid_before: req.bodyString('is_paid_before') ? req.bodyString('is_paid_before') : 0,
                is_paid_after: req.bodyString('is_paid_after') ? req.bodyString('is_paid_after') : 0,
                added_date: added_date,
                status: 'PENDING',
                use_as_template: req.bodyString('use_as_template') ? req.bodyString('use_as_template') : 1,
                aggrement: req.bodyString('aggrement') ? req.bodyString('aggrement') : ""
            }

            new_invoice_model.add(ins_body).then(async resp => {
                    let item_array = []
                    let total_array = []
                    for (let item of items) {
                        let item_body = {
                            merchant_id: 0,
                            invoice_no: inv_no,
                            description: item.description ? item.description : "",
                            action: item.action,
                            amount: item.amount,
                            unit_cost: item.unit_cost ? item.unit_cost : 0,
                            quantity: item.quantity ? item.quantity : 0,
                            discount: item.discount ? item.discount : 0,
                            discount_in: item.discount_in ? item.discount_in : "",
                            title: item.title ? item.title : "",
                            price: item.price ? item.price : 0,
                            term: item.term ? item.term : 0,
                            vat_rate_percentage: item.vat_rate ? item.vat_rate : 0,
                            taxable_amount: item.taxable_amount ? item.taxable_amount : 0,
                            tax_rate_percentage: item.tax_rate ? item.tax_rate : 0,
                        }
                        item_array.push(item_body)
                    }

                    for (let total of totals) {
                        let total_body = {
                            merchant_id: 0,
                            invoice_no: inv_no,
                            name: total.name ? total.name : "",
                            action: total.action,
                            amount: total.amount
                        }
                        total_array.push(total_body)
                    }
                    await new_invoice_model.itemAdd(item_array, 'invoice_items')
                    await new_invoice_model.itemAdd(total_array, 'invoice_totals')

                    resp_data = {
                        invoice_no: inv_no
                    }

                    // Adding event base email sender
                    if (email_details) {
                        id = await enc_dec.cjs_encrypt(resp.insertId)
                        await send_email(id, email_details)
                    }

                    res.status(statusCode.ok).send(ServerResponse.successdatamsg(resp_data, req.bodyString('use_as_template') == 1 ? "New template Created" : `Invoice sent ${inv_no}`))
                })
                .catch(err => {
                    console.log(err);
                    res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
                })

        } catch (err) {
            console.log(err)
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    details: async (req, res) => {
        try {
            let inv_id = enc_dec.cjs_decrypt(req.bodyString('inv_id'))

            let data = await new_invoice_model.select("*", {
                id: inv_id,
                merchant_id: 0
            }, 'invoice_master')
            let items = await new_invoice_model.select("*", {
                invoice_no: data[0].invoice_no,
                merchant_id: 0
            }, 'invoice_items')
            let totals = await new_invoice_model.select("*", {
                invoice_no: data[0].invoice_no,
                merchant_id: 0
            }, 'invoice_totals')
            let items_array = []
            let total_array = []
            for (let item of items) {
                let item_body = {
                    // "invoice_no": item.invoice_no,
                    "description": item.description ? item.description : "",
                    "action": item.action,
                    "amount": item.amount,
                    "unit_cost": item.unit_cost ? item.unit_cost : "",
                    "quantity": item.quantity ? item.quantity : "",
                    "discount": item.discount ? item.discount : "",
                    "discount_in": items.discount_in ? items.discount_in : "",
                    "title": item.title ? item.title : "",
                    "price": items.price ? items.price : "",
                    "term": item.term ? item.term : "",
                    "vat_rate_percentage": items.vat_rate_percentage ? items.vat_rate_percentage : "",
                    "taxable_amount": items.taxable_amount ? items.taxable_amount : "",
                    "tax_rate_percentage": item.tax_rate_percentage ? item.tax_rate_percentage : ""
                }
                items_array.push(item_body)
            }
            for (let total of totals) {
                let total_body = {
                    "name": total.name ? total.name : "",
                    "action": total.action,
                    "amount": total.amount
                }
                total_array.push(total_body)
            }
            let resp_data = {
                invoice_no: data[0].invoice_no,
                title: data[0].title,
                store_id: enc_dec.cjs_encrypt(data[0].store_id),
                template_id: enc_dec.cjs_encrypt(data[0].template_id),
                currency: data[0].currency,
                note: data[0].note ? data[0].note : "",
                sub_total: data[0].sub_total ? data[0].sub_total : "",
                total: data[0].total,
                not_valid_after: data[0].not_valid_after ? data[0].not_valid_before : "",
                not_valid_before: data[0].not_valid_before ? data[0].not_valid_after : "",
                early_pay: data[0].early_pay ? data[0].early_pay : "",
                late_pay: data[0].late_pay ? data[0].late_pay : "",
                is_paid_before: data[0].is_paid_before ? data[0].is_paid_before : "",
                is_paid_after: data[0].is_paid_after ? data[0].is_paid_after : "",
                status: data[0].status,
                // added_date: data[0].added_date.toJSON().substring(0, 19).replace('T', ' '),
                item: items_array,
                totals: total_array
            }

            console.log(resp_data);
            res.status(statusCode.ok).send(ServerResponse.successdatamsg(resp_data, 'details fetched successfully'))

        } catch (err) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    terminal_list: async (req, res) => {
        try {
            list = {
                perpage: 20,
                start: 1
            }
            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))

                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }
            let data = await new_invoice_model.select("*", {
                merchant_id: 0,
                use_as_template: 1
            }, 'invoice_master')
            resp_data = []
            for (let val of data) {
                let ins_body = {
                    id: enc_dec.cjs_encrypt(val.id),
                    title: val.title,
                    store_id: enc_dec.cjs_encrypt(val.store_id),
                    template_id: enc_dec.cjs_encrypt(val.template_id),
                    invoice_no: val.invoice_no,
                    added: val.added_date.toJSON().substring(0, 19).replace('T', ' ')
                }
                resp_data.push(ins_body)
            }
            res.status(statusCode.ok).send(ServerResponse.successdatamsg(resp_data, "Successfully fetched template list"))
        } catch (err) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    update_status: async (req, res) => {
        try {
            let inv_id = enc_dec.cjs_decrypt(req.bodyString('invoice_id'))
            let status = req.bodyString('status')
            let date = new Date().toJSON().substring(0, 19).replace('T', ' ')

            ins_body = {
                status: status.toUpperCase(),
                updated_at: date
            }
            new_invoice_model.updateDetails({
                    id: inv_id
                }, ins_body).then(resp => {
                    res.status(statusCode.ok).send(ServerResponse.successmsg('Invoice updated successfully'))
                })
                .catch(err => {
                    res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
                })

        } catch (err) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    recent_invoices: async (req, res) => {
        try {
            limit = {
                perpage: 20,
                start: 0
            }
            if (req.bodyString('perpage') && req.bodyString('page')) {
                perpage = parseInt(req.bodyString('perpage'))
                start = parseInt(req.bodyString('page'))

                limit.perpage = perpage
                limit.start = ((start - 1) * perpage)
            }

            let and_filter_obj = {
                email_sent: 1
            };
            let date_condition = {};
            // if (req.user.type == 'merchant') {
            //     and_filter_obj.super_merchant_id = req.user.id
            // }

            if (req.bodyString('store_id')) {
                and_filter_obj.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'))
            }
            if (req.bodyString('currency')) {
                and_filter_obj.currency = req.bodyString('currency')
            }
            if (req.bodyString('status')) {
                and_filter_obj.status = req.bodyString('status')
            }

            if (req.bodyString('from_date')) {
                date_condition.from_date = moment(req.bodyString('from_date')).format('YYYY-MM-DD')
            }

            if (req.bodyString('to_date')) {
                date_condition.to_date = moment(req.bodyString('to_date')).format('YYYY-MM-DD')
            }

            let data = await new_invoice_model.selectList(and_filter_obj,date_condition,limit,'invoice_master')

            resp_data = []
            for (let val of data) {
                let ins_body = {
                    // test_id: val.id,
                    id: enc_dec.cjs_encrypt(val.id),
                    title: val.title,
                    store_id: enc_dec.cjs_encrypt(val.store_id),
                    template_id: enc_dec.cjs_encrypt(val.template_id),
                    invoice_no: val.invoice_no,
                    amount: val.amount,
                    sent_to: val.full_name ? val.full_name + ',' + val.email_address : val.email_address,
                    added: val.added_date.toJSON().substring(0, 19).replace('T', ' '),
                    status: val.status,
                    transaction: val.transaction ? val.transaction : ""
                }
                resp_data.push(ins_body)
            }
            let count = await new_invoice_model.get_count(and_filter_obj,date_condition)
            res.status(statusCode.ok).send(ServerResponse.successdatamsg(resp_data, "Successfully fetched template list",count))

        } catch (err) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    sendEmail: async (req, res) => {
        try {
            let inv_id = enc_dec.cjs_decrypt(req.bodyString('invoice_id'))
            let is_resend = req.bodyString('is_resend')
            let email_details = req.body.email_details

            let data = await new_invoice_model.select("*", {
                id: inv_id
            }, 'invoice_master')
            name = data[0].full_name.split(' ')

            console.log(data[0]);
            let details = {
                title: name[0],
                first_name: name[1],
                last_name: name[2],
                address_line_1: data[0].address_line_1 ? data[0].address_line_1 : "",
                address_line_2: data[0].address_line_2 ? data[0].address_line_2 : "",
                address_line_3: data[0].address_line_3 ? data[0].address_line_3 : "",
                template_id: data[0].template_id ? data[0].template_id : "" ,
                city: data[0].city ? data[0].city : "",
                state: data[0].state ? data[0].state : "",
                country: data[0].country ? data[0].country : "",
                trn: data[0].trn ? data[0].trn : "",
                email_address: data[0].email_address ? data[0].email_address : "",
                email_address_cc: data[0].email_address_cc ? data[0].email_address_cc : "",
            }
            if (is_resend == 1) {
                await send_email(req.bodyString('invoice_id'), details)
            } else {
                await send_email(req.bodyString('invoice_id'), email_details)
            }
            res.status(statusCode.ok).send(ServerResponse.successmsg('Invoice sent'))
        } catch (err) {
            console.log(err);
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },

    add_config: async (req, res) => {
        try {
            let condition = {
                merchant_id: 0,
                store_id: enc_dec.cjs_decrypt(req.bodyString('store_id'))
            };
            let result = await new_invoice_model.selectOneConfig('*', condition);
            console.log(result);
            if (result) {
                let updateData = {
                    store_id: enc_dec.cjs_decrypt(req.bodyString('store_id')),
                    auth_url_use_for: req.bodyString('authorized_url_use_for'),
                    authorized_url: req.bodyString('authorized_url'),
                    cancel_url_use_for: req.bodyString('cancelled_url_use_for'),
                    cancel_url: req.bodyString('cancelled_url'),
                    declined_url_use_for: req.bodyString('declined_url_use_for'),
                    declined_url: req.bodyString('declined_url'),
                    authentication_key: req.bodyString('authentication_key'),

                }
                let updateRes = await new_invoice_model.updateConfigDetails({
                    id: result.id
                }, updateData);
                res.status(statusCode.ok).send(ServerResponse.successmsg('Config updated successfully'));
            } else {
                let insData = {
                    merchant_id: 0,
                    store_id: enc_dec.cjs_decrypt(req.bodyString('store_id')),
                    auth_url_use_for: req.bodyString('authorized_url_use_for'),
                    authorized_url: req.bodyString('authorized_url'),
                    cancel_url_use_for: req.bodyString('cancelled_url_use_for'),
                    cancel_url: req.bodyString('cancelled_url'),
                    declined_url_use_for: req.bodyString('declined_url_use_for'),
                    declined_url: req.bodyString('declined_url'),
                    authentication_key: req.bodyString('authentication_key'),
                    created_at: moment().format('YYYY-MM-DD hh:mm'),
                    status: 0,
                    deleted: 0
                }
                let insertRes = await new_invoice_model.addConfig(insData);
                res.status(statusCode.ok).send(ServerResponse.successmsg('Config updated successfully'));
            }

        } catch (error) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(error.message));
        }
    },


}

module.exports = newInvoice