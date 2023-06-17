const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const encDec = require('../utilities/decryptor/decryptor');
const SubmerchantModel = require('../models/submerchantmodel');
const merchantModel = require('../models/merchantmodel');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const helpers = require('../utilities/helper/general_helper');
require('dotenv').config({ path: '../.env' });
const moment = require('moment');
const serverAddr = process.env.SERVER_LOAD;
const port = process.env.SERVER_PORT;
const SequenceUUID = require('sequential-uuid');
const qrGenerateModel = require('../models/qrGenerateModule');
const checkifrecordexist = require('../utilities/validations/checkifrecordexist');
let allData = {
  add: async (req, res) => {
    const data = req.bodyString('email') + req.bodyString('name');
    try {
      let userData = {
        super_merchant_id: req.user.id,
        register_at: new Date().toJSON().substring(0, 19).replace('T', ' '),
        ip: await helpers.get_ip(req),
      };
      let insId = await SubmerchantModel.add(userData);

      let storeId = 100000 + insId.insertId;
      await merchantModel.updateDetails({ id: insId.insertId }, { store_id: storeId });

      let merDetails = {
        merchant_id: insId.insertId,
        company_name: req.bodyString('legal_business_name')
      };
      await SubmerchantModel.add_merchant_details(merDetails);

      let kayData = {
        merchant_id: insId.insertId,
        type: 'test',
        merchant_key: await helpers.make_order_number('test-'),
        merchant_secret: await helpers.make_order_number('sec-'),
        created_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
      };
      await SubmerchantModel.add_key(kayData);

      res.status(statusCode.ok).send(response.successdatamsg({ id: encDec.cjs_encrypt(insId.insertId) }, 'Store added successfully'));
    } catch (error) {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error));
    }
  },
  list: async (req, res) => {
    let limit = {
      perpage: 0,
      page: 0,
    };
    if (req.bodyString('perpage') && req.bodyString('page')) {
      let perpage = parseInt(req.bodyString('perpage'));
      let start = parseInt(req.bodyString('page'));

      limit.perpage = perpage;
      limit.start = ((start - 1) * perpage);
    }
    let condition = {};
    let like_condition_arr = [];

    if (req.user.type === 'merchant') {
      condition = { ['s.deleted']: 0, ['s.super_merchant_id']: req.user.id };
    } else {
      condition = { ['s.deleted']: 0 };
    }

    if (req.bodyString('registration_number')) {
      condition['m.company_registration_number'] = req.bodyString('registration_number');
    }

    if (req.bodyString('business_address')) {
      condition['m.register_business_country'] = encDec.cjs_decrypt(req.bodyString('business_address'));
    }

    if (req.bodyString('type_of_business')) {
      condition['m.type_of_business'] = encDec.cjs_decrypt(req.bodyString('type_of_business'));
    }
    if (req.bodyString('industry_type')) {
      condition['m.mcc_codes'] = encDec.cjs_decrypt(req.bodyString('industry_type'));
    }

    if (req.bodyString('super_merchant')) {
      condition['s.super_merchant_id'] = encDec.cjs_decrypt(req.bodyString('super_merchant'));
    }
    if (req.bodyString('status') && encDec.cjs_decrypt(req.bodyString('status')) !== '') {
      condition['s.status'] = encDec.cjs_decrypt(req.bodyString('status'));
    }

    if (req.bodyString('ekyc_status')) {
      if (req.bodyString('ekyc_status') === 'ekyc_pending') {
        condition['s.ekyc_required'] = 1;
        condition['s.ekyc_done'] = 1; //1=pending, 2= Approved
        condition['s.onboarding_done'] = 1;
      } if (req.bodyString('ekyc_status') === 'onboarding_pending') {
        condition['s.onboarding_done'] = 0;
      } if (req.bodyString('ekyc_status') === 'ekyc_done') {
        condition['s.ekyc_done'] = 2;
      } if (req.bodyString('ekyc_status') === 'onboarding_done') {
        condition['s.ekyc_required'] = 0;
        condition['s.onboarding_done'] = 1;
      }

    }

    if (req.bodyString('store_id')) {
      condition['s.store_id'] = req.bodyString('store_id');
    }

    if (req.bodyString('payout_currency')) {
      condition['m.payout_currency'] = req.bodyString('payout_currency');
    }

    if (req.bodyString('payout_method')) {
      condition['m.payout_method'] = req.bodyString('payout_method');
    }

    if (req.bodyString('transaction_currencies')) {
      condition['m.transaction_currencies'] = req.bodyString('transaction_currencies');
    }

    if (req.bodyString('settlement_currency')) {
      condition['m.settlement_currency'] = req.bodyString('settlement_currency');
    }

    if (req.bodyString('company_details')) {
      like_condition_arr.push({
        'm.company_registration_number': req.bodyString('company_details'),
        'm.vat_number': req.bodyString('company_details'),
      })
    }
    if (req.bodyString('addressDetalis')) {
      like_condition_arr.push({
        'm.address_line1': req.bodyString('addressDetalis'),
        'm.address_line2': req.bodyString('addressDetalis'),
        'm.business_phone_number': req.bodyString('addressDetalis'),
      })
    }
    if (req.bodyString('legalDetalis')) {
      like_condition_arr.push({
        'm.legal_person_first_name': req.bodyString('legalDetalis'),
        'm.legal_person_last_name': req.bodyString('legalDetalis'),
        'm.legal_person_email': req.bodyString('legalDetalis'),
      })
    }
    if (req.bodyString('homeAddressDetails')) {
      like_condition_arr.push({
        'm.home_address_line_1': req.bodyString('homeAddressDetails'),
        'm.home_address_line_2': req.bodyString('homeAddressDetails'),
        'm.home_phone_number': req.bodyString('homeAddressDetails'),
        'm.personal_id_number': req.bodyString('homeAddressDetails'),
      })
    }
    if (req.bodyString('bankDetails')) {
      like_condition_arr.push({
        'm.bank_currency': req.bodyString('bankDetails'),
        'm.bank_name': req.bodyString('bankDetails'),
        'm.branch_name': req.bodyString('bankDetails'),
      })
    }
    if (req.bodyString('pocDetails')) {
      like_condition_arr.push({
        'm.poc_name': req.bodyString('pocDetails'),
        'm.poc_email': req.bodyString('pocDetails'),
        'm.poc_mobile': req.bodyString('pocDetails'),
      })
    }
    if (req.bodyString('techDetails')) {
      like_condition_arr.push({
        'm.tech_name': req.bodyString('techDetails'),
        'm.tech_email': req.bodyString('techDetails'),
        'm.tech_mobile': req.bodyString('techDetails'),
      })
    }
    if (req.bodyString('finDetails')) {
      like_condition_arr.push({
        'm.fin_name': req.bodyString('finDetails'),
        'm.fin_email': req.bodyString('finDetails'),
        'm.fin_mobile': req.bodyString('finDetails'),
      })
    }
    if (req.bodyString('userData')) {
      like_condition_arr.push({
        's.mobile_no': req.bodyString('userData'),
        's.email': req.bodyString('userData'),
        'm.company_name': req.bodyString('userData'),
      })
    }

    //   const searchText = req.bodyString('search');
    //   const filter = {};
    //   if (searchText ) { filter['m.company_name'] = searchText ; filter['m.legal_person_email'] = searchText ; filter['m.business_phone_number'] = searchText; ; filter['m.payout_currency'] = searchText;
    //   ; filter['m.payout_method'] = searchText ;  filter['m.transaction_currencies'] = searchText ;  filter['m.settlement_currency'] = searchText ;  filter['m.register_business_country'] = searchText ; 
    // }
    SubmerchantModel.select(condition, limit, like_condition_arr)
      .then(async (result) => {
        let sendRes = [];
        let [registerBusinessCountryIds, typeOfBusinessIds, ids, superMerchantIds] =
          await Promise.all([
            helpers.keyByArr(result, 'register_business_country'),
            helpers.keyByArr(result, 'type_of_business'),
            helpers.keyByArr(result, 'id'),
            helpers.keyByArr(result, 'super_merchant_id'),
          ]);

        let [countryName, typeOfBusiness, businessNameByMerchant, storeStatus,
          superMerchantDetails, totalCount, completionStatus] = await Promise.all([
            helpers.get_country_name_by_ids(registerBusinessCountryIds),
            helpers.get_type_of_business_arr(typeOfBusinessIds),
            helpers.get_business_name_by_merchant_ids(ids),
            helpers.get_store_status_by_number(),
            helpers.get_super_merchant_details(superMerchantIds),
            SubmerchantModel.get_sub_merchant_count(condition, like_condition_arr),
            SubmerchantModel.getOnboardingCompletionStatus(ids)
          ]);

        for (let val of result) {
          let res = {
            submerchant_id: encDec.cjs_encrypt(val.id),
            store_id: val.store_id,
            ekyc_done: val.ekyc_done === 2 ? 'Yes' : 'No',
            ekyc_required: val.ekyc_required === 1 ? 'Yes' : 'No',
            onboarding_done: val.onboarding_done === 1 ? 'Yes' : 'No',
            mail_send_to_psp: val.psp_mail_send === 1 ? 'Yes' : 'No',
            register_business_country: countryName[val.register_business_country],
            type_of_business: typeOfBusiness[val.type_of_business],
            company_registration_number: val.company_registration_number ? val.company_registration_number : '',
            // status_id: encDec.cjs_encrypt(val.id),
            //company_name: val.company_name? val.company_name:"",
            // vat_number:val.vat_number,
            // address_line1: val.address_line1,
            // address_line2: val.address_line2,
            // business_phone_number:val.business_phone_number,
            // legal_person_first_name: val.legal_person_first_name,
            // legal_person_last_name: val.legal_person_last_name,
            // legal_person_email: val.legal_person_email,
            // home_address_line_1:val.home_address_line_1,
            // home_address_line_2:val.home_address_line_2,
            // home_phone_number: val.home_phone_number,
            // personal_id_number:val.personal_id_number,
            // bank_currency: val.bank_currency,
            // bank_name:val.bank_name,
            // branch_name: val.branch_name,
            // poc_name: val.poc_name,
            // poc_email:val.poc_email,
            // poc_mobile:val.poc_mobile,
            // tech_name:val.tech_name,
            // tech_email:val.tech_email,
            // tech_mobile:val.tech_mobile,
            // fin_name:val.fin_name,
            // fin_email:val.fin_email,
            // fin_mobile:val.fin_mobile,
            // name:val.name,
            // email:val.email,
            // mobile_no:val.mobile_no,
            // company_name:val.company_name,
            // payout_currency:val.payout_currency,
            // payout_method:val.payout_method,
            // transaction_currencies:val.transaction_currencies,
            // settlement_currency:val.settlement_currency,

            legal_business_name: val.company_name
              ? val.company_name
              : businessNameByMerchant[val.id],
            kyc_status: val.onboarding_done !== 1 ? 'Onboarding Pending' : (val.ekyc_required === 1 && val.ekyc_done !== 2) ? 'EKYC Pending' : (val.ekyc_required === 1 && val.ekyc_done === 2) ? 'EKYC Done' : (val.ekyc_required === 0 && val.onboarding_done === 1) ? 'Onboarding Done' : '',
            status: storeStatus[val.status],
            live: val.live,
            payment_status: val.payment_status == null || val.payment_status === '0' ? 'Pending' : 'Done',
            contact_name: (superMerchantDetails[val.super_merchant_id]?.name) ? superMerchantDetails[val.super_merchant_id]?.name : '',
            contact_email: (superMerchantDetails[val.super_merchant_id]?.email) ? superMerchantDetails[val.super_merchant_id]?.email : '',
            contact_mobile_code: (superMerchantDetails[val.super_merchant_id]?.code) ? superMerchantDetails[val.super_merchant_id]?.code : '',
            contact_mobile_number: (superMerchantDetails[val.super_merchant_id]?.mobile_no) ? superMerchantDetails[val.super_merchant_id]?.mobile_no : '',

            completion_percentage: (completionStatus[val.id]?.count)
              ? ((completionStatus[val.id]?.count) * 20)
              : 0,
            completion_status: await helpers.subsection_completion((completionStatus[val.id]?.sub_section) ? completionStatus[val.id]?.sub_section : ''),
            video_kyc_done:
              val.video_kyc_done === 1
                ? 'Yes'
                : 'No',

          };

          sendRes.push(res);
        }

        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.', totalCount));
      })
      .catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  list_ekycPending: async (req, res) => {
    try {
     let limit = {
        perpage: 0,
        page: 0,
      };
      if (req.bodyString('perpage') && req.bodyString('page')) {
        let perpage = parseInt(req.bodyString('perpage'));
        let start = parseInt(req.bodyString('page'));

        limit.perpage = perpage;
        limit.start = ((start - 1) * perpage);
      }
      let condition = {};
      let like_condition_arr = [];

  
      if (req.user.type === 'merchant') {
        condition = { ['s.deleted']: 0, ['s.super_merchant_id']: req.user.id };
      } else {
        condition = { ['s.deleted']: 0 };
      }

      if (req.bodyString('registration_number')) {
        condition['m.company_registration_number'] = req.bodyString('registration_number');
      }

      if (req.bodyString('business_address')) {
        condition['m.register_business_country'] = encDec.cjs_decrypt(req.bodyString('business_address'));
      }

      if (req.bodyString('type_of_business')) {
        condition['m.type_of_business'] = encDec.cjs_decrypt(req.bodyString('type_of_business'));
      }
      if (req.bodyString('industry_type')) {
        condition['m.mcc_codes'] = encDec.cjs_decrypt(req.bodyString('industry_type'));
      }

      if (req.bodyString('super_merchant')) {
        condition['s.super_merchant_id'] = encDec.cjs_decrypt(req.bodyString('super_merchant'));
      }
      if (req.bodyString('status') && encDec.cjs_decrypt(req.bodyString('status')) !== '') {
        condition['s.status'] = encDec.cjs_decrypt(req.bodyString('status'));
        condition['m.payment_status'] = 1;

      }

      if (req.bodyString('ekyc_status')) {
        if (req.bodyString('ekyc_status') === 'ekyc_pending') {
          condition['s.ekyc_required'] = 1;
          condition['s.ekyc_done'] = 1; //1=pending, 2= Approved
          condition['s.onboarding_done'] = 1;
        } if (req.bodyString('ekyc_status') === 'onboarding_pending') {
          condition['s.onboarding_done'] = 0;
        } if (req.bodyString('ekyc_status') === 'ekyc_done') {
          condition['s.ekyc_done'] = 2;
        } if (req.bodyString('ekyc_status') === 'onboarding_done') {
          condition['s.ekyc_required'] = 0;
          condition['s.onboarding_done'] = 1;
        }

      }

      if (req.bodyString('store_id')) {
        condition['s.store_id'] = req.bodyString('store_id');
      }

      if (req.bodyString('payout_currency')) {
        condition['m.payout_currency'] = req.bodyString('payout_currency');
      }

      if (req.bodyString('payout_method')) {
        condition['m.payout_method'] = req.bodyString('payout_method');
      }

      if (req.bodyString('transaction_currencies')) {
        condition['m.transaction_currencies'] = req.bodyString('transaction_currencies');
      }

      if (req.bodyString('settlement_currency')) {
        condition['m.settlement_currency'] = req.bodyString('settlement_currency');
      }

      if (req.bodyString('company_details')) {
        like_condition_arr.push({
          'm.company_registration_number': req.bodyString('company_details'),
          'm.vat_number': req.bodyString('company_details'),
        })
      }
      if (req.bodyString('addressDetalis')) {
        like_condition_arr.push({
          'm.address_line1': req.bodyString('addressDetalis'),
          'm.address_line2': req.bodyString('addressDetalis'),
          'm.business_phone_number': req.bodyString('addressDetalis'),
        })
      }
      if (req.bodyString('legalDetalis')) {
        like_condition_arr.push({
          'm.legal_person_first_name': req.bodyString('legalDetalis'),
          'm.legal_person_last_name': req.bodyString('legalDetalis'),
          'm.legal_person_email': req.bodyString('legalDetalis'),
        })
      }
      if (req.bodyString('homeAddressDetails')) {
        like_condition_arr.push({
          'm.home_address_line_1': req.bodyString('homeAddressDetails'),
          'm.home_address_line_2': req.bodyString('homeAddressDetails'),
          'm.home_phone_number': req.bodyString('homeAddressDetails'),
          'm.personal_id_number': req.bodyString('homeAddressDetails'),
        })
      }
      if (req.bodyString('bankDetails')) {
        like_condition_arr.push({
          'm.bank_currency': req.bodyString('bankDetails'),
          'm.bank_name': req.bodyString('bankDetails'),
          'm.branch_name': req.bodyString('bankDetails'),
        })
      }
      if (req.bodyString('pocDetails')) {
        like_condition_arr.push({
          'm.poc_name': req.bodyString('pocDetails'),
          'm.poc_email': req.bodyString('pocDetails'),
          'm.poc_mobile': req.bodyString('pocDetails'),
        })
      }
      if (req.bodyString('techDetails')) {
        like_condition_arr.push({
          'm.tech_name': req.bodyString('techDetails'),
          'm.tech_email': req.bodyString('techDetails'),
          'm.tech_mobile': req.bodyString('techDetails'),
        })
      }
      if (req.bodyString('finDetails')) {
        like_condition_arr.push({
          'm.fin_name': req.bodyString('finDetails'),
          'm.fin_email': req.bodyString('finDetails'),
          'm.fin_mobile': req.bodyString('finDetails'),
        })
      }
      if (req.bodyString('userData')) {
        like_condition_arr.push({
          's.mobile_no': req.bodyString('userData'),
          's.email': req.bodyString('userData'),
          'm.company_name': req.bodyString('userData'),
        })
      }

      //   const searchText = req.bodyString('search');
      //   const filter = {};
      //   if (searchText ) { filter['m.company_name'] = searchText ; filter['m.legal_person_email'] = searchText ; filter['m.business_phone_number'] = searchText; ; filter['m.payout_currency'] = searchText;
      //   ; filter['m.payout_method'] = searchText ;  filter['m.transaction_currencies'] = searchText ;  filter['m.settlement_currency'] = searchText ;  filter['m.register_business_country'] = searchText ; 
      // }
      SubmerchantModel.select(condition, limit, like_condition_arr)
        .then(async (result) => {
          let sendRes = [];
          let [registerBusinessCountryIds, typeOfBusinessIds, ids, superMerchantIds] =
            await Promise.all([
              helpers.keyByArr(result, 'register_business_country'),
              helpers.keyByArr(result, 'type_of_business'),
              helpers.keyByArr(result, 'id'),
              helpers.keyByArr(result, 'super_merchant_id'),
            ]);
          let [countryName, typeOfBusiness, businessNameByMerchant, storeStatus,
            superMerchantDetails, totalCount, completionStatus] = await Promise.all([
              helpers.get_country_name_by_ids(registerBusinessCountryIds),
              helpers.get_type_of_business_arr(typeOfBusinessIds),
              helpers.get_business_name_by_merchant_ids(ids),
              helpers.get_store_status_by_number(),
              helpers.get_super_merchant_details(superMerchantIds),
              SubmerchantModel.get_sub_merchant_count(condition, like_condition_arr),
              SubmerchantModel.getOnboardingCompletionStatus(ids)
            ]);

          for (let val of result) {
            let res = {
              submerchant_id: encDec.cjs_encrypt(val.id),
              store_id: val.store_id,
              ekyc_done: val.ekyc_done === 2 ? 'Yes' : 'No',
              payment_status: val.payment_status === 1 ? 'Yes' : 'No',
              ekyc_required: val.ekyc_required === 1 ? 'Yes' : 'No',
              onboarding_done: val.onboarding_done === 1 ? 'Yes' : 'No',
              mail_send_to_psp: val.psp_mail_send === 1 ? 'Yes' : 'No',
              register_business_country: countryName[val.register_business_country],
              type_of_business: typeOfBusiness[val.type_of_business],
              company_registration_number: val.company_registration_number ? val.company_registration_number : '',
              ekyc_stage : val?.ekyc_stage || 'Pending',
              application_date : val?.payment_date ,
              // status_id: encDec.cjs_encrypt(val.id),
              //company_name: val.company_name? val.company_name:"",
              // vat_number:val.vat_number,
              // address_line1: val.address_line1,
              // address_line2: val.address_line2,
              // business_phone_number:val.business_phone_number,
              // legal_person_first_name: val.legal_person_first_name,
              // legal_person_last_name: val.legal_person_last_name,
              // legal_person_email: val.legal_person_email,
              // home_address_line_1:val.home_address_line_1,
              // home_address_line_2:val.home_address_line_2,
              // home_phone_number: val.home_phone_number,
              // personal_id_number:val.personal_id_number,
              // bank_currency: val.bank_currency,
              // bank_name:val.bank_name,
              // branch_name: val.branch_name,
              // poc_name: val.poc_name,
              // poc_email:val.poc_email,
              // poc_mobile:val.poc_mobile,
              // tech_name:val.tech_name,
              // tech_email:val.tech_email,
              // tech_mobile:val.tech_mobile,
              // fin_name:val.fin_name,
              // fin_email:val.fin_email,
              // fin_mobile:val.fin_mobile,
              // name:val.name,
              // email:val.email,
              // mobile_no:val.mobile_no,
              // company_name:val.company_name,
              // payout_currency:val.payout_currency,
              // payout_method:val.payout_method,
              // transaction_currencies:val.transaction_currencies,
              // settlement_currency:val.settlement_currency,

              legal_business_name: val.company_name
                ? val.company_name
                : businessNameByMerchant[val.id],
              kyc_status: val.onboarding_done !== 1 ? 'Onboarding Pending' : (val.ekyc_required === 1 && val.ekyc_done !== 2) ? 'EKYC Pending' : (val.ekyc_required === 1 && val.ekyc_done === 2) ? 'EKYC Done' : (val.ekyc_required === 0 && val.onboarding_done === 1) ? 'Onboarding Done' : '',
              status: storeStatus[val.status],
              live: val.live,
              payment_status: val.payment_status == null || val.payment_status === '0' ? 'Pending' : 'Done',
              contact_name: (superMerchantDetails[val.super_merchant_id]?.name) ? superMerchantDetails[val.super_merchant_id]?.name : '',
              contact_email: (superMerchantDetails[val.super_merchant_id]?.email) ? superMerchantDetails[val.super_merchant_id]?.email : '',
              contact_mobile_code: (superMerchantDetails[val.super_merchant_id]?.code) ? superMerchantDetails[val.super_merchant_id]?.code : '',
              contact_mobile_number: (superMerchantDetails[val.super_merchant_id]?.mobile_no) ? superMerchantDetails[val.super_merchant_id]?.mobile_no : '',

              completion_percentage: (completionStatus[val.id]?.count)
                ? ((completionStatus[val.id]?.count) * 20)
                : 0,
              completion_status: await helpers.subsection_completion((completionStatus[val.id]?.sub_section) ? completionStatus[val.id]?.sub_section : ''),
              video_kyc_done:
                val.video_kyc_done === 1
                  ? 'Yes'
                  : 'No',

            };

            sendRes.push(res);
          }

          res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.', totalCount));
        })
        .catch((error) => {
          console.log(error);
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  psp_list: async (req, res) => {
    let recId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));
    SubmerchantModel.selectpspList({ merchant_id: recId })

      .then(async (result) => {

        let sendRes = [];
        for (let val of result) {
          let res = {
            data_id: encDec.cjs_encrypt(val.id),
            submerchant_id: encDec.cjs_encrypt(val.merchant_id),
            psp_id: encDec.cjs_encrypt(val.psp_id),
            psp_name: await helpers.get_psp_name_by_id(val.psp_id),
          };
          sendRes.push(res);
        }
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.'));
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  details: async (req, res) => {
    let recId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));
    SubmerchantModel.selectOneDetails({ merchant_id: recId })
      .then(async (result) => {

        let list = await SubmerchantModel.selectdata(recId);
        let getKeys = await SubmerchantModel.selectKeyData(recId);

        const data = [];
        let index = 0;
        for (let elements of list) {
          //list.forEach((elements, index) => {
          let midId = encDec.cjs_encrypt(elements.id);
          let submerchantId = encDec.cjs_encrypt(elements.submerchant_id);
          let pspId = encDec.cjs_encrypt(elements.psp_id);
          let pspName = await helpers.get_psp_name_by_id(elements.psp_id);
          let currencyId = encDec.cjs_encrypt(elements.currency_id);
          let currencyCode = await helpers.get_currency_name_by_id(elements.currency_id);
          let legalBusinessName = elements.company_name;
          let temp = {
            mid_id: midId,
            submerchant_id: submerchantId,
            psp_id: pspId,
            psp_name: pspName,
            currency_id: currencyId,
            currency_code: currencyCode,
            MID: elements.MID,
            status: (elements.deleted === 1) ? 'Deactivated' : 'Active',
          };
          data[index] = temp;
          index++;
        }

        const keyData = [];
        getKeys.forEach((elements, index) => {
          let keysId = encDec.cjs_encrypt(elements.id);
          let submerchantId = encDec.cjs_encrypt(elements.merchant_id);
          let type = elements.type;
          let merchantKey = elements.merchant_key;
          let merchantSecret = elements.merchant_secret;
          let createdAt = moment(elements.created_at).format('DD-MM-YYYY H:mm:ss');

          let temp = {
            keys_id: keysId,
            submerchant_id: submerchantId,
            type: type,
            merchant_key: merchantKey,
            merchant_secret: merchantSecret,
            created_date: createdAt
          };
          keyData[index] = temp;
        });

        let countData = await SubmerchantModel.get_mid_count(
          { submerchant_id: recId, deleted: 0 }, 0);
        let val = result;
        let resp = {
          merchant_id: encDec.cjs_encrypt(val.merchant_id),
          merchant_details_id: encDec.cjs_encrypt(val.id),
          legal_business_name: val.company_name,
          mid_data: data,
          key_data: keyData,
          count_mid: countData
        };
        let sendRes = resp;

        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'Details fetched successfully.'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },
  update: async (req, res) => {
    try {
      let dataId = await encDec.cjs_decrypt(req.bodyString('id'));

      let userData = {
        company_name: req.bodyString('legal_business_name')
      };

      let insId = await SubmerchantModel.updateDetails({ id: dataId }, userData);
      res.status(statusCode.ok).send(response.successmsg('Submerchant updated successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  deactivate: async (req, res) => {
    try {
      let userId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));
      let insdata = {
        'status': 1
      };

      let insId = await SubmerchantModel.update_merchant({ id: userId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant deactivated successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  activate: async (req, res) => {
    try {

      let userId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));
      let insdata = {
        'status': 0
      };
      let insId = await SubmerchantModel.update_merchant({ id: userId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant activated successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  delete: async (req, res) => {
    try {
      let userId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));
      let insdata = {
        'deleted': 1
      };
      let insId = await SubmerchantModel.update_merchant({ id: userId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant deleted successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  branding_details: async (req, res) => {
    let recId = await encDec.cjs_decrypt(req.bodyString('submerchant_id'));

    SubmerchantModel.selectOne('*', { id: recId, deleted: 0 })
      .then(async (result) => {
        let sendRes = [];
        let val = result;
        let resp = {
          super_merchant_id: encDec.cjs_encrypt(val.super_merchant_id),
          submerchant_id: encDec.cjs_encrypt(val.id),
          merchant_name: await helpers.get_merchant_details_name_by_id(val.id),
          icon_name: val.icon,
          logo_name: val.logo,
          language: await encDec.cjs_encrypt(val.default_language),
          accept_image_name: val.we_accept_image,
          icon: serverAddr + ':' + port + '/static/files/' + val.icon,
          logo: serverAddr + ':' + port + '/static/files/' + val.logo,
          accept_image: val.we_accept_image !== '' ? serverAddr + ':' + port + '/static/files/' + val.we_accept_image : serverAddr + ':' + port + '/static/files/' + 'payment-list.png',
          use_logo_instead_icon: val.use_logo,
          brand_color: val.brand_color,
          accent_color: val.accent_color
        };
        sendRes = resp;
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'Details fetched successfully.'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },
  branding_update: async (req, res) => {
    try {
      let submerchantId = await encDec.cjs_decrypt(req.bodyString('id'));
      let language = await encDec.cjs_decrypt(req.bodyString('language'));
      let insdata = {
        use_logo: req.bodyString('use_logo_instead_icon'),
        brand_color: req.bodyString('brand_color'),
        accent_color: req.bodyString('accent_color'),
        default_language: language,
      };
      if (req.all_files) {
        if (req.all_files.icon) {
          insdata.icon = req.all_files.icon;
        }
        if (req.all_files.logo) {
          insdata.logo = req.all_files.logo;
        }
        if (req.all_files.accept_image) {
          insdata.we_accept_image = req.all_files.accept_image;
        }
      }
      let insId = await SubmerchantModel.update_merchant({ id: submerchantId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant branding updated successfully'));

    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  blocked: async (req, res) => {
    try {
      let userId = await encDec.cjs_decrypt(req.bodyString('merchant_id'));
      let insdata = {
        'is_blocked': 1
      };
      let insId = await SubmerchantModel.updateDetails({ id: userId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant blocked successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  unblocked: async (req, res) => {
    try {

      let userId = await encDec.cjs_decrypt(req.bodyString('merchant_id'));
      let insdata = {
        'is_blocked': 0
      };

      let insId = await SubmerchantModel.updateDetails({ id: userId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant unblocked successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  password: async (req, res) => {
    let userId = await encDec.cjs_decrypt(req.bodyString('merchant_id'));
    SubmerchantModel.selectOne('password', { id: userId, deleted: 0 }).then(async (result) => {
      let sendRes = [];
      let val = result;
      let res1 = {
        password: await encryptDecrypt('decrypt', val.password),
      };
      sendRes = res1;
      res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'Password fetched successfully.'));
    }).catch((error) => {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    });
  },
  add_mid: async (req, res) => {
    try {
      let insData = req.body.data;
      for (let i = 0; i < insData.length; i++) {
        if (insData[i].mid_id) {

          let MIDData = `'${insData[i].MID_up}'`;
          let dataId = await encDec.cjs_decrypt(insData[i].mid_id);
          let userId = await encDec.cjs_decrypt(insData[i].submerchant_id_up);
          let pspId = await encDec.cjs_decrypt(insData[i].psp_id_up);
          let currencyId = await encDec.cjs_decrypt(insData[i].currency_id_up);
          let countData = await SubmerchantModel.get_mid_count(
            {
              submerchant_id: userId,
              psp_id: pspId,
              currency_id: currencyId,
              MID: MIDData, deleted: 0
            }, dataId);

          if (countData > 0) {
            res.status(statusCode.ok).send({ status: false, message: 'Data exist', });
          } else {
            let temp = {
              submerchant_id: userId,
              psp_id: pspId,
              currency_id: currencyId,
              MID: insData[i].MID_up,
            };
            SubmerchantModel.update_mid({ id: dataId }, temp)
              .then((result) => {
                res.status(statusCode.ok).send({ status: true, message: 'Updated successfully', });
              });
          }
        }
        //add
        if (insData[i].psp_id) {
          let MIDData = `'${insData[i].MID}'`;
          let userId = await encDec.cjs_decrypt(insData[i].submerchant_id);
          let pspId = await encDec.cjs_decrypt(insData[i].psp_id);
          let currencyId = await encDec.cjs_decrypt(insData[i].currency_id);
          let countData = await SubmerchantModel.get_mid_count(
            {
              submerchant_id: userId,
              psp_id: pspId,
              currency_id: currencyId,
              MID: MIDData, deleted: 0
            }, 0);

          if (countData === 0) {
            let temp = {
              submerchant_id: userId,
              psp_id: pspId,
              currency_id: currencyId,
              MID: insData[i].MID,
              added_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
            };
            SubmerchantModel.add_mid(temp)
              .then(async (result) => {
                let kayData = {
                  merchant_id: userId,
                  type: 'live',
                  merchant_key: await helpers.make_order_number('live-'),
                  merchant_secret: await helpers.make_order_number('sec-'),
                  created_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
                };
                await SubmerchantModel.add_key(kayData);
                let addLiveData = {
                  live: 1,
                };

                await SubmerchantModel.update_merchant({ id: userId }, addLiveData);

                let currency = await SubmerchantModel.fetchCurrencyName(temp.currency_id);
                let planExist = await checkifrecordexist({ 'sub_merchant_id': temp.submerchant_id, 'currency': currency.code }, 'merchant_qr_codes');
                if (!planExist) {
                  const uuid = new SequenceUUID({
                    valid: true,
                    dashes: false,
                    unsafeBuffer: true
                  });
                  let qrId = uuid.generate();

                  let createdAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
                  let qrData = {
                    merchant_id: req.user.id,
                    sub_merchant_id: temp.submerchant_id,
                    currency: currency.code,
                    qr_id: qrId,
                    created_at: createdAt,
                    type_of_qr_code: 'Static_QR',
                  };
                  qrGenerateModel.add(qrData).then(async (resultQrAdd) => {
                    console.log(resultQrAdd);
                    res.status(statusCode.ok).send({ status: true, message: 'Added successfully', });
                  }).then((error) => {
                    res.status(statusCode.internalError)
                      .send(response.errormsg('Something went wrong'));
                  });
                } else {
                  res.status(statusCode.ok).send({ status: true, message: 'Added successfully', });
                }
              });
          } else {
            res.status(statusCode.ok)
              .send({ status: false, message: 'Data exist', });
          }
        }
      }
    }
    catch (error) {
      console.log(error);
      res.status(statusCode.internalError)
        .send(response.errormsg('Something went wrong'));
    }
  },
  delete_mid: async (req, res) => {
    try {
      let midId = await encDec.cjs_decrypt(req.bodyString('mid_id'));
      let insdata = {
        'deleted': 1
      };
      let insId = await SubmerchantModel.update_mid({ id: midId }, insdata);
      res.status(statusCode.ok).send(response.successmsg('Submerchant deleted successfully'));
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  list_mid: async (req, res) => {
    let recId = await encDec.cjs_decrypt(req.bodyString('id'));
    SubmerchantModel.selectmidList({ submerchant_id: recId })
      .then(async (result) => {

        let sendRes = [];
        for (let val of result) {
          let res = {
            enc_id: encDec.cjs_encrypt(val.id),
            //submerchant_id: encDec.cjs_encrypt(val.submerchant_id),
            MID: val.MID,
            terminal_id: val.terminal_id,
            // merchant_name:await helpers.get_merchant_name_by_id(val.submerchant_id)
            psp_name: await helpers.get_psp_name_by_id(val.psp_id),
            class: val.class,
            auth_currency: val.auth_currency,
            settlement_currency: val.settlement_currency,
            protocol: val.protocol,
            mode: val.mode,
            class_setting: val.class_setting,
            cvv_setting: val.cvv_setting,
            buy_percentage: val.buy_percentage,
            buy_fixed: val.buy_fixed,
            sell_percentage: val.sell_percentage,
            sell_fixed: val.sell_fixed,
            payout_delay: val.payout_delay,
            currency: val.currency ? val.currency : '',
            submerchant_name: val.submerchant_name ? val.submerchant_name : '',
            submerchant_city: val.submerchant_city ? val.submerchant_city : '',
            sales_person: val.sales_person ? encDec.cjs_encrypt(val.sales_person) : '',
            sales_person_name: await helpers.get_admin_name_by_id(val.sales_person),
            convenience_percentage: val.convenience_percentage,
            convenience_fixed: val.convenience_fixed,
            domestic_convenience_percentage: val.domestic_convenience_percentage,
            domestic_convenience_fixed: val.domestic_convenience_fixed,
            international_convenience_percentage: val.international_convenience_percentage,
            international_convenience_fixed: val.international_convenience_fixed,
            international_buy_percentage: val.international_buy_percentage,
            international_buy_fixed: val.international_buy_fixed,
            international_sell_percentage: val.international_sell_percentage,
            international_sell_fixed: val.international_sell_fixed,
            cards: val.cards ? val.cards : '',
            telr_mid: val.telr_mid ? val.telr_mid : ''
          };
          sendRes.push(res);
        }
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

};
module.exports = allData;