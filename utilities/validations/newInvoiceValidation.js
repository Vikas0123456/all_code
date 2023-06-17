const Joi = require("joi")
const statusCode = require("../statuscode")
const ServerResponse = require("../response/ServerResponse")
const checkifrecordexist = require("./checkifrecordexist")
const protector = require("../decryptor/decryptor")

const newInvoiceValidation = {
    add: async (req, res, next) => {
        const schema = Joi.object().keys({
            title: Joi.string().required().error(() => {
                throw new Error('Valid title required')
            }),
            currency: Joi.string().required().error(() => {
                throw new Error('Valid currency required')
            }),
            total: Joi.number().required().error(() => {
                throw new Error('Valid amount required')
            }),
            sub_total: Joi.number().allow(''),
            store_id: Joi.string().required().error(() => {
                throw new Error('Valid store_id required')
            }),
            template_id: Joi.string().required().error(() => {
                throw new Error('Valid valid template id required')
            }),
            use_as_template: Joi.number().required().error(() => {
                throw new Error('Valid use as template value required')
            }),
            items: Joi.array().required().items({
                description: Joi.string().allow(''),
                action: Joi.string().required().error(() => {
                    throw new Error('Invalid action required')
                }),
                amount: Joi.number().required().error(() => {
                    throw new Error('Invalid amount required')
                }),
                unit_cost: Joi.number().allow(''),
                quantity: Joi.number().allow(''),
                discount: Joi.number().allow(''),
                discount_in: Joi.string().allow(''),
                title: Joi.string().allow(''),
                price: Joi.number().allow(''),
                term: Joi.string().allow(''),
                vat_rate_percentage: Joi.number().allow(''),
                taxable_amount: Joi.number().allow(''),
                tax_rate_percentage: Joi.number().allow(''),
            }),
            totals: Joi.array().required().items({
                name: Joi.string().allow(''),
                action: Joi.string().required().error(() => {
                    throw new Error('Invalid action required')
                }),
                amount: Joi.number().required().error(() => {
                    throw new Error('Invalid  amount required')
                }),
            }),
            email_details: Joi.object().allow("").keys({
                title: Joi.string().allow(''),
                first_name: Joi.string().allow(''),
                last_name: Joi.string().allow(''),
                address_line_1: Joi.string().allow(''),
                address_line_2: Joi.string().allow(''),
                address_line_3: Joi.string().allow(''),
                postal_code: Joi.string().allow(''),
                city: Joi.string().allow(''),
                state: Joi.string().allow(''),
                country: Joi.string().allow(''),
                trn: Joi.string().allow(''),
                email_address: Joi.string().allow(""),
                email_address_cc: Joi.string().allow(''),
            }),
            not_valid_before: Joi.string().allow(''),
            not_valid_after: Joi.string().allow(''),
            early_pay: Joi.string().allow(''),
            late_pay: Joi.string().allow(''),
            is_paid_before: Joi.string().allow(''),
            is_paid_after: Joi.string().allow(''),
            note: Joi.string().allow(''),
            aggrement: Joi.string().allow('')
        })

        try {
            const {
                error
            } = schema.validate(req.body)
            if (error) {
                res.status(statusCode.badRequest).send(ServerResponse.validationResponse(error.message));
            } else {
                let record_id = protector.cjs_decrypt(req.bodyString('store_id'))
                let record_exist = await checkifrecordexist({
                    'id': record_id,
                    'deleted': 0
                }, 'master_merchant');

                if (record_exist) {
                    next()
                } else {
                    res.status(statusCode.badRequest).send(ServerResponse.validationResponse('Invalid store id'));
                }
            }
        } catch (err) {
            res.status(statusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    },


    update_details: async (req, res, next) => {
        let schema = Joi.object().keys({
            invoice_id: Joi.string().required().error(() => {
                throw new Error('Invalid invoice number')
            }),
            status: Joi.string().required().error(() => {
                throw new Error('Invalid status')
            })
        })

        try {
            const {
                error
            } = schema.validate(req.body)
            if (error) {
                res.status(statusCode.badRequest).send(ServerResponse.validationResponse(error.message))
            } else {
                let inv_id = protector.cjs_decrypt(req.bodyString('invoice_id'))
                console.log(inv_id);
                record_exsist = await checkifrecordexist({
                    id: inv_id,
                    status: "PENDING"
                }, 'invoice_master')

                if (record_exsist) {
                    next()
                } else {
                    res.status(statusCode.badRequest).send(ServerResponse.validationResponse('Unbale to update invoice'));
                }
            }

        } catch (err) {
            res.status(statusCode.badRequest).send(ServerResponse.validationResponse(err.message))
        }
    },

    // quantity: Joi.alternatives().conditional('type_of_qr', {
    //     is: "Dynamic_QR", then: Joi.number().min(1).max(9999999).required().error(() => {
    //         return new Error("quantity required.")
    //     }),
    //     otherwise: Joi.string().optional().allow("")
    // }),

    add_config: async (req, res, next) => {
        const schema = Joi.object().keys({
            store_id: Joi.string().required().error(() => {
                return new Error("Store id required")
            }),
            authorized_url_use_for: Joi.any().allow(''),
            authorized_url: Joi.alternatives().conditional('authorized_url_use_for', {
                is: '2',
                then: Joi.string().uri().required().error(() => {
                    throw new Error('Valid authorized url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
            cancelled_url_use_for: Joi.any().allow(''),
            cancelled_url: Joi.alternatives().conditional('cancelled_url_use_for', {
                is: '2',
                then: Joi.string().uri().required().error(() => {
                    throw new Error('Valid cancel url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
            declined_url_use_for: Joi.any().allow(''),
            declined_url: Joi.alternatives().conditional('declined_url_use_for', {
                is: '2',
                then: Joi.string().uri().required().error(() => {
                    throw new Error('Valid declined url required ')
                }),
                otherwise: Joi.any().allow('')
            }),
            authentication_key: Joi.any().min(8).allow('')
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(statusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let record_id = protector.cjs_decrypt(req.bodyString('store_id'))
                let record_exist = await checkifrecordexist({
                    'id': record_id,
                    'deleted': 0
                }, 'master_merchant');
                if (record_exist) {
                    next();
                } else {
                    res.status(statusCode.badRequest).send(ServerResponse.validationResponse('Invalid store id'));
                }
            }
        } catch (error) {
            console.log(error);
            res.status(statusCode.badRequest).send(ServerResponse.validationResponse(error.message));
        }
    }

}

module.exports = newInvoiceValidation