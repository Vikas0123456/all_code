const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const enc_dec = require("../utilities/decryptor/decryptor");
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const helpers = require("../utilities/helper/general_helper");
const MerchantEkycModel = require("../models/merchant_ekycModel");
const MerchantModel = require("../models/merchantmodel");
const MerchantApproval = require("../models/merchantapproval");
const MerchantRegistrationModel = require("../models/merchant_registration");
const UserNotificationModel = require("../models/userNotification");
const adminModel = require('../models/adm_user');
require("dotenv").config({ path: "../.env" });
const server_addr = process.env.SERVER_LOAD;
const port = process.env.SERVER_PORT;
var uuid = require("uuid");
const mailSender = require("../utilities/mail/mailsender");
const merchantToken = require("../utilities/tokenmanager/merchantToken");
const env = process.env.ENVIRONMENT;
const region = process.env.REGION;
const config = require("../config/config.json")[env];
const PspModel = require("../models/psp");
const moment = require("moment");
const EventEmitter = require("events");
const EntityModel = require("../models/entityModel");
const ee = new EventEmitter();
const axios = require("axios");
const qs = require("qs");
const shortid = require("shortid");
const efr_exportdata = require("../models/efr_reportdata");
const ComplianceMail = require('../models/compliance_mail');
const ServerResponse = require("../utilities/response/ServerResponse");
var MerchantEkyc = {
    login: async (req, res) => {
        let passwordHash = encrypt_decrypt(
            "encrypt",
            req.bodyString("password")
        );
        let login_data = {
            email: req.bodyString("email"),
            password: passwordHash,
            deleted: 0,
        };
        MerchantEkycModel.select_super_merchant(
            "id,name,email,code,mobile_no,status,password_expired",
            login_data
        )
            .then(async (result) => {
                if (result) {
                    if (result.password_expired == "0") {
                        let payload = {
                            merchant_id: result.id,
                            name: result.name,
                            email: result.email,
                            //ekyc_status: !result.ekyc_done ? 'Yes' : 'No',
                            //main_step: result.main_step,
                            //sub_step: result.sub_step
                        };

                        const aToken = merchantToken(payload);

                        let two_fa_token = uuid.v1();
                        let created_at = new Date()
                            .toJSON()
                            .substring(0, 19)
                            .replace("T", " ");
                        let otp = "123456"; //generateOTPLogin();
                        let ref_no = shortid.generate();
                        let two_fa_data = {
                            token: two_fa_token,
                            otp: otp,
                            merchant_id: result.id,
                            ref_no: ref_no,
                            created_at: created_at,
                        };
                        let result_2fa =
                            await MerchantRegistrationModel.add_two_fa(
                                two_fa_data
                            );

                        let body =
                            otp +
                            " is your one time password to login to your Telr Dashboard. This code expires in 5 minutes. Do not share this code with anyone. If not requested, please contact +971 4 314 6999 Telr Ref No. " +
                            ref_no;
                        axios
                            .get(
                                "https://api.smsglobal.com/http-api.php?action=sendsms&user=" +
                                process.env.SMS_USERNAME +
                                "&password=" +
                                process.env.SMS_PASSWORD +
                                "&from=Test&to=" +
                                result.code +
                                result.mobile_no +
                                "&maxsplit=2" +
                                "&text=" +
                                body
                            )
                            .then((result_sms) => {
                                res.status(statusCode.ok).send(
                                    response.successdatamsg(
                                        { token: two_fa_token },
                                        "OTP sent to your registered mobile no with Ref No. " +
                                        ref_no +
                                        " and will expire in 5 minutes."
                                    )
                                );
                            })
                            .catch((error) => {
                                res.status(statusCode.internalError).send(
                                    response.errormsg("Unable to send sms")
                                );
                            });
                    } else {
                        res.status(statusCode.ok).send(
                            response.errormsg(
                                "Your password is expired, please reset your password."
                            )
                        );
                    }
                } else {
                    res.status(statusCode.ok).send(
                        response.errormsg("Invalid email or password")
                    );
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    getMccCodes: async (req, res) => {
        MerchantEkycModel.selectMcc()
            .then(async (result) => {
                let tree = [];
                for (let i of result) {
                    let subtree = await MerchantEkycModel.fetchChild({
                        category: i.id,
                        deleted: 0,
                        status: 0,
                    });
                    let subtree_enc = [];
                    for (let j of subtree) {
                        let val = {
                            data_id: j.id,
                            id: enc_dec.cjs_encrypt(j.id),
                            mcc: j.mcc,
                            description: j.description,
                            mcc_and_description: j.mcc + ' ' + j.description
                        };
                        subtree_enc.push(val);
                    }
                    let other = {
                        id: enc_dec.cjs_encrypt("0"),
                        description: "Other",
                    };
                    subtree_enc.push(other);
                    let obj = {
                        mcc_category: i.mcc_category,
                        children: subtree_enc,
                    };

                    tree.push(obj);
                }
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        tree,
                        "mcc codes fetch successfully"
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    verify_otp: async (req, res) => {
        const token = req.bodyString("token");
        let otp = req.bodyString("otp");
        MerchantRegistrationModel.select2fa({
            token: token,
            otp: otp,
            is_expired: 0,
        })
            .then(async (result) => {
                if (result) {
                    var date1 = new Date().getTime();
                    var date2 = new Date(result.created_at).getTime();
                    if (date1 - date2 <= 5 * 60 * 1000) {
                        let condition = { token: token };
                        let data = { is_expired: 1 };
                        await MerchantRegistrationModel.update2fa(
                            condition,
                            data
                        );

                        let merchant_data =
                            await MerchantModel.selectOneSuperMerchant("*", {
                                id: result.merchant_id,
                            });
                        let user = merchant_data;
                        payload = {
                            email: user.email,
                            id: user.id,
                            name: user.name,
                            type: "merchant",
                        };
                        const aToken = merchantToken(payload);
                        let user_language = 1;
                        if (user.language) {
                            user_language = user.language;
                        }

                        let search_condition = {};
                        if (user.language) {
                            search_condition.id = user.language;
                        } else {
                            (search_condition.status = 0),
                                (search_condition.deleted = 0);
                        }

                        let language =
                            await helpers.get_first_active_language_json(
                                search_condition
                            );

                        res.status(statusCode.ok).send(
                            response.loginSuccess({
                                accessToken: aToken,
                                name: user.name ? user.name : user.email,
                                email: user.email,
                                language: language,
                                theme: user.theme,
                                user_type: "merchant",
                                region: region
                            })
                        );
                    } else {
                        res.status(statusCode.ok).send(
                            response.errormsg("OTP expired")
                        );
                    }
                } else {
                    res.status(statusCode.ok).send(
                        response.errormsg(
                            "Invalid otp, please try with correct one."
                        )
                    );
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    getPspByMcc: async (req, res) => {
        MerchantEkycModel.selectPspByMcc(
            enc_dec.cjs_decrypt(req.bodyString("mcc_code"))
        )
            .then((result) => {
                let send_res = [];
                result.forEach(function (val, key) {
                    let enc_id = enc_dec.cjs_encrypt(val.id);
                    let res_temp = {
                        psp_id: enc_id,
                        psp_name: val.name,
                        status: val.status == 1 ? "Deactivated" : "Active",
                    };
                    send_res.push(res_temp);
                });
                res.status(statusCode.ok).send(
                    response.successdatamsg(send_res, "psp fetch successfully")
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    business_type: async (req, res) => {
        //step-1
        let err = "";
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        try {
            //merchant details update or add
            let result = await MerchantEkycModel.merchantDetails({ merchant_id: submerchant_id });
            let last_updated = moment().format('YYYY-MM-DD HH:mm');
            if (result) {
                let condition = { merchant_id: submerchant_id };
                let data = {
                    register_business_country: enc_dec.cjs_decrypt(
                        req.bodyString("register_country")
                    ),
                    type_of_business: enc_dec.cjs_decrypt(
                        req.bodyString("entity_type")
                    ),
                    is_business_register_in_free_zone: req.bodyString(
                        "is_business_register_in_free_zone"
                    ),
                    last_updated: last_updated,
                };
                await MerchantEkycModel.updateMerchantDetails(condition, data)
                let update_condition = { id: submerchant_id };
                let update_data = { main_step: 2 };
                await MerchantEkycModel.update(update_condition, update_data);
                await helpers.complete_kyc_step(submerchant_id, 1);
            } else {
                let merchant_details = {
                    merchant_id: submerchant_id,
                    register_business_country: enc_dec.cjs_decrypt(
                        req.bodyString("register_country")
                    ),
                    type_of_business: enc_dec.cjs_decrypt(
                        req.bodyString("entity_type")
                    ),
                    is_business_register_in_free_zone: req.bodyString(
                        "is_business_register_in_free_zone"
                    ),
                    last_updated: last_updated,
                };
                await MerchantEkycModel.insertMerchantDetails(merchant_details)
                let ins_condition = { id: submerchant_id };
                let ins_data = { main_step: 2 };
                await MerchantEkycModel.update(
                    ins_condition,
                    ins_data
                );
                await helpers.complete_kyc_step(submerchant_id, 1);

            }
            //entity document update or add 
            let entity_id = enc_dec.cjs_decrypt(req.bodyString('entity_type'));
            let merchant_entity_document = await MerchantEkycModel.selectBusinessTypeDocument('sequence,id', { entity_id: entity_id, merchant_id: submerchant_id, deleted: 0 });
            if (merchant_entity_document.length > 0) {
                let entity_documents = await EntityModel.list_of_document({ entity_id: entity_id, deleted: 0, is_applicable: 1 });
                let i = 1;
                for (let entity of entity_documents) {
                    let obj_temp = {
                        entity_id: entity_id,
                        sequence: entity.document,
                        merchant_id: submerchant_id,
                        document_id: entity.id,
                        issue_date: moment(req.bodyString('document_' + i + '_issue_date')).format('YYYY-MM-DD'),
                        expiry_date: moment(req.bodyString('document_' + i + '_expiry_date')).format('YYYY-MM-DD'),
                        document_num: req.bodyString('document_' + i + '_number'),
                        added_date: last_updated
                    }
                    if (req.bodyString('document_' + i) != '') {
                        obj_temp.document_name = req.bodyString('document_' + i);
                    }

                    await MerchantEkycModel.updateMerchantBusinessTypeDocument(obj_temp, { id: merchant_entity_document[i - 1].id })
                    i++;
                }


            } else {
                //No Document Uploaded Insert Document
                let entity_documents = await EntityModel.list_of_document({ entity_id: entity_id, deleted: 0, is_applicable: 1 });
                let i = 1;
                let whole_insert_obj = [];
                for (let entity of entity_documents) {
                    let obj_temp = {
                        entity_id: entity_id,
                        sequence: entity.document,
                        merchant_id: submerchant_id,
                        document_id: entity.id,
                        issue_date: moment(req.bodyString('document_' + i + '_issue_date')).format('YYYY-MM-DD'),
                        expiry_date: moment(req.bodyString('document_' + i + '_expiry_date')).format('YYYY-MM-DD'),
                        document_num: req.bodyString('document_' + i + '_number'),
                        document_name: req.bodyString('document_' + i),
                        deleted: 0,
                        added_date: last_updated
                    }
                    whole_insert_obj.push(obj_temp);
                    i++;
                }
                let add_all_document = await MerchantEkycModel.addMerchantDocs(whole_insert_obj);


            }

            let log = {
                submerchant_id: submerchant_id,
                super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                section: "Verify your business",
                sub_section: "Business type",
                json_data: JSON.stringify(req.body),
            }

            await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
            await helpers.create_activatylog({ merchant_id: submerchant_id, activity: "Business Type  Added " }, req, res);
            res.status(statusCode.ok).send(
                response.successmsg("Updated successfully")
            );



        } catch (error) {
            console.log(error)
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    business_details: async (req, res) => {
        //step-2
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        MerchantEkycModel.merchantDetails({ merchant_id: submerchant_id })
            .then(async (result) => {
                let last_updated = new Date()
                    .toJSON()
                    .substring(0, 19)
                    .replace("T", " ");
                if (result) {
                    let condition = { merchant_id: submerchant_id };

                    let data = {
                        company_name: req.bodyString("legal_business_name"),
                        company_registration_number: req.bodyString(
                            "company_registration_number"
                        ),
                        vat_number: req.bodyString("vat_number"),
                        // doing_business_as: req.bodyString('doing_business_as'),
                        // register_business_address_country: enc_dec.cjs_decrypt(req.bodyString('register_business_address_country')),
                        address_line1: req.bodyString("business_address_line1"),
                        address_line2: req.bodyString("business_address_line2"),
                        province: enc_dec.cjs_decrypt(
                            req.bodyString("province")
                        ),
                        business_phone_code: req.bodyString(
                            "business_phone_code"
                        ),
                        business_phone_number: req.bodyString(
                            "business_phone_number"
                        ),
                        mcc_codes: enc_dec.cjs_decrypt(
                            req.bodyString("industry_type")
                        ),

                        business_website: req.bodyString("business_website"),
                        product_description: req.bodyString(
                            "product_description"
                        ),
                        last_updated: last_updated,

                        poc_name: req.bodyString("poc_name"),
                        poc_email: req.bodyString("poc_email"),
                        poc_mobile_code: req.bodyString("poc_mobile_code"),
                        poc_mobile: req.bodyString("poc_mobile"),
                        tech_name: req.bodyString('tech_name'),
                        tech_email: req.bodyString('tech_email'),
                        tech_mobile_code: req.bodyString('tech_mobile_code'),
                        tech_mobile: req.bodyString('tech_mobile'),
                        fin_name: req.bodyString('fin_name'),
                        fin_email: req.bodyString('fin_email'),
                        fin_mobile_code: req.bodyString('fin_mobile_code'),
                        fin_mobile: req.bodyString('fin_mobile'),
                        link_tc: req.bodyString("link_tc"),
                        link_pp: req.bodyString("link_pp"),
                        link_refund: req.bodyString("link_rf"),
                        // transaction_currencies:req.bodyString('transaction_currencies'),
                        // settlement_currency:req.bodyString('settlement_currency'),
                        estimated_revenue_amount: req.bodyString(
                            "estimated_revenue_amount"
                        ),
                        // link_refund:req.bodyString('link_refund'),
                        // link_cancellation:req.bodyString('link_cancellation'),
                        // link_delivery_policy:req.bodyString('link_dp')
                    };
                    if (
                        enc_dec.cjs_decrypt(req.bodyString("industry_type")) ==
                        "0" &&
                        req.bodyString("other_industry_type") != ""
                    ) {
                        data.other_mcc_title = req.bodyString(
                            "other_industry_type"
                        );
                    }
                    MerchantEkycModel.updateMerchantDetails(condition, data)
                        .then(async (result) => {
                            let main_sub_merchant_data =
                                await MerchantEkycModel.select_first("id", {
                                    super_merchant_id: req.user.id,
                                });
                            if (main_sub_merchant_data.id == submerchant_id) {
                                let name = {
                                    name: req.bodyString("legal_business_name"),
                                };
                                await MerchantEkycModel.updateDetails(
                                    { id: req.user.id },
                                    name
                                );
                            }
                            let condition = { id: submerchant_id };
                            let data = { main_step: 3 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 2);

                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                } else {
                    let merchant_details = {
                        merchant_id: submerchant_id,
                        company_name: req.bodyString("legal_business_name"),
                        company_registration_number: req.bodyString(
                            "company_registration_number"
                        ),
                        vat_number: req.bodyString("vat_number"),
                        // doing_business_as: req.bodyString('doing_business_as'),
                        // register_business_address_country: enc_dec.cjs_decrypt(req.bodyString('register_business_address_country')),
                        address_line1: req.bodyString("business_address_line1"),
                        address_line2: req.bodyString("business_address_line2"),
                        province: enc_dec.cjs_decrypt(
                            req.bodyString("province")
                        ),
                        business_phone_code: req.bodyString(
                            "business_phone_code"
                        ),
                        business_phone_number: req.bodyString(
                            "business_phone_number"
                        ),
                        mcc_codes: enc_dec.cjs_decrypt(
                            req.bodyString("industry_type")
                        ),

                        business_website: req.bodyString("business_website"),
                        product_description: req.bodyString(
                            "product_description"
                        ),
                        last_updated: last_updated,

                        poc_name: req.bodyString("poc_name"),
                        poc_email: req.bodyString("poc_email"),
                        poc_mobile_code: req.bodyString("poc_mobile_code"),
                        poc_mobile: req.bodyString("poc_mobile"),
                        tech_name: req.bodyString('tech_name'),
                        tech_email: req.bodyString('tech_email'),
                        tech_mobile_code: req.bodyString('tech_mobile_code'),
                        tech_mobile: req.bodyString('tech_mobile'),
                        fin_name: req.bodyString('fin_name'),
                        fin_email: req.bodyString('fin_email'),
                        fin_mobile_code: req.bodyString('fin_mobile_code'),
                        fin_mobile: req.bodyString('fin_mobile'),
                        link_tc: req.bodyString("link_tc"),
                        link_pp: req.bodyString("link_pp"),
                        link_refund: req.bodyString("link_rf"),
                        // transaction_currencies: req.bodyString('transaction_currencies'),
                        // settlement_currency: req.bodyString('settlement_currency'),
                        estimated_revenue_amount: req.bodyString(
                            "estimated_revenue_amount"
                        ),
                    };
                    MerchantEkycModel.insertMerchantDetails(merchant_details)
                        .then(async (result) => {
                            let main_sub_merchant_data =
                                await MerchantEkycModel.select_first("id", {
                                    super_merchant_id: req.user.id,
                                });

                            if (main_sub_merchant_data.id == submerchant_id) {
                                let name = {
                                    name: req.bodyString("legal_business_name"),
                                };
                                await MerchantEkycModel.updateDetails(
                                    { id: req.user.id },
                                    name
                                );
                            }

                            let condition = { id: submerchant_id };
                            let data = { main_step: 3 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 2);

                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                }

                let log = {
                    submerchant_id: submerchant_id,
                    super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                    section: "Verify your business",
                    sub_section: "Business details",
                    json_data: JSON.stringify(req.body),
                }

                await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                await helpers.create_activatylog({ merchant_id: submerchant_id, activity: "Business Details Updated " }, req, res);

                res.status(statusCode.ok).send(
                    response.successmsg("Updated successfully")
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    representative_update: async (req, res) => {
        //step-3
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        MerchantEkycModel.merchantDetails({ merchant_id: submerchant_id })
            .then(async (result) => {
                let last_updated = new Date()
                    .toJSON()
                    .substring(0, 19)
                    .replace("T", " ");
                if (result) {
                    let condition = { merchant_id: submerchant_id };
                    let data = {
                        legal_person_first_name: req.bodyString(
                            "legal_person_first_name"
                        ),
                        legal_person_last_name: req.bodyString(
                            "legal_person_last_name"
                        ),
                        legal_person_email: req.bodyString("email_address"),
                        job_title: req.bodyString("job_title"),
                        nationality: enc_dec.cjs_decrypt(
                            req.bodyString("nationality")
                        ),
                        dob: req.bodyString("date_of_birth"),
                        home_address_country: enc_dec.cjs_decrypt(
                            req.bodyString("home_address_country")
                        ),
                        home_address_line_1:
                            req.bodyString("home_address_line1"),
                        home_address_line_2:
                            req.bodyString("home_address_line2") + "",
                        home_province: enc_dec.cjs_decrypt(
                            req.bodyString("home_address_state")
                        ),
                        home_phone_code: req.bodyString(
                            "home_address_phone_code"
                        ),
                        home_phone_number: req.bodyString(
                            "home_address_phone_number"
                        ),
                        personal_id_number:
                            req.bodyString("personal_id_number"),
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.updateMerchantDetails(condition, data)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 4 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 3);

                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                } else {
                    let merchant_details = {
                        merchant_id: submerchant_id,
                        legal_person_first_name: req.bodyString(
                            "legal_person_first_name"
                        ),
                        legal_person_last_name: req.bodyString(
                            "legal_person_last_name"
                        ),
                        legal_person_email: req.bodyString("email_address"),
                        job_title: req.bodyString("job_title"),
                        nationality: enc_dec.cjs_decrypt(
                            req.bodyString("nationality")
                        ),
                        dob: req.bodyString("date_of_birth"),
                        home_address_country: encrypt_decrypt(
                            req.bodyString("home_address_country")
                        ),
                        home_address_line_1:
                            req.bodyString("home_address_line1"),
                        home_address_line_2:
                            req.bodyString("home_address_line2") + "",
                        home_province: enc_dec.cjs_decrypt(
                            req.bodyString("home_address_state")
                        ),
                        home_phone_code: req.bodyString(
                            "home_address_phone_code"
                        ),
                        home_phone_number: req.bodyString(
                            "home_address_phone_number"
                        ),
                        personal_id_number:
                            req.bodyString("personal_id_number"),
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.insertMerchantDetails(merchant_details)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 4 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 3);

                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                }

                let log = {
                    submerchant_id: submerchant_id,
                    super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                    section: "Verify your business",
                    sub_section: "Representative details",
                    json_data: JSON.stringify(req.body),
                }

                await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                res.status(statusCode.ok).send(
                    response.successmsg("Updated successfully")
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    add_business_owner: async (req, res) => {
        let submerchant_id = enc_dec.cjs_decrypt(
            req.bodyString("submerchant_id")
        );
        let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");

        let data = {
            merchant_id: submerchant_id,
            first_name: req.bodyString("first_name"),
            middle_name: req.bodyString("middle_name") ? req.bodyString("middle_name") : "",
            last_name: req.bodyString("last_name"),
            email: req.bodyString("email_address"),
            nationality: enc_dec.cjs_decrypt(req.bodyString("nationality")),
            type_of_business_owner: req.bodyString('type_of_business_owner'),
            type_of_owner: req.bodyString('type_of_owner') ? req.bodyString('type_of_owner') : 'owner',
            emirates_id: req.bodyString("emirates_id") ? req.bodyString("emirates_id") : "",
            emirates_id_no: req.bodyString("emirates_id_no") ? req.bodyString("emirates_id_no") : "",
            emirates_id_issue_date: req.bodyString("emirates_id_issue_date") ? req.bodyString("emirates_id_issue_date") : "0000-00-00",
            emirates_id_expiry_date: req.bodyString("emirates_id_expiry_date") ? req.bodyString("emirates_id_expiry_date") : "0000-00-00",
            passport: req.bodyString("passport") ? req.bodyString("passport") : "",
            passport_no: req.bodyString("passport_no") ? req.bodyString("passport_no") : "",
            passport_issue_date: req.bodyString("passport_issue_date") ? req.bodyString("passport_issue_date") : "0000-00-00",
            passport_expiry_date: req.bodyString("passport_expiry_date") ? req.bodyString("passport_expiry_date") : "0000-00-00",
            visa: req.bodyString("visa") ? req.bodyString("visa") : "",
            visa_no: req.bodyString("visa_no") ? req.bodyString("visa_no") : "",
            visa_issue_date: req.bodyString("visa_issue_date") ? req.bodyString("visa_issue_date") : "0000-00-00",
            visa_expiry_date: req.bodyString("visa_expiry_date") ? req.bodyString("visa_expiry_date") : "0000-00-00",
            trade_license: req.bodyString("trade_license") ? req.bodyString("trade_license") : "",
            trade_license_no: req.bodyString("trade_license_no") ? req.bodyString("trade_license_no") : "",
            trade_license_issue_date: req.bodyString("trade_license_issue_date") ? req.bodyString("trade_license_issue_date") : "0000-00-00",
            trade_license_expiry_date: req.bodyString("trade_license_expiry_date") ? req.bodyString("trade_license_expiry_date") : "0000-00-00",
            passport_of_ubo: req.bodyString("passport_of_ubo"),
            passport_of_ubo_no: req.bodyString("passport_of_ubo_no") ? req.bodyString("passport_of_ubo_no") : "",
            passport_of_ubo_issue_date: req.bodyString("passport_of_ubo_issue_date") ? req.bodyString("passport_of_ubo_issue_date") : "0000-00-00",
            passport_of_ubo_expiry_date: req.bodyString("passport_of_ubo_expiry_date") ? req.bodyString("passport_of_ubo_expiry_date") : "0000-00-00",
            moa: req.bodyString("moa"),
            status: 0,
            deleted: 0,

            ekyc_status: req.bodyString("ekyc_status") ? req.bodyString("ekyc_status") : 0,
            country_of_residence: req.bodyString("country_of_residence") ? enc_dec.cjs_decrypt(req.bodyString("country_of_residence")) : "",
            city_of_residence: req.bodyString("city_of_residence") ? enc_dec.cjs_decrypt(req.bodyString("city_of_residence")) : "",
            legal_business_name: req.bodyString("legal_business_name") ? req.bodyString("legal_business_name") : "",
            trading_name: req.bodyString("trading_name") ? req.bodyString("trading_name") : "",
            country_of_registration: req.bodyString("country_of_registration") ? enc_dec.cjs_decrypt(req.bodyString("country_of_registration")) : "",
            city_of_registration: req.bodyString("city_of_registration") ? enc_dec.cjs_decrypt(req.bodyString("city_of_registration")) : "",
            website_url: req.bodyString("website_url") ? req.bodyString("website_url") : "",
            created_at: created_at,
        };
        if (req.all_files) {
            if (req.all_files.document) {
                data.document = req.all_files.document;
            }
        }
        MerchantEkycModel.addBusinessOwner(data)
            .then(async (result) => {
                let condition = { id: submerchant_id };
                let data = { main_step: 5 };
                let updateResult = await MerchantEkycModel.update(
                    condition,
                    data
                );
                await helpers.complete_kyc_step(submerchant_id, 4);

                let log = {
                    submerchant_id: submerchant_id,
                    super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                    section: "Verify your business",
                    sub_section: "Business owners",
                    json_data: JSON.stringify(req.body),
                }

                await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                await helpers.create_activatylog({ merchant_id: submerchant_id, activity: "Business Owner Updated " }, req, res);
                res.status(statusCode.ok).send(
                    response.successmsg("Updated successfully")
                );
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        { id: encrypt_decrypt("encrypt", result.insertId) },
                        "Business owner added successfully"
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
    update_business_owner: async (req, res) => {
        try {
            //step-4
            let id = enc_dec.cjs_decrypt(req.bodyString('business_owner_id'));
            let submerchant_id = enc_dec.cjs_decrypt(
                req.bodyString("submerchant_id")
            );
            let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");

            let data = {
                merchant_id: submerchant_id,
                first_name: req.bodyString("first_name"),
                middle_name: req.bodyString("middle_name") ? req.bodyString("middle_name") : "",
                last_name: req.bodyString("last_name"),
                email: req.bodyString("email_address"),
                nationality: enc_dec.cjs_decrypt(req.bodyString("nationality")),
                type_of_business_owner: req.bodyString("type_of_business_owner"),
                type_of_owner: req.bodyString('type_of_owner') ? req.bodyString('type_of_owner') : 'owner',
                emirates_id_no: req.bodyString("emirates_id_no") ? req.bodyString("emirates_id_no") : "",
                emirates_id_issue_date: req.bodyString("emirates_id_issue_date") ? req.bodyString("emirates_id_issue_date") : "0000-00-00",
                emirates_id_expiry_date: req.bodyString("emirates_id_expiry_date") ? req.bodyString("emirates_id_expiry_date") : "0000-00-00",

                passport_no: req.bodyString("passport_no") ? req.bodyString("passport_no") : "",
                passport_issue_date: req.bodyString("passport_issue_date") ? req.bodyString("passport_issue_date") : "0000-00-00",
                passport_expiry_date: req.bodyString("passport_expiry_date") ? req.bodyString("passport_expiry_date") : "0000-00-00",

                visa_no: req.bodyString("visa_no") ? req.bodyString("visa_no") : "",
                visa_issue_date: req.bodyString("visa_issue_date") ? req.bodyString("visa_issue_date") : "0000-00-00",
                visa_expiry_date: req.bodyString("visa_expiry_date") ? req.bodyString("visa_expiry_date") : "0000-00-00",

                trade_license_no: req.bodyString("trade_license_no") ? req.bodyString("trade_license_no") : "",
                trade_license_issue_date: req.bodyString("trade_license_issue_date") ? req.bodyString("trade_license_issue_date") : "0000-00-00",
                trade_license_expiry_date: req.bodyString("trade_license_expiry_date") ? req.bodyString("trade_license_expiry_date") : "0000-00-00",

                passport_of_ubo_no: req.bodyString("passport_of_ubo_no") ? req.bodyString("passport_of_ubo_no") : "",
                passport_of_ubo_issue_date: req.bodyString("passport_of_ubo_issue_date") ? req.bodyString("passport_of_ubo_issue_date") : "0000-00-00",
                passport_of_ubo_expiry_date: req.bodyString("passport_of_ubo_expiry_date") ? req.bodyString("passport_of_ubo_expiry_date") : "0000-00-00",

                ekyc_status: req.bodyString("ekyc_status") ? req.bodyString("ekyc_status") : 0,
                country_of_residence: req.bodyString("country_of_residence") ? enc_dec.cjs_decrypt(req.bodyString("country_of_residence")) : "",
                city_of_residence: req.bodyString("city_of_residence") ? enc_dec.cjs_decrypt(req.bodyString("city_of_residence")) : "",
                legal_business_name: req.bodyString("legal_business_name") ? req.bodyString("legal_business_name") : "",
                trading_name: req.bodyString("trading_name") ? req.bodyString("trading_name") : "",
                country_of_registration: req.bodyString("country_of_registration") ? enc_dec.cjs_decrypt(req.bodyString("country_of_registration")) : "",
                city_of_registration: req.bodyString("city_of_registration") ? enc_dec.cjs_decrypt(req.bodyString("city_of_registration")) : "",
                website_url: req.bodyString("website_url") ? req.bodyString("website_url") : "",
            };
            if (req.body.passport) {
                data.passport = req.body.passport;
            }
            if (req.body.emirates_id) {
                data.emirates_id = req.body.emirates_id;
            }
            if (req.body.visa) {
                data.visa = req.body.visa;
            }
            if (req.body.trade_license) {
                data.trade_license = req.body.trade_license;
            }
            if (req.body.passport_of_ubo) {
                data.passport_of_ubo = req.body.passport_of_ubo;
            }
            if (req.body.moa) {
                data.moa = req.body.moa;
            }
            MerchantEkycModel.updateOwner({ id: id }, data)
                .then(async (result) => {
                    console.log(result);
                    let condition = { id: submerchant_id };
                    let data = { main_step: 5 };
                    let updateResult = await MerchantEkycModel.update(
                        condition,
                        data
                    );
                    await helpers.complete_kyc_step(submerchant_id, 4);
                    let log = {
                        submerchant_id: submerchant_id,
                        super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                        section: "Verify your business",
                        sub_section: "Business owners",
                        json_data: JSON.stringify(req.body),
                    }

                    await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                    res.status(statusCode.ok).send(
                        response.successmsg(
                            "Business owner updated successfully"
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(
                        response.errormsg(error)
                    );
                });

        } catch (error) {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    business_owner_copy: async (req, res) => {
        //step-4

        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        MerchantEkycModel.selectBusiness("*", {
            merchant_id: submerchant_id,
            deleted: 0,
        })
            .then(async (result) => {
                for (i = 0; i < result.length; i++) {
                    let get_count = await MerchantEkycModel.get_count({
                        merchant_id: submerchant_id,
                        email: `'${result[i].email}'`,
                    });
                    if (get_count == 0) {
                        let res = {
                            merchant_id: result[i].merchant_id,
                            first_name: result[i].first_name,
                            last_name: result[i].last_name,
                            email: result[i].email,
                            status: result[i].status,
                            deleted: result[i].deleted,
                            created_at: moment(result[i].created_at).format(
                                "YYYY-MM-DD H:mm:ss"
                            ),
                        };
                        let owners_copydata =
                            await MerchantEkycModel.addExecutive(res);
                    }
                }
                await MerchantEkycModel.selectDynamic(
                    "*",
                    { merchant_id: submerchant_id, deleted: 0 },
                    "pg_merchant_business_executives"
                )
                    .then(async (list) => {
                        let send_data = [];
                        for (let val of list) {
                            let res1 = {
                                id: encrypt_decrypt("encrypt", val.id),
                                name: val.first_name + " " + val.last_name,
                                last_name: val.last_name,
                                email: val.email,
                            };
                            send_data.push(res1);
                        }
                        res.status(statusCode.ok).send(
                            response.successdatamsg(
                                send_data,
                                "Executive added successfully"
                            )
                        );
                    })
                    .catch((error) => {
                        console.log(error);
                        res.status(statusCode.internalError).send(
                            response.errormsg(error)
                        );
                    });
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    add_executive: async (req, res) => {
        //step-5
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        let created_at = new Date().toJSON().substring(0, 19).replace("T", " ");
        let data = {
            merchant_id: submerchant_id,
            first_name: req.bodyString("first_name"),
            last_name: req.bodyString("last_name"),
            email: req.bodyString("email_address"),
            status: 0,
            deleted: 0,
            created_at: created_at,
        };
        MerchantEkycModel.addExecutive(data)
            .then(async (result) => {
                let condition = { id: submerchant_id };
                let data = { main_step: 6 };
                let updateResult = await MerchantEkycModel.update(
                    condition,
                    data
                );
                await helpers.complete_kyc_step(submerchant_id, 5);
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        { id: encrypt_decrypt("encrypt", result.insertId) },
                        "Executive added successfully"
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    update_public: async (req, res) => {
        //step-6
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        MerchantEkycModel.merchantDetails({ merchant_id: submerchant_id })
            .then((result) => {
                let last_updated = new Date()
                    .toJSON()
                    .substring(0, 19)
                    .replace("T", " ");
                if (result) {
                    let condition = { merchant_id: submerchant_id };

                    let psp_ids = req.bodyString("psp_id").split(",");
                    let psp_cs = [];
                    for (let i = 0; i < psp_ids.length; i++) {
                        psp_cs.push(enc_dec.cjs_decrypt(psp_ids[i]));
                    }
                    let psp_ids_cs = psp_cs.join(",");

                    let data = {
                        statement_descriptor: req.bodyString(
                            "statement_descriptor"
                        ),
                        shortened_descriptor: req.bodyString(
                            "shortened_descriptor"
                        ),
                        customer_support_phone_code: req.bodyString(
                            "customer_support_phone_code"
                        ),
                        customer_support_phone_number: req.bodyString(
                            "customer_support_phone_number"
                        ),
                        psp_id: psp_ids_cs + "",
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.updateMerchantDetails(condition, data)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 7 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 6);
                            res.status(statusCode.ok).send(
                                response.successmsg("Updated successfully")
                            );
                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                } else {
                    let psp_ids = req.bodyString("psp_id").split(",");
                    let psp_cs = [];
                    for (let i = 0; i < psp_ids.length; i++) {
                        psp_cs.push(enc_dec.cjs_decrypt(psp_ids[i]));
                    }
                    let psp_ids_cs = psp_cs.join(",");

                    let merchant_details = {
                        merchant_id: submerchant_id,
                        statement_descriptor: req.bodyString(
                            "statement_descriptor"
                        ),
                        shortened_descriptor: req.bodyString(
                            "shortened_descriptor"
                        ),
                        customer_support_phone_number: req.bodyString(
                            "customer_support_phone_number"
                        ),
                        psp_id: psp_ids_cs + "",
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.insertMerchantDetails(merchant_details)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 7 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 6);
                            res.status(statusCode.ok).send(
                                response.successmsg("Updated successfully")
                            );
                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                }
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    add_bank: async (req, res) => {
        //step-7
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        let country_id = enc_dec.cjs_decrypt(req.bodyString("country"));
        MerchantEkycModel.merchantDetails({ merchant_id: submerchant_id })
            .then(async (result) => {
                let last_updated = new Date()
                    .toJSON()
                    .substring(0, 19)
                    .replace("T", " ");
                if (result) {
                    let condition = { merchant_id: submerchant_id };
                    let data = {
                        iban: req.bodyString("iban_no"),

                        bank_currency: req.bodyString("currency"),
                        bank_country: country_id,
                        bank_document: req.bodyString("document"),
                        bank_document_type: req.bodyString(
                            "owners_bank_document_type"
                        ),
                        bank_name: req.bodyString("bank_name"),
                        account_no: req.bodyString("account_no"),
                        swift: req.bodyString("swift"),
                        branch_name: req.bodyString("branch_name"),
                        transaction_currencies: req.bodyString(
                            "transaction_currencies"
                        ),
                        settlement_currency: req.bodyString(
                            "settlement_currency"
                        ),
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.updateMerchantDetails(condition, data)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 8 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 7);

                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                } else {
                    let merchant_details = {
                        merchant_id: submerchant_id,
                        iban: req.bodyString("iban_no"),
                        bank_currency: req.bodyString("currency"),
                        bank_country: country_id,
                        bank_document: req.bodyString("document"),
                        bank_document_type:
                            req.bodyString("bank_document_type"),
                        bank_name: req.bodyString("bank_name"),
                        account_no: req.bodyString("account_no"),
                        swift: req.bodyString("swift"),
                        branch_name: req.bodyString("branch_name"),
                        transaction_currencies: req.bodyString(
                            "transaction_currencies"
                        ),
                        settlement_currency: req.bodyString(
                            "settlement_currency"
                        ),
                        last_updated: last_updated,
                    };
                    MerchantEkycModel.insertMerchantDetails(merchant_details)
                        .then(async (result) => {
                            let condition = { id: submerchant_id };
                            let data = { main_step: 8 };
                            let updateResult = await MerchantEkycModel.update(
                                condition,
                                data
                            );
                            await helpers.complete_kyc_step(submerchant_id, 7);

                        })
                        .catch((error) => {
                            res.status(statusCode.internalError).send(
                                response.errormsg(error)
                            );
                        });
                }
                let log = {
                    submerchant_id: submerchant_id,
                    super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                    section: "Add your bank",
                    sub_section: "Bank details",
                    json_data: JSON.stringify(req.body),
                }

                await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                await helpers.create_activatylog({ merchant_id: submerchant_id, activity: "Bank Details Added" }, req, res);
                res.status(statusCode.ok).send(
                    response.successmsg("Updated successfully")
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    submit_summary: async (req, res) => {
        //step-8
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        MerchantEkycModel.select("step_completed", { id: submerchant_id })
            .then(async (result) => {
                console.log(result);
                let err = "";
                if (result.step_completed != "") {
                    let sequence_arr = result.step_completed.split(",");
                    sequence_arr.sort();
                    for (let i = 0; i < 7; i++) {
                        let j = i + 1;
                        if (j != 4 && j != 5 && j != 6 && j != 3) {
                            if (!sequence_arr.includes(j.toString())) {
                                //if (sequence_arr[i] != j.toString()) {
                                err =
                                    "Please fill and complete " +
                                    helpers.ekyc_steps(j);
                                break;
                            }
                        }
                    }
                    if (err) {
                        res.status(statusCode.ok).send(
                            response.validationResponse(err)
                        );
                    } else {
                        let merchant_details =
                            await MerchantEkycModel.selectMerchantDetails("*", {
                                merchant_id: submerchant_id,
                            });
                        let entity_document =
                            await MerchantEkycModel.selectDynamic(
                                "*",
                                { merchant_id: submerchant_id, deleted: 0 },
                                config.table_prefix + "merchant_entity_document"
                            );
                        let match_selfie_owner_document =
                            await MerchantEkycModel.getSelfieDocsByEmiratesId(
                                submerchant_id
                            );
                        if (match_selfie_owner_document) {
                            let submit_merchant_status = {
                                kyc_link: process.env.MERCHANT_KYC_URL,
                                match_link: match_selfie_owner_document
                                    ? server_addr +
                                    ":" +
                                    port +
                                    "/static/files/" +
                                    match_selfie_owner_document.emirates_id
                                    : "",
                                merchant_id: encrypt_decrypt(
                                    "encrypt",
                                    submerchant_id
                                ),
                                merchant_name: merchant_details.company_name
                                    ? merchant_details.company_name
                                    : "",
                                legal_person_name:
                                    match_selfie_owner_document
                                        ? match_selfie_owner_document.first_name +
                                        " " +
                                        match_selfie_owner_document.last_name
                                        : "",
                                doc_name: "Emirates ID",
                                doc_number: match_selfie_owner_document.emirates_id_no,
                                dob: merchant_details.dob
                                    ? moment(merchant_details.dob).format(
                                        "DD-MM-YYYY"
                                    )
                                    : "",
                                address:
                                    await helpers.get_city_name_by_id(match_selfie_owner_document.city_of_residence) +
                                    ", " +
                                    await helpers.get_country_name_by_id(match_selfie_owner_document.country_of_residence),
                            };

                            let psp_details_arr = [];
                            let merchant_data = await MerchantEkycModel.select(
                                "*",
                                { id: submerchant_id }
                            );
                            // let psp_kyc = 0
                            // if (merchant_details.psp_id) {
                            //     let psp_ids = merchant_details.psp_id.split(",")
                            //     for (let pi of psp_ids) {
                            //         let psp_details = await helpers.get_psp_details_by_id('ekyc_required', pi)
                            //         psp_details_arr.push(psp_details)
                            //         if (psp_details.ekyc_required == 1) {
                            //             psp_kyc++;
                            //             let ob = {
                            //                 merchant_id: merchant_details.merchant_id,
                            //                 psp_id: pi,
                            //                 status: 0
                            //             }
                            //             await MerchantEkycModel.insertPspStatus(ob)
                            //         }

                            //     }
                            // }
                            // let ekyc_required = 0
                            // if (psp_kyc > 0) {
                            //     submit_merchant_status.ekyc_required = 1
                            //     ekyc_required = 1
                            // }else{
                            //     submit_merchant_status.ekyc_required = 0
                            //     ekyc_required = 0
                            // }
                            let ekyc_required = 1;
                            let ref_no = await helpers.make_reference_number(
                                "REF",
                                7
                            );
                            await MerchantEkycModel.update(
                                { id: submerchant_id },
                                {
                                    onboarding_done: 1,
                                    ekyc_required: ekyc_required,
                                    referral_code: ref_no,
                                }
                            );

                            let tc_obj = {
                                merchant_id: submerchant_id,
                                tc_id: await helpers.get_latest_tc_version_id(),
                                added_date: new Date()
                                    .toJSON()
                                    .substring(0, 19)
                                    .replace("T", " "),
                                type: "submerchant",
                            };

                            await MerchantRegistrationModel.addTC(tc_obj);

                            // if (psp_kyc > 0) {
                            ee.once("ping", async (arguments) => {
                                try {
                                    let file_name = [];
                                    let original_name = [];
                                    for (ed of entity_document) {
                                        if (ed.document_name) {
                                            file_name.push(ed.document_name);
                                            original_name.push(
                                                helpers.doc_names(ed.sequence)
                                            );
                                        }
                                    }
                                    MerchantEkycModel.selectDynamic(
                                        "*",
                                        {
                                            merchant_id: submerchant_id,
                                            ekyc_status: 0,
                                        },
                                        config.table_prefix +
                                        "merchant_business_owners"
                                    ).then(async (owners_result) => {
                                        for (let owner of owners_result) {
                                            original_name.push(owner.emirates_id);
                                            file_name.push(owner.emirates_id);
                                            original_name.push(owner.passport);
                                            file_name.push(owner.passport);
                                            original_name.push(owner.visa);
                                            file_name.push(owner.visa);
                                            original_name.push(owner.trade_license);
                                            file_name.push(owner.visa);
                                        }
                                        //         for(i=0;i<=owners_result.length;i++) {
                                        //          owners_id =await encrypt_decrypt('encrypt', owner.id);
                                        //         let verify_url = process.env.MERCHANT_KYC_URL + '?token=' + owners_id;
                                        //         let title = await helpers.get_title();
                                        //          let subject = 'Welcome to '+title;
                                        //         await mailSender.ekycOwnersMail(owner.email, subject, verify_url);
                                        //         let owner_data = {
                                        //             file_name: file_name.join(','),
                                        //             original_name: original_name.join(','),
                                        //             folder_name: "files",
                                        //             file_path: server_addr + ':' + port + "/static/files/",
                                        //             document: server_addr + ':' + port + "/static/files/"+ owner.document ,
                                        //             enc_merchant_id: encrypt_decrypt('encrypt', submerchant_id),
                                        //             merchant_id: submerchant_id,
                                        //             type: 1,
                                        //             data: '',
                                        //             name: merchant_details.company_name + "",
                                        //             email: merchant_data.email + "",
                                        //             mobile: merchant_data.mobile_no + "",
                                        //             enc_owner_id: encrypt_decrypt('encrypt', owner.id),
                                        //             owner_name:owner.first_name+' '+owner.last_name,
                                        //             owners_email: owner.email + "",
                                        //         }
                                        //         var response_owner = await axios.post(process.env.ADMIN_KYC_URL+"SaveMerchant", qs.stringify(owner_data), {
                                        //             headers: {
                                        //                 'Content-Type': 'application/x-www-form-urlencoded',
                                        //             }
                                        //         })

                                        //   }

                                        let data_str = {
                                            file_name: file_name.join(","),
                                            original_name: original_name.join(","),
                                            folder_name: "files",
                                            file_path:
                                                server_addr +
                                                ":" +
                                                port +
                                                "/static/files/",
                                            enc_merchant_id: encrypt_decrypt(
                                                "encrypt",
                                                submerchant_id
                                            ),
                                            merchant_id: submerchant_id,
                                            type: 1,
                                            data: "",
                                            name:
                                                merchant_details.company_name + "",
                                            email: merchant_data.email + "",
                                            mobile: merchant_data.mobile_no + "",
                                        };

                                        let response = await axios.post(
                                            process.env.ADMIN_KYC_URL +
                                            "SaveMerchant",
                                            qs.stringify(data_str),
                                            {
                                                headers: {
                                                    "Content-Type":
                                                        "application/x-www-form-urlencoded",
                                                },
                                            }
                                        );
                                    });
                                } catch (error) {
                                    console.log(error); // this is the main part. Use the response property from the error object
                                    return error.response;
                                }
                            });
                            ee.emit("ping", { merchant_id: submerchant_id });
                            // }
                            let log = {
                                submerchant_id: submerchant_id,
                                super_merchant: await helpers.get_super_merchant_id(submerchant_id),
                                section: "Review and finish",
                                sub_section: "Summary",
                                json_data: JSON.stringify(req.body),
                            }

                            await MerchantEkycModel.addDynamic(log, config.table_prefix + "onboarding_logs");
                            await helpers.create_activatylog({ merchant_id: submerchant_id, activity: "Merchant onboarded successfully." }, req, res);

                            res.status(statusCode.ok).send(
                                response.successdatamsg(
                                    submit_merchant_status,
                                    "Congratulations! You are onboarded successfully."
                                )
                            );
                        } else {
                            res.status(statusCode.ok).send(
                                response.validationResponse("No Business owner found please add business owner.")
                            );
                        }
                    }
                } else {
                    res.status(statusCode.ok).send(
                        response.validationResponse("Please fill all details.")
                    );
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    submit_video_kyc: async (req, res) => {
        let table = config.table_prefix + "master_merchant";
        let condition = {
            id: enc_dec.cjs_decrypt(req.bodyString("merchant_id")),
        };
        let data = { video_kyc_done: 1 };
        MerchantEkycModel.updateDynamic(condition, data, table)
            .then(async (result) => {
                await helpers.create_activatylog({ merchant_id: enc_dec.cjs_decrypt(req.bodyString("merchant_id")), activity: "Video kyc status updated successfully" }, req, res);
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Video kyc status updated successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    send_psp_mail: async (req, res) => {
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.body.submerchant_id
        );
        let merchant_details = await MerchantEkycModel.selectMerchantDetails(
            "*",
            { merchant_id: submerchant_id }
        );
        let psp_details_send = [];

        let psp_kyc = 0;
        if (merchant_details.psp_id) {
            let psp_ids = merchant_details.psp_id.split(",");
            for (let pi of psp_ids) {
                let psp_details = await helpers.get_psp_details_by_id(
                    "id,name,email_to,cc,ekyc_required",
                    pi
                );
                psp_details_send.push({
                    email: psp_details.email_to,
                    cc: psp_details.cc,
                    name: psp_details.name,
                    id: psp_details.id,
                });

                if (psp_details.ekyc_required == 1) {
                    psp_kyc++;
                }
            }
        }

        let merchant_details_mail_arr = {
            "Registered business address": await helpers.get_country_name_by_id(
                merchant_details.register_business_country
            ),
            "Type of business": await helpers.get_type_of_business(
                merchant_details.type_of_business
            ),
            "Is business register in free zone":
                merchant_details.is_business_register_in_free_zone
                    ? "No"
                    : "Yes",
            "Company Name": merchant_details.company_name,
            "Company Registration Number":
                merchant_details.company_registration_number,
            "VAT number": merchant_details.vat_number,
            "I am going to use payment solution for":
                merchant_details.doing_business_as,
            "Business registered country": await helpers.get_country_name_by_id(
                merchant_details.register_business_country
            ),
            "Address Line 1": merchant_details.address_line1,
            "Address Line 2": merchant_details.address_line2,
            province: merchant_details.province
                ? await helpers.get_state_name_by_id(merchant_details.province)
                : "",
            "Business phone number": merchant_details.business_phone_number,
            "Business phone code": merchant_details.business_phone_code,
            "MCC codes": await helpers.get_mcc_code_description(
                merchant_details.mcc_codes
            ),
            "Business website": merchant_details.business_website,
            "Product Description": merchant_details.product_description,
            "Legal person first name": merchant_details.legal_person_first_name,
            "Legal person last name": merchant_details.legal_person_last_name,
            "legal person email": merchant_details.legal_person_email,
            "Job title": merchant_details.job_title,
            Nationality: await helpers.get_country_name_by_id(
                merchant_details.nationality
            ),
            DOB: merchant_details.dob
                ? moment(merchant_details.dob).format("DD-MM-YYYY")
                : "",
            "Home address country": await helpers.get_country_name_by_id(
                merchant_details.home_address_country
            ),
            "Home address line-1": merchant_details.home_address_line_1,
            "Home address line-2": merchant_details.home_address_line_2,
            "Home province": merchant_details.home_province
                ? await helpers.get_state_name_by_id(
                    merchant_details.home_province
                )
                : "",
            "Home phone code": merchant_details.home_phone_code,
            "Home phone number": merchant_details.home_phone_number,
            "Personal ID number": merchant_details.personal_id_number,
            "Statement Descriptor": merchant_details.statement_descriptor,
            "Shortened Descriptor": merchant_details.shortened_descriptor,
            "Customer support phone code":
                merchant_details.customer_support_phone_code,
            "Customer support phone number":
                merchant_details.customer_support_phone_number,
            IBAN: merchant_details.iban,
            "Bank Name": merchant_details.bank_name,
            "Branch Name": merchant_details.branch_name,
            "Point of contact name": merchant_details.poc_name,
            "Point of contact email": merchant_details.poc_email,
            "Point of contact mobile code": merchant_details.poc_mobile_code,
            "Point of contact mobile": merchant_details.poc_mobile,
            "Compliance and risk officer name": merchant_details.cro_name,
            "Compliance and risk officer email": merchant_details.cro_email,
            "Compliance and risk officer mobile code":
                merchant_details.cro_mobile_code,
            "Compliance and risk officer mobile": merchant_details.cro_mobile,
            "Customer support name": merchant_details.co_name,
            "Customer support email": merchant_details.co_email,
            "Customer support mobile code": merchant_details.co_mobile_code,
            "Customer support mobile": merchant_details.co_mobile,
            "Link terms and conditions": merchant_details.link_tc,
            "Link privacy policy": merchant_details.link_pp,
            "Link refund": merchant_details.link_refund,
            "Link cancellation": merchant_details.link_cancellation,
            "Link delivery policy": merchant_details.link_delivery_policy,
        };

        let table = `
            <table style="font-family: 'Montserrat',Arial,sans-serif; width: 100%;border:1px solid #ccc;border-radius:5px;" width="100%; background:#fff;" cellpadding="0" cellspacing="0">
                <tr>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Document</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Document Number</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Issue Date</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Expiry Date</th>
                    
                </tr>
            `;

        let entity_document = await MerchantEkycModel.selectDynamic(
            "*",
            { merchant_id: submerchant_id, deleted: 0 },
            config.table_prefix + "merchant_entity_document"
        );

        let no_data_str = `<span style='color:#7C8386;font-style: italic;font-size:10px'>Not Available</span>`;
        for (val of entity_document) {
            let doc = helpers.doc_names(val.sequence);
            let document_name = val.document_name
                ? server_addr +
                ":" +
                port +
                "/static/files/" +
                val.document_name
                : no_data_str;
            let issue_date = val.issue_date
                ? moment(val.issue_date).format("DD-MM-YYYY")
                : no_data_str;
            let expiry_date = val.expiry_date
                ? moment(val.expiry_date).format("DD-MM-YYYY")
                : no_data_str;
            let document_num = val.document_num
                ? val.document_num
                : no_data_str;

            table +=
                `<tr>
                            <td  style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                doc +
                ` <br> <a href = "` +
                document_name +
                `">click here to view</a> </td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                document_num +
                `</td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                issue_date +
                `</td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                expiry_date +
                `</td>
                            
                        </tr>`;
        }

        table += `</table>`;

        table += `<br>`;
        table += `
            <table style="font-family: 'Montserrat',Arial,sans-serif; width: 100%;border:1px solid #ccc;border-radius:5px;" width="100%; background:#fff;" cellpadding="0" cellspacing="0">`;

        //for (val of merchant_details_mail_arr) {
        Object.keys(merchant_details_mail_arr).forEach(function (key) {
            var val = merchant_details_mail_arr[key];
            table +=
                `<tr>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;width:200px;">` +
                key +
                `</th>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                val +
                `</td>
                </tr>
            `;
        });
        table += `</table>`;

        for (let emails of psp_details_send) {
            let mail = emails.email;
            let mail_cc = emails.cc;
            let psp_id = emails.id;
            let reference = await helpers.make_reference_number("REF", 8);

            await MerchantEkycModel.addDynamic(
                {
                    submerchant_id: submerchant_id,
                    psp_id: psp_id,
                    email: mail,
                    cc: mail_cc,
                    reference: reference,
                },
                config.table_prefix + "psp_mail_log"
            );

            let para =
                `Dear ` +
                emails.name +
                ` ,<br>
             Please find the Merchant's details along with documents link with request reference no. ` +
                reference +
                ``;

            let subject = "Merchant KYC documents - " + reference;
            ee.once("email", async (arguments) => {
                await mailSender.PSPMail(mail, mail_cc, subject, table, para);
            });
            ee.emit("email", { merchant_id: submerchant_id });
        }
        await MerchantEkycModel.updateDynamic(
            { id: submerchant_id },
            { psp_mail_send: 1 },
            config.table_prefix + "master_merchant"
        );
        res.status(statusCode.ok).send(
            response.successmsg("Mail send successfully")
        );
    },

    send_psp_mail_auto: async (submerchant_id1) => {
        let submerchant_id = submerchant_id1;
        let merchant_details = await MerchantEkycModel.selectMerchantDetails(
            "*",
            { merchant_id: submerchant_id }
        );

        let psp_details_send = [];

        let psp_kyc = 0;
        if (merchant_details.psp_id) {
            let psp_ids = merchant_details.psp_id.split(",");
            for (let pi of psp_ids) {
                let psp_details = await helpers.get_psp_details_by_id(
                    "id,name,email_to,cc,ekyc_required",
                    pi
                );
                psp_details_send.push({
                    email: psp_details.email_to,
                    cc: psp_details.cc,
                    name: psp_details.name,
                    id: psp_details.id,
                });

                if (psp_details.ekyc_required == 1) {
                    psp_kyc++;
                }
            }
        }

        let merchant_details_mail_arr = {
            "Registered business address": await helpers.get_country_name_by_id(
                merchant_details.register_business_country
            ),
            "Type of business": await helpers.get_type_of_business(
                merchant_details.type_of_business
            ),
            "Is business register in free zone":
                merchant_details.is_business_register_in_free_zone
                    ? "No"
                    : "Yes",
            "Company Name": merchant_details.company_name,
            "Company Registration Number":
                merchant_details.company_registration_number,
            "VAT number": merchant_details.vat_number,
            "I am going to use payment solution for":
                merchant_details.doing_business_as,
            "Business registered country": await helpers.get_country_name_by_id(
                merchant_details.register_business_country
            ),
            "Address Line 1": merchant_details.address_line1,
            "Address Line 2": merchant_details.address_line2,
            province: merchant_details.province
                ? await helpers.get_state_name_by_id(merchant_details.province)
                : "",
            "Business phone number": merchant_details.business_phone_number,
            "Business phone code": merchant_details.business_phone_code,
            "MCC codes": await helpers.get_mcc_code_description(
                merchant_details.mcc_codes
            ),
            "Business website": merchant_details.business_website,
            "Product Description": merchant_details.product_description,
            "Legal person first name": merchant_details.legal_person_first_name,
            "Legal person last name": merchant_details.legal_person_last_name,
            "legal person email": merchant_details.legal_person_email,
            "Job title": merchant_details.job_title,
            Nationality: await helpers.get_country_name_by_id(
                merchant_details.nationality
            ),
            DOB: merchant_details.dob
                ? moment(merchant_details.dob).format("DD-MM-YYYY")
                : "",
            "Home address country": await helpers.get_country_name_by_id(
                merchant_details.home_address_country
            ),
            "Home address line-1": merchant_details.home_address_line_1,
            "Home address line-2": merchant_details.home_address_line_2,
            "Home province": merchant_details.home_province
                ? await helpers.get_state_name_by_id(
                    merchant_details.home_province
                )
                : "",
            "Home phone code": merchant_details.home_phone_code,
            "Home phone number": merchant_details.home_phone_number,
            "Personal ID number": merchant_details.personal_id_number,
            "Statement Descriptor": merchant_details.statement_descriptor,
            "Shortened Descriptor": merchant_details.shortened_descriptor,
            "Customer support phone code":
                merchant_details.customer_support_phone_code,
            "Customer support phone number":
                merchant_details.customer_support_phone_number,
            IBAN: merchant_details.iban,
            "Bank Name": merchant_details.bank_name,
            "Branch Name": merchant_details.branch_name,
            "Point of contact name": merchant_details.poc_name,
            "Point of contact email": merchant_details.poc_email,
            "Point of contact mobile code": merchant_details.poc_mobile_code,
            "Point of contact mobile": merchant_details.poc_mobile,
            "Compliance and risk officer name": merchant_details.cro_name,
            "Compliance and risk officer email": merchant_details.cro_email,
            "Compliance and risk officer mobile code":
                merchant_details.cro_mobile_code,
            "Compliance and risk officer mobile": merchant_details.cro_mobile,
            "Customer support name": merchant_details.co_name,
            "Customer support email": merchant_details.co_email,
            "Customer support mobile code": merchant_details.co_mobile_code,
            "Customer support mobile": merchant_details.co_mobile,
            "Link terms and conditions": merchant_details.link_tc,
            "Link privacy policy": merchant_details.link_pp,
            "Link refund": merchant_details.link_refund,
            "Link cancellation": merchant_details.link_cancellation,
            "Link delivery policy": merchant_details.link_delivery_policy,
        };

        let merchant_kyc_response = await axios.post(
            process.env.ADMIN_KYC_URL +
            "merchant/Transmittal/merchant_details_api",
            qs.stringify({
                merchant_id: encrypt_decrypt("encrypt", submerchant_id),
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        let table = `
            <table style="font-family: 'Montserrat',Arial,sans-serif; width: 100%;border:1px solid #ccc;border-radius:5px;" width="100%; background:#fff;" cellpadding="0" cellspacing="0">
                <tr>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Document</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Document Number</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Issue Date</th>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">Expiry Date</th>
                    
                </tr>
            `;

        let entity_document = await MerchantEkycModel.selectDynamic(
            "*",
            { merchant_id: submerchant_id, deleted: 0 },
            config.table_prefix + "merchant_entity_document"
        );

        let no_data_str = `<span style='color:#7C8386;font-style: italic;font-size:10px'>Not Available</span>`;
        for (val of entity_document) {
            let doc = helpers.doc_names(val.sequence);
            let document_name = val.document_name
                ? server_addr +
                ":" +
                port +
                "/static/files/" +
                val.document_name
                : no_data_str;
            let issue_date = val.issue_date
                ? moment(val.issue_date).format("DD-MM-YYYY")
                : no_data_str;
            let expiry_date = val.expiry_date
                ? moment(val.expiry_date).format("DD-MM-YYYY")
                : no_data_str;
            let document_num = val.document_num
                ? val.document_num
                : no_data_str;

            table +=
                `<tr>
                            <td  style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                doc +
                ` <br> <a href = "` +
                document_name +
                `">click here to view</a> </td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                document_num +
                `</td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                issue_date +
                `</td>
                            <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                expiry_date +
                `</td>
                            
                        </tr>`;
        }

        if (merchant_kyc_response.data) {
            table +=
                `<tr>
                    <td  style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">KYC Selfie <br><a href = "` +
                merchant_kyc_response.data.selfie_link +
                `">click here to view</a></td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                    
                </tr>
                <tr>
                    <td  style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">KYC Video <br> <a href = "` +
                merchant_kyc_response.data.video_kyc_link +
                `">click here to view</a></td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                no_data_str +
                `</td>
                </tr>`;
        }

        table += `</table>`;

        table += `<br>`;
        table += `
            <table style="font-family: 'Montserrat',Arial,sans-serif; width: 100%;border:1px solid #ccc;border-radius:5px;" width="100%; background:#fff;" cellpadding="0" cellspacing="0">`;

        //for (val of merchant_details_mail_arr) {
        Object.keys(merchant_details_mail_arr).forEach(function (key) {
            var val = merchant_details_mail_arr[key];
            table +=
                `<tr>
                    <th style = "padding: 8px;border:1px solid #ccc;background-color: #fff;width:200px;">` +
                key +
                `</th>
                    <td style = "padding: 8px;border:1px solid #ccc;background-color: #fff;">` +
                val +
                `</td>
                </tr>
            `;
        });
        table += `</table>`;

        for (let emails of psp_details_send) {
            let mail = emails.email;
            let mail_cc = emails.cc;
            let psp_id = emails.id;
            let reference = await helpers.make_reference_number("REF", 8);

            await MerchantEkycModel.addDynamic(
                {
                    submerchant_id: submerchant_id,
                    psp_id: psp_id,
                    email: mail,
                    cc: mail_cc,
                    reference: reference,
                },
                config.table_prefix + "psp_mail_log"
            );

            let para =
                `Dear ` +
                emails.name +
                ` ,<br>
             Please find the Merchant's details along with documents link with request reference no. ` +
                reference +
                ``;

            let subject = "Merchant KYC documents - " + reference;
            ee.once("email", async (arguments) => {
                await mailSender.PSPMail(mail, mail_cc, subject, table, para);
            });
            ee.emit("email", { merchant_id: submerchant_id });
        }
        await MerchantEkycModel.updateDynamic(
            { id: submerchant_id },
            { psp_mail_send: 1 },
            config.table_prefix + "master_merchant"
        );

        return;

        //res.status(statusCode.ok).send(response.successmsg('Mail send successfully'));
    },
    delete_business_owner: async (req, res) => {
        let table = config.table_prefix + "merchant_business_owners";
        let condition = {
            id: enc_dec.cjs_decrypt(req.bodyString("business_owner_id")),
        };
        let data = { deleted: 1 };
        MerchantEkycModel.updateDynamic(condition, data, table)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg("Business owner deleted successfully")
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    business_owner_details: async (req, res) => {

        let id = enc_dec.cjs_decrypt(req.bodyString("business_owner_id"));
        let table = config.table_prefix + "merchant_business_owners";
        let condition = { id: id, deleted: 0 };
        let selection = "*";
        MerchantEkycModel.selectDynamic(selection, condition, table)
            .then(async (result) => {
                let send_res = [];
                let val = result
                // for (val of result) {
                let res1 = {
                    business_owner_id: enc_dec.cjs_encrypt(val[0].id),
                    first_name: val[0].first_name,
                    middle_name: val[0].middle_name,
                    last_name: val[0].last_name,
                    email: val[0].email,
                    nationality: enc_dec.cjs_encrypt(val[0].nationality),
                    type_of_business_owner: val[0].type_of_business_owner,
                    type_of_owner: val[0].type_of_owner,
                    emirates_id: val[0].emirates_id ? process.env.STATIC_URL + "/static/files/" + val[0].emirates_id : "",
                    emirates_id_no: val[0].emirates_id_no ? val[0].emirates_id_no : "",
                    emirates_id_issue_date: moment(val[0].emirates_id_issue_date, 'YYYY-MM-DD').isValid() ? val[0].emirates_id_issue_date : "",
                    emirates_id_expiry_date: moment(val[0].emirates_id_expiry_date, 'YYYY-MM-DD').isValid() ? val[0].emirates_id_expiry_date : "",
                    passport: val[0].passport ? process.env.STATIC_URL + "/static/files/" + val[0].passport : "",
                    passport_no: val[0].passport_no ? val[0].passport_no : "",
                    passport_issue_date: moment(val[0].passport_issue_date, 'YYYY-MM-DD').isValid()
                        ? val[0].passport_issue_date
                        : "",
                    passport_expiry_date: moment(val[0].passport_expiry_date, 'YYYY-MM-DD').isValid()
                        ? val[0].passport_expiry_date
                        : "",
                    visa: val[0].visa
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        val[0].visa
                        : "",
                    visa_no: val[0].visa_no ? val[0].visa_no : "",
                    visa_issue_date: moment(val[0].visa_issue_date, 'YYYY-MM-DD').isValid()
                        ? val[0].visa_issue_date
                        : "",
                    visa_expiry_date: moment(val[0].visa_expiry_date, 'YYYY-MM-DD').isValid()
                        ? val[0].visa_expiry_date
                        : "",
                    trade_license: val[0].trade_license
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        val[0].trade_license
                        : "",
                    trade_license_no: val[0].trade_license_no
                        ? val[0].trade_license_no
                        : "",
                    trade_license_issue_date: moment(val[0].trade_license_issue_date, 'YYYY-MM-DD').isValid()
                        ? val[0].trade_license_issue_date
                        : "",
                    trade_license_expiry_date: moment(val[0].trade_license_expiry_date, 'YYYY-MM-DD').isValid()
                        ? val[0].trade_license_expiry_date
                        : "",
                    passport_of_ubo: val[0].passport_of_ubo
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        val[0].passport_of_ubo
                        : "",
                    passport_of_ubo_no: val[0].passport_of_ubo_no
                        ? val[0].passport_of_ubo_no
                        : "",
                    passport_of_ubo_issue_date:
                        moment(val[0].passport_of_ubo_issue_date, 'YYYY-MM-DD').isValid()
                            ? val[0].passport_of_ubo_issue_date
                            : "",
                    passport_of_ubo_expiry_date:
                        moment(val[0].passport_of_ubo_expiry_date, 'YYYY-MM-DD').isValid()
                            ? val[0].passport_of_ubo_expiry_date
                            : "",

                    moa: val[0].moa
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        val[0].moa
                        : "",
                    country_of_registration: val[0].country_of_registration ? enc_dec.cjs_encrypt(val[0].country_of_registration) : "",
                    city_of_registration: val[0].city_of_registration ? enc_dec.cjs_encrypt(val[0].city_of_registration) : "",
                    country_of_residence: val[0].country_of_residence ? enc_dec.cjs_encrypt(val[0].country_of_residence) : "",
                    city_of_residence: val[0].city_of_residence ? enc_dec.cjs_encrypt(val[0].city_of_residence) : "",
                    website_url: val[0].website_url,
                    legal_business_name: val[0].legal_business_name,
                    trading_name: val[0].trading_name,
                    status: val.status == 1 ? "Deactivated" : "Active",
                };
                // send_res.push(res);
                // }
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        res1,
                        "Business owner fetch successfully"
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });

    },
    list_business_owner: async (req, res) => {
        let submerchant_id = encrypt_decrypt("decrypt", req.bodyString("submerchant_id"));
        let table = config.table_prefix + "merchant_business_owners";
        let condition = { merchant_id: submerchant_id, deleted: 0 };
        let selection = "*";
        MerchantEkycModel.selectDynamic(selection, condition, table)
            .then((result) => {
                let send_res = [];
                for (val of result) {
                    let res = {
                        business_owner_id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        middle_name: val.middle_name,
                        last_name: val.last_name,
                        email: val.email,
                        nationality: enc_dec.cjs_encrypt(val.nationality),
                        type_of_business_owner: val.type_of_business_owner,
                        type_of_owner: val.type_of_owner,
                        emirates_id: val.emirates_id ? process.env.STATIC_URL + "/static/files/" + val.emirates_id : "",
                        emirates_id_no: val.emirates_id_no ? val.emirates_id_no : "",
                        emirates_id_issue_date: val.emirates_id_issue_date ? val.emirates_id_issue_date : "",
                        emirates_id_expiry_date: val.emirates_id_expiry_date ? val.emirates_id_expiry_date : "",
                        passport: val.passport ? process.env.STATIC_URL + "/static/files/" + val.passport : "",
                        passport_no: val.passport_no ? val.passport_no : "",
                        passport_issue_date: val.passport_issue_date
                            ? val.passport_issue_date
                            : "",
                        passport_expiry_date: val.passport_expiry_date
                            ? val.passport_expiry_date
                            : "",
                        visa: val.visa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.visa
                            : "",
                        visa_no: val.visa_no ? val.visa_no : "",
                        visa_issue_date: val.visa_issue_date
                            ? val.visa_issue_date
                            : "",
                        visa_expiry_date: val.visa_expiry_date
                            ? val.visa_expiry_date
                            : "",
                        trade_license: val.trade_license
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.trade_license
                            : "",
                        trade_license_no: val.trade_license_no
                            ? val.trade_license_no
                            : "",
                        trade_license_issue_date: val.trade_license_issue_date
                            ? val.trade_license_issue_date
                            : "",
                        trade_license_expiry_date: val.trade_license_expiry_date
                            ? val.trade_license_expiry_date
                            : "",
                        passport_of_ubo: val.passport_of_ubo
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.passport_of_ubo
                            : "",
                        passport_of_ubo_no: val.passport_of_ubo_no
                            ? val.passport_of_ubo_no
                            : "",
                        passport_of_ubo_issue_date:
                            val.passport_of_ubo_issue_date
                                ? val.passport_of_ubo_issue_date
                                : "",
                        passport_of_ubo_expiry_date:
                            val.passport_of_ubo_expiry_date
                                ? val.passport_of_ubo_expiry_date
                                : "",
                        moa: val.moa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.moa
                            : "",
                        country_of_registration: val.country_of_registration,
                        city_of_registration: val.city_of_registration,
                        country_of_residence: val.country_of_residence,
                        city_of_residence: val.city_of_registration,
                        website_url: val.website_url,
                        legal_business_name: val.legal_business_name,
                        trading_name: val.trading_name,
                        status: val.status == 1 ? "Deactivated" : "Active",
                    };
                    send_res.push(res);
                }
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Business owner fetch successfully"
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    list_business_executives: async (req, res) => {
        let submerchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("submerchant_id")
        );
        let table = config.table_prefix + "merchant_business_executives";
        let condition = { merchant_id: submerchant_id, deleted: 0 };
        let selection = "id,first_name,last_name,email,status";
        MerchantEkycModel.selectDynamic(selection, condition, table)
            .then((result) => {
                let send_res = [];
                for (val of result) {
                    let res = {
                        business_owner_id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        last_name: val.last_name,
                        email: val.email,
                        status: val.status == 1 ? "Deactivated" : "Active",
                    };
                    send_res.push(res);
                }
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Business executives fetch successfully"
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    delete_business_executive: async (req, res) => {
        let table = config.table_prefix + "merchant_business_executives";
        let condition = {
            id: enc_dec.cjs_decrypt(req.bodyString("business_executive_id")),
        };
        let data = { deleted: 1 };
        MerchantEkycModel.updateDynamic(condition, data, table)
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successmsg(
                        "Business executive deleted successfully"
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },

    merchant_profile: async (req, res) => {
        let selection = "`id`,`name`, `email`, `code`, `mobile_no`";
        let condition = { id: req.user.id };
        let table_name = config.table_prefix + "master_super_merchant";

        let submerchant_id;


        MerchantEkycModel.selectDynamicSingle(selection, condition, table_name)
            .then(async (merchant_result) => {
                let main_sub_merchant_data = await MerchantEkycModel.select_first("id", {
                    super_merchant_id: req.user.id,
                });
                let merchant_id;


                if (!main_sub_merchant_data) {
                    let master_merchant = await MerchantModel.add(
                        {
                            super_merchant_id: req.user.id,
                            onboarding_done: 0,
                            video_kyc_done: 0,
                            ekyc_done: 1,
                            ekyc_required: 1
                        }
                    )
                    let store_id = 100000 + master_merchant.insertId;
                    merchant_id = master_merchant.insertId;
                    await MerchantModel.updateDetails({ id: master_merchant.insertId }, { store_id: store_id });
                } else {
                    merchant_id = main_sub_merchant_data.id
                }


                let condition = { "mm.id": merchant_id };
                MerchantEkycModel.selectFullProfile(condition)
                    .then(async (merchant_details_result) => {
                        let vat_no = await helpers.getMerchantDocumentByName(merchant_details_result.id, merchant_details_result.type_of_business, 'VAT');
                        let trade_license_no = await helpers.getMerchantDocumentByName(merchant_details_result.id, merchant_details_result.type_of_business, 'Trade License');
                        let condition = {
                            merchant_id: req.user.id,
                            status: 0,
                            deleted: 0,
                        };
                        let selection = "*";
                        let table_name =
                            config.table_prefix + "merchant_business_owners";
                        let business_owners =
                            await MerchantEkycModel.selectDynamic(
                                selection,
                                condition,
                                table_name
                            );
                        let entity_document =
                            await MerchantEkycModel.selectDynamic(
                                "*",
                                { merchant_id: req.user.id, deleted: 0 },
                                config.table_prefix + "merchant_entity_document"
                            );
                        let getKeys = await MerchantEkycModel.selectKeyData(
                            merchant_id
                        );
                        let entity_documents = [];
                        for (val of entity_document) {
                            let ent_lists = await EntityModel.list_of_document({
                                id: val.document_id,
                            });
                            let ent_list = ent_lists[0];
                            if (typeof ent_list != "undefined") {
                                let seq = val.sequence;
                                let res = {
                                    id: enc_dec.cjs_encrypt(ent_list.id),
                                    document: "document_" + ent_list.document,
                                    is_required: ent_list.required ? 1 : 0,
                                    document_num_required:
                                        ent_list.document_num_required == 1
                                            ? 1 : 0,
                                    issue_date_required:
                                        ent_list.issue_date_required == 1
                                            ? 1
                                            : 0,
                                    expiry_date_required:
                                        ent_list.expiry_date_required ? 1 : 0,
                                    sequence: val.sequence,
                                    entity_type: encrypt_decrypt(
                                        "encrypt",
                                        val.entity_id
                                    ),
                                };

                                (res["data_id"] = encrypt_decrypt(
                                    "encrypt",
                                    val.id
                                )),
                                    (res["document_id"] = encrypt_decrypt(
                                        "encrypt",
                                        val.document_id
                                    )),
                                    (res["document_number"] = val.document_num
                                        ? val.document_num
                                        : ""),
                                    (res["document_issue_date"] = val.issue_date
                                        ? moment(val.issue_date).format(
                                            "DD-MM-YYYY"
                                        )
                                        : ""),
                                    (res["document_expiry_date"] =
                                        val.expiry_date
                                            ? moment(val.expiry_date).format(
                                                "DD-MM-YYYY"
                                            )
                                            : ""),
                                    (res["document_file"] = val.document_name
                                        ? server_addr +
                                        ":" +
                                        port +
                                        "/static/files/" +
                                        val.document_name
                                        : ""),
                                    entity_documents.push(res);
                            }
                        }

                        //get kyc form data
                        let match_selfie_document =
                            await MerchantEkycModel.getSelfieDocs(req.user.id);

                        let submit_merchant_status = {
                            kyc_link: process.env.MERCHANT_KYC_URL,
                            match_link: match_selfie_document
                                ? server_addr +
                                ":" +
                                port +
                                "/static/files/" +
                                match_selfie_document.document_name
                                : "",
                            merchant_id: encrypt_decrypt(
                                "encrypt",
                                req.user.id
                            ),
                            merchant_name: merchant_details_result.company_name
                                ? merchant_details_result.company_name
                                : "",
                            legal_person_name:
                                merchant_details_result.legal_person_first_name
                                    ? merchant_details_result.legal_person_first_name +
                                    " " +
                                    merchant_details_result.legal_person_last_name
                                    : "",
                            doc_name: match_selfie_document.document_num
                                ? helpers.doc_names(
                                    match_selfie_document.sequence
                                )
                                : "",
                            doc_number: match_selfie_document.document_num
                                ? match_selfie_document.document_num
                                : "",
                            dob: merchant_details_result.dob
                                ? moment(merchant_details_result.dob).format(
                                    "DD-MM-YYYY"
                                )
                                : "",
                            address:
                                merchant_details_result.home_address_line_1 +
                                    merchant_details_result.home_address_line_2
                                    ? " " +
                                    merchant_details_result.home_address_line_2
                                    : "",
                        };
                        let psp_kyc = 0;

                        if (merchant_details_result.psp_id) {
                            let psp_ids =
                                merchant_details_result.psp_id.split(",");
                            for (let pi of psp_ids) {
                                let psp_details =
                                    await helpers.get_psp_details_by_id(
                                        "ekyc_required",
                                        pi
                                    );
                                if (psp_details.ekyc_required == 1) {
                                    psp_kyc++;
                                }
                            }
                        }
                        let ekyc_required = 0;
                        if (psp_kyc > 0) {
                            submit_merchant_status.ekyc_required = 1;
                            ekyc_required = 1;
                        } else {
                            submit_merchant_status.ekyc_required = 0;
                            ekyc_required = 0;
                        }

                        //end kyc form data

                        //key data

                        const keyData = [];
                        getKeys.forEach((elements, index) => {
                            keys_id = enc_dec.cjs_encrypt(elements.id);
                            submerchant_id = enc_dec.cjs_encrypt(
                                elements.merchant_id
                            );
                            type = elements.type;
                            merchant_key = elements.merchant_key;
                            merchant_secret = elements.merchant_secret;
                            created_at = moment(elements.created_at).format(
                                "DD-MM-YYYY H:mm:ss"
                            );

                            var temp = {};
                            temp = {
                                keys_id: keys_id,
                                submerchant_id: submerchant_id,
                                type: type,
                                merchant_key: merchant_key,
                                merchant_secret: merchant_secret,
                                created_date: created_at,
                            };
                            keyData[index] = temp;
                        });
                        //key data

                        let business_owner = [];
                        for (val of business_owners) {
                            let res = {
                                id: encrypt_decrypt("encrypt", val.id),
                                first_name: val.first_name,
                                last_name: val.last_name,
                                email: val.email,
                                type_of_business_owner:
                                    val.type_of_business_owner,
                                emirates_id: val.emirates_id
                                    ? process.env.STATIC_URL +
                                    "/static/files/" +
                                    val.emirates_id
                                    : "",
                                emirates_id_no: val.emirates_id_no
                                    ? val.emirates_id_no
                                    : "",
                                emirates_id_issue_date:
                                    val.emirates_id_issue_date
                                        ? val.emirates_id_issue_date
                                        : "",
                                emirates_id_expiry_date:
                                    val.emirates_id_expiry_date
                                        ? val.emirates_id_expiry_date
                                        : "",
                                passport: val.passport
                                    ? process.env.STATIC_URL +
                                    "/static/files/" +
                                    val.passport
                                    : "",
                                passport_no: val.passport_no
                                    ? val.passport_no
                                    : "",
                                passport_issue_date: val.passport_issue_date
                                    ? val.passport_issue_date
                                    : "",
                                passport_expiry_date: val.passport_expiry_date
                                    ? val.passport_expiry_date
                                    : "",
                                visa: val.visa
                                    ? process.env.STATIC_URL +
                                    "/static/files/" +
                                    val.visa
                                    : "",
                                visa_no: val.visa_no ? val.visa_no : "",
                                visa_issue_date: val.visa_issue_date
                                    ? val.visa_issue_date
                                    : "",
                                visa_expiry_date: val.visa_expiry_date
                                    ? val.visa_expiry_date
                                    : "",
                                trade_license: val.trade_license
                                    ? val.trade_license
                                    : "",
                                trade_license_no: val.trade_license_no
                                    ? val.trade_license_no
                                    : "",
                                trade_license_issue_date:
                                    val.trade_license_issue_date
                                        ? val.trade_license_issue_date
                                        : "",
                                trade_license_expiry_date:
                                    val.trade_license_expiry_date
                                        ? val.trade_license_expiry_date
                                        : "",
                                passport_of_ubo: val.passport_of_ubo
                                    ? process.env.STATIC_URL +
                                    "/static/files/" +
                                    val.passport_of_ubo
                                    : "",
                                passport_of_ubo_no: val.passport_of_ubo_no
                                    ? val.passport_of_ubo_no
                                    : "",
                                passport_of_ubo_issue_date:
                                    val.passport_of_ubo_issue_date
                                        ? val.passport_of_ubo_issue_date
                                        : "",
                                passport_of_ubo_expiry_date:
                                    val.passport_of_ubo_expiry_date
                                        ? val.passport_of_ubo_expiry_date
                                        : "",
                                moa: val.moa
                                    ? process.env.STATIC_URL +
                                    "/static/files/" +
                                    val.moa
                                    : "",
                            };
                            business_owner.push(res);
                        }

                        let table_executive =
                            config.table_prefix +
                            "merchant_business_executives";
                        let business_executive =
                            await MerchantEkycModel.selectDynamic(
                                selection,
                                condition,
                                table_executive
                            );

                        let business_executives = [];
                        for (val of business_executive) {
                            let res = {
                                id: encrypt_decrypt("encrypt", val.id),
                                first_name: val.first_name,
                                last_name: val.last_name,
                                email: val.email,
                            };
                            business_executives.push(res);
                        }
                        let payment_details = {};
                        if (merchant_details_result.payment_status == 1) {
                            payment_details =
                                await MerchantEkycModel.selectDynamicSingle(
                                    "order_id,payment_id,amount,currency,card_no,status",
                                    {
                                        payment_id:
                                            merchant_details_result.payment_id,
                                    },
                                    config.table_prefix + "orders"
                                );
                        }

                        let profile = {
                            submerchant_id: encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.id
                            ),
                            name: merchant_result.name,
                            email: merchant_result.email,
                            business_name:
                                merchant_details_result.business_name,
                            mobile_code: merchant_result.code,
                            mobile_no: merchant_result.mobile_no,
                            ekyc_done:
                                merchant_details_result.ekyc_done == 2
                                    ? "Yes"
                                    : "No",
                            video_kyc_done:
                                merchant_details_result.video_kyc_done == 1
                                    ? "Yes"
                                    : "No",
                            onboarding_done:
                                merchant_details_result.onboarding_done == 1
                                    ? "Yes"
                                    : "No",
                            ekyc_required:
                                merchant_details_result.ekyc_required,
                            main_step: merchant_details_result.main_step,
                            live: merchant_details_result.live,
                            register_business_country:
                                merchant_details_result.register_business_country
                                    ? encrypt_decrypt(
                                        "encrypt",
                                        merchant_details_result.register_business_country
                                    )
                                    : "",
                            //register_business_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_country),
                            register_business_country_name:
                                merchant_details_result.register_business_country_name,

                            type_of_business:
                                merchant_details_result.type_of_business
                                    ? encrypt_decrypt(
                                        "encrypt",
                                        merchant_details_result.type_of_business
                                    )
                                    : "",
                            //type_of_business_name: await helpers.get_type_of_business(merchant_details_result.type_of_business),
                            type_of_business_name:
                                merchant_details_result.type_of_business_name,

                            is_business_register_in_free_zone:
                                merchant_details_result.is_business_register_in_free_zone,
                            company_name: merchant_details_result.company_name,
                            company_registration_number:
                                merchant_details_result.company_registration_number,
                            vat_number: merchant_details_result.vat_number,
                            doing_business_as:
                                merchant_details_result.doing_business_as,

                            register_business_address_country:
                                merchant_details_result.register_business_country
                                    ? encrypt_decrypt(
                                        "encrypt",
                                        merchant_details_result.register_business_country
                                    )
                                    : "",
                            //register_business_address_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_address_country),
                            register_business_address_country_name:
                                merchant_details_result.register_business_address_country_name,

                            address_line1:
                                merchant_details_result.address_line1,
                            address_line2:
                                merchant_details_result.address_line2,

                            province_name:
                                merchant_details_result.province_name,
                            legal_person_home_province_name:
                                merchant_details_result.legal_person_home_province_name,

                            business_phone_code:
                                merchant_details_result.business_phone_code,
                            business_phone_number:
                                merchant_details_result.business_phone_number,

                            mcc_codes: merchant_details_result.mcc_codes
                                ? encrypt_decrypt(
                                    "encrypt",
                                    merchant_details_result.mcc_codes
                                )
                                : "",
                            //mcc_codes_name: merchant_details_result.mcc_codes?await helpers.get_mcc_code_description(merchant_details_result.mcc_codes):"",
                            mcc_codes_name:
                                merchant_details_result.mcc_codes != 0
                                    ? merchant_details_result.mcc_codes_name
                                    : merchant_details_result.mcc_codes_name
                                        ? merchant_details_result.mcc_codes_name
                                        : "Other",
                            other_mcc_code_title:
                                merchant_details_result.other_mcc_title
                                    ? merchant_details_result.other_mcc_title
                                    : "",
                            psp_id: merchant_details_result.psp_id
                                ? helpers.get_multiple_ids_encrypt(
                                    merchant_details_result.psp_id
                                )
                                : "",
                            psp_name: merchant_details_result.psp_id
                                ? await PspModel.getPspName(
                                    String(merchant_details_result.psp_id)
                                )
                                : "",
                            //psp_name: merchant_details_result.psp_name,

                            business_website:
                                merchant_details_result.business_website,
                            product_description:
                                merchant_details_result.product_description,
                            legal_person_first_name:
                                merchant_details_result.legal_person_first_name,
                            legal_person_last_name:
                                merchant_details_result.legal_person_last_name,
                            legal_person_email:
                                merchant_details_result.legal_person_email,
                            job_title: merchant_details_result.job_title,
                            nationality: merchant_details_result.nationality
                                ? encrypt_decrypt(
                                    "encrypt",
                                    merchant_details_result.nationality
                                )
                                : "",
                            nationality_name:
                                merchant_details_result.nationality
                                    ? await helpers.get_country_name_by_id(
                                        merchant_details_result.nationality
                                    )
                                    : "",
                            dob: merchant_details_result.dob,
                            home_address_country:
                                merchant_details_result.home_address_country
                                    ? encrypt_decrypt(
                                        "encrypt",
                                        merchant_details_result.home_address_country
                                    )
                                    : "",
                            home_address_country_name:
                                merchant_details_result.home_address_country
                                    ? await helpers.get_country_name_by_id(
                                        merchant_details_result.home_address_country
                                    )
                                    : "",
                            home_address_line_1:
                                merchant_details_result.home_address_line_1,
                            home_address_line_2:
                                merchant_details_result.home_address_line_2,
                            home_province_id:
                                merchant_details_result.home_province
                                    ? encrypt_decrypt(
                                        "encrypt",
                                        merchant_details_result.home_province
                                    )
                                    : "",
                            home_province: merchant_details_result.home_province
                                ? await helpers.get_state_name_by_id(
                                    merchant_details_result.home_province
                                )
                                : "",
                            home_phone_code:
                                merchant_details_result.home_phone_code,
                            home_phone_number:
                                merchant_details_result.home_phone_number,
                            personal_id_number:
                                merchant_details_result.personal_id_number,
                            statement_descriptor:
                                merchant_details_result.statement_descriptor,
                            shortened_descriptor:
                                merchant_details_result.shortened_descriptor,
                            customer_support_phone_code:
                                merchant_details_result.customer_support_phone_code,
                            customer_support_phone_number:
                                merchant_details_result.customer_support_phone_number,
                            bank_name: merchant_details_result.bank_name,
                            branch_name: merchant_details_result.branch_name,
                            bank_country: merchant_details_result.bank_country
                                ? enc_dec.cjs_encrypt(
                                    merchant_details_result.bank_country
                                )
                                : "",
                            bank_country_name:
                                await helpers.get_country_name_by_id(
                                    merchant_details_result.bank_country
                                ),
                            bank_currency:
                                merchant_details_result.bank_currency,
                            bank_document_type:
                                merchant_details_result.bank_document_type,
                            bank_document: merchant_details_result.bank_document
                                ? process.env.STATIC_URL +
                                "/static/files/" +
                                merchant_details_result.bank_document
                                : "",
                            iban: merchant_details_result.iban
                                ? merchant_details_result.iban
                                : "",
                            account_no: merchant_details_result.account_no
                                ? merchant_details_result.account_no
                                : "",
                            swift: merchant_details_result.swift
                                ? merchant_details_result.swift
                                : "",
                            last_updated: merchant_details_result.last_updated,

                            legal_person_home_address_country_name:
                                merchant_details_result.legal_person_home_address_country_name,

                            poc_name: merchant_details_result.poc_name + "",
                            poc_email: merchant_details_result.poc_email + "",
                            poc_mobile_code:
                                merchant_details_result.poc_mobile_code + "",
                            poc_mobile: merchant_details_result.poc_mobile + "",
                            tech_name: merchant_details_result.tech_name + "",
                            tech_email: merchant_details_result.tech_email + "",
                            tech_mobile_code:
                                merchant_details_result.tech_mobile_code + "",
                            tech_mobile: merchant_details_result.tech_mobile ? merchant_details_result.tech_mobile : "",
                            fin_name: merchant_details_result.fin_name + "",
                            fin_email: merchant_details_result.fin_email + "",
                            fin_mobile_code:
                                merchant_details_result.fin_mobile_code + "",
                            fin_mobile: merchant_details_result.fin_mobile + "",
                            link_tc: merchant_details_result.link_tc + "",
                            link_pp: merchant_details_result.link_pp + "",
                            link_refund:
                                merchant_details_result.link_refund + "",
                            link_cancellation:
                                merchant_details_result.link_cancellation + "",
                            link_dp:
                                merchant_details_result.link_delivery_policy +
                                "",
                            transaction_currencies:
                                merchant_details_result.transaction_currencies
                                    ? merchant_details_result.transaction_currencies
                                    : "",
                            settlement_currency:
                                merchant_details_result.settlement_currency
                                    ? merchant_details_result.settlement_currency
                                    : "",
                            estimated_revenue_amount:
                                merchant_details_result.estimated_revenue_amount
                                    ? merchant_details_result.estimated_revenue_amount
                                    : 0.0,
                            province: merchant_details_result.province
                                ? encrypt_decrypt(
                                    "encrypt",
                                    merchant_details_result.province
                                )
                                : "",
                            business_owners: business_owner,
                            business_executives: business_executives,
                            entity_documents: entity_documents,
                            kyc_document_data: submit_merchant_status,
                            keyData: keyData,
                            payment_status:
                                merchant_details_result.payment_status === 1
                                    ? "Done"
                                    : "Pending",
                            payment_details: payment_details,
                            mode: merchant_details_result.mode,
                            vat_no: vat_no ? vat_no : '',
                            trade_license_no: trade_license_no ? trade_license_no : ''
                        };
                        res.status(statusCode.ok).send(
                            response.successdatamsg(
                                profile,
                                "Profile fetch successfully"
                            )
                        );
                    })
                    .catch((error) => {
                        console.log(error);
                        res.status(statusCode.internalError).send(
                            response.errormsg(error)
                        );
                    });
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },


    get_profile: async (req, res) => {
        let super_merchant_id = req.user.id;
        let merchant_id = encrypt_decrypt("decrypt", req.bodyString("submerchant_id"));
        let condition = { "mm.id": merchant_id, "mm.super_merchant_id": super_merchant_id };
        MerchantEkycModel.selectFullProfile(condition)
            .then(async (merchant_details_result) => {

                let [vat_no, trade_license_no, main_sub_merchant_data, super_merchant] = await Promise.all([
                    helpers.getMerchantDocumentByName(merchant_details_result.id, merchant_details_result.type_of_business, 'VAT'),

                    helpers.getMerchantDocumentByName(merchant_details_result.id, merchant_details_result.type_of_business, 'Trade License'),

                    MerchantEkycModel.select_first("id", {
                        super_merchant_id: req.user.id,
                    }),

                    MerchantEkycModel.selectDynamicSingle(
                        "company_name",
                        { id: super_merchant_id },
                        config.table_prefix + "master_super_merchant"
                    )
                ])

                let condition = {
                    merchant_id: req.user.id,
                    status: 0,
                    deleted: 0,
                };
                let selection = "*";
                let table_name =
                    config.table_prefix + "merchant_business_owners";
                let business_owners =
                    await MerchantEkycModel.selectDynamic(
                        selection,
                        condition,
                        table_name
                    );
                let entity_document =
                    await MerchantEkycModel.selectDynamic(
                        "*",
                        { merchant_id: req.user.id, deleted: 0 },
                        config.table_prefix + "merchant_entity_document"
                    );
                let getKeys = await MerchantEkycModel.selectKeyData(
                    merchant_id
                );
                let entity_documents = [];
                for (val of entity_document) {
                    let ent_lists = await EntityModel.list_of_document({
                        id: val.document_id,
                    });
                    let ent_list = ent_lists[0];
                    if (typeof ent_list != "undefined") {
                        let seq = val.sequence;
                        let res = {
                            id: enc_dec.cjs_encrypt(ent_list.id),
                            document: "document_" + ent_list.document,
                            is_required: ent_list.required ? 1 : 0,
                            document_num_required:
                                ent_list.document_num_required == 1
                                    ? 1 : 0,
                            issue_date_required:
                                ent_list.issue_date_required == 1
                                    ? 1
                                    : 0,
                            expiry_date_required:
                                ent_list.expiry_date_required ? 1 : 0,
                            sequence: val.sequence,
                            entity_type: encrypt_decrypt(
                                "encrypt",
                                val.entity_id
                            ),
                        };

                        (res["data_id"] = encrypt_decrypt(
                            "encrypt",
                            val.id
                        )),
                            (res["document_id"] = encrypt_decrypt(
                                "encrypt",
                                val.document_id
                            )),
                            (res["document_number"] = val.document_num
                                ? val.document_num
                                : ""),
                            (res["document_issue_date"] = val.issue_date
                                ? moment(val.issue_date).format(
                                    "DD-MM-YYYY"
                                )
                                : ""),
                            (res["document_expiry_date"] =
                                val.expiry_date
                                    ? moment(val.expiry_date).format(
                                        "DD-MM-YYYY"
                                    )
                                    : ""),
                            (res["document_file"] = val.document_name
                                ? server_addr +
                                ":" +
                                port +
                                "/static/files/" +
                                val.document_name
                                : ""),
                            entity_documents.push(res);
                    }
                }

                //get kyc form data
                let match_selfie_document =
                    await MerchantEkycModel.getSelfieDocs(req.user.id);

                let submit_merchant_status = {
                    kyc_link: process.env.MERCHANT_KYC_URL,
                    match_link: match_selfie_document
                        ? server_addr +
                        ":" +
                        port +
                        "/static/files/" +
                        match_selfie_document.document_name
                        : "",
                    merchant_id: encrypt_decrypt(
                        "encrypt",
                        req.user.id
                    ),
                    merchant_name: merchant_details_result.company_name
                        ? merchant_details_result.company_name
                        : "",
                    legal_person_name:
                        merchant_details_result.legal_person_first_name
                            ? merchant_details_result.legal_person_first_name +
                            " " +
                            merchant_details_result.legal_person_last_name
                            : "",
                    doc_name: match_selfie_document.document_num
                        ? helpers.doc_names(
                            match_selfie_document.sequence
                        )
                        : "",
                    doc_number: match_selfie_document.document_num
                        ? match_selfie_document.document_num
                        : "",
                    dob: merchant_details_result.dob
                        ? moment(merchant_details_result.dob).format(
                            "DD-MM-YYYY"
                        )
                        : "",
                    address:
                        merchant_details_result.home_address_line_1 +
                            merchant_details_result.home_address_line_2
                            ? " " +
                            merchant_details_result.home_address_line_2
                            : "",
                };
                let psp_kyc = 0;

                if (merchant_details_result.psp_id) {
                    let psp_ids =
                        merchant_details_result.psp_id.split(",");
                    for (let pi of psp_ids) {
                        let psp_details =
                            await helpers.get_psp_details_by_id(
                                "ekyc_required",
                                pi
                            );
                        if (psp_details.ekyc_required == 1) {
                            psp_kyc++;
                        }
                    }
                }
                let ekyc_required = 0;
                if (psp_kyc > 0) {
                    submit_merchant_status.ekyc_required = 1;
                    ekyc_required = 1;
                } else {
                    submit_merchant_status.ekyc_required = 0;
                    ekyc_required = 0;
                }

                //end kyc form data

                //key data

                const keyData = [];
                getKeys.forEach((elements, index) => {
                    keys_id = enc_dec.cjs_encrypt(elements.id);
                    submerchant_id = enc_dec.cjs_encrypt(
                        elements.merchant_id
                    );
                    type = elements.type;
                    merchant_key = elements.merchant_key;
                    merchant_secret = elements.merchant_secret;
                    created_at = moment(elements.created_at).format(
                        "DD-MM-YYYY H:mm:ss"
                    );

                    var temp = {};
                    temp = {
                        keys_id: keys_id,
                        submerchant_id: submerchant_id,
                        type: type,
                        merchant_key: merchant_key,
                        merchant_secret: merchant_secret,
                        created_date: created_at,
                    };
                    keyData[index] = temp;
                });
                //key data

                let business_owner = [];
                for (val of business_owners) {
                    let res = {
                        id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        last_name: val.last_name,
                        email: val.email,
                        type_of_business_owner:
                            val.type_of_business_owner,
                        emirates_id: val.emirates_id
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.emirates_id
                            : "",
                        emirates_id_no: val.emirates_id_no
                            ? val.emirates_id_no
                            : "",
                        emirates_id_issue_date:
                            val.emirates_id_issue_date
                                ? val.emirates_id_issue_date
                                : "",
                        emirates_id_expiry_date:
                            val.emirates_id_expiry_date
                                ? val.emirates_id_expiry_date
                                : "",
                        passport: val.passport
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.passport
                            : "",
                        passport_no: val.passport_no
                            ? val.passport_no
                            : "",
                        passport_issue_date: val.passport_issue_date
                            ? val.passport_issue_date
                            : "",
                        passport_expiry_date: val.passport_expiry_date
                            ? val.passport_expiry_date
                            : "",
                        visa: val.visa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.visa
                            : "",
                        visa_no: val.visa_no ? val.visa_no : "",
                        visa_issue_date: val.visa_issue_date
                            ? val.visa_issue_date
                            : "",
                        visa_expiry_date: val.visa_expiry_date
                            ? val.visa_expiry_date
                            : "",
                        trade_license: val.trade_license
                            ? val.trade_license
                            : "",
                        trade_license_no: val.trade_license_no
                            ? val.trade_license_no
                            : "",
                        trade_license_issue_date:
                            val.trade_license_issue_date
                                ? val.trade_license_issue_date
                                : "",
                        trade_license_expiry_date:
                            val.trade_license_expiry_date
                                ? val.trade_license_expiry_date
                                : "",
                        passport_of_ubo: val.passport_of_ubo
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.passport_of_ubo
                            : "",
                        passport_of_ubo_no: val.passport_of_ubo_no
                            ? val.passport_of_ubo_no
                            : "",
                        passport_of_ubo_issue_date:
                            val.passport_of_ubo_issue_date
                                ? val.passport_of_ubo_issue_date
                                : "",
                        passport_of_ubo_expiry_date:
                            val.passport_of_ubo_expiry_date
                                ? val.passport_of_ubo_expiry_date
                                : "",
                        moa: val.moa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.moa
                            : "",
                    };
                    business_owner.push(res);
                }

                let table_executive =
                    config.table_prefix +
                    "merchant_business_executives";
                let business_executive =
                    await MerchantEkycModel.selectDynamic(
                        selection,
                        condition,
                        table_executive
                    );

                let business_executives = [];
                for (val of business_executive) {
                    let res = {
                        id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        last_name: val.last_name,
                        email: val.email,
                    };
                    business_executives.push(res);
                }
                let payment_details = {};
                if (merchant_details_result.payment_status == 1) {
                    payment_details =
                        await MerchantEkycModel.selectDynamicSingle(
                            "order_id,payment_id,amount,currency,card_no,status",
                            {
                                payment_id:
                                    merchant_details_result.payment_id,
                            },
                            config.table_prefix + "orders"
                        );
                }

                let profile = {
                    submerchant_id: encrypt_decrypt(
                        "encrypt",
                        merchant_details_result.id
                    ),
                    ekyc_done:
                        merchant_details_result.ekyc_done == 2
                            ? "Yes"
                            : "No",
                    video_kyc_done:
                        merchant_details_result.video_kyc_done == 1
                            ? "Yes"
                            : "No",
                    onboarding_done:
                        merchant_details_result.onboarding_done == 1
                            ? "Yes"
                            : "No",
                    business_name: super_merchant.company_name,
                    ekyc_required:
                        merchant_details_result.ekyc_required,
                    main_step: merchant_details_result.main_step,
                    live: merchant_details_result.live,
                    register_business_country:
                        merchant_details_result.register_business_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.register_business_country
                            )
                            : "",
                    //register_business_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_country),
                    register_business_country_name:
                        merchant_details_result.register_business_country_name,

                    type_of_business:
                        merchant_details_result.type_of_business
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.type_of_business
                            )
                            : "",
                    //type_of_business_name: await helpers.get_type_of_business(merchant_details_result.type_of_business),
                    type_of_business_name:
                        merchant_details_result.type_of_business_name,

                    is_business_register_in_free_zone:
                        merchant_details_result.is_business_register_in_free_zone,
                    company_name: merchant_details_result.company_name,
                    company_registration_number:
                        merchant_details_result.company_registration_number,
                    vat_number: merchant_details_result.vat_number,
                    doing_business_as:
                        merchant_details_result.doing_business_as,

                    register_business_address_country:
                        merchant_details_result.register_business_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.register_business_country
                            )
                            : "",
                    //register_business_address_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_address_country),
                    register_business_address_country_name:
                        merchant_details_result.register_business_address_country_name,

                    address_line1:
                        merchant_details_result.address_line1,
                    address_line2:
                        merchant_details_result.address_line2,

                    province_name:
                        merchant_details_result.province_name,
                    legal_person_home_province_name:
                        merchant_details_result.legal_person_home_province_name,

                    business_phone_code:
                        merchant_details_result.business_phone_code,
                    business_phone_number:
                        merchant_details_result.business_phone_number,

                    mcc_codes: merchant_details_result.mcc_codes
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.mcc_codes
                        )
                        : "",
                    //mcc_codes_name: merchant_details_result.mcc_codes?await helpers.get_mcc_code_description(merchant_details_result.mcc_codes):"",
                    mcc_codes_name:
                        merchant_details_result.mcc_codes != 0
                            ? merchant_details_result.mcc_codes_name
                            : merchant_details_result.mcc_codes_name
                                ? merchant_details_result.mcc_codes_name
                                : "Other",
                    other_mcc_code_title:
                        merchant_details_result.other_mcc_title
                            ? merchant_details_result.other_mcc_title
                            : "",
                    psp_id: merchant_details_result.psp_id
                        ? helpers.get_multiple_ids_encrypt(
                            merchant_details_result.psp_id
                        )
                        : "",
                    psp_name: merchant_details_result.psp_id
                        ? await PspModel.getPspName(
                            String(merchant_details_result.psp_id)
                        )
                        : "",
                    //psp_name: merchant_details_result.psp_name,

                    business_website:
                        merchant_details_result.business_website,
                    product_description:
                        merchant_details_result.product_description,
                    legal_person_first_name:
                        merchant_details_result.legal_person_first_name,
                    legal_person_last_name:
                        merchant_details_result.legal_person_last_name,
                    legal_person_email:
                        merchant_details_result.legal_person_email,
                    job_title: merchant_details_result.job_title,
                    nationality: merchant_details_result.nationality
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.nationality
                        )
                        : "",
                    nationality_name:
                        merchant_details_result.nationality
                            ? await helpers.get_country_name_by_id(
                                merchant_details_result.nationality
                            )
                            : "",
                    dob: merchant_details_result.dob,
                    home_address_country:
                        merchant_details_result.home_address_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.home_address_country
                            )
                            : "",
                    home_address_country_name:
                        merchant_details_result.home_address_country
                            ? await helpers.get_country_name_by_id(
                                merchant_details_result.home_address_country
                            )
                            : "",
                    home_address_line_1:
                        merchant_details_result.home_address_line_1,
                    home_address_line_2:
                        merchant_details_result.home_address_line_2,
                    home_province_id:
                        merchant_details_result.home_province
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.home_province
                            )
                            : "",
                    home_province: merchant_details_result.home_province
                        ? await helpers.get_state_name_by_id(
                            merchant_details_result.home_province
                        )
                        : "",
                    home_phone_code:
                        merchant_details_result.home_phone_code,
                    home_phone_number:
                        merchant_details_result.home_phone_number,
                    personal_id_number:
                        merchant_details_result.personal_id_number,
                    statement_descriptor:
                        merchant_details_result.statement_descriptor,
                    shortened_descriptor:
                        merchant_details_result.shortened_descriptor,
                    customer_support_phone_code:
                        merchant_details_result.customer_support_phone_code,
                    customer_support_phone_number:
                        merchant_details_result.customer_support_phone_number,
                    bank_name: merchant_details_result.bank_name,
                    branch_name: merchant_details_result.branch_name,
                    bank_country: merchant_details_result.bank_country
                        ? enc_dec.cjs_encrypt(
                            merchant_details_result.bank_country
                        )
                        : "",
                    bank_country_name:
                        await helpers.get_country_name_by_id(
                            merchant_details_result.bank_country
                        ),
                    bank_currency:
                        merchant_details_result.bank_currency,
                    bank_document_type:
                        merchant_details_result.bank_document_type,
                    bank_document: merchant_details_result.bank_document
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        merchant_details_result.bank_document
                        : "",
                    iban: merchant_details_result.iban
                        ? merchant_details_result.iban
                        : "",
                    account_no: merchant_details_result.account_no
                        ? merchant_details_result.account_no
                        : "",
                    swift: merchant_details_result.swift
                        ? merchant_details_result.swift
                        : "",
                    last_updated: merchant_details_result.last_updated,

                    legal_person_home_address_country_name:
                        merchant_details_result.legal_person_home_address_country_name,

                    poc_name: merchant_details_result.poc_name + "",
                    poc_email: merchant_details_result.poc_email + "",
                    poc_mobile_code:
                        merchant_details_result.poc_mobile_code + "",
                    poc_mobile: merchant_details_result.poc_mobile + "",
                    tech_name: merchant_details_result.tech_name + "",
                    tech_email: merchant_details_result.tech_email + "",
                    tech_mobile_code:
                        merchant_details_result.tech_mobile_code + "",
                    tech_mobile: merchant_details_result.tech_mobile ? merchant_details_result.tech_mobile : "",
                    fin_name: merchant_details_result.fin_name + "",
                    fin_email: merchant_details_result.fin_email + "",
                    fin_mobile_code:
                        merchant_details_result.fin_mobile_code + "",
                    fin_mobile: merchant_details_result.fin_mobile + "",
                    link_tc: merchant_details_result.link_tc + "",
                    link_pp: merchant_details_result.link_pp + "",
                    link_refund:
                        merchant_details_result.link_refund + "",
                    link_cancellation:
                        merchant_details_result.link_cancellation + "",
                    link_dp:
                        merchant_details_result.link_delivery_policy +
                        "",
                    transaction_currencies:
                        merchant_details_result.transaction_currencies
                            ? merchant_details_result.transaction_currencies
                            : "",
                    settlement_currency:
                        merchant_details_result.settlement_currency
                            ? merchant_details_result.settlement_currency
                            : "",
                    estimated_revenue_amount:
                        merchant_details_result.estimated_revenue_amount
                            ? merchant_details_result.estimated_revenue_amount
                            : 0.0,
                    province: merchant_details_result.province
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.province
                        )
                        : "",
                    business_owners: business_owner,
                    business_executives: business_executives,
                    entity_documents: entity_documents,
                    kyc_document_data: submit_merchant_status,
                    keyData: keyData,
                    payment_status:
                        merchant_details_result.payment_status === 1
                            ? "Done"
                            : "Pending",
                    payment_details: payment_details,
                    mode: merchant_details_result.mode,
                    vat_no: vat_no ? vat_no : '',
                    trade_license_no: trade_license_no ? trade_license_no : '',
                    ksa_uae_access: (parseInt(main_sub_merchant_data.id) === parseInt(merchant_id)) ? 1 : 0,
                };
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        profile,
                        "Profile fetch successfully"
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });

    },

    get_sub_merchant_profile: async (req, res) => {
        let submerchant_id = enc_dec.cjs_decrypt(
            req.bodyString("submerchant_id")
        );
        let super_merchant_id = await MerchantEkycModel.selectDynamicSingle(
            "super_merchant_id",
            { id: submerchant_id },
            config.table_prefix + "master_merchant"
        );

        let selection = "`id`,`name`, `email`, `code`, `mobile_no`";
        let condition_new = { id: super_merchant_id.super_merchant_id };
        let table_name = config.table_prefix + "master_super_merchant";

        let merchant_result = await MerchantEkycModel.selectDynamicSingle(
            selection,
            condition_new,
            table_name
        );
        let condition = { "mm.id": submerchant_id };
        MerchantEkycModel.selectFullProfile(condition)
            .then(async (merchant_details_result) => {
                let condition = {
                    merchant_id: submerchant_id,
                    status: 0,
                    deleted: 0,
                };
                let selection = "*";
                let table_name =
                    config.table_prefix + "merchant_business_owners";
                let business_owners = await MerchantEkycModel.selectDynamic(
                    selection,
                    { merchant_id: submerchant_id, deleted: 0 },
                    table_name
                );
                let entity_document = await MerchantEkycModel.selectDynamic(
                    "*",
                    { merchant_id: submerchant_id, deleted: 0 },
                    config.table_prefix + "merchant_entity_document"
                );
                let getKeys = await MerchantEkycModel.selectKeyData(
                    submerchant_id
                );
                let entity_documents = [];
                for (val of entity_document) {
                    let ent_lists = await EntityModel.list_of_document({
                        id: val.document_id,
                    });
                    let ent_list = ent_lists[0];
                    let seq = val.sequence;
                    let res_temp = {};
                    if (ent_list) {
                        let res_temp = {
                            id: enc_dec.cjs_encrypt(ent_list.id),
                            document: "document_" + ent_list.document,
                            is_required: ent_list.required ? 1 : 0,
                            document_num_required:
                                ent_list.document_num_required == 1 ? 1 : 0,
                            issue_date_required:
                                ent_list.issue_date_required == 1 ? 1 : 0,
                            expiry_date_required: ent_list.expiry_date_required
                                ? 1
                                : 0,
                            sequence: val.sequence,
                            entity_type: encrypt_decrypt(
                                "encrypt",
                                val.entity_id
                            ),
                        };
                    }
                    (res_temp["data_id"] = encrypt_decrypt("encrypt", val.id)),
                        (res_temp["document_id"] = encrypt_decrypt(
                            "encrypt",
                            val.document_id
                        )),
                        (res_temp["document_name"] = val.document_id ? await helpers.get_document_by_id(val.document_id) : ''),
                        (res_temp["document_number"] = val.document_num
                            ? val.document_num
                            : ""),
                        (res_temp["document_issue_date"] = val.issue_date
                            ? moment(val.issue_date).format("DD-MM-YYYY")
                            : ""),
                        (res_temp["document_expiry_date"] = val.expiry_date
                            ? moment(val.expiry_date).format("DD-MM-YYYY")
                            : ""),
                        (res_temp["document_file"] = val.document_name
                            ? server_addr +
                            ":" +
                            port +
                            "/static/files/" +
                            val.document_name
                            : ""),
                        entity_documents.push(res_temp);
                }

                //get kyc form data
                let match_selfie_document =
                    await MerchantEkycModel.getSelfieDocs(req.user.id);

                let submit_merchant_status = {
                    kyc_link: process.env.MERCHANT_KYC_URL,
                    match_link: match_selfie_document
                        ? server_addr +
                        ":" +
                        port +
                        "/static/files/" +
                        match_selfie_document.document_name
                        : "",
                    merchant_id: encrypt_decrypt("encrypt", req.user.id),
                    merchant_name: merchant_details_result.company_name
                        ? merchant_details_result.company_name
                        : "",
                    legal_person_name:
                        merchant_details_result.legal_person_first_name
                            ? merchant_details_result.legal_person_first_name +
                            " " +
                            merchant_details_result.legal_person_last_name
                            : "",
                    doc_name: match_selfie_document.document_num
                        ? helpers.doc_names(match_selfie_document.sequence)
                        : "",
                    doc_number: match_selfie_document.document_num
                        ? match_selfie_document.document_num
                        : "",
                    dob: merchant_details_result.dob
                        ? moment(merchant_details_result.dob).format(
                            "DD-MM-YYYY"
                        )
                        : "",
                    address:
                        merchant_details_result.home_address_line_1 +
                            merchant_details_result.home_address_line_2
                            ? " " + merchant_details_result.home_address_line_2
                            : "",
                };
                let psp_kyc = 0;

                // if (merchant_details_result.psp_id) {
                //     let psp_ids = merchant_details_result.psp_id.split(",")
                //     for (let pi of psp_ids) {
                //         let psp_details = await helpers.get_psp_details_by_id('ekyc_required', pi)
                //         if (psp_details.ekyc_required == 1) {
                //             psp_kyc++;
                //         }
                //     }
                // }
                let ekyc_required = 0;
                if (psp_kyc > 0) {
                    submit_merchant_status.ekyc_required = 1;
                    ekyc_required = 1;
                } else {
                    submit_merchant_status.ekyc_required = 0;
                    ekyc_required = 0;
                }

                //end kyc form data

                //key data

                const keyData = [];
                getKeys.forEach((elements, index) => {
                    keys_id = enc_dec.cjs_encrypt(elements.id);
                    submerchant_id = enc_dec.cjs_encrypt(elements.merchant_id);
                    type = elements.type;
                    merchant_key = elements.merchant_key;
                    merchant_secret = elements.merchant_secret;
                    created_at = moment(elements.created_at).format(
                        "DD-MM-YYYY H:mm:ss"
                    );

                    var temp = {};
                    temp = {
                        keys_id: keys_id,
                        submerchant_id: submerchant_id,
                        type: type,
                        merchant_key: merchant_key,
                        merchant_secret: merchant_secret,
                        created_date: created_at,
                    };
                    keyData[index] = temp;
                });
                //key data

                let business_owner = [];
                for (val of business_owners) {
                    let res = {
                        id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        last_name: val.last_name,
                        email: val.email,
                        type_of_business_owner: val.type_of_business_owner,
                        emirates_id: val.emirates_id
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.emirates_id
                            : "",
                        emirates_id_no: val.emirates_id_no
                            ? val.emirates_id_no
                            : "",
                        emirates_id_issue_date: val.emirates_id_issue_date
                            ? moment(val.emirates_id_issue_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        emirates_id_expiry_date: val.emirates_id_expiry_date
                            ? moment(val.emirates_id_expiry_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        passport: val.passport
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.passport
                            : "",
                        passport_no: val.passport_no ? val.passport_no : "",
                        passport_issue_date: val.passport_issue_date
                            ? moment(val.passport_issue_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        passport_expiry_date: val.passport_expiry_date
                            ? moment(val.passport_expiry_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        visa: val.visa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.visa
                            : "",
                        visa_no: val.visa_no ? val.visa_no : "",
                        visa_issue_date: val.visa_issue_date
                            ? moment(val.visa_issue_date).format("DD-MM-YYYY")
                            : "",
                        visa_expiry_date: val.visa_expiry_date
                            ? moment(val.visa_expiry_date).format("DD-MM-YYYY")
                            : "",
                        trade_license: val.trade_license
                            ? val.trade_license
                            : "",
                        trade_license_no: val.trade_license_no
                            ? val.trade_license_no
                            : "",
                        trade_license_issue_date: val.trade_license_issue_date
                            ? moment(val.trade_license_issue_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        trade_license_expiry_date: val.trade_license_expiry_date
                            ? moment(val.trade_license_expiry_date).format(
                                "DD-MM-YYYY"
                            )
                            : "",
                        passport_of_ubo: val.passport_of_ubo
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.passport_of_ubo
                            : "",
                        passport_of_ubo_no: val.passport_of_ubo_no
                            ? val.passport_of_ubo_no
                            : "",
                        passport_of_ubo_issue_date:
                            val.passport_of_ubo_issue_date
                                ? moment(val.passport_of_ubo_issue_date).format(
                                    "DD-MM-YYYY"
                                )
                                : "",
                        passport_of_ubo_expiry_date:
                            val.passport_of_ubo_expiry_date
                                ? moment(
                                    val.passport_of_ubo_expiry_date
                                ).format("DD-MM-YYYY")
                                : "",
                        moa: val.moa
                            ? process.env.STATIC_URL +
                            "/static/files/" +
                            val.moa
                            : "",
                    };
                    business_owner.push(res);
                }

                let table_executive =
                    config.table_prefix + "merchant_business_executives";
                let business_executive = await MerchantEkycModel.selectDynamic(
                    selection,
                    condition,
                    table_executive
                );

                let business_executives = [];
                for (val of business_executive) {
                    let res = {
                        id: encrypt_decrypt("encrypt", val.id),
                        first_name: val.first_name,
                        last_name: val.last_name,
                        email: val.email,
                    };
                    business_executives.push(res);
                }

                let payment_details = {};
                if (merchant_details_result.payment_status == 1) {
                    payment_details =
                        await MerchantEkycModel.selectDynamicSingle(
                            "order_id,payment_id,amount,currency,card_no,status",
                            { payment_id: merchant_details_result.payment_id },
                            config.table_prefix + "orders"
                        );
                }
                let merchant_id = enc_dec.cjs_decrypt(
                    req.bodyString("submerchant_id")
                );


                const efr_data = await efr_exportdata.selectOne('*', { merchant_id: merchant_id });    
                const efrdata_keys = {
                    id : enc_dec.cjs_encrypt(efr_data?.id) || " " ,
                    merchant_id :  enc_dec.cjs_encrypt(efr_data?.merchant_id) || "",
                    registrationNumber : efr_data?.registrationNumber || "" ,
                    reportData : efr_data?.reportData || "" ,
                } 

                const checkcomplience_manager = await adminModel.checkcomplianceuser(req.user.id)
                let get_compliancedata = "";
                if (checkcomplience_manager.length > 0) {
                    get_compliancedata = await MerchantApproval.selectAllOne('*', {
                        merchant_id: merchant_id,
                        compliance_manager: req.user.id
                    });
                    if (get_compliancedata.length > 0) {
                        get_compliancedata = get_compliancedata[get_compliancedata.length - 1];
                    }
                }


                const pyMerchantDetails = await MerchantEkycModel.selectMerchantDetails('*', { merchant_id: enc_dec.cjs_decrypt( req.bodyString("submerchant_id"))});
                const compliance_manager = await MerchantApproval.selectAllOne('*', {
                    merchant_id: merchant_id
                })
                let compliance_one = 0;
                let compliance_two = 0;

                const compliance_map = compliance_manager && compliance_manager.map((data, index) => {
                    if (data.level === 1 && data.level === 1) {
                        compliance_one = 1;
                    }
                    if (data.level === 2 && data.status === 1) {
                        compliance_two = 1;
                    }
                })

                let profile = {
                    submerchant_id: encrypt_decrypt(
                        "encrypt",
                        merchant_details_result.id
                    ),
                    store_id: merchant_details_result.store_id,
                    name: merchant_result.name,
                    email: merchant_result.email,
                    mobile_code: merchant_result.code,
                    mobile_no: merchant_result.mobile_no,
                    ekyc_done:
                        merchant_details_result.ekyc_done == 2 ? "Yes" : "No",
                    video_kyc_done:
                        merchant_details_result.video_kyc_done == 1
                            ? "Yes"
                            : "No",
                    onboarding_done:
                        merchant_details_result.onboarding_done == 1
                            ? "Yes"
                            : "No",
                    ekyc_required: merchant_details_result.ekyc_required,
                    main_step: merchant_details_result.main_step,
                    live: merchant_details_result.live,
                    register_business_country:
                        merchant_details_result.register_business_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.register_business_country
                            )
                            : "",
                    //register_business_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_country),
                    register_business_country_name:
                        merchant_details_result.register_business_country_name,

                    type_of_business: merchant_details_result.type_of_business
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.type_of_business
                        )
                        : "",
                    //type_of_business_name: await helpers.get_type_of_business(merchant_details_result.type_of_business),
                    type_of_business_name:
                        merchant_details_result.type_of_business_name,

                    is_business_register_in_free_zone:
                        merchant_details_result.is_business_register_in_free_zone,
                    company_name: merchant_details_result.company_name,
                    company_registration_number:
                        merchant_details_result.company_registration_number,
                    vat_number: merchant_details_result.vat_number,
                    doing_business_as:
                        merchant_details_result.doing_business_as,

                    register_business_address_country:
                        merchant_details_result.register_business_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.register_business_country
                            )
                            : "",
                    //register_business_address_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_address_country),
                    register_business_address_country_name:
                        merchant_details_result.register_business_address_country_name,

                    address_line1: merchant_details_result.address_line1,
                    address_line2: merchant_details_result.address_line2,

                    province_name: merchant_details_result.province_name,
                    legal_person_home_province_name:
                        merchant_details_result.legal_person_home_province_name,

                    business_phone_code:
                        merchant_details_result.business_phone_code,
                    business_phone_number:
                        merchant_details_result.business_phone_number,

                    mcc_codes: merchant_details_result.mcc_codes
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.mcc_codes
                        )
                        : "",
                    //mcc_codes_name: merchant_details_result.mcc_codes?await helpers.get_mcc_code_description(merchant_details_result.mcc_codes):"",
                    mcc_codes_name:
                        merchant_details_result.mcc_codes != 0
                            ? merchant_details_result.mcc_codes_name
                            : merchant_details_result.mcc_codes_name
                                ? merchant_details_result.mcc_codes_name
                                : "Other",
                    other_mcc_code_title:
                        merchant_details_result.other_mcc_title
                            ? merchant_details_result.other_mcc_title
                            : "",
                    psp_id: merchant_details_result.psp_id
                        ? helpers.get_multiple_ids_encrypt(
                            merchant_details_result.psp_id
                        )
                        : "",
                    psp_name: merchant_details_result.psp_id
                        ? await PspModel.getPspName(
                            String(merchant_details_result.psp_id)
                        )
                        : "",
                    //psp_name: merchant_details_result.psp_name,

                    business_website: merchant_details_result.business_website,
                    product_description:
                        merchant_details_result.product_description,
                    legal_person_first_name:
                        merchant_details_result.legal_person_first_name,
                    legal_person_last_name:
                        merchant_details_result.legal_person_last_name,
                    legal_person_email:
                        merchant_details_result.legal_person_email,
                    job_title: merchant_details_result.job_title,
                    nationality: merchant_details_result.nationality
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.nationality
                        )
                        : "",
                    nationality_name: merchant_details_result.nationality
                        ? await helpers.get_country_name_by_id(
                            merchant_details_result.nationality
                        )
                        : "",
                    dob: merchant_details_result.dob,
                    home_address_country:
                        merchant_details_result.home_address_country
                            ? encrypt_decrypt(
                                "encrypt",
                                merchant_details_result.home_address_country
                            )
                            : "",
                    home_address_country_name:
                        merchant_details_result.home_address_country
                            ? await helpers.get_country_name_by_id(
                                merchant_details_result.home_address_country
                            )
                            : "",
                    home_address_line_1:
                        merchant_details_result.home_address_line_1,
                    home_address_line_2:
                        merchant_details_result.home_address_line_2,
                    home_province_id: merchant_details_result.home_province
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.home_province
                        )
                        : "",
                    home_province: merchant_details_result.home_province
                        ? await helpers.get_state_name_by_id(
                            merchant_details_result.home_province
                        )
                        : "",
                    home_phone_code: merchant_details_result.home_phone_code,
                    home_phone_number:
                        merchant_details_result.home_phone_number,
                    personal_id_number:
                        merchant_details_result.personal_id_number,
                    statement_descriptor:
                        merchant_details_result.statement_descriptor,
                    shortened_descriptor:
                        merchant_details_result.shortened_descriptor,
                    customer_support_phone_code:
                        merchant_details_result.customer_support_phone_code,
                    customer_support_phone_number:
                        merchant_details_result.customer_support_phone_number,
                    bank_name: merchant_details_result.bank_name,
                    branch_name: merchant_details_result.branch_name,
                    bank_country: merchant_details_result.bank_country
                        ? enc_dec.cjs_encrypt(
                            merchant_details_result.bank_country
                        )
                        : "",
                    bank_country_name: await helpers.get_country_name_by_id(
                        merchant_details_result.bank_country
                    ),
                    bank_currency: merchant_details_result.bank_currency,
                    bank_document_type:
                        merchant_details_result.bank_document_type,
                    bank_document: merchant_details_result.bank_document
                        ? process.env.STATIC_URL +
                        "/static/files/" +
                        merchant_details_result.bank_document
                        : "",
                    iban: merchant_details_result.iban
                        ? merchant_details_result.iban
                        : "",
                    account_no: merchant_details_result.account_no
                        ? merchant_details_result.account_no
                        : "",
                    swift: merchant_details_result.swift
                        ? merchant_details_result.swift
                        : "",
                    last_updated: merchant_details_result.last_updated,

                    legal_person_home_address_country_name:
                        merchant_details_result.legal_person_home_address_country_name,

                    poc_name: merchant_details_result.poc_name
                        ? merchant_details_result.poc_name + ""
                        : "",
                    poc_email: merchant_details_result.poc_email
                        ? merchant_details_result.poc_email + ""
                        : "",
                    poc_mobile_code: merchant_details_result.poc_mobile_code
                        ? merchant_details_result.poc_mobile_code + ""
                        : "",
                    poc_mobile: merchant_details_result.poc_mobile
                        ? merchant_details_result.poc_mobile + ""
                        : "",
                    cro_name: merchant_details_result.cro_name
                        ? merchant_details_result.cro_name + ""
                        : "",
                    cro_email: merchant_details_result.cro_email
                        ? merchant_details_result.cro_email + ""
                        : "",
                    cro_mobile_code: merchant_details_result.cro_mobile_code
                        ? merchant_details_result.cro_mobile_code + ""
                        : "",
                    cro_mobile: merchant_details_result.cro_mobile
                        ? merchant_details_result.cro_mobile + ""
                        : "",
                    co_name: merchant_details_result.co_name
                        ? merchant_details_result.co_name + ""
                        : "",
                    co_email: merchant_details_result.co_email
                        ? merchant_details_result.co_email + ""
                        : "",
                    co_mobile_code: merchant_details_result.co_mobile_code
                        ? merchant_details_result.co_mobile_code + ""
                        : "",
                    co_mobile: merchant_details_result.co_mobile
                        ? merchant_details_result.co_mobile + ""
                        : "",
                    tech_name: merchant_details_result.tech_name + "",
                    tech_email: merchant_details_result.tech_email + "",
                    tech_mobile_code:
                        merchant_details_result.tech_mobile_code + "",
                    tech_mobile: merchant_details_result.tech_mobile ? merchant_details_result.tech_mobile : "",
                    fin_name: merchant_details_result.fin_name + "",
                    fin_email: merchant_details_result.fin_email + "",
                    fin_mobile_code:
                        merchant_details_result.fin_mobile_code + "",
                    fin_mobile: merchant_details_result.fin_mobile + "",
                    link_tc: merchant_details_result.link_tc
                        ? merchant_details_result.link_tc + ""
                        : "",
                    link_pp: merchant_details_result.link_pp
                        ? merchant_details_result.link_pp + ""
                        : "",
                    link_refund: merchant_details_result.link_refund
                        ? merchant_details_result.link_refund + ""
                        : "",
                    link_cancellation: merchant_details_result.link_cancellation
                        ? merchant_details_result.link_cancellation + ""
                        : "",
                    link_dp: merchant_details_result.link_delivery_policy
                        ? merchant_details_result.link_delivery_policy + ""
                        : "",

                    province: merchant_details_result.province
                        ? encrypt_decrypt(
                            "encrypt",
                            merchant_details_result.province
                        )
                        : "",
                    business_owners: business_owner,
                    business_executives: business_executives,
                    entity_documents: entity_documents,
                    kyc_document_data: submit_merchant_status,
                    keyData: keyData,
                    estimated_revenue_amount:
                        merchant_details_result.estimated_revenue_amount
                            ? merchant_details_result.estimated_revenue_amount
                            : "",
                    settlement_currency:
                        merchant_details_result.settlement_currency
                            ? merchant_details_result.settlement_currency
                            : "",
                    transaction_currencies:
                        merchant_details_result.transaction_currencies
                            ? merchant_details_result.transaction_currencies
                            : "",
                    payment_status:
                        merchant_details_result.payment_status == 0
                            ? "Pending"
                            : "Done",
                    payment_details: payment_details,
                    compliance_manager: {
                        compliance_manager_01_accepted: compliance_one,
                        compliance_manager_02_accepted: compliance_two,
                        accept: get_compliancedata?.is_accepted || 0,
                        approve: get_compliancedata?.status || 0,
                        industry_isic: pyMerchantDetails?.industry_isic ? enc_dec.cjs_encrypt(pyMerchantDetails?.industry_isic) : '',
                        ram_risk_ratings: pyMerchantDetails?.ram_risk_ratings,
                        triggered_risk: pyMerchantDetails?.triggered_risk,
                        overall_risk: pyMerchantDetails?.overall_risk,
                        remark : get_compliancedata?.remark
                    },
                    efrData: efrdata_keys,
                };
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        profile,
                        "Merchant details fetch successfully."
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
        /*  let selection = "`id`,`name`, `email`, `code`, `mobile_no`,`main_step`,`ekyc_done`,`onboarding_done`,`live`,`video_kyc_done`,`ekyc_required`";
          let submerchant_id =  encrypt_decrypt('decrypt', req.bodyString('submerchant_id'))
          let condition = { id: submerchant_id };
          let table_name = config.table_prefix + "master_merchant";
  
          MerchantEkycModel.selectDynamicSingle(selection, condition, table_name).then((merchant_result) => {
              let condition = { 'mm.id': submerchant_id };
              MerchantEkycModel.selectFullProfile(condition).then(async (merchant_details_result) => {
                  let condition = { merchant_id: submerchant_id, status: 0, deleted: 0 };
                  let selection_owner = '`id`,`merchant_id`,ekyc_status,`first_name`, `last_name`, `email`';
                  let selection = '`id`,`merchant_id`,`first_name`, `last_name`, `email`';
                  let table_name = config.table_prefix + "merchant_business_owners";
                  let business_owners = await MerchantEkycModel.selectDynamic(selection_owner, condition, table_name);
                  let entity_document = await MerchantEkycModel.selectDynamic("*", { merchant_id: submerchant_id, deleted: 0 }, config.table_prefix + 'merchant_entity_document');
  
                  let entity_documents = [];
                  for (val of entity_document) {
  
                      let ent_lists = await EntityModel.list_of_document({ id: val.document_id });
                      let ent_list = ent_lists[0]
                      let seq = val.sequence
                      let res = {
                          "id": enc_dec.cjs_encrypt(ent_list.id),
                          "document": "document_" + ent_list.document,
                          "is_required": ent_list.required ? 1 : 0,
                          "document_num_required": ent_list.document_num_required == 1 ? 1 : 0,
                          "issue_date_required": ent_list.issue_date_required == 1 ? 1 : 0,
                          "expiry_date_required": ent_list.expiry_date_required ? 1 : 0,
                          sequence: val.sequence,
                          entity_type: encrypt_decrypt('encrypt', val.entity_id),
                      }
  
                      res['data_id'] = encrypt_decrypt('encrypt', val.id),
                          res['document_id'] = encrypt_decrypt('encrypt', val.document_id),
                          res['document_number'] = val.document_num ? val.document_num : "",
                          res['document_issue_date'] = val.issue_date ? moment(val.issue_date).format('DD-MM-YYYY') : "",
                          res['document_expiry_date'] = val.expiry_date ? moment(val.expiry_date).format('DD-MM-YYYY') : "",
                          res['document_file'] = val.document_name ? server_addr + ':' + port + "/static/files/" + val.document_name : "",
                          entity_documents.push(res);
                  }
  
                  //get kyc form data
                  let match_selfie_document = await MerchantEkycModel.getSelfieDocs(submerchant_id)
  
                  let submit_merchant_status = {
                      'kyc_link': process.env.MERCHANT_KYC_URL,
                      'match_link': match_selfie_document ? server_addr + ':' + port + "/static/files/" + match_selfie_document.document_name : "",
                      'merchant_id': encrypt_decrypt('encrypt', submerchant_id),
                      'merchant_name': merchant_details_result.company_name ? merchant_details_result.company_name : "",
                      'legal_person_name': merchant_details_result.legal_person_first_name ? merchant_details_result.legal_person_first_name+" "+merchant_details_result.legal_person_last_name : "",
                      'doc_name': match_selfie_document.document_num ? helpers.doc_names(match_selfie_document.sequence) : "",
                      'doc_number': match_selfie_document.document_num ? match_selfie_document.document_num : "",
                      "dob": merchant_details_result.dob ? moment(merchant_details_result.dob).format('DD-MM-YYYY') : '',
                      "address": merchant_details_result.home_address_line_1 + merchant_details_result.home_address_line_2? " " + merchant_details_result.home_address_line_2:"",
                  }
                  let psp_kyc = 0
                  
                  if (merchant_details_result.psp_id) {
                      let psp_ids = merchant_details_result.psp_id.split(",")
                      for (let pi of psp_ids){
                          let psp_details = await helpers.get_psp_details_by_id('ekyc_required', pi)
                          if (psp_details.ekyc_required == 1){
                              psp_kyc++;
                          }
                      }
                  }
                  let ekyc_required = 0
                  if (psp_kyc > 0) {
                      submit_merchant_status.ekyc_required = 1
                      ekyc_required = 1
                  }else{
                      submit_merchant_status.ekyc_required = 0
                      ekyc_required = 0
                  }
  
  
                  //end kyc form data
  
                  let business_owner = [];
                  for (val of business_owners) {
                      let res = {
                          id: encrypt_decrypt('encrypt', val.id),
                          first_name: val.first_name,
                          last_name: val.last_name,
                          email: val.email,
                          ekyc_status:val.ekyc_status
                      }
                      business_owner.push(res);
                  }
  
  
                  let table_executive = config.table_prefix + "merchant_business_executives";
                  let business_executive = await MerchantEkycModel.selectDynamic(selection, condition, table_executive)
  
                  let business_executives = [];
                  for (val of business_executive) {
                      let res = {
                          id: encrypt_decrypt('encrypt', val.id),
                          first_name: val.first_name,
                          last_name: val.last_name,
                          email: val.email,
                      }
                      business_executives.push(res);
                  }
  
  
                  let profile = {
                      super_merchant_name:merchant_details_result.name,
                      super_merchant_mobile: merchant_details_result.mobile_no,
                      super_merchant_code: merchant_details_result.code,
                      super_merchant_email: merchant_details_result.email,
                      submerchant_id: encrypt_decrypt("encrypt",merchant_details_result.id),
                      referral_code: merchant_details_result.referral_code ,
                      email: merchant_result.legal_person_email,
                      mobile_code: merchant_result.code,
                      mobile_no: merchant_result.mobile_no,
                      ekyc_done: merchant_result.ekyc_done == 2 ? 'Yes' : "No",
                      video_kyc_done: merchant_result.video_kyc_done == 1 ? 'Yes' : "No",
                      onboarding_done: merchant_result.onboarding_done == 1 ? 'Yes' : "No",
                      onboarding_done: merchant_result.onboarding_done,
                      ekyc_required:merchant_result.ekyc_required,
                      main_step: merchant_result.main_step,
                      live: merchant_result.live,
                      register_business_country: merchant_details_result.register_business_country ? encrypt_decrypt("encrypt", merchant_details_result.register_business_country) : "",
                      //register_business_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_country),
                      register_business_country_name: merchant_details_result.register_business_country_name,
  
                      type_of_business: merchant_details_result.type_of_business ? encrypt_decrypt("encrypt", merchant_details_result.type_of_business) : "",
                      type_of_business_name: await helpers.get_entity_type(merchant_details_result.type_of_business),
                      // type_of_business_name: merchant_details_result.type_of_business_name,
  
                      is_business_register_in_free_zone: merchant_details_result.is_business_register_in_free_zone ,
                      company_name: merchant_details_result.company_name,
                      company_registration_number: merchant_details_result.company_registration_number,
                      vat_number: merchant_details_result.vat_number,
                      doing_business_as: merchant_details_result.doing_business_as,
  
                      register_business_address_country: merchant_details_result.register_business_country ? encrypt_decrypt("encrypt", merchant_details_result.register_business_country) : "",
                      //register_business_address_country_name: await helpers.get_country_name_by_id(merchant_details_result.register_business_address_country),
                      register_business_address_country_name: merchant_details_result.register_business_address_country_name ,
  
                      address_line1: merchant_details_result.address_line1,
                      address_line2: merchant_details_result.address_line2,
  
                      province_name:merchant_details_result.province_name,
                      legal_person_home_province_name:merchant_details_result.legal_person_home_province_name,
  
                      business_phone_code: merchant_details_result.business_phone_code,
                      business_phone_number: merchant_details_result.business_phone_number,
  
                      mcc_codes: merchant_details_result.mcc_codes ? encrypt_decrypt("encrypt", merchant_details_result.mcc_codes) : "",
                      //mcc_codes_name: merchant_details_result.mcc_codes?await helpers.get_mcc_code_description(merchant_details_result.mcc_codes):"",
                      mcc_codes_name: merchant_details_result.mcc_codes_name,
  
                      psp_id: merchant_details_result.psp_id ? helpers.get_multiple_ids_encrypt(merchant_details_result.psp_id) : "",
                      psp_name: merchant_details_result.psp_id ? await PspModel.getPspName(String(merchant_details_result.psp_id)) : "",
                      //psp_name: merchant_details_result.psp_name,
  
                      business_website: merchant_details_result.business_website,
                      product_description:merchant_details_result.product_description ,
                      legal_person_first_name: merchant_details_result.legal_person_first_name,
                      legal_person_last_name: merchant_details_result.legal_person_last_name,
                      legal_person_email:merchant_details_result.legal_person_email,
                      job_title: merchant_details_result.job_title,
                      nationality: merchant_details_result.nationality ? encrypt_decrypt("encrypt", merchant_details_result.nationality) : "",
                      nationality_name: merchant_details_result.nationality ? await helpers.get_country_name_by_id(merchant_details_result.nationality) : "",
                      dob:moment(merchant_details_result.dob).format('DD-MM-YYYY'),
                      home_address_country: merchant_details_result.home_address_country ? encrypt_decrypt("encrypt", merchant_details_result.home_address_country) : "",
                      home_address_country_name: merchant_details_result.home_address_country ? await helpers.get_country_name_by_id(merchant_details_result.home_address_country) : "",
                      home_address_line_1: merchant_details_result.home_address_line_1 ,
                      home_address_line_2:merchant_details_result.home_address_line_2 ,
                       home_province_id: merchant_details_result.home_province ? encrypt_decrypt("encrypt", merchant_details_result.home_province) : "",
                       home_province: merchant_details_result.home_province ? await helpers.get_state_name_by_id(merchant_details_result.home_province) : "",
                       home_phone_code: merchant_details_result.home_phone_code,
                       home_phone_number: merchant_details_result.home_phone_number,
                       personal_id_number: merchant_details_result.personal_id_number,
                       statement_descriptor: merchant_details_result.statement_descriptor,
                      shortened_descriptor: merchant_details_result.shortened_descriptor,
                      customer_support_phone_code: merchant_details_result.customer_support_phone_code,
                      customer_support_phone_number: merchant_details_result.customer_support_phone_number,
                      bank_name: merchant_details_result.bank_name,
                      branch_name: merchant_details_result.branch_name,
                      iban:merchant_details_result.iban,
                      last_updated: moment(merchant_details_result.last_updated).format('DD-MM-YYYY H:mm:ss'),
  
                      legal_person_home_address_country_name: merchant_details_result.legal_person_home_address_country_name,
  
                      poc_name:merchant_details_result.poc_name,
                      poc_email:merchant_details_result.poc_email,
                      poc_mobile_code:merchant_details_result.poc_mobile_code,
                      poc_mobile:merchant_details_result.poc_mobile,
                      cro_name:merchant_details_result.cro_name,
                      cro_email:merchant_details_result.cro_email ,
                      cro_mobile_code:merchant_details_result.cro_mobile_code,
                      cro_mobile:merchant_details_result.cro_mobile,
                      co_name:merchant_details_result.co_name ,
                      co_email:merchant_details_result.co_email ,
                      co_mobile_code:merchant_details_result.co_mobile_code,
                      co_mobile:merchant_details_result.co_mobile,
                      link_tc:merchant_details_result.link_tc ,
                      link_pp:merchant_details_result.link_pp,
                      link_refund:merchant_details_result.link_refund ,
                      link_cancellation:merchant_details_result.link_cancellation ,
                      link_dp:merchant_details_result.link_delivery_policy,
  
                      province: merchant_details_result.province ? encrypt_decrypt("encrypt", merchant_details_result.province) : "",
                      business_owners: business_owner,
                      business_executives: business_executives,
                      entity_documents: entity_documents,
                      kyc_document_data: submit_merchant_status
                  }
  
                  res.status(statusCode.ok).send(response.successdatamsg(profile, 'Profile fetch successfully'));
              }).catch((error) => {
                  console.log(error);
                  res.status(statusCode.internalError).send(response.errormsg(error));
              })
  
          }).catch((error) => {
              console.log(error);
              res.status(statusCode.internalError).send(response.errormsg(error));
          }) */
    },
    update_ekyc_status: async (req, res) => {
        let activation_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        let merchant_id = encrypt_decrypt(
            "decrypt",
            req.bodyString("merchant_id")
        );
        let condition = { id: merchant_id };
        let data = { ekyc_done: req.bodyString("ekyc_status") };
        if (req.bodyString("ekyc_status") == 2 || req.bodyString("ekyc_status") == '2') {
            if (req.user.payment_status == 1) {
                data.status = 3;
            } else {
                data.status = 2;
                data.activation_date = activation_date;
            }
            await mailSender.sendEkycDoneMail({ email: req.user.email, url: process.env.FRONTEND_URL + 'dashboard/store' }, 'eKYC approved, Activate payout')

        }
        let table_name = config.table_prefix + "master_merchant";
        MerchantEkycModel.updateDynamic(condition, data, table_name)
            .then(async (result) => {
                /*  if (
                      req.bodyString("ekyc_status") == 2 ||
                      req.bodyString("ekyc_status") == "2"
                  ) {
                      await MerchantEkyc.send_psp_mail_auto(merchant_id);
                  } */
                res.status(statusCode.ok).send(
                    response.successmsg("Ekyc status updated successfully.")
                );

            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error)
                );
            });
    },
    update_profile: async (req, res) => {
        try {
            let supermerchant_id = req.user.id;

            insdata = {
                name: req.bodyString("name"),
                code: req.bodyString("code"),
                mobile_no: req.bodyString("mobile"),
                email: req.bodyString("email"),
            };
            if (req.all_files) {
                if (req.all_files.icon) {
                    insdata.avatar = req.all_files.avatar;
                }
            }
            $ins_id = await MerchantEkycModel.updateDetails(
                { id: supermerchant_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg(
                    "Supermerchant profile updated successfully"
                )
            );
        } catch (error) {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
    super_merchant_list: async (req, res) => {
        let condition = {};
        if (req.user.type == "admin") {
            condition = {
                deleted: 0,
            };
        }
        if (req.user.type == "merchant") {
            condition = {
                deleted: 0,
                id: req.user.id,
            };
        }
        MerchantEkycModel.selectAll("*", condition)
            .then(async (result) => {
                let send_res = [];
                for (let val of result) {
                    let res = {
                        super_merchant_id: enc_dec.cjs_encrypt(val.id),
                        super_merchant_name: val.name,
                        super_merchant_mobile: val.mobile_no,
                        super_merchant_email: val.email,
                        status: val.status == 1 ? "Deactivated" : "Active",
                    };
                    send_res.push(res);
                }
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
    owners_data: async (req, res) => {
        let owner_id = await enc_dec.cjs_decrypt(req.bodyString("token"));
        MerchantEkycModel.selectDynamicOwnerData(
            "id,email,first_name,last_name,document,ekyc_status,merchant_id",
            { id: owner_id, deleted: 0 },
            "pg_merchant_business_owners"
        )
            .then(async (result) => {
                let send_res = [];
                let val = result;
                let res1 = {
                    id: enc_dec.cjs_encrypt(val.id),
                    name: val.first_name + " " + val.last_name,
                    email: val.email,
                    ekyc_status: val.ekyc_status,
                    merchant_id: enc_dec.cjs_encrypt(val.merchant_id),
                    merchant_name: await helpers.get_merchant_details_name_by_id(
                        val.merchant_id
                    ),
                    image_name: val.document,
                    match_link:
                        val.document != ""
                            ? server_addr +
                            ":" +
                            port +
                            "/static/files/" +
                            val.document
                            : "",
                };
                send_res = res1;
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "Details fetched successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
    update_owners_status: async (req, res) => {
        let owner_id = await enc_dec.cjs_decrypt(req.bodyString("owner_id"));
        let status = req.bodyString("status");
        console.log(status);
        await MerchantEkycModel.updateDynamic(
            { id: owner_id },
            { ekyc_status: status },
            config.table_prefix + "merchant_business_owners"
        );
        res.status(statusCode.ok).send(
            response.successmsg("Updated successfully")
        );
    },
    business_owner_documents: async (req, res) => {
        let send_res = {
            individual: {
                emirates_id: {
                    document_required: 1,
                    document_no_required: 1,
                    document_issue_date_required: 1,
                    document_expiry_date_required: 1,
                },
                passport: {
                    document_required: 1,
                    document_no_required: 1,
                    document_issue_date_required: 1,
                    document_expiry_date_required: 1,
                },
                visa: {
                    document_required: 0,
                    document_no_required: 0,
                    document_issue_date_required: 0,
                    document_expiry_date_required: 0,
                },
            },
            business: {
                trade_license: {
                    document_required: 1,
                    document_no_required: 0,
                    document_issue_date_required: 0,
                    document_expiry_date_required: 1,
                },
                passport_of_ubo: {
                    document_required: 1,
                    document_no_required: 0,
                    document_issue_date_required: 0,
                    document_expiry_date_required: 0,
                },
                moa: {
                    document_required: 1,
                },
            },
        };
        res.status(statusCode.ok).send(
            response.successdatamsg(
                send_res,
                "Required document for business owner fetched successfully"
            )
        );
    },
    updatePaymentStatus: async (req, res) => {
        let checkTransactionStatus = await MerchantEkycModel.selectDynamicSingle('status', { txn: req.bodyString("payment_id") }, config.table_prefix + 'order_txn')
        if (checkTransactionStatus.status == 'APPROVED') {
            let updateData = {
                payment_status: 1,
                payment_id: req.bodyString("payment_id"),
                payment_date: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
            };
            let compliance_manager_one = await adminModel.get_form_commaseperated('cm_01');

            if (!compliance_manager_one && compliance_manager_one.length === 0) {
                return res.status(statusCode.ok).send(response.successmsg("No Compliance Manager Found!!"));
            }
            const cpv = compliance_manager_one.map((data, index) => data.id)
            let master_merchant = await MerchantEkycModel.selectDynamicSingle("id,ekyc_done,store_id", { super_merchant_id: req.user.id }, config.table_prefix + "master_merchant");
            const checkcomplanceprocess = await MerchantApproval.selectOne('id', { merchant_id: master_merchant.id });
            if (checkcomplanceprocess) {
                return res.status(statusCode.ok).send(
                    response.successmsg("Payment Already Completed ,  Waiting for Compliance Manager Approval")
                );
            }


            MerchantEkycModel.updateDynamic({ merchant_id: master_merchant.id }, updateData, config.table_prefix + "master_merchant_details").then(async (result) => {
                if (master_merchant.ekyc_done == '2' || master_merchant.ekyc_done == 2) {
                    let update_master_merchant = { status: 3 };
                    await MerchantEkycModel.updateDynamic({ super_merchant_id: req.user.id }, update_master_merchant, config.table_prefix + "master_merchant")
                }
                const approvalData = {
                    merchant_id: master_merchant.id,
                    level: 1,
                    added_at: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                await MerchantApproval.add(approvalData);
                const approvalactivaty = {
                    merchant_id: master_merchant.id,
                    activity: 'Payment Success , Send to Compliance Manager',
                    user: req.user.id,
                    added_date: moment().format('YYYY-MM-DD'),
                    added_time: moment().format('HH:mm:ss'),
                    ip: "1000.00.00",
                }
                await MerchantApproval.addApprovalActivaty(approvalactivaty);

                cpv.forEach(async (data, index) => {
                    const notificationData = {
                        user: data,
                        title: "Approval Request for KYC",
                        message: `Store ID #${master_merchant.store_id}`,
                        send_by: req.user.id,
                        added_date: moment().format('YYYY-MM-DD'),
                        added_time: moment().format('HH:mm:ss')
                    }
                    const respo = await UserNotificationModel.add(notificationData).then(async (datas) => {
                        const update_link = { link: `http://localhost:4200/compliance/home?notification_id=${enc_dec.cjs_encrypt(datas.insert_id)}&merchant_id=${enc_dec.cjs_encrypt(master_merchant.id)}` }
                        await UserNotificationModel.updateDetails({ "id": datas.insert_id }, update_link)
                    });
                })
                const ekyc_stage = {
                    ekyc_stage: 'Payment Success , Send to Compliance Manager',
                }
                await MerchantEkycModel.update({ id: master_merchant.id }, ekyc_stage)
                res.status(statusCode.ok).send(
                    response.successmsg("Payment status updated successfully")
                );
            })
                .catch((error) => {
                    console.log(error)
                    res.status(statusCode.ok).send(
                        response.errormsg("Unable to update payment status")
                    );
                });
        } else {
            res.status(statusCode.ok).send(
                response.errormsg("Unable to update payment status")
            );
        }
    },

    CM_Accept: async (req, res) => {
        try {
            const merchant_id = enc_dec.cjs_decrypt(req.body.merchant_id);
            const checkuser = await MerchantApproval.selectOne('*', { merchant_id: merchant_id, is_accepted: 0 })
            if (checkuser) {
                const updatedata = {
                    compliance_manager: req.user.id,
                    is_accepted: 1
                }
                await MerchantApproval.updateDetails({ merchant_id: merchant_id, is_accepted: 0 }, updatedata);
                const approvalactivaty = {
                    merchant_id: merchant_id,
                    activity: `Accepted by Compliance Manager 0${checkuser.level}`,
                    user: req.user.id,
                    added_date: moment().format('YYYY-MM-DD'),
                    added_time: moment().format('HH:mm:ss'),
                    ip: "1000.00.00",
                }
                await MerchantApproval.addApprovalActivaty(approvalactivaty);
                const ekyc_stage = {
                    ekyc_stage: `Accepted by Compliance Manager 0${checkuser.level}`,
                }
                await MerchantEkycModel.update({ id: merchant_id }, ekyc_stage)
                res.status(statusCode.ok).send(
                    response.successmsg("Accepted successfully")
                );
            }
            else {
                console.log
                res.status(statusCode.badRequest).send(ServerResponse.errorMsgWithData('Not Permitted or Already accepted!!',[]));
            }
        } catch (error) {
            res.status(statusCode.internalError).send(ServerResponse.errorMsgWithData(error.message,[]));
        }
    },
    CM_Approval: async (req, res, next) => {
        try {
            const { industry_isic, ram_risk_ratings, triggered_risk, overall_risk, merchant_id, status, remark } = req.body;
            const dec_merchant_id = enc_dec.cjs_decrypt(merchant_id);
            const dec_industry_isic = enc_dec.cjs_decrypt(industry_isic)
            let compliance_manager_two = await adminModel.get_form_commaseperated('cm_02');
            if (!compliance_manager_two && compliance_manager_two.length === 0) {
                return res.status(statusCode.ok).send(response.successmsg("No Compliance Manager Found!!"));
            }
            const cpv = compliance_manager_two.map((data, index) => data.id)
            let getlevel = await MerchantApproval.selectList('*', { merchant_id: dec_merchant_id, compliance_manager: req.user.id });
            getlevel = getlevel[getlevel.length - 1]
            const updateData = {
                industry_isic: dec_industry_isic,
                ram_risk_ratings,
                triggered_risk,
                overall_risk
            }
            await MerchantEkycModel.updateDynamic({ merchant_id: dec_merchant_id }, updateData, config.table_prefix + "master_merchant_details");
            const Approvaldata = {
                status: status,
            }
            await MerchantApproval.updateDetails({ merchant_id: dec_merchant_id }, Approvaldata);
            const approvalactivaty = {
                merchant_id: dec_merchant_id,
                activity: `Approved by Compliance Manager 0${getlevel.level}`,
                user: req.user.id,
                added_date: moment().format('YYYY-MM-DD'),
                added_time: moment().format('HH:mm:ss'),
                remark: req.body.remark,
                ip: "1000.00.00",
            }
            let ekyc_status;
            if (status === 0) {
                approvalactivaty.activity = `Rejected by Compliance Manager 0${getlevel.level}`;
                ekyc_status = 7
            }
            else {
                ekyc_status = 2
                if (getlevel.level !== 2) {
                    const approvalData = {
                        merchant_id: dec_merchant_id,
                        level: 2,
                        added_by: req.user.id,
                        remark: req.body.remark,
                    }
                    await MerchantApproval.add(approvalData);
                    cpv.forEach(async (data, index) => {
                        const notificationData = {
                            user: data,
                            title: "Approval Request for KYC",
                            message: `Store ID #${dec_merchant_id}`,
                            send_by: req.user.id,
                            added_date: moment().format('YYYY-MM-DD'),
                            added_time: moment().format('HH:mm:ss')
                        }
                        const respo = await UserNotificationModel.add(notificationData).then(async (datas) => {
                            const msgid = await UserNotificationModel.selectOne('*', { id: datas.insert_id });
                            const update_link = {
                                message: msgid.message,
                                link: `http://localhost:4200/compliance/home?notification_id=${enc_dec.cjs_encrypt(datas.insert_id)}&merchant_id=${merchant_id}`
                            };
                            await UserNotificationModel.updateDetails({ "id": datas.insert_id }, update_link)
                        });
                    })
                }
            }

            const ekyc_stage = {
                ekyc_stage: approvalactivaty.activity,
            }

            if (getlevel.level === 2) {
                ekyc_stage.ekyc_stage = "Completed"
            }
            await MerchantEkycModel.update({ id: dec_merchant_id }, ekyc_stage)
            await MerchantApproval.addApprovalActivaty(approvalactivaty);
            let condition = { id: dec_merchant_id };

            let data = { ekyc_done: ekyc_status };

            if (getlevel.level === 2 || status === 1) {
                let activation_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
                if (ekyc_status === 2) {
                    data.status = 2;
                    data.activation_date = activation_date;
                    await mailSender.sendEkycDoneMail({ email: req.user.email, url: process.env.FRONTEND_URL + 'dashboard/store' }, 'eKYC approved, Activate payout')
                }
            }

            let table_name = config.table_prefix + "master_merchant";
            await MerchantEkycModel.updateDynamic(condition, data, table_name)
            res.status(statusCode.ok).send(response.successmsg(approvalactivaty.activity));
        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

    CM_Notification: async (req, res, next) => {
        const userid = req?.user?.id || '';
        try {
            const result = await UserNotificationModel.selectList('*', {
                user: userid
            });
            result.forEach((data, index) => {
                result[index].id = enc_dec.cjs_encrypt(data.id);
                result[index].user = enc_dec.cjs_encrypt(data.user);
            })
            return res.status(statusCode.ok).send(response.successdatamsg(result, 'List fetched successfully.'));
        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

    CM_NotificationSeen: async (req, res, next) => {
        const notification_id = enc_dec.cjs_decrypt(req.body.notification_id);
        const seentime = moment().format('YYYY-MM-DD HH:mm:ss')
        try {
            const result = await UserNotificationModel.updateDetails({
                id: notification_id
            }, {
                seen: seentime
            })
            return res.status(statusCode.ok).send(response.successmsg('Seen successfully.'));
        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

    CM_SendMail: async (req, res, next) => {
        try {
            const { merchant_id, cc, subject, body } = req.body;
            const dec_merchant_id = enc_dec.cjs_decrypt(merchant_id);
            const getemail = await MerchantEkycModel.select('email', { id: dec_merchant_id });
            let  attachment = "";
            if (req.files?.attachment) {
                const attachment_file = req.files?.attachment[0];
                const path  = attachment_file.path.replace("public", "static")
                attachment = [{
                    filename: attachment_file.originalname,
                    path: `${req.protocol}://${req.get('host')}/${path}` 
                }]
            }
            await mailSender.sendComplienceMail(getemail.email, subject, body, cc, attachment);
            const ins_data = {
                mail_to: getemail.email,
                mail_cc: cc.join(', '),
                mail_subject: subject,
                mail_body: body,
                send_by: req.user.id,
            }
            await ComplianceMail.add(ins_data);
            return res.status(statusCode.ok).send(response.successmsg('Send successfully.'));
        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },

    CM_Approvallogs: async (req, res, next) => {
        try {
            const { merchant_id } = req.body;

            const dec_merchant_id = enc_dec.cjs_decrypt(merchant_id);
            const result = await MerchantApproval.selectApprovalList('*', {
                merchant_id: dec_merchant_id
            });
            result.forEach((data, index) => {
                result[index].id = enc_dec.cjs_encrypt(data.id);
                result[index].merchant_id = enc_dec.cjs_encrypt(data.merchant_id);
                result[index].user = enc_dec.cjs_encrypt(data.user);
            })
            return res.status(statusCode.ok).send(response.successdatamsg(result, 'List fetched successfully.'));
        } catch (error) {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
        }
    },



    getOnboardingLogs: async (req, res) => {
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

        if (req.bodyString('merchant_id')) {
            and_filter_obj.submerchant_id = enc_dec.cjs_decrypt(req.bodyString('merchant_id'))
        }
        if (req.bodyString('super_merchant')) {
            and_filter_obj.super_merchant = enc_dec.cjs_decrypt(req.bodyString('super_merchant'))
        }

        if (req.bodyString('from_date')) {
            date_condition.from_date = moment(req.bodyString('from_date')).format('YYYY-MM-DD')
        }

        if (req.bodyString('to_date')) {
            date_condition.to_date = moment(req.bodyString('to_date')).format('YYYY-MM-DD')
        }

        MerchantEkycModel.get_onboarding_logs(and_filter_obj, date_condition, limit)
            .then(async (result) => {
                let send_res = [];

                let merchant_ids = await helpers.keyByArr(result, 'submerchant_id');
                let merchants_name = await helpers.get_merchant_details_name_by_ids(merchant_ids)
                for (let val of result) {
                    let res = {
                        id: enc_dec.cjs_encrypt(val.id),
                        date: moment(val.created_date).utc().format('DD-MM-YYYY H:mm:ss'),
                        merchant_id: enc_dec.cjs_encrypt(val.submerchant_id),
                        merchant_name: merchants_name[val.submerchant_id]?.company_name,
                        section: val.section,
                        sub_section: val.sub_section,
                        //req_data:val.json_data
                    };
                    send_res.push(res);
                }
                total_count = await MerchantEkycModel.get_logs_count(and_filter_obj, date_condition)

                res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
            })
            .catch((error) => {
                console.log(error)
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
};

module.exports = MerchantEkyc;

// Function to generate OTP
function generateOTPLogin() {
    // Declare a digits variable
    // which stores all digits
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}
