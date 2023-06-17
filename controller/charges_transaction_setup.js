const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const helpers = require('../utilities/helper/general_helper');
const maintenanceModule = require('../models/charges_transaction_setup_Module');
const dynamicPricingCalculation = require('../models/dynamic_pricing_calculation');
const merchantModel = require('../models/merchantmodel');
const submerchantModel = require('../models/submerchantmodel');
const ordersModel = require('../models/merchantOrder');
const transactionModel = require('../models/transactions');
const encDec = require('../utilities/decryptor/decryptor');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });
const excel = require('exceljs');
const PDFDocument = require('pdfkit-table');

let transaction = {
  transaction_add: async (req, res) => {
    let registerAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
    // let charges_type = req.bodyString('charges_type');
    const resp = [];
    const respo = [];
    let document = req.body.buy_sell;
    let sell = req.body.sell;
    let mcc = req.bodyString('mcc');
    let textParts = mcc.split(',');
    let textParts1;
    let encryptedText='';
    let mccId;
    for (let i = 0.; i < textParts.length; i++) {
      textParts1 = await encDec.cjs_decrypt(textParts[i]);
      encryptedText += (textParts1+',');
    }
    let transactionData = {
      plan_name: req.bodyString('plan_name'),
      psp: await encDec.cjs_decrypt(req.bodyString('psp')),
      mcc: encryptedText,
      currency: req.bodyString('currency'),
      payment_mode: req.bodyString('payment_mode'),
      international_transaction_volume: req.bodyString('max_international_transaction_volume'),
      mcp_fee: req.bodyString('mcp_activation_fee'),
      mid_setup_fee: req.bodyString('mid_setup_fee'),
      mid_annual_fee: req.bodyString('mid_annual_fee'),
      per_tr_val_fraud: req.bodyString('per_of_tr_val_fraud'),
      fixed_amount_fraud: req.bodyString('fixed_amount_fraud'),
      fraud_engine: parseFloat(req.bodyString('per_of_tr_val_fraud')) + parseFloat(req.bodyString('fixed_amount_fraud')),
      per_tr_val_refund: req.bodyString('per_of_tr_val_refund'),
      fixed_amount_refund: req.bodyString('fixed_amount_refund'),
      refund_fee: parseFloat(req.bodyString('per_of_tr_val_refund')) + parseFloat(req.bodyString('fixed_amount_refund')),
      per_tr_val_processing: req.bodyString('per_of_tr_val_processing'),
      fixed_amount_processing: req.bodyString('fixed_amount_processing'),
      chargeback_processing_fee: parseFloat(req.bodyString('per_of_tr_val_processing')) + parseFloat(req.bodyString('fixed_amount_processing')),
      monthly_tpv: req.bodyString('monthly_tpv'),
      monthly_margin: req.bodyString('monthly_margin'),
      onboarding_fee: req.bodyString('onboarding_fee'),
      charges_type: req.bodyString('charges_type'),
      // transaction_type: req.bodyString('transaction_type'),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      added_date: registerAt,
      status: 0,
      added_by: req.user.id,
    };
    maintenanceModule.register(transactionData).then(async (result) => {
      let resultType = await maintenanceModule.selectOne({ id: result.insertId });
      let type = resultType.charges_type;
      let resp = [];
      let resp1 = [];
      let rtl = [];
      if (type === 'Slab' || type === 'volume_Base') {
        let slabData;
        let sellData;
        for (let i = 0; i < document.length; i++) {
          slabData = {
            'transaction_setup_id': result.insertId,
            'transaction_type': document[i].transaction_type,
            'buy_from_amount': document[i].buy_from_amount,
            'buy_to_amount': document[i].buy_to_amount,
            'buy_per_charges': document[i].buy_per_charges,
            'buy_fix_amount': document[i].buy_fix_amount,
            'buy_min_charge_amount': document[i].buy_min_charge_amount,
            'buy_max_charge_amount': document[i].buy_max_charge_amount,
            'buy_tax': document[i].buy_tax,

            'sell_from_amount': document[i].sell_from_amount,
            'sell_to_amount': document[i].sell_to_amount,
            'sell_per_charges': document[i].sell_per_charges,
            'sell_fixed_amount': document[i].sell_fixed_amount,
            'sell_min_charge_amount': document[i].sell_min_charge_amount,
            'sell_max_charge_amount': document[i].sell_max_charge_amount,
            'sell_tax': document[i].sell_tax,
          };
          resp.push(slabData);
        }
        await maintenanceModule.add_slab(resp);
      }
      else if (resultType.charges_type === 'Flat') {
        let slabData;
        for (let i = 0; i < document.length; i++) {
          slabData = {
            'transaction_setup_id': result.insertId,
            'transaction_type': document[i].transaction_type,
            'buy_per_charges': document[i].buy_per_charges,
            'buy_fix_amount': document[i].buy_fix_amount,
            'buy_min_charge_amount': document[i].buy_min_charge_amount,
            'buy_max_charge_amount': document[i].buy_max_charge_amount,
            'buy_tax': document[i].buy_tax,

            'sell_per_charges': document[i].sell_per_charges,
            'sell_fixed_amount': document[i].sell_fixed_amount,
            'sell_min_charge_amount': document[i].sell_min_charge_amount,
            'sell_max_charge_amount': document[i].sell_max_charge_amount,
            'sell_tax': document[i].sell_tax,
          };
          resp.push(slabData);
        }
        await maintenanceModule.add_slab(resp);
        // for (i = 0; i < sell.length; i++) {
        //    sell_data = {
        //       'transaction_setup_id': result.insertId,
        //       'transaction_type': sell[i].transaction_type,
        //       'sell_per_charges': sell[i].sell_per_charges,
        //       'sell_fixed_amount': sell[i].sell_fixed_amount,
        //       'sell_min_charge_amount': sell[i].sell_min_charge_amount,
        //       'sell_max_charge_amount': sell[i].sell_max_charge_amount,
        //       'sell_tax': sell[i].sell_tax,
        //    }
        //    resp1.push(sell_data)
        // }
        // await maintenanceModule.add_slab(resp1);
      } else {
        res.status(statusCode.internalError).send(response.errormsg('Select Valid Charges Type'));
      }

      res.status(statusCode.ok).send(response.successmsg('Added successfully'));
    }).catch((error) => {

      res.status(statusCode.internalError).send(response.errormsg(error));
    });
  },

  transaction_list: async (req, res) => {
    const pspName = await maintenanceModule.getPSPName();
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
    let likeSearch = {};

    if (req.bodyString('search')) {
      likeSearch.psp = req.bodyString('search');
    }
    let result = await maintenanceModule.select('*', limit, likeSearch);

    let sendRes = [];
    for (let val of result) {
      let res = {
        setup_id: encDec.cjs_encrypt(val.id),
        plan_name: val.plan_name,
        psp: val.psp,
        psp_name: pspName[val.psp],
        mcc: val.mcc,
        mcc_code: await maintenanceModule.getMCCName(val.mcc),
        currency: val.currency,
        payment_mode: val.payment_mode,
        mcp_activation_fee: val.mcp_fee,
        mid_setup_fee: val.mid_setup_fee,
        mid_annual_fee: val.mid_annual_fee,
        fraud_engine: val.fraud_engine,
        refund_fee: val.refund_fee,
        processing_fee: val.chargeback_processing_fee,
        monthly_tpv: val.monthly_TPV,
        monthly_margin: val.monthly_margin,
        charges_type: val.charges_type,
        status: val.status === 1 ? 'Deactivated' : 'Activated',
      };
      sendRes.push(res);
    }
    let totalCount = await maintenanceModule.get_counts(likeSearch);
    res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.', totalCount));
  },

  transaction_details: async (req, res) => {
    let id = await encDec.cjs_decrypt(req.bodyString('setup_id'));
    const pspName = await maintenanceModule.getPSPName();
    maintenanceModule.selectOne({ id: id })
      .then(async (result) => {
        let sendRes = [];
        let val = result;
        let res1 = {
          setup_id: encDec.cjs_encrypt(val.id),
          plan_name: val.plan_name,
          psp: encDec.cjs_encrypt(val.psp),
          psp_name: pspName[val.psp],
          mcc: encDec.cjs_encrypt(val.mcc),
          mcc_code: await maintenanceModule.getMCCName(val.mcc),
          currency: val.currency,
          payment_mode: val.payment_mode,
          payment_mode_name: await maintenanceModule.getPaymentMode(val.payment_mode),
          mcp_activation_fee: val.mcp_fee,
          mid_setup_fee: val.mid_setup_fee,
          mid_annual_fee: val.mid_annual_fee,
          per_tr_val_fraud: val.per_tr_val_fraud,
          fixed_amount_fraud: val.fixed_amount_fraud,
          fraud_engine: val.fraud_engine,
          per_of_tr_val_refund: val.per_tr_val_refund,
          fixed_amount_refund: val.fixed_amount_refund,
          refund_fee: val.refund_fee,
          per_of_tr_val_processing: val.per_tr_val_processing,
          fixed_amount_processing: val.fixed_amount_processing,
          processing_fee: val.chargeback_processing_fee,

          monthly_tpv: val.monthly_tpv,
          monthly_margin: val.monthly_margin,
          onboarding_fee: val.onboarding_fee,
          max_international_transaction_volume: val.international_transaction_volume,
          charges_type: val.charges_type,
          status: val.status === 1 ? 'Deactivated' : 'Activated',
          buy: await maintenanceModule.list_of_document({ transaction_setup_id: val.id, 'status': 0 }),
          // sell: await maintenanceModule.list_of_sell(
          //{ transaction_setup_id: val.id, 'status': 0 }),

        };
          
        sendRes = res1;
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 
          'Details fetched successfully.'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  transaction_update: async (req, res) => {
    let setupId = await encDec.cjs_decrypt(req.bodyString('setup_id'));
    let chargesType = req.bodyString('charges_type');
    let buy = req.body.buy_sell;
    let sell = req.body.sell;

    // let document = req.body.buy;
    // let sell = req.body.sell;
    var setupData = {
      plan_name: req.bodyString('plan_name'),
      psp: await encDec.cjs_decrypt(req.bodyString('psp')),
      mcc: await encDec.cjs_decrypt(req.bodyString('mcc')),
      currency: req.bodyString('currency'),
      payment_mode: req.bodyString('payment_mode'),
      mcp_fee: req.bodyString('mcp_activation_fee'),
      mid_setup_fee: req.bodyString('mid_setup_fee'),
      mid_annual_fee: req.bodyString('mid_annual_fee'),
      per_tr_val_fraud: req.bodyString('per_of_tr_val_fraud'),
      fixed_amount_fraud: req.bodyString('fixed_amount_fraud'),
      fraud_engine: parseFloat(req.bodyString('per_of_tr_val_fraud')) + parseFloat(req.bodyString('fixed_amount_fraud')),
      per_tr_val_refund: req.bodyString('per_of_tr_val_refund'),
      fixed_amount_refund: req.bodyString('fixed_amount_refund'),
      refund_fee: parseFloat(req.bodyString('per_of_tr_val_refund')) + parseFloat(req.bodyString('fixed_amount_refund')),
      per_tr_val_processing: req.bodyString('per_of_tr_val_processing'),
      fixed_amount_processing: req.bodyString('fixed_amount_processing'),

      chargeback_processing_fee: parseFloat(req.bodyString('per_of_tr_val_processing')) + parseFloat(req.bodyString('fixed_amount_processing')),
      monthly_TPV: req.bodyString('monthly_tpv'),
      monthly_margin: req.bodyString('monthly_margin'),
      onboarding_fee: req.bodyString('onboarding_fee'),
      charges_type: chargesType,
      // transaction_type: req.bodyString('transaction_type'),
      international_transaction_volume: req.bodyString('max_international_transaction_volume'),
    };

    maintenanceModule.updateDetails({ id: setupId }, setupData).then(async (result) => {
      let resultType = await maintenanceModule.selectOne({ id: setupId });
      let type = resultType.charges_type;
      let resp = [];
      let resp1 = [];

      if (type === 'Slab' || type === 'volume_Base') {
        let slabData;
        let sellData;
        let documentObj;
        for (let i = 0; i < buy.length; i++) {
          if (buy[i].id) {
            documentObj = {
              'transaction_type': buy[i].transaction_type,
              'buy_from_amount': buy[i].buy_from_amount,
              'buy_to_amount': buy[i].buy_to_amount,
              'buy_per_charges': buy[i].buy_per_charges,
              'buy_fix_amount': buy[i].buy_fix_amount,
              'buy_min_charge_amount': buy[i].buy_min_charge_amount,
              'buy_max_charge_amount': buy[i].buy_max_charge_amount,
              'buy_tax': buy[i].buy_tax,
              'sell_from_amount': buy[i].sell_from_amount,
              'sell_to_amount': buy[i].sell_to_amount,
              'sell_per_charges': buy[i].sell_per_charges,
              'sell_fixed_amount': buy[i].sell_fixed_amount,
              'sell_min_charge_amount': buy[i].sell_min_charge_amount,
              'sell_max_charge_amount': buy[i].sell_max_charge_amount,
              'sell_tax': buy[i].sell_tax,
            };
          }
          
          if (buy[i].id === '') {
            documentObj = {
              'transaction_setup_id': setupId,
              'transaction_type': buy[i].transaction_type,
              'buy_from_amount': buy[i].buy_from_amount,
              'buy_to_amount': buy[i].buy_to_amount,
              'buy_per_charges': buy[i].buy_per_charges,
              'buy_fix_amount': buy[i].buy_fix_amount,
              'buy_min_charge_amount': buy[i].buy_min_charge_amount,
              'buy_max_charge_amount': buy[i].buy_max_charge_amount,
              'buy_tax': buy[i].buy_tax,
              'sell_from_amount': buy[i].sell_from_amount,
              'sell_to_amount': buy[i].sell_to_amount,
              'sell_per_charges': buy[i].sell_per_charges,
              'sell_fixed_amount': buy[i].sell_fixed_amount,
              'sell_min_charge_amount': buy[i].sell_min_charge_amount,
              'sell_max_charge_amount': buy[i].sell_max_charge_amount,
              'sell_tax': buy[i].sell_tax,
            };
            await maintenanceModule.add_slab(documentObj);
          } else {
            await maintenanceModule.updateSlab(
              { id: encDec.cjs_decrypt(buy[i].id) }, documentObj);
          }
        }
      }
      else if (type === 'Flat') {
        for (let i = 0; i < buy.length; i++) {
          if (buy[i].id) {
            let documentObj = {
              'transaction_type': buy[i].transaction_type,
              'buy_per_charges': buy[i].buy_per_charges,
              'buy_fix_amount': buy[i].buy_fix_amount,
              'buy_min_charge_amount': buy[i].buy_min_charge_amount,
              'buy_max_charge_amount': buy[i].buy_max_charge_amount,
              'buy_tax': buy[i].buy_tax,
              'sell_per_charges': buy[i].sell_per_charges,
              'sell_fixed_amount': buy[i].sell_fixed_amount,
              'sell_min_charge_amount': buy[i].sell_min_charge_amount,
              'sell_max_charge_amount': buy[i].sell_max_charge_amount,
              'sell_tax': buy[i].sell_tax,
            };
            await maintenanceModule.updateSlab(
              { id: encDec.cjs_decrypt(buy[i].id) }, documentObj);
          }
        }
      }else {
        res.status(statusCode.internalError).send(response.errormsg('Select Valid Charges Type'));
      }
      res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
    }).catch((error) => {
      res.status(statusCode.internalError).send(response.errormsg(error));
    });
  },

   transaction_deactivate: async (req, res) => {
      let setup_id = await encDec.cjs_decrypt(req.bodyString('setup_id'));
      try {
         var insdata = {
            'status': '1'
         };
         var ins_id = await maintenanceModule.updateDetails({ id: setup_id }, insdata);
         let ins_doc = await maintenanceModule.updateSlab({ transaction_setup_id: setup_id }, insdata)
         res.status(statusCode.ok).send(response.successmsg('Record deactivated successfully'));
      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   transaction_activate: async (req, res) => {
      try {
         let setup_id = await encDec.cjs_decrypt(req.bodyString('setup_id'));
         var insdata = {
            'status': '0'
         };
         var ins_id = await maintenanceModule.updateDetails({ id: setup_id }, insdata);
         let ins_doc = await maintenanceModule.updateSlab({ transaction_setup_id: setup_id }, insdata)
         res.status(statusCode.ok).send(response.successmsg('Record activated successfully'));
      } catch {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   slab_deactivate: async (req, res) => {
      let id = await encDec.cjs_decrypt(req.bodyString('id'));
      try {
         var insdata = {
            'status': 1
         };
         let ins_doc = await maintenanceModule.updateSlab({ id: id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Record deactivated successfully'));
      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));

      }
   },


   slab_add: async (req, res) => {
      let setup_id = await encDec.cjs_decrypt(req.bodyString('setup_id'));
      let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let type = req.bodyString('charges_type');
      let buy = req.body.buy;
      let sell = req.body.sell;
      let check_data = await maintenanceModule.selectOne({ id: setup_id })
         .then(async (result) => {
            let resp = [];
            let resp1 = [];
            let sell_data;
            let lb = [];
            let ub = [];
            let buy_data;
            if (result.charges_type == 'Slab') {
               for (i = 0; i < buy.length; i++) {
                  buy_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': document[i].transaction_type,
                     'buy_from_amount': document[i].buy_from_amount,
                     'buy_to_amount': document[i].buy_to_amount,
                     'buy_per_charges': document[i].buy_per_charges,
                     'buy_fix_amount': document[i].buy_fix_amount,
                     'buy_min_charge_amount': document[i].buy_min_charge_amount,
                     'buy_max_charge_amount': document[i].buy_max_charge_amount,
                     'buy_tax': document[i].buy_tax,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp.push(buy_data)
               }

               await maintenanceModule.add_slab(resp);
               for (i = 0; i < sell.length; i++) {
                  sell_data = {
                     'transaction_type': sell[i].transaction_type,
                     'sell_from_amount': sell[i].sell_from_amount,
                     'sell_to_amount': sell[i].sell_to_amount,
                     'sell_per_charges': sell[i].sell_per_charges,
                     'sell_fixed_amount': sell[i].sell_fixed_amount,
                     'sell_min_charge_amount': sell[i].sell_min_charge_amount,
                     'sell_max_charge_amount': sell[i].sell_max_charge_amount,
                     'sell_tax': sell[i].sell_tax,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp1.push(sell_data)
               }

              
               await maintenanceModule.add_slab(resp1);

            }
            else if (result.charges_type == 'Flat') {
               for (i = 0; i < buy.length; i++) {
                  buy_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': document[i].transaction_type,
                     // 'from': buy[i].from_amount,
                     // 'to': buy[i].to_amount,
                     'buy_per_charges': document[i].buy_per_charges,
                     'buy_fix_amount': document[i].buy_fix_amount,
                     'buy_min_charge_amount': document[i].buy_min_charge_amount,
                     'buy_max_charge_amount': document[i].buy_max_charge_amount,
                     'buy_tax': document[i].buy_tax,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp.push(buy_data)
               }
               await maintenanceModule.add_slab(resp);
               for (i = 0; i < sell.length; i++) {
                  sell_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': sell[i].transaction_type,
                     // 'sell_from_amount': sell[i].from_amount,
                     // 'sell_to_amount': sell[i].to_amount,
                     'sell_per_charges': sell[i].sell_per_charges,
                     'sell_fixed_amount': sell[i].sell_fixed_amount,
                     'sell_min_charge_amount': sell[i].sell_min_charge_amount,
                     'sell_max_charge_amount': sell[i].sell_max_charge_amount,
                     'sell_tax': sell[i].sell_tax,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp1.push(sell_data)
               }
               await maintenanceModule.add_slab(resp1);

            }
            else if (result.charges_type == 'volume_Base') {
               for (i = 0; i < buy.length; i++) {
                  buy_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': result.transaction_type,
                     'from': buy[i].from_amount,
                     'to': buy[i].to_amount,
                     'per_charges': buy[i].charges_in_percent,
                     'fix_amt': buy[i].fixed_amount,
                     'min': buy[i].min_charges,
                     'max': buy[i].max_charges,
                     'per_tax': buy[i].tax_in_percent,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp.push(buy_data)
               }
               await maintenanceModule.add_slab(resp);
               for (i = 0; i < sell.length; i++) {
                  sell_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': result.transaction_type,
                     'sell_from_amount': sell[i].from_amount,
                     'sell_to_amount': sell[i].to_amount,
                     'sell_per_charges': sell[i].charges_in_percent,
                     'sell_fixed_amount': sell[i].fixed_amount,
                     'sell_min_charges': sell[i].min_charges,
                     'sell_max_charges': sell[i].max_charges,
                     'sell_per_tax': sell[i].tax_in_percent,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp1.push(sell_data)
               }
               await maintenanceModule.add_slab(resp1);

            }
            else {
               res.status(statusCode.internalError).send(response.errormsg('Not valid charges type'));
            }
            res.status(statusCode.ok).send(response.successmsg('Added successfully'));


         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })


   },


   slab_list: async (req, res) => {
      let limit = {
         perpage: 0,
         page: 0,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }
      maintenanceModule.select_slab(limit)
         .then(async (result) => {
            let send_res = [];
            for (let val of result) {
               // result.forEach(async function (val, key) {
               let res = {
                  transaction_id: encDec.cjs_encrypt(val.id),
                  buy: await maintenanceModule.list_of_document({ transaction_setup_id: val.id }),
                  sell: await maintenanceModule.list_of_sell({ transaction_setup_id: val.id }),
                  status: (val.status == 1) ? 'Deactivated' : 'Active',
               };
               send_res.push(res);
            };

           
            res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.'));
         })
         .catch((error) => {
         
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         });
   },


   slab_update: async (req, res) => {
      try {
         let transaction_id = encDec.cjs_decrypt(req.bodyString('setup_id'));
         let match_data = await maintenanceModule.selectOne({ id: transaction_id });
         let buy = req.body.buy;
         let sell = req.body.sell;
         if (match_data) {
            // let document = req.body.data;
           
            let document_obj;
            let document_add = [];
            if (match_data.charges_type == 'Slab' || match_data.charges_type == 'volume_Base') {
               for (let i = 0; i < buy.length; i++) {
                  if (buy[i].id) {
                     document_obj = {
                        'buy_from_amount': buy[i].from_amount,
                        'buy_to_amount	': buy[i].to_amount,
                        'transaction_type': buy[i].transaction_type,
                        'buy_per_charges': buy[i].charges_in_percent,
                        'buy_fix_amount': buy[i].fixed_amount,
                        'buy_min_charge_amount	': buy[i].min_charges,
                        'buy_max_charge_amount': buy[i].max_charges,
                        'buy_tax': buy[i].tax_in_percent,
                     }
                     await maintenanceModule.updateSlab({ id: encDec.cjs_decrypt(buy[i].id) }, document_obj)
                  }
               }
               for (let i = 0; i < sell.length; i++) {
                  if (sell[i].id) {
                     document_obj = {
                        'sell_from_amount': sell[i].from_amount,
                        'sell_to_amount	': sell[i].to_amount,
                        'transaction_type': sell[i].transaction_type,
                        'sell_per_charges': sell[i].charges_in_percent,
                        'sell_fixed_amount': sell[i].fixed_amount,
                        'sell_min_charge_amount': sell[i].min_charges,
                        'sell_max_charge_amount': sell[i].max_charges,
                        'sell_tax': sell[i].tax_in_percent,
                     }
                     await maintenanceModule.updateSlab({ id: encDec.cjs_decrypt(sell[i].id) }, document_obj)
                  }
               }

            }
            else if (match_data.charges_type == 'Flat') {
               for (let i = 0; i < buy.length; i++) {
                  if (buy[i].id) {
                     document_obj = {
                        'transaction_type': buy[i].transaction_type,
                        'buy_per_charges': buy[i].charges_in_percent,
                        'buy_fix_amount': buy[i].fixed_amount,
                        'buy_min_charge_amount': buy[i].min_charges,
                        'buy_max_charge_amount': buy[i].max_charges,
                        'buy_tax': buy[i].tax_in_percent,

                     }
                     await maintenanceModule.updateSlab({ id: encDec.cjs_decrypt(buy[i].id) }, document_obj)
                  }
               }
               for (let i = 0; i < sell.length; i++) {
                  if (sell[i].id) {
                     document_obj = {
                        'transaction_type': sell[i].transaction_type,
                        'sell_per_charges': sell[i].charges_in_percent,
                        'sell_fixed_amount': sell[i].fixed_amount,
                        'sell_min_charge_amount': sell[i].min_charges,
                        'sell_max_charge_amount': sell[i].max_charges,
                        'sell_tax': sell[i].tax_in_percent,
                     }
                     await maintenanceModule.updateSlab({ id: encDec.cjs_decrypt(sell[i].id) }, document_obj)
                  }
               }

            }
            res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
         } else {
            res.status(statusCode.internalError).send(response.errormsg('Details not available.'));
         }
      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }

   },

   slab_sell_add: async (req, res) => {
      let setup_id = await encDec.cjs_decrypt(req.bodyString('setup_id'));
      let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let type = req.bodyString('charges_type');
      let buy = req.body.buy;
      let sell = req.body.sell;
      let check_data = await maintenanceModule.selectOne({ id: setup_id })
         .then(async (result) => {
            let resp = [];
            let resp1 = [];
            let sell_data;
            let buy_data;
            if (result.charges_type == 'Slab') {
               for (i = 0; i < sell.length; i++) {
                  sell_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': result.transaction_type,
                     'sell_from_amount': sell[i].from_amount,
                     'sell_to_amount': sell[i].to_amount,
                     'sell_per_charges': sell[i].charges_in_percent,
                     'sell_fixed_amount': sell[i].fixed_amount,
                     'sell_min_charges': sell[i].min_charges,
                     'sell_max_charges': sell[i].max_charges,
                     'sell_per_tax': sell[i].tax_in_percent,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp1.push(sell_data)
               }
               await maintenanceModule.add_slab(resp1);

            } else if (result.charges_type == 'Flat') {
               for (i = 0; i < sell.length; i++) {
                  sell_data = {
                     'transaction_setup_id': result.id,
                     'transaction_type': result.transaction_type,
                     'sell_per_charges': sell[i].charges_in_percent,
                     'sell_fixed_amount': sell[i].fixed_amount,
                     'sell_min_charges': sell[i].min_charges,
                     'sell_max_charges': sell[i].max_charges,
                     'sell_per_tax': sell[i].tax_in_percent,
                     'charges_type': result.charges_type,
                     'added_date': register_at,
                     'added_by': req.user.id,
                     'ip': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                  }
                  resp1.push(sell_data)
               }
               await maintenanceModule.add_slab(resp1);

            } else {
               res.status(statusCode.internalError).send(response.errormsg('Not valid charges type'));
            }
            res.status(statusCode.ok).send(response.successmsg('Added successfully'));
         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })


   },

   payment_mode_list: async (req, res) => {
      let limit = {
         perpage: 0,
         page: 0,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }
      let like_search = {}

      if (req.bodyString('search')) {
         like_search.plan_name = req.bodyString('search');
      }
      let result = await maintenanceModule.select_payment_mode('*', limit, like_search);

      let send_res = [];
      for (let val of result) {

         let res = {
            mode_id: encDec.cjs_encrypt(val.id),
            payment_mode: val.payment_mode,
         };
         send_res.push(res);
      }

      let total_count = await maintenanceModule.get_counts_payment_mode(like_search);
      res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
   },

   transaction_charges_testing: async (req,res) => {
      //need to check merchant kyc done or not in validation
      let all_active_merchants = await merchantModel.getAllActivatedMerchant();
      let active_merchants_ids = all_active_merchants.split(',')
      let merchant_ids_arr = []
      let batch = 0
      let batch_size = 10
      while(1){
         let ids_batch = active_merchants_ids.slice(batch, batch+batch_size);
         batch = batch+batch_size
         if(ids_batch[0]){
            merchant_ids_arr.push(ids_batch);
         }else{
            break;
        }
      }

      let response_send = []

      for (let i = 0; i < merchant_ids_arr.length; i++) {
         let response_arr = []
         for(let j = 0; j < merchant_ids_arr[i].length; j++){
            response_arr.push(transaction.dynamic_charges_add(merchant_ids_arr[i][j]));
         }
         response_send.push(await Promise.all(response_arr))
      }

      res.status(statusCode.ok).send(response_send);
   },

   transaction_charges: async () => {
      //need to check merchant kyc done or not in validation
      let all_active_merchants = await merchantModel.getAllActivatedMerchant();
      let active_merchants_ids = all_active_merchants.split(',')
      let merchant_ids_arr = []
      let batch = 0
      let batch_size = 10
      while(1){
         let ids_batch = active_merchants_ids.slice(batch, batch+batch_size);
         batch = batch+batch_size
         if(ids_batch[0]){
            merchant_ids_arr.push(ids_batch);
         }else{
            break;
        }
      }

      let response_send = []

      for (let i = 0; i < merchant_ids_arr.length; i++) {
         let response_arr = []
         for(let j = 0; j < merchant_ids_arr[i].length; j++){
            response_arr.push(transaction.dynamic_charges_add(merchant_ids_arr[i][j]));
         }
         response_send.push(await Promise.all(response_arr))
      }

      return response_send;
   },
   dynamic_charges_add: async (merchant_id) => {
      let buy_percentage=0,buy_fixed=0,sell_percentage=0,sell_fixed=0,convenience_percentage=0,fixed_amount=0;
      let convenience_fixed=0,domestic_convenience_percentage=0,domestic_convenience_fixed=0;
      let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let yesterdays_date = moment().subtract(1, 'day').format('YYYY-MM-DD');
      let todays_date = moment().format('YYYY-MM-DD');

      let [merchant_details, merchant_charges, monthly_txn_sum, daily_transaction_total, refunded_txn,
      check_sales_refund_added
      ] = await Promise.all([
         merchantModel.selectOne('id,activation_date,super_merchant_id',{id:merchant_id}),
         submerchantModel.selectOneMID('buy_percentage,buy_fixed,sell_percentage,sell_fixed,convenience_percentage,convenience_fixed,domestic_convenience_percentage,domestic_convenience_fixed',{submerchant_id:merchant_id}),
         dynamicPricingCalculation.currentMonthTxnSum(merchant_id),
         dynamicPricingCalculation.getTxnTotalByDate(merchant_id,yesterdays_date),
         dynamicPricingCalculation.getTxnRefundTotalByDate(merchant_id,yesterdays_date),
         dynamicPricingCalculation.getCountForTxnType(merchant_id,todays_date)
      ]);

      let monthly_charges_response = await transaction.add_monthly_charges(merchant_details,monthly_txn_sum);

      let pricing_charges = await ordersModel.selectDynamic('*',{'from_amount <=':monthly_txn_sum,'to_amount >=':monthly_txn_sum},'pricing_plan');
      let vat = parseFloat(pricing_charges[0].vat_percentage);

      if(!merchant_charges[0] || (merchant_charges[0]?.sell_percentage == 0 && merchant_charges[0]?.sell_fixed == 0)){
         sell_percentage = pricing_charges[0].percentage_value;//mdr
         fixed_amount = pricing_charges[0].fixed_amount;//txn_fees
      }else{
         //buy_percentage = merchant_charges[0].buy_percentage;
         //buy_fixed = merchant_charges[0].buy_fixed;
         sell_percentage = merchant_charges[0].sell_percentage;//mdr
         sell_fixed = merchant_charges[0].sell_fixed;//mdr
         convenience_percentage = merchant_charges[0].convenience_percentage;//txn_fees
         convenience_fixed = merchant_charges[0].convenience_fixed;//txn_fees
         domestic_convenience_percentage = merchant_charges[0].domestic_convenience_percentage;//txn_fees
         domestic_convenience_fixed = merchant_charges[0].domestic_convenience_fixed;//txn_fees
      }

      //For sales
      let volume = daily_transaction_total.total?parseFloat(daily_transaction_total.total):0
      let no_of_transactions = daily_transaction_total.count?daily_transaction_total.count:0
      let mdr = parseFloat(await helpers.percentage(parseFloat(sell_percentage),parseFloat(volume)))+(parseFloat(sell_fixed)*parseFloat(no_of_transactions));

      let txn_fees = parseFloat(await helpers.percentage(convenience_percentage,volume))+parseFloat(convenience_fixed*no_of_transactions)+parseFloat(await helpers.percentage(domestic_convenience_percentage,volume))+parseFloat(domestic_convenience_fixed*no_of_transactions)+parseFloat(fixed_amount*no_of_transactions);
      let percentage_vat = parseFloat(await helpers.percentage(vat,(mdr+txn_fees)))
      let debit_credit = parseFloat(volume)+parseFloat(percentage_vat)

      if(volume && (check_sales_refund_added.txn_type == null || !check_sales_refund_added.txn_type.includes("Sales"))){
         let sales_charges = {
            added_date:added_date,
            value_date:yesterdays_date,
            merchant_id:merchant_id,
            super_merchant_id:merchant_details.super_merchant_id,
            txn_type:'Sales',
            no_of_txn:no_of_transactions, //no of txn
            volume:volume,
            monthly_fees:0,
            payout_charges:0,
            mdr:volume?(-mdr):0, //mdr
            txn_fees:(volume && txn_fees)?(-txn_fees):0, //txn_fees
            percentage_vat: (volume && percentage_vat)?(-percentage_vat):0, //percentage VAT
            debit_credit:debit_credit, //debit-credit
            balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(debit_credit),
            update_date:added_date,
         }
         await dynamicPricingCalculation.insert(sales_charges); //temp comment
      }

      //check refunds
      let refund_volume = refunded_txn.total?parseFloat(refunded_txn.total):0
      let refund_no_of_transactions = refunded_txn.count?refunded_txn.count:0

      if(refund_volume && (check_sales_refund_added.txn_type == null || !check_sales_refund_added.txn_type.includes("Refund"))){
         let mdr_refund_tx = {
            added_date:added_date,
            value_date:yesterdays_date,
            merchant_id:merchant_id,
            super_merchant_id:merchant_details.super_merchant_id,
            txn_type:'Refund',
            no_of_txn:(-refund_no_of_transactions),
            volume:(-refund_volume),
            monthly_fees:0,
            payout_charges:0,
            mdr:0,
            txn_fees:0, 
            percentage_vat: 0,
            debit_credit:(-refund_volume), //credit debit
            balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(-refund_volume),
            update_date:added_date,
         }
         await dynamicPricingCalculation.insert(mdr_refund_tx);
      }  

      if(monthly_charges_response.slab_changed == 1){    
         let mdr_response = await dynamicPricingCalculation.mdr_credit_for_slab_changes(merchant_id,monthly_charges_response.monthly_charges_id)
         let mdr_credit_mc = (mdr_response.mdr_credit != 0)?parseFloat(-(mdr_response.mdr_credit)):0
         let txn_fees_mc = (mdr_response.txn_fees != 0)?parseFloat(-(mdr_response.txn_fees)):0

         //need to change logic here

         let percentage_vat_mdr_credit = parseFloat(await helpers.percentage(vat,(mdr_credit_mc+txn_fees_mc)));
         let debit_credit_mc = mdr_credit_mc+txn_fees_mc+percentage_vat_mdr_credit;

         let mdr_credit_charges_charges = {
            added_date:added_date,
            value_date:added_date,
            merchant_id:merchant_id,
            super_merchant_id:merchant_details.super_merchant_id,
            txn_type:'MDR credit',
            no_of_txn:0,
            volume:0,
            monthly_fees:0,
            payout_charges:0,
            mdr:mdr_credit_mc,
            txn_fees:txn_fees_mc,
            percentage_vat: percentage_vat_mdr_credit,
            debit_credit:debit_credit_mc,
            balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(debit_credit_mc),
            update_date:added_date,
         }

         await dynamicPricingCalculation.insert(mdr_credit_charges_charges);
         let mdr_tx = await dynamicPricingCalculation.mdr_for_slab_changes(merchant_id,monthly_charges_response.monthly_charges_id)

         let mdr_tx_volume = (mdr_tx.volume)?parseFloat(mdr_tx.volume):0
         let mdr_tx_no_of_txn = (mdr_tx.no_of_txn)?parseFloat(mdr_tx.no_of_txn):0
         let mdr_tx_mc = (await helpers.percentage(parseFloat(sell_percentage),mdr_tx_volume))+(sell_fixed*mdr_tx_no_of_txn);

         let txn_fees_tx_mc = 
         parseFloat(await helpers.percentage(convenience_percentage,mdr_tx_volume))
         +parseFloat(convenience_fixed*mdr_tx_no_of_txn)
         +parseFloat(await helpers.percentage(domestic_convenience_percentage,parseFloat(mdr_tx_volume)))
         +parseFloat(domestic_convenience_fixed*mdr_tx_no_of_txn);

         let percentage_vat_mdr = parseFloat(await helpers.percentage(vat,(parseFloat(mdr_tx_mc)+parseFloat(txn_fees_tx_mc))));

         let debit_credit_tx = parseFloat(mdr_tx_mc)+parseFloat(txn_fees_tx_mc)+parseFloat(percentage_vat_mdr);

         let mdr_charges_tx = {
            added_date:added_date,
            value_date:added_date,
            merchant_id:merchant_id,
            super_merchant_id:merchant_details.super_merchant_id,
            txn_type:'MDR',
            no_of_txn:0,
            volume:0,
            monthly_fees:0,
            payout_charges:0,
            mdr:mdr_tx_mc?parseFloat(-mdr_tx_mc):0, //mdr
            txn_fees:(txn_fees_tx_mc)?(-txn_fees_tx_mc):0,   //txn_fees
            percentage_vat: percentage_vat_mdr?(-percentage_vat_mdr):0, // percentage VAT
            debit_credit:debit_credit_tx?(-debit_credit_tx):0, //credit debit
            balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(-debit_credit_tx),
            update_date:added_date,
         }
         
         await dynamicPricingCalculation.insert(mdr_charges_tx);
      }

     //mid plan
     return {merchant_id:merchant_id,result:true};
     //res.status(statusCode.ok).send('success');
   },

   add_monthly_charges: async(merchant_details,monthly_txn_sum)=>{
      let merchant_id = merchant_details.id;
      let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let response = {
         transactions:1, //initial value
         slab_changed:0 //initial value
      }
      
      //last transaction
      let [last_monthly_charges,pricing_plans,last_transaction,currentMonthChargesTaken] = await Promise.all([
         dynamicPricingCalculation.checkLastMonthlyChargesTaken(merchant_id),
         ordersModel.selectDynamic('*',{'deleted':0},'pricing_plan'),
         dynamicPricingCalculation.checkLastTransactionId(merchant_id),
         dynamicPricingCalculation.getCurrentMonthChargesTaken(merchant_id),
      ]);

      let insert = 0,vat,debit_credit,percentage_vat;
      let monthly_fees = pricing_plans[0].monthly_fee;
      
      if(!last_monthly_charges){
         if(merchant_details.activation_date){
            let endOfMonth   = moment(merchant_details.activation_date).endOf('month').format('D');
            let activation_date   = moment(merchant_details.activation_date).format('D');
            let activated_days =  endOfMonth-activation_date+1;
            monthly_fees = (monthly_fees/endOfMonth)*activated_days;
         }
         vat = await helpers.percentage(pricing_plans[0].vat_percentage,monthly_fees);
         vat = parseFloat(vat)
         monthly_fees = parseFloat(monthly_fees)
         percentage_vat = (-(vat)).toFixed(2)
         debit_credit = (-(monthly_fees + vat)).toFixed(2);
         insert = 1;
         console.log('scenario 1');
      }

      //check if first transaction
      if(!last_transaction){
         //add monthly fees because no transaction done yet by merchant (any transaction not done yet)
         let last_charges_month = moment(last_monthly_charges.added_date).format('M')
         let current_month = moment().format('M')
         if(last_monthly_charges && last_charges_month != current_month){
            monthly_fees = pricing_plans[0].monthly_fee;
            vat = await helpers.percentage(pricing_plans[0].vat_percentage,monthly_fees);
            vat = parseFloat(vat)
            monthly_fees = parseFloat(monthly_fees)
            percentage_vat = (-(vat)).toFixed(2)
            debit_credit = (-(monthly_fees + vat)).toFixed(2);
            insert = 1;
            console.log('scenario 2');
         }

         response.transaction = 0;
      }else if(last_monthly_charges){
         if(currentMonthChargesTaken){
            let current_month_txn_sum = monthly_txn_sum;
            let current_slab;
           
            for (let i = 0; i < pricing_plans.length; i++) {
               let element = pricing_plans[i];
               if(element.from_amount <= current_month_txn_sum && element.to_amount >= current_month_txn_sum){
                  current_slab = element;
                  break;
               }
            }

            if(-(currentMonthChargesTaken.monthly_fees) != current_slab.monthly_fee){
               //slab changed
               let monthly_charges_return = {
                  added_date:added_date,
                  value_date:added_date,
                  merchant_id:merchant_id,
                  super_merchant_id:merchant_details.super_merchant_id,
                  txn_type:'Fees reversal credit',
                  no_of_txn:0,
                  volume:0,
                  monthly_fees: -(currentMonthChargesTaken.monthly_fees).toFixed(2), //mf
                  payout_charges:0,
                  mdr:0,
                  txn_fees:0,
                  percentage_vat:  -(currentMonthChargesTaken.percentage_vat), //pv
                  debit_credit: -(currentMonthChargesTaken.debit_credit), //cb
                  balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(-(currentMonthChargesTaken.debit_credit)),
                  update_date:added_date,
               }

               let monthly_charges_id = await dynamicPricingCalculation.insert(monthly_charges_return);
               //let monthly_charges_id = {insert_id:57};

               monthly_fees = current_slab.monthly_fee;
               vat = await helpers.percentage(current_slab.vat_percentage,monthly_fees);
               vat = parseFloat(vat)
               monthly_fees = parseFloat(monthly_fees)
               percentage_vat = (-(vat)).toFixed(2)
               debit_credit = (-(monthly_fees + vat)).toFixed(2);
               insert = 1;
               console.log('scenario 3');

               response.slab_changed = 1
               response.new_slab = current_slab
               response.monthly_charges_id = monthly_charges_id.insert_id

            }
            
         }else{
            monthly_fees = -(last_monthly_charges.monthly_fees);
            percentage_vat = last_monthly_charges.percentage_vat;
            debit_credit = last_monthly_charges.debit_credit;
            insert = 1;
            console.log('scenario 4');
         }
      }

      if(insert == 1){
         let monthly_charges = {
            added_date:added_date,
            value_date:added_date,
            merchant_id:merchant_id,
            super_merchant_id:merchant_details.super_merchant_id,
            txn_type:'Monthly fees',
            no_of_txn:0,
            volume:0,
            monthly_fees: (-(monthly_fees)).toFixed(2), //mf
            payout_charges:0,
            mdr:0,
            txn_fees:0,
            percentage_vat: percentage_vat, //pv
            debit_credit:debit_credit, //cb
            balance:parseFloat(await dynamicPricingCalculation.getBalance(merchant_id))+parseFloat(debit_credit),
            update_date:added_date,
         }
         await dynamicPricingCalculation.insert(monthly_charges);
      }
      return response
   },
  dynamic_pricing_list: async (req, res) => {
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
      if (req.user.type == 'merchant') {
          and_filter_obj.super_merchant_id = req.user.id
      }
      
      if (req.bodyString('merchant_id')) {
          and_filter_obj.merchant_id = encDec.cjs_decrypt(req.bodyString('merchant_id'))
      }
      if (req.bodyString('super_merchant')) {
          and_filter_obj.super_merchant_id = encDec.cjs_decrypt(req.bodyString('super_merchant'))
      }
      if (req.bodyString('description') && req.bodyString('description') != '') {
          and_filter_obj.txn_type = req.bodyString('description')
      }

      if (req.bodyString('from_date')) {
          date_condition.from_date = moment(req.bodyString('from_date')).format('YYYY-MM-DD')
      }

      if (req.bodyString('to_date')) {
          date_condition.to_date = moment(req.bodyString('to_date')).format('YYYY-MM-DD')
      }

      dynamicPricingCalculation.select(and_filter_obj, date_condition, limit)
          .then(async (result) => {
              let send_res = [];

              let merchant_ids = await helpers.keyByArr(result,'merchant_id');
              let merchants_name = await helpers.get_merchant_details_name_by_ids(merchant_ids)
              for (let val of result) {
                  let res = {
                      id: encDec.cjs_encrypt(val.id),
                      added_date: val.added_date,
                      date: moment(val.added_date).utc().format('DD-MM-YYYY H:mm:ss'),
                      value_date: moment(val.value_date).utc().format('DD-MM-YYYY'),
                      merchant_id: encDec.cjs_encrypt(val.merchant_id),
                      merchant_name: merchants_name[val.merchant_id]?.company_name,
                      store_id: merchants_name[val.merchant_id]?.store_id,
                      super_merchant_id: encDec.cjs_encrypt(val.super_merchant_id),
                      description: val.txn_type,
                      no_of_txn: val.no_of_txn,
                      gross: val.volume.toFixed(2),
                      fees: (parseFloat(val.monthly_fees) + parseFloat(val.payout_charges) + parseFloat(val.mdr) + parseFloat(val.txn_fees)).toFixed(2),
                      tax: val.percentage_vat.toFixed(2),
                      debit: (val.debit_credit.toFixed(2) < 0)?val.debit_credit.toFixed(2):0,
                      credit: (val.debit_credit.toFixed(2) >= 0)?val.debit_credit.toFixed(2):0,
                      balance: val.balance.toFixed(2),
                  };
                  send_res.push(res);
              }
              total_count = await dynamicPricingCalculation.get_count(and_filter_obj, date_condition)

              res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
          })
          .catch((error) => {
              console.log(error)
              res.status(statusCode.internalError).send(response.errormsg(error.message));
          });
  },

  dynamic_pricing_list_excel:async(req,res)=>{
   let limit = {
      perpage: 1000,
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
  if (req.user.type == 'merchant') {
      and_filter_obj.super_merchant_id = req.user.id
  }
  
  if (req.bodyString('merchant_id')) {
      and_filter_obj.merchant_id = encDec.cjs_decrypt(req.bodyString('merchant_id'))
  }
  if (req.bodyString('super_merchant')) {
      and_filter_obj.super_merchant_id = encDec.cjs_decrypt(req.bodyString('super_merchant'))
  }
  if (req.bodyString('description') && req.bodyString('description') != '') {
      and_filter_obj.txn_type = req.bodyString('description')
  }

  if (req.bodyString('from_date')) {
      date_condition.from_date = moment(req.bodyString('from_date')).format('YYYY-MM-DD')
  }

  if (req.bodyString('to_date')) {
      date_condition.to_date = moment(req.bodyString('to_date')).format('YYYY-MM-DD')
  }

  dynamicPricingCalculation.select(and_filter_obj, date_condition, limit)
      .then(async (result) => {
          let send_res = [];

          let merchant_ids = await helpers.keyByArr(result,'merchant_id');
          let merchants_name = await helpers.get_merchant_details_name_by_ids(merchant_ids)
          for (let val of result) {
              let res = {
                  merchant_name: merchants_name[val.merchant_id]?.company_name,
                  date: moment(val.added_date).utc().format('DD-MM-YYYY H:mm:ss'),
                  value_date: moment(val.value_date).utc().format('DD-MM-YYYY'),
                  store_id: merchants_name[val.merchant_id]?.store_id,
                  description: val.txn_type,
                  no_of_txn: val.no_of_txn,
                  gross: val.volume.toFixed(2),
                  fees: (parseFloat(val.monthly_fees) + parseFloat(val.payout_charges) + parseFloat(val.mdr) + parseFloat(val.txn_fees)).toFixed(2),
                  tax: val.percentage_vat.toFixed(2),
                  debit: (val.debit_credit.toFixed(2) < 0)?val.debit_credit.toFixed(2):0,
                  credit: (val.debit_credit.toFixed(2) >= 0)?val.debit_credit.toFixed(2):0,
                  balance: val.balance.toFixed(2),
              };
              send_res.push(res);
            }

            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet('Invoices');
            worksheet.columns = [
                  { header: 'Merchant Name', key: 'merchant_name', width: 30 },
                  { header: 'Date', key: 'date', width: 25 },
                  { header: 'Value Date', key: 'value_date', width: 25 },
                  { header: 'Store ID', key: 'store_id', width: 25 },
                  { header: 'Description', key: 'description', width: 25 },
                  { header: 'No. of Txn.', key: 'no_of_txn', width: 25 },
                  { header: 'Gross', key: 'gross', width: 25 },
                  { header: 'Fees', key: 'fees', width: 25 },
                  { header: 'Tax', key: 'tax', width: 25 },
                  { header: 'Debit', key: 'debit', width: 25 },
                  { header: 'Credit', key: 'credit', width: 25 },
                  { header: 'Balance', key: 'balance', width: 25 },
            ];
         
            worksheet.addRows(send_res);

            res.setHeader(
                  'Content-Type',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            res.setHeader(
                  'Content-Disposition',
                  'attachment; filename=' + 'invoice.xlsx'
            );

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

            workbook.xlsx.write(res).then(function () {
                  res.status(200).end();
            });
         })
         
         .catch((error) => {
            console.log(error)
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         });
   },
   dynamic_pricing_list_pdf:async(req,res)=>{
      let limit = {
         perpage: 1000,
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
     if (req.user.type == 'merchant') {
         and_filter_obj.super_merchant_id = req.user.id
     }
     
     if (req.bodyString('merchant_id')) {
         and_filter_obj.merchant_id = encDec.cjs_decrypt(req.bodyString('merchant_id'))
     }
     if (req.bodyString('super_merchant')) {
         and_filter_obj.super_merchant_id = encDec.cjs_decrypt(req.bodyString('super_merchant'))
     }
     if (req.bodyString('description') && req.bodyString('description') != '') {
         and_filter_obj.txn_type = req.bodyString('description')
     }
   
     if (req.bodyString('from_date')) {
         date_condition.from_date = moment(req.bodyString('from_date')).format('YYYY-MM-DD')
     }
   
     if (req.bodyString('to_date')) {
         date_condition.to_date = moment(req.bodyString('to_date')).format('YYYY-MM-DD')
     }
   
     dynamicPricingCalculation.select(and_filter_obj, date_condition, limit)
         .then(async (result) => {
             let send_res = [];
   
             let merchant_ids = await helpers.keyByArr(result,'merchant_id');
             let merchants_name = await helpers.get_merchant_details_name_by_ids(merchant_ids)
             for (let val of result) {
                 let res = {
                     merchant_name: merchants_name[val.merchant_id]?.company_name,
                     date: moment(val.added_date).utc().format('DD-MM-YYYY H:mm:ss'),
                     value_date: moment(val.value_date).utc().format('DD-MM-YYYY'),
                     store_id: merchants_name[val.merchant_id]?.store_id,
                     description: val.txn_type,
                     no_of_txn: val.no_of_txn,
                     gross: val.volume.toFixed(2),
                     fees: (parseFloat(val.monthly_fees) + parseFloat(val.payout_charges) + parseFloat(val.mdr) + parseFloat(val.txn_fees)).toFixed(2),
                     tax: val.percentage_vat.toFixed(2),
                     debit: (val.debit_credit.toFixed(2) < 0)?val.debit_credit.toFixed(2):0,
                     credit: (val.debit_credit.toFixed(2) >= 0)?val.debit_credit.toFixed(2):0,
                     balance: val.balance.toFixed(2),
                 };
                 send_res.push(res);
               }

               const table = {
                  subtitle: '',
                  headers: [
                     { label: 'Merchant Name', property: 'merchant_name', width: 100 },
                     { label: 'Date', property: 'date', width: 80 },
                     { label: 'Value Date', property: 'value_date', width: 80 },
                     { label: 'Store ID', property: 'store_id', width: 60 },
                     { label: 'Description', property: 'description', width: 60 },
                     { label: 'No. of Txn.', property: 'no_of_txn', width: 60 },
                     { label: 'Gross', property: 'gross', width: 60 },
                     { label: 'Fees', property: 'fees', width: 60 },
                     { label: 'Tax', property: 'tax', width: 60 },
                     { label: 'Debit', property: 'debit', width: 60 },
                     { label: 'Credit', property: 'credit', width: 60 },
                     { label: 'Balance', property: 'balance', width: 60 },
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
  orders_list: async (req, res) => {
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
   if (req.user.type == 'merchant') {
       and_filter_obj.super_merchant = req.user.id
   }

   if (req.bodyString('super_merchant')) {
       and_filter_obj.super_merchant = encDec.cjs_decrypt(req.bodyString('super_merchant'))
   }

   let dpc_tx_rec = await dynamicPricingCalculation.selectOne('*',{id:encDec.cjs_decrypt(req.bodyString('id'))});
   let date_txn = moment(dpc_tx_rec.added_date).subtract(1, 'day').format('YYYY-MM-DD');
   let merchant_id = dpc_tx_rec.merchant_id;

   and_filter_obj.merchant_id = merchant_id
   date_condition.from_date = date_txn;
   date_condition.to_date = date_txn;

   if(dpc_tx_rec.txn_type == 'Sales'){
      and_filter_obj.status='AUTHORISED'
   }else if(dpc_tx_rec.txn_type == 'Refund'){
      and_filter_obj.status='REFUNDED'
   }else{
      and_filter_obj.id = 0
   }
   //filters end

   let buy_percentage=0,buy_fixed=0,sell_percentage=0,sell_fixed=0,convenience_percentage=0,fixed_amount=0;
   let convenience_fixed=0,domestic_convenience_percentage=0,domestic_convenience_fixed=0;
      let [merchant_charges,monthly_txn_sum] = await Promise.all([
         submerchantModel.selectOneMID('buy_percentage,buy_fixed,sell_percentage,sell_fixed,convenience_percentage,convenience_fixed,domestic_convenience_percentage,domestic_convenience_fixed',{submerchant_id:merchant_id}),
         ordersModel.monthlyTxnSum(merchant_id,date_txn,'orders')
      ]);

      let pricing_charges = await ordersModel.selectDynamic('*',{'from_amount <=':monthly_txn_sum,'to_amount >=':monthly_txn_sum},'pricing_plan');
      let vat = parseFloat(pricing_charges[0].vat_percentage);

      if(!merchant_charges[0] || (merchant_charges[0]?.sell_percentage == 0 && merchant_charges[0]?.sell_fixed == 0)){
         sell_percentage = pricing_charges[0].percentage_value;//mdr
         fixed_amount = pricing_charges[0].fixed_amount;//txn_fees
      }else{
         buy_percentage = merchant_charges[0].buy_percentage;
         buy_fixed = merchant_charges[0].buy_fixed;
         sell_percentage = merchant_charges[0].sell_percentage;//mdr
         sell_fixed = merchant_charges[0].sell_fixed;//mdr
         convenience_percentage = merchant_charges[0].convenience_percentage;//txn_fees
         convenience_fixed = merchant_charges[0].convenience_fixed;//txn_fees
         domestic_convenience_percentage = merchant_charges[0].domestic_convenience_percentage;//txn_fees
         domestic_convenience_fixed = merchant_charges[0].domestic_convenience_fixed;//txn_fees
      }

   transactionModel.select(and_filter_obj, date_condition,[], limit,'orders')
       .then(async (result) => {
           let send_res = [];

           

           for (let val of result) {
               let volume = parseFloat(val.amount.toFixed(2))
               let no_of_transactions = 1
               let mdr = (await helpers.percentage(sell_percentage,volume))+(sell_fixed*no_of_transactions);
                  
               
               let txn_fees = 
               parseFloat(await helpers.percentage(convenience_percentage,volume))
               +parseFloat(convenience_fixed*no_of_transactions)
               +parseFloat(await helpers.percentage(domestic_convenience_percentage,volume))
               +parseFloat(domestic_convenience_fixed*no_of_transactions)
               +parseFloat(fixed_amount*no_of_transactions);

               let percentage_vat = parseFloat(await helpers.percentage(vat,(mdr+txn_fees)))
               let debit_credit = parseFloat(volume)+parseFloat(percentage_vat)


               let res = {
                  transactions_id: await encDec.cjs_encrypt(val.id),
                  merchant_id: await encDec.cjs_encrypt(val.merchant_id),
                  order_id: val.order_id,
                  payment_id: val.payment_id,
                  order_amount: val.amount.toFixed(2),
                  auth: val.amount.toFixed(2),
                  order_currency: val.currency,
                  type: await helpers.get_latest_type_of_txn(val.order_id),
                  status: val.status,
                  mdr:mdr.toFixed(2),
                  fees:txn_fees.toFixed(2),
                  tax:percentage_vat.toFixed(2),
                  net:debit_credit.toFixed(2),
                  settlement: val.amount.toFixed(2),
                  transaction_date: moment(val.created_at).format('DD-MM-YYYY H:mm:ss')
               };
               send_res.push(res);
           }
           total_count = await transactionModel.get_count(and_filter_obj, date_condition,[], 'orders')

           res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
       })
       .catch((error) => {
           console.log(error)
           res.status(statusCode.internalError).send(response.errormsg(error.message));
       });
   },

}
module.exports = transaction;