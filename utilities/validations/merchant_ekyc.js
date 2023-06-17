const Joi = require('joi').extend(require('@joi/date')).extend(require('joi-currency-code'));
const ServerResponse = require('../response/ServerResponse');
const StatusCode = require('../statuscode/index');
const checkEmpty = require('./emptyChecker');
const idChecker = require('./idchecker');
const checkifrecordexist = require('./checkifrecordexist');
const enc_dec = require("../decryptor/decryptor");
const encrypt_decrypt = require('../decryptor/encrypt_decrypt');
const checkifrecordexistandexpiration = require('./checkifrecordexistandexpiration');
const helpers = require('../helper/general_helper');
const MerchanrApproval = require('../../models/merchantapproval');
const MerchantEkycModel = require('../../models/merchant_ekycModel');
const adminUserModel = require('../../models/adm_user')
//const validator = require('email-validator');
const MerchantEkyc = {
    login: async (req, res, next) => {
        const schema = Joi.object().keys({
            email: Joi.string().email().required().error(() => {
                return new Error("Valid email required")
            }),
            password: Joi.string().required().error(() => {
                return new Error("Password Required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let email_exits = await checkifrecordexist({ email: req.bodyString('email') }, 'master_super_merchant');
                let password_is_blank = await checkifrecordexist({ email: req.bodyString('email'), password: '' }, 'master_super_merchant');
                if (!email_exits || password_is_blank) {
                    if (!email_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Account is not registered`));
                    else
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Password is not set for account.`));
                } else {
                    next()
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    psp_by_mcc: async (req, res, next) => {
        const schema = Joi.object().keys({
            mcc_code: Joi.string().required().error(() => {
                return new Error("Valid Mcc code required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let mcc_code_id = enc_dec.cjs_decrypt(req.bodyString('mcc_code'));
                let mcc_exits = await checkifrecordexist({ id: mcc_code_id }, 'mcc_codes');
                if (!mcc_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Mcc code is not valid`));
                } else {
                    next()
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    business_type: async (req, res, next) => {
        let EntityModel = require('../../models/entityModel');
        let entity_id = enc_dec.cjs_decrypt(req.bodyString('entity_type'));
        let entity_list = await EntityModel.list_of_document({ entity_id: entity_id, deleted: 0, is_applicable: 1 });

        let i = 1;
        let filterSchema = {};
        for (let entity of entity_list) {
            filterSchema['data_id_' + i] = Joi.string().allow('').error(() => {
                return new Error("Data-" + i + "ID required")
            });
            filterSchema['document_' + i] = entity.required == 1 && req.body['document_' + i + '_id'] == '' ? Joi.string().required().error(() => {
                return new Error(`${entity.document_name} required`)
            }) : Joi.string().optional().allow('');
            filterSchema['document_' + i + '_id'] = Joi.string().optional().allow('').error(() => {
                return new Error("Document-" + i + "ID required")
            });
            filterSchema['document_' + i + '_number'] = entity.document_num_required == 1 ? Joi.string().required().error(() => {
                return new Error(`${entity.document_name} number required`)
            }) : Joi.string().allow('');
            filterSchema['document_' + i + '_issue_date'] = entity.issue_date_required == 1 ? Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                return new Error(`${entity.document_name} issue date required`)
            }) : Joi.string().allow('');
            filterSchema['document_' + i + '_expiry_date'] = entity.expiry_date_required == 1 ? Joi.date().format('YYYY-MM-DD').min('now').required().error(() => {
                return new Error(`${entity.document_name} expiry date required`)
            }) : Joi.string().allow('');
            i++;
        }
        filterSchema['submerchant_id'] = Joi.string().required().error(() => {
            return new Error("Sub-merchant ID required")
        });

        filterSchema['register_country'] = Joi.string().required().error(() => {
            return new Error("Register country required")
        });
        filterSchema['entity_type'] = Joi.string().required().error(() => {
            return new Error("Entity type required")
        });
        filterSchema['is_business_register_in_free_zone'] = Joi.any().valid(0, 1, "1", "0").required().error(() => {
            return new Error("Is business register in free zone required")
        });
        try {
            let schema = Joi.object().keys(filterSchema);
            console.log(req.body);
            const result = schema.validate(req.body);

            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let country_id = enc_dec.cjs_decrypt(req.bodyString('register_country'));
                let entity_type_id = enc_dec.cjs_decrypt(req.bodyString('entity_type'));

                let country_exits = await checkifrecordexist({ id: country_id }, 'country');
                let entity_type_exits = await checkifrecordexist({ id: entity_type_id }, 'master_entity_type')

                if (!country_exits || !entity_type_exits) {
                    if (!country_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Country id is not valid`));
                    else
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Entity type id is not valid`));
                } else {
                    // let entity_type_doc_exits = await helpers.get_data_list("*", 'master_entity_document', { entity_id: entity_type_id, deleted: 0 })
                    // if (entity_type_doc_exits[0]) {
                    //     let doc_arr = []
                    //     for (let val of entity_type_doc_exits) {
                    //         doc_arr['document_' + val.document] = val.required;
                    //         // doc_arr['document_' + val.document + '_is_required']= val.required;
                    //         doc_arr['document_' + val.document + '_number'] = val.document_num_required;
                    //         doc_arr['document_' + val.document + '_issue_date'] = val.issue_date_required;
                    //         doc_arr['document_' + val.document + '_expiry_date'] = val.expiry_date_required;


                    //     }
                    //     let doc_error = ""
                    //     for (const [key, value] of Object.entries(doc_arr)) {
                    //         if (value == 1 && (key == "document_1" || key == "document_2" || key == "document_3" || key == "document_4" || key == "document_5")) {
                    //             let data_id = [];
                    //             if (key == "document_1" && req.bodyString('data_id_1')) {
                    //                 data_id['document_1'] = encrypt_decrypt('decrypt', req.bodyString('data_id_1'));
                    //             }
                    //             if (key == "document_2" && req.bodyString('data_id_2')) {
                    //                 data_id['document_2'] = encrypt_decrypt('decrypt', req.bodyString('data_id_2'));
                    //             }
                    //             if (key == "document_3" && req.bodyString('data_id_3')) {
                    //                 data_id['document_3'] = encrypt_decrypt('decrypt', req.bodyString('data_id_3'));
                    //             }
                    //             if (key == "document_4" && req.bodyString('data_id_4')) {
                    //                 data_id['document_4'] = encrypt_decrypt('decrypt', req.bodyString('data_id_4'));
                    //             }
                    //             if (key == "document_5" && req.bodyString('data_id_5')) {
                    //                 data_id['document_5'] = encrypt_decrypt('decrypt', req.bodyString('data_id_5'));
                    //             }

                    //             if (req.all_files) {
                    //                 if (!req.all_files[key] && !data_id[key]) {
                    //                     doc_error = "Error: " + key.replace(/_|_/g, ' ') + " field required"
                    //                     break;
                    //                 }

                    //             } else if (!data_id[key]) {
                    //                 doc_error = "Error: " + key.replace(/_|_/g, ' ') + " field required"
                    //                 break;
                    //             }


                    //         } else if (value == 1) {
                    //             if (!req.bodyString(key)) {
                    //                 doc_error = "Error:" + key.replace(/_|_/g, ' ') + " field required"
                    //                 break;
                    //             }
                    //         }

                    //     }

                    //     if (doc_error) {
                    //         res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(doc_error));
                    //     } else {
                    //         next()
                    //     }

                    // } else {
                    //     next()
                    // }
                    next();
                }
            }
        } catch (error) {
            console.log(error)
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
        /*    const schema = Joi.object().keys({
                submerchant_id: Joi.string().required().error(() => {
                    return new Error("Sub-merchant ID required")
                }),
                register_country: Joi.string().required().error(() => {
                    return new Error("Register country required")
                }),
                entity_type: Joi.string().required().error(() => {
                    return new Error("Entity type required")
                }),
                is_business_register_in_free_zone: Joi.any().valid(0, 1, "1", "0").required().error(() => {
                    return new Error("Is business register in free zone required")
                }),
                data_id_1: Joi.string().optional().allow('').error(() => {
                    return new Error("Data-1 ID required")
                }),
                data_id_2: Joi.string().optional().allow('').error(() => {
                    return new Error("Data-2 ID required")
                }),
                data_id_3: Joi.string().optional().allow('').error(() => {
                    return new Error("Data-3 ID required")
                }),
                data_id_4: Joi.string().optional().allow('').error(() => {
                    return new Error("Data-4 ID required")
                }),
                data_id_5: Joi.string().optional().allow('').error(() => {
                    return new Error("Data-5 ID required")
                }),
    
                document_1: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-1 required")
                }),
                document_2: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-2 required")
                }),
                document_3: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-3 required")
                }),
                document_4: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-4 required")
                }),
                document_5: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-5 required")
                }),
    
                document_1_id: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-1 ID required")
                }),
                document_2_id: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-2 ID required")
                }),
                document_3_id: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-3 ID required")
                }),
                document_4_id: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-4 ID required")
                }),
                document_5_id: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-5 ID required")
                }),
    
                document_1_is_required: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-1 is required")
                }),
                document_2_is_required: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-2 is required")
                }),
                document_3_is_required: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-3 is required")
                }),
                document_4_is_required: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-4 is required")
                }),
                document_5_is_required: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-5 is required")
                }),
    
                document_1_number: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-1 number required")
                }),
                document_2_number: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-2 number required")
                }),
                document_3_number: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-3 number required")
                }),
                document_4_number: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-4 number required")
                }),
                document_5_number: Joi.string().optional().allow('').error(() => {
                    return new Error("Document-5 number required")
                }),
    
                document_1_issue_date: Joi.date().format('YYYY-MM-DD').max('now').optional().allow('').error(() => {
                    return new Error("Valid Document-1 issue date required")
                }),
                document_2_issue_date: Joi.date().format('YYYY-MM-DD').max('now').optional().allow('').error(() => {
                    return new Error("Valid Document-2 issue date required")
                }),
                document_3_issue_date: Joi.date().format('YYYY-MM-DD').max('now').optional().allow('').error(() => {
                    return new Error("Valid Document-3 issue date required")
                }),
                document_4_issue_date: Joi.date().format('YYYY-MM-DD').max('now').optional().allow('').error(() => {
                    return new Error("Valid Document-4 issue date required")
                }),
                document_5_issue_date: Joi.date().format('YYYY-MM-DD').max('now').optional().allow('').error(() => {
                    return new Error("Valid Document-5 issue date required")
                }),
    
                document_1_expiry_date: Joi.date().format('YYYY-MM-DD').min('now').optional().allow('').error(() => {
                    return new Error("Valid Document-1 expiry date required")
                }),
                document_2_expiry_date: Joi.date().format('YYYY-MM-DD').min('now').optional().allow('').error(() => {
                    return new Error("Valid Document-2 expiry date required")
                }),
                document_3_expiry_date: Joi.date().format('YYYY-MM-DD').min('now').optional().allow('').error(() => {
                    return new Error("Valid Document-3 expiry date required")
                }),
                document_4_expiry_date: Joi.date().format('YYYY-MM-DD').min('now').optional().allow('').error(() => {
                    return new Error("Valid Document-4 expiry date required")
                }),
                document_5_expiry_date: Joi.date().format('YYYY-MM-DD').min('now').optional().allow('').error(() => {
                    return new Error("Valid Document-5 expiry date required")
                }),
            })
            */



    },
    business_details: async (req, res, next) => {
        var url_regex = /^(?:(?:(?:https?|ftp):)?(\/\/|www\.))(?:\+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[\/?#]\S*)?$/
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            legal_business_name: Joi.string().required().error(() => {
                return new Error("Legal business name required")
            }),
            company_registration_number: Joi.string().required().error(() => {
                return new Error("Company registration number required")
            }),
            vat_number: Joi.string().allow('').error(() => {
                return new Error("Vat number required")
            }),
            doing_business_as: Joi.string().allow('').error(() => {
                return new Error("Valid doing business as field required")
            }),
            // register_business_address_country: Joi.string().required().error(() => {
            //     return new Error("Valid country required")
            // }),
            business_address_line1: Joi.string().required().error(() => {
                return new Error("Valid address line1 required")
            }),
            business_address_line2: Joi.string().allow('').error(() => {
                return new Error("Valid address line2 required")
            }),
            province: Joi.string().required().error(() => {
                return new Error("Province required")
            }),
            business_phone_code: Joi.string().required().error(() => {
                return new Error("Business phone code required")
            }),
            business_phone_number: Joi.string().required().error(() => {
                return new Error("Business phone number required")
            }),
            industry_type: Joi.string().required().error(() => {
                return new Error("Industry type required")
            }),
            other_industry_type: Joi.string().allow('').error(() => {
                return new Error("Valid industry type title required")
            }),
            business_website: Joi.string().regex(url_regex).required().error(() => {
                return new Error("Business website required")
            }),
            product_description: Joi.string().required().error(() => {
                return new Error("Product description required")
            }),

            poc_name: Joi.string().required().error(() => {
                return new Error("Point of contact name required")
            }),
            poc_email: Joi.string().email().max(100).required().error(() => {
                return new Error("Point of contact email required")
            }),
            poc_mobile_code: Joi.string().required().max(3).error(() => {
                return new Error("Point of contact mobile code required")
            }),
            poc_mobile: Joi.string().required().max(15).error(() => {
                return new Error("Point of contact mobile required")
            }),
            tech_name: Joi.string().required().error(() => {
                return new Error("Technical Point of contact name required")
            }),
            tech_email: Joi.string().email().max(100).required().error(() => {
                return new Error("Technical Point of contact email required")
            }),
            tech_mobile_code: Joi.string().required().max(3).error(() => {
                return new Error("Technical Point of contact mobile code required")
            }),
            tech_mobile: Joi.string().required().max(15).error(() => {
                return new Error("Technical Point of contact mobile required")
            }),
            fin_name: Joi.string().required().error(() => {
                return new Error("Finance Point of contact name required")
            }),
            fin_email: Joi.string().email().max(100).required().error(() => {
                return new Error("Finance Point of contact email required")
            }),
            fin_mobile_code: Joi.string().required().max(3).error(() => {
                return new Error("Finance Point of contact mobile code required")
            }),
            fin_mobile: Joi.string().required().max(15).error(() => {
                return new Error("Finance Point of contact mobile required")
            }),
            // transaction_currencies:Joi.string().required().error(()=>{
            //     return new Error('Transaction currencies required');
            // }),
            // settlement_currency:Joi.string().currency().required().error(()=>{
            //     return new Error('Valid settlement currency required');
            // }),
            estimated_revenue_amount: Joi.number().greater(1.0).required().error(() => {
                return new Error('Valid estimated revenue amount required')
            }),

            // cro_name: Joi.string().required().error(() => {
            //     return new Error("Compliance & risk officer name required")
            // }),
            // cro_email: Joi.string().email().max(100).required().error(() => {
            //     return new Error("Compliance & risk officer email required")
            // }),
            // cro_mobile_code: Joi.string().required().max(3).error(() => {
            //     return new Error("Compliance & risk officer mobile code required")
            // }),
            // cro_mobile: Joi.string().required().max(15).error(() => {
            //     return new Error("Compliance & risk officer mobile required")
            // }),

            // co_name: Joi.string().required().error(() => {
            //     return new Error("Customer support name required")
            // }),
            // co_email: Joi.string().email().max(100).required().error(() => {
            //     return new Error("Customer support email required")
            // }),
            // co_mobile_code: Joi.string().required().max(3).error(() => {
            //     return new Error("Customer support mobile code required")
            // }),
            // co_mobile: Joi.string().required().max(15).error(() => {
            //     return new Error("Customer support mobile required")
            // }),

            link_tc: Joi.string().regex(url_regex).allow('').error(() => {
                return new Error("Valid terms and conditions link required")
            }),
            link_pp: Joi.string().regex(url_regex).allow('').error(() => {
                return new Error("Valid privacy policy link required")
            }),
            link_rf: Joi.string().regex(url_regex).allow('').error(() => {
                return new Error("Valid refund policy link required")
            })

            // link_refund: Joi.string().regex(url_regex).required().error(() => {
            //     return new Error("Valid refund link required")
            // }),
            // link_cancellation: Joi.string().regex(url_regex).required().error(() => {
            //     return new Error("Valid cancellation link required")
            // }),
            // link_dp: Joi.string().regex(url_regex).required().error(() => {
            //     return new Error("Valid delivery policy link required")
            // }),


        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {

                //let country_id = enc_dec.cjs_decrypt( req.bodyString('register_business_address_country'));

                let state_id = enc_dec.cjs_decrypt(req.bodyString('province'));
                let industry_type_id = enc_dec.cjs_decrypt(req.bodyString('industry_type'))





                //let country_exits = await checkifrecordexist({ id: country_id }, 'country');
                let state_exits = await checkifrecordexist({ id: state_id }, 'states')
                let industry_type_exits = industry_type_id != '0' ? await checkifrecordexist({ id: industry_type_id }, 'mcc_codes') : true;

                if (!state_exits || !industry_type_exits) {
                    // if (!country_exits){
                    //     res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Country id is not valid`));
                    // }else 
                    if (!state_exits) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Province id is not valid`));
                    } else if (!industry_type_exits) {
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Industry type id is not valid`));
                    }

                } else {

                    next()
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }


    },
    representative_update: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            legal_person_first_name: Joi.string().required().error(() => {
                return new Error("Legal person first name required")
            }),
            legal_person_last_name: Joi.string().required().error(() => {
                return new Error("Legal person last name required")
            }),
            email_address: Joi.string().email().required().error(() => {
                return new Error("Valid email address required")
            }),
            job_title: Joi.string().required().error(() => {
                return new Error("Job title required")
            }),
            nationality: Joi.string().required().error(() => {
                return new Error("Nationality required")
            }),
            home_address_country: Joi.string().required().error(() => {
                return new Error("Country required")
            }),
            date_of_birth: Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                return new Error("Valid date of birth required")
            }),
            home_address_line1: Joi.string().required().error(() => {
                return new Error("Home address line1 required")
            }),
            home_address_line2: Joi.string().optional().allow('').error(() => {
                return new Error("Home address line2 required")
            }),
            home_address_state: Joi.string().required().error(() => {
                return new Error("Home address state required")
            }),
            home_address_phone_code: Joi.string().required().error(() => {
                return new Error("Home address phone code required")
            }),
            home_address_phone_number: Joi.string().required().error(() => {
                return new Error("Home address phone number required")
            }),
            personal_id_number: Joi.string().required().error(() => {
                return new Error("Personal id number required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let nationality_id = enc_dec.cjs_decrypt(req.bodyString('nationality'));
                let country_id = enc_dec.cjs_decrypt(req.bodyString('home_address_country'));
                let state_id = enc_dec.cjs_decrypt(req.bodyString('home_address_state'));

                let country_exits = await checkifrecordexist({ id: country_id }, 'country');
                let nationality = await checkifrecordexist({ id: nationality_id }, 'country');
                let state_exits = await checkifrecordexist({ id: state_id }, 'states')
                if (!country_exits || !nationality || !state_exits) {
                    if (!nationality)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Nationality id is not valid`));
                    if (!country_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid country id`))
                    if (!state_exits)
                        res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid state id`))

                } else {
                    next()
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    add_business_owner: async (req, res, next) => {

        if (req.files.emirates_id) {
            req.body.emirates_id = req.files.emirates_id[0].filename;
        } else {
            req.body.emirates_id = '';
        }
        if (req.files.passport) {
            req.body.passport = req.files.passport[0].filename;
        } else {
            req.body.passport = '';
        }
        if (req.files.visa) {
            req.body.visa = req.files.visa[0].filename;
        } else {
            req.body.visa = '';
        }
        if (req.files.trade_license) {
            req.body.trade_license = req.files.trade_license[0].filename;
        } else {
            req.body.trade_license = '';
        }
        if (req.files.passport_of_ubo) {
            req.body.passport_of_ubo = req.files.passport_of_ubo[0].filename;
        } else {
            req.body.passport_of_ubo = '';
        }
        if (req.files.moa) {
            req.body.moa = req.files.moa[0].filename;
        } else {
            req.body.moa = '';
        }
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            first_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Legal person first name required")
                })
            }),
            middle_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Legal person middle name required")
                })
            }),
            last_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Legal person last name required")
                })
            }),
            email_address: Joi.string().email().required().error(() => {
                return new Error("Valid email address required")
            }),
            nationality: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Nationality required")
                })
            }),
            type_of_business_owner: Joi.number().required().valid('individual', 'company').error(() => {
                return new Error("Valid type of business required")
            }),
            type_of_owner: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Owner or Authorized signatory required")
                })
            }),
            emirates_id: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Emirates ID document required")
                })
            }),
            emirates_id_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Emitated ID No required")
                })
            }),
            emirates_id_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                    return new Error("Valid emitated ID issue date required")
                })
            }),
            emirates_id_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').ruleset.greater(Joi.ref(' emirates_id_issue_date'))
                    .rule({ message: 'emirates id expiry date required and must be greater than emirates id issue date' })
                    .required()
                    .error(() => {
                        return new Error("emirates id expiry date required and must be greater than emirates_id_issue_date")
                    })
            }),
            passport: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Passport  required")
                })
            }),
            passport_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Passport No required")
                })
            }),
            passport_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                    return new Error("Valid passport issue date required")
                })
            }),
            passport_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').ruleset.greater(Joi.ref(' passport_issue_date'))
                    .rule({ message: 'Passport expiry date required and must be greater than passport issue date' })
                    .required()
                    .error(() => {
                        return new Error("Passport expiry date required and must be greater than passport issue date")
                    })
            }),
            visa: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Valid visa document  required")
                })
            }),
            visa_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Valid visa no required")
                })
            }),
            visa_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').allow('').error(() => {
                    return new Error("Valid visa issue date required")
                })
            }),
            visa_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').min('now').allow('').error(() => {
                    return new Error("Valid visa expiry date required")
                })
            }),
            trade_license: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Trade license required")
                })
            }),
            trade_license_no: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Valid trade license no required")
                })
            }),
            trade_license_issue_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').error(() => {
                    return new Error("Trade license issue date required")
                })
            }),
            trade_license_expiry_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').ruleset.greater(Joi.ref('trade_license_issue_date'))
                    .rule({ message: 'Trade license issue date required and must be greater than issue date' })
                    .required()
                    .error(() => {
                        return new Error("Trade license expiry date required and must be greater than issue date")
                    })
            }),
            passport_of_ubo: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Passport of UBO required")
                })
            }),
            passport_of_ubo_no: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Valid Passport of UBO no required")
                })
            }),
            passport_of_ubo_issue_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').error(() => {
                    return new Error("Passport of UBO issue date required")
                })
            }),
            passport_of_ubo_expiry_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').ruleset.greater(Joi.ref('passport_of_ubo_issue_date'))
                    .rule({ message: 'Passport of ubo no expiry date required and must be greater than passport of issue date' })
                    .error(() => {
                        return new Error("Passport of ubo expiry date required and must be greater than passport of issue date")
                    })
            }),
            moa: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("MOA required")
                })
            }),
            ekyc_status: Joi.string().allow(''),
            country_of_residence: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Valid country of residence required")
                })
            }),
            city_of_residence: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Valid city of residence required")
                })
            }),
            legal_business_name: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid legal business name required")
                })
            }),
            trading_name: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid trading name required")
                })
            }),
            country_of_registration: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid country of registration required")
                })
            }),
            city_of_registration: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid city of registration required")
                })
            }),
            // website_url: Joi.when('type_of_business_owner', {
            //     is: 'company', then: Joi.string().allow('').error(() => {
            //         return new Error("Valid website url required")
            //     })
            // }),    

            website_url: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('')
                    .regex(/^(http:\/\/|https:\/\/|www\.)[a-zA-Z0-9]+\.[a-zA-Z]+(\/\S*)?$/)
                    .required().error(() => {
                        return new Error('Valid website url required')
                    }),

            })
        })
        console.log(req.bodyString('trade_license'))
        try {
            const result = schema.validate(req.body);
            console.log(result);
            if (result.error) {
                if (req.all_files) {
                    if (req.all_files.document) {
                        fs.unlink('public/files/' + req.all_files.document, function (err) {
                            if (err) console.log(err, 'errrr');
                        });
                    }
                }
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                var error1 = '';
                if (req.all_files) {
                    if (!req.all_files.document) {
                        error1 = "Please upload valid document file. Only .jpg,.png file accepted (size: upto 1MB)";

                    }
                }
                let email_exits = await checkifrecordexist({ email: req.bodyString('email_address'), deleted: 0 }, 'merchant_business_owners');
                let nationality = await checkifrecordexist({ id: enc_dec.cjs_decrypt(req.bodyString('nationality')) }, 'nationality');
                if (email_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Business owner with email address already exits.`))
                } else if (!nationality && req.bodyString('type_of_business_owner') == 'individual') {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid nationality.`))
                }
                else {
                    next()
                }

            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    update_business_owner: async (req, res, next) => {
        if (req.files.emirates_id) {
            req.body.emirates_id = req.files.emirates_id[0].filename;
        } else {
            req.body.emirates_id = '';
        }
        if (req.files.passport) {
            req.body.passport = req.files.passport[0].filename;
        } else {
            req.body.passport = '';
        }
        if (req.files.visa) {
            req.body.visa = req.files.visa[0].filename;
        } else {
            req.body.visa = '';
        }
        if (req.files.trade_license) {
            req.body.trade_license = req.files.trade_license[0].filename;
        } else {
            req.body.trade_license = '';
        }
        if (req.files.passport_of_ubo) {
            req.body.passport_of_ubo = req.files.passport_of_ubo[0].filename;
        } else {
            req.body.passport_of_ubo = '';
        }
        if (req.files.moa) {
            req.body.moa = req.files.moa[0].filename;
        } else {
            req.body.moa = '';
        }

        const schema = Joi.object().keys({
            business_owner_id: Joi.string().required().error(() => {
                return new Error("Business owner ID required")
            }),
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            first_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Legal person first name required")
                })
            }),
            middle_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Legal person middle name required")
                })
            }),
            last_name: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Legal person last name required")
                })
            }),
            email_address: Joi.string().email().required().error(() => {
                return new Error("Valid email address required")
            }),
            nationality: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Nationality required")
                })
            }),
            type_of_business_owner: Joi.number().required().valid('individual', 'company').error(() => {
                return new Error("Valid type of business required")
            }),
            type_of_owner: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Owner or Authorized signatory required")
                })
            }),
            emirates_id: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Emirates ID document required")
                })
            }),
            emirates_id_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Emitated ID No required")
                })
            }),
            emirates_id_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                    return new Error("Valid emitated ID issue date required")
                })
            }),
            emirates_id_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').min('now').required().error(() => {
                    return new Error("Valid Emitated ID document expiry date required")
                })
            }),
            passport: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Passport  required")
                })
            }),
            passport_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Passport No required")
                })
            }),
            passport_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').required().error(() => {
                    return new Error("Valid passport issue date required")
                })
            }),
            passport_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').min('now').required().error(() => {
                    return new Error("Valid passport expiry date required")
                })
            }),
            visa: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Valid visa document  required")
                })
            }),
            visa_no: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().allow('').error(() => {
                    return new Error("Valid visa no required")
                })
            }),
            visa_issue_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').max('now').allow('').error(() => {
                    return new Error("Valid visa issue date required")
                })
            }),
            visa_expiry_date: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.date().format('YYYY-MM-DD').min('now').allow('').error(() => {
                    return new Error("Valid visa expiry date required")
                })
            }),
            trade_license: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Trade license required")
                })
            }),
            trade_license_no: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Valid trade license no required")
                })
            }),
            trade_license_issue_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').max('now').allow('').error(() => {
                    return new Error("Valid trade license issue date required")
                })
            }),
            trade_license_expiry_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').min('now').required().error(() => {
                    return new Error("Valid trade license expiry date required")
                })
            }),
            passport_of_ubo: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Passport of UBO required")
                })
            }),
            passport_of_ubo_no: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Valid Passport of UBO no required")
                })
            }),
            passport_of_ubo_issue_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').max('now').allow('').error(() => {
                    return new Error("Valid Passport of UBO issue date required")
                })
            }),
            passport_of_ubo_expiry_date: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.date().format('YYYY-MM-DD').min('now').allow('').error(() => {
                    return new Error("alid Passport of UBO expiry date required")
                })
            }),
            moa: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("MOA required")
                })
            }),
            ekyc_status: Joi.string().allow(''),
            country_of_residence: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Valid country of residence required")
                })
            }),
            city_of_residence: Joi.when('type_of_business_owner', {
                is: 'individual', then: Joi.string().required().error(() => {
                    return new Error("Valid city of residence required")
                })
            }),
            legal_business_name: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid legal business name required")
                })
            }),
            trading_name: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid trading name required")
                })
            }),
            country_of_registration: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid country of registration required")
                })
            }),
            city_of_registration: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().required().error(() => {
                    return new Error("Valid city of registration required")
                })
            }),
            website_url: Joi.when('type_of_business_owner', {
                is: 'company', then: Joi.string().allow('').error(() => {
                    return new Error("Valid website url required")
                })
            }),
        })
        // console.log(req.bodyString('trade_license'))
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                if (req.all_files) {
                    if (req.all_files.document) {
                        fs.unlink('public/files/' + req.all_files.document, function (err) {
                            if (err) console.log(err);
                        });
                    }
                }
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                var error1 = '';
                if (req.all_files) {

                    if (!req.all_files.document) {
                        error1 = "Please upload valid document file. Only .jpg,.png file accepted (size: upto 1MB)";

                    }
                }
                let email_exits = await checkifrecordexist({ email: req.bodyString('email_address'), deleted: 0, 'id !=': req.bodyString('business_owner_id') }, 'merchant_business_owners');
                let nationality = await checkifrecordexist({ id: enc_dec.cjs_decrypt(req.bodyString('nationality')) }, 'nationality');
                let user_exits = await checkifrecordexist({ id: req.bodyString('business_owner_id'), deleted: 0 }, 'merchant_business_owners');

                if (!email_exits && user_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Business owner with email address already exits.`))
                } else if (!nationality && req.bodyString('type_of_business_owner') == 'individual') {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid nationality.`))
                }
                else {
                    next()
                }

            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    business_owner_details: async (req, res, next) => {
        const schema = Joi.object().keys({
            business_owner_id: Joi.string().optional().allow('').error(() => {
                return new Error("Business owner ID required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let id = enc_dec.cjs_decrypt(req.bodyString('business_owner_id'));
                let record_exist = await checkifrecordexist({ id: id }, 'merchant_business_owners');
                if (!record_exist) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Please add owners first`))
                } else {

                    next()
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    owners_copy: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().optional().allow('').error(() => {
                return new Error("Sub-merchant ID required")
            }),
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let submerchant_id = enc_dec.cjs_decrypt(req.bodyString('submerchant_id'));
                let merchant_id = await checkifrecordexist({ merchant_id: submerchant_id }, 'merchant_business_owners');
                if (!merchant_id) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Please add owners first`))
                } else {

                    next()
                }
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    add_executives: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            first_name: Joi.string().required().error(() => {
                return new Error("Legal person first name required")
            }),
            last_name: Joi.string().required().error(() => {
                return new Error("Legal person last name required")
            }),
            email_address: Joi.string().email().required().error(() => {
                return new Error("Valid email address required")
            })
        })

        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let email_exits = await checkifrecordexist({ email: req.bodyString('email_address'), deleted: 0 }, 'merchant_business_executives');
                if (email_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Executive with email address already exits.`))
                else
                    next()
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    update_public: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            statement_descriptor: Joi.string().required().error(() => {
                return new Error("Statement descriptor required")
            }),
            shortened_descriptor: Joi.string().required().error(() => {
                return new Error("Shortened descriptor required")
            }),
            customer_support_phone_code: Joi.string().required().error(() => {
                return new Error("Customer support phone code required")
            }),
            customer_support_phone_number: Joi.string().required().error(() => {
                return new Error("Customer support phone number required")
            }),
            psp_id: Joi.string().required().error(() => {
                return new Error("PSP required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let psp_ids = req.bodyString('psp_id').split(",");
                let psp_exits = true;
                for (let i = 0; i < psp_ids.length; i++) {
                    if (psp_exits) {
                        psp_exits = await checkifrecordexist({ id: enc_dec.cjs_decrypt(psp_ids[i]) }, 'psp')
                    }
                }

                if (!psp_exits) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`PSP  id is not valid`));
                } else {
                    next()
                }

            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    add_bank: async (req, res, next) => {
        const schema = Joi.object().keys({
            submerchant_id: Joi.string().required().error(() => {
                return new Error("Sub-merchant ID required")
            }),
            iban_no: Joi.string().pattern(
                new RegExp(
                    /^[a-zA-Z]{2}[0-9]{2}\s?[a-zA-Z0-9]{4}\s?[0-9]{4}\s?[0-9]{3}([a-zA-Z0-9]\s?[a-zA-Z0-9]{0,4}\s?[a-zA-Z0-9]{0,4}\s?[a-zA-Z0-9]{0,4}\s?[a-zA-Z0-9]{0,3})?$/
                )
            ).allow('').error(() => {
                return new Error("Valid IBAN no. required (e.g. GB33BUKB20201555555555).")
            }),
            account_no: Joi.string().allow(''),
            swift: Joi.string().allow(''),
            owners_bank_document_type: Joi.string().required().error(() => {
                return new Error("Document type required")
            }),
            currency: Joi.string().currency().required().error(() => {
                return new Error("Valid currency required")
            }),
            country: Joi.string().required().error(() => {
                return new Error("Country required")
            }),
            bank_name: Joi.string().required(),
            branch_name: Joi.string().required(),
            document: Joi.string().required().error(() => {
                return new Error("Document required")
            }),
            transaction_currencies: Joi.string().required().error(() => {
                return new Error('Transaction currencies required');
            }),
            settlement_currency: Joi.string().currency().required().error(() => {
                return new Error('Valid settlement currency required');
            }),

        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let iban = req.bodyString('iban_no');
                let account_no = req.bodyString('account_no');
                let swift = req.bodyString('swift');
                if (iban == '' && account_no == '') {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg('Iban or account no required'));
                } else {
                    if (account_no != '' && swift == '') {
                        res.status(StatusCode.ok).send(ServerResponse.errormsg('Swift code required'));
                    } else {
                        next()
                    }
                }

            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    remove_business_owner: async (req, res, next) => {
        const schema = Joi.object().keys({

            business_owner_id: Joi.string().required().error(() => {
                return new Error("Business owner id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let business_owner_id = enc_dec.cjs_decrypt(req.bodyString('business_owner_id'));
                let business_owner_exits = await checkifrecordexist({ id: business_owner_id, deleted: 0 }, 'merchant_business_owners');
                if (!business_owner_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Business orwner with id not exits or already deleted.`))
                else
                    next()
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    remove_business_executive: async (req, res, next) => {
        const schema = Joi.object().keys({
            business_executive_id: Joi.string().required().error(() => {
                return new Error("Business executive id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let business_executive_id = enc_dec.cjs_decrypt(req.bodyString('business_executive_id'));
                let business_executive_exits = await checkifrecordexist({ id: business_executive_id, deleted: 0 }, 'merchant_business_executives');
                console.log(business_executive_exits);
                if (!business_executive_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Business executive with id not exits or already deleted.`))
                else
                    next()
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    checkMerchant: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required")
            }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let merchant_exits = await checkifrecordexist({ id: merchant_id, deleted: 0, status: 0 }, 'master_merchant');
                if (!merchant_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with id not exits or account deleted or account is not active.`))
                else
                    next()
            }
        } catch (error) {
            console.log(error);
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    update_merchant_ekyc: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required")
            }),
            ekyc_status: Joi.string().required().error(() => {
                return new Error("Ekyc status  required")
            }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let merchant_exits = await checkifrecordexist({ id: merchant_id, deleted: 0 }, 'master_merchant');
                if (!merchant_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with id not exits or account deleted or account is not active.`))
                else
                    next()
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    psp_mail: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required().error(() => {
                return new Error("Merchant id required")
            }),
            ekyc_status: Joi.string().required().error(() => {
                return new Error("Ekyc status  required")
            }),
        });
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
            } else {
                let merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let merchant_exits = await checkifrecordexist({ id: merchant_id, deleted: 0, status: 0 }, 'master_merchant');
                if (!merchant_exits)
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Merchant with id not exits or account deleted or account is not active.`))
                else
                    next()
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    update_owners_status: async (req, res, next) => {

        const schema = Joi.object().keys({
            owner_id: Joi.string().required().error(() => {
                return new Error("Valid Owner Id required")
            }),
            status: Joi.number().min(0).max(3).required().error(() => {
                return new Error("Status required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let owner_id = enc_dec.cjs_decrypt(req.bodyString('owner_id'));
                let owner_id_exist = await checkifrecordexist({ id: owner_id, deleted: 0 }, 'merchant_business_owners');

                if (!owner_id_exist) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Owner not found`));
                } else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }

    },
    paymentStatus: async (req, res, next) => {
        const schema = Joi.object().keys({
            order_id: Joi.string().required().error(() => {
                return new Error("Valid order id required")
            }),
            payment_id: Joi.string().required().error(() => {
                return new Error("Valid payment id required")
            }),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let order_id = req.bodyString('order_id');
                let payment_id = req.bodyString('payment_id');
                let order_exits = await checkifrecordexist({ order_id: order_id, txn: payment_id }, 'order_txn');
                let payment_id_already_used = await checkifrecordexist({ payment_id: payment_id }, 'master_merchant_details');
                if (!order_exits || payment_id_already_used) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid order id or payment id.`));
                } else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

    CM_Accept: async (req, res, next) => {
        try {
            const schema = Joi.object().keys({
                merchant_id: Joi.string().required(),
            })
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                const checkmerchantid = await adminUserModel.selectOne('role', { id: req.user.id });
                const arr = checkmerchantid.role.split(',');
                const checkuser = arr.includes('cm_01') || arr.includes('cm_02')
                if (!checkuser) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid Access.`));
                }
                else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },
    CM_Approval: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required(),
            status: Joi.number().required(),
            industry_isic: Joi.string(),
            ram_risk_ratings: Joi.string(),
            triggered_risk: Joi.string(),
            overall_risk: Joi.string(),
            remark: Joi.string(),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                let merchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'));
                let checkmerchantid = await MerchanrApproval.selectList('*', { merchant_id: merchant_id, compliance_manager: req.user.id });
                checkmerchantid = checkmerchantid[checkmerchantid.length - 1]
                if (!checkmerchantid) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Invalid merchant id.`));
                }
                else if (checkmerchantid.is_accepted === 0) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Please Accept Before Approve`));
                }
                else if (checkmerchantid.status === 0 || checkmerchantid.status === 1) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Already Submitted.`));
                }
                else if (checkmerchantid.status) {
                    res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(`Already Completed Process.`));
                }
                else {
                    next();
                }
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

    CM_SendMail: async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required(),
            to : Joi.string().required(),
            cc: Joi.array().items(Joi.string().email({ minDomainSegments: 2 })).max(5),
            subject: Joi.string().required(),
            body: Joi.string().required(),
            file : Joi.any(),
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
                next();
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

    CM_Approvallogs :async (req, res, next) => {
        const schema = Joi.object().keys({
            merchant_id: Joi.string().required()
        })
        try {
            const result = schema.validate(req.body);
            if (result.error) {
                res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(result.error.message));
            } else {
               next();
            }
        } catch (error) {
            res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
        }
    },

}
module.exports = MerchantEkyc