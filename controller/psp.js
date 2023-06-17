const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const encDec = require('../utilities/decryptor/decryptor');
const PspModel = require('../models/psp');
require('dotenv').config({
  path: '../.env'
});
const adminActivityLogger = require('../utilities/activity-logger/admin_activity_logger');
let Psp = {
  getMccCodes: async (req, res) => {
    let mccCodes = await PspModel.selectAll('*', {
      deleted: 0
    });
    let sendRes = [];
    for (let val of mccCodes) {
      let res = {
        id: encDec.cjs_encrypt(val.id),
        mcc: val.mcc,
        description: val.description,
        classification: val.classification,
      };
      sendRes.push(res);
    }
    res.status(statusCode.ok).send(
      response.successdatamsg(sendRes, 'List fetched successfully.')
    );
  },
  add: async (req, res) => {
    let addedDate = new Date().toJSON().substring(0, 19).replace('T', ' ');
    let rates = req.body.rates;
    let pspData = {
      name: req.bodyString('name'),
      class: req.bodyString('class'),
      // auth_currency: req.bodyString('auth_currency'),
      // settlement_currency: req.bodyString('settlement_currency'),
      // protocol: req.bodyString('protocol'),
      // mode: req.bodyString('mode'),
      // cvv_setting: req.bodyString('cvv_setting'),
      // class_setting: req.bodyString('class_setting'),
      // buy_percentage: req.bodyString('buy_percentage'),
      // buy_fixed: req.bodyString('buy_fixed'),
      // sell_percentage: req.bodyString('sell_percentage'),
      // sell_fixed: req.bodyString('sell_fixed'),
      // international_buy_percentage: req.bodyString(
      //     'international_buy_percentage'
      // ),
      // international_buy_fixed: req.bodyString('international_buy_fixed'),
      // international_sell_percentage: req.bodyString(
      //     'international_sell_percentage'
      // ),
      // international_sell_fixed: req.bodyString(
      //     'international_sell_fixed'
      // ),
      // convenience_percentage: req.bodyString('convenience_percentage') ?
      //     req.bodyString('convenience_percentage') : 0,
      // convenience_fixed: req.bodyString('convenience_fixed') ?
      //     req.bodyString('convenience_fixed') : 0,
      // domestic_convenience_percentage: req.bodyString(
      //         'domestic_convenience_percentage'
      //     ) ?
      //     req.bodyString('domestic_convenience_percentage') : 0,
      // domestic_convenience_fixed: req.bodyString(
      //         'domestic_convenience_fixed'
      //     ) ?
      //     req.bodyString('domestic_convenience_fixed') : 0,
      // international_convenience_percentage: req.bodyString(
      //         'international_convenience_percentage'
      //     ) ?
      //     req.bodyString('international_convenience_percentage') : 0,
      // international_convenience_fixed: req.bodyString(
      //         'international_convenience_fixed'
      //     ) ?
      //     req.bodyString('international_convenience_fixed') : 0,
      cards: req.bodyString('cards'),
      // telr_mid: req.bodyString('telr_mid'),
      // telr_password: req.bodyString('telr_password'),
      // deleted: req.bodyString('deleted') ?
      //     req.bodyString('deleted') : '0',
      // status: req.bodyString('status') ? req.bodyString('status') : '0',
      added_date: addedDate,
      // sales_person: encDec.cjs_decrypt(req.bodyString('sales_person')),
      applicable_rates: req.bodyString('applicable_rates') 
    };

    PspModel.add(pspData)
      .then(async (result) => {
        if (rates.length > 0) {
          let ratesArray = [];
          for (let i = 0; i < rates.length; i++) {
            let arrayData = {
              acquirer: result.insert_id,
              payment_method: rates[i].payment_method,
              scheme: rates[i].scheme,
              domestic_international: rates[i].domestic_international,
              variant: rates[i].variant,
              buy_rate_percentage: rates[i].buy_rate_percentage,
              buy_rate_fixed: rates[i].buy_rate_fixed,
              sell_rate_percentage: rates[i].sell_rate_percentage,
              sell_rate_fixed: rates[i].sell_rate_fixed,
              tax_in_percentage: rates[i].tax_in_percentage,
              deleted: 0,
            };
            ratesArray.push(arrayData);
          }
          await PspModel.addRates(ratesArray);
        }
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Databank',
          sub_module: 'PSP',
        };
        let addedName = req.bodyString('name');
        let headers = req.headers;
        adminActivityLogger
          .add(moduleAndUser, addedName, headers)
          .then((result) => {
            res.status(statusCode.ok).send(
              response.successmsg('PSP added successfully')
            );
          }).catch((error) => {
            console.log(error);
            res.status(statusCode.internalError).send(
              response.errormsg(error.message)
            );
          });
      }).catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(
          response.errormsg(error)
        );
      });
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
      limit.start = (start - 1) * perpage;
    }
    let allAndCond = {
      deleted: 0,
    };
    if (req.bodyString('status') === 'Active') {
      allAndCond.status = 0;
    }
    if (req.bodyString('status') === 'Deactivated') {
      allAndCond.status = 1;
    }

    let andInSet = {};
    let likeSearch = {};

    if (req.bodyString('search')) {
      likeSearch.email_to = req.bodyString('search');
      likeSearch.name = req.bodyString('search');
    }
    if (req.bodyString('mcc_codes')) {
      andInSet.mcc = encDec.cjs_decrypt(req.bodyString('mcc_codes'));
    }
    // id,name,email_to,cc,ekyc_required,threshold_value,status,mcc,files
    let result = await PspModel.select(
      '*',
      limit,
      allAndCond,
      andInSet,
      likeSearch
    );
    let sendRes = [];
    for (let val of result) {

      let res = {
        psp_id: encDec.cjs_encrypt(val.id),
        name: val.name,
        status: val.status === 1 ? 'Deactivated' : 'Active',
        class: val.class.split(',').join(', '),
        auth_currency: val.auth_currency,
        settlement_currency: val.settlement_currency,
        protocol: val.protocol,
        mode: val.mode,
        cvv_setting: val.cvv_setting,
        class_setting: val.class_setting,
        buy_percentage: val.buy_percentage,
        buy_fixed: val.buy_fixed,
        sell_percentage: val.sell_percentage,
        sell_fixed: val.sell_fixed,
        international_buy_percentage: val.international_buy_percentage,
        international_buy_fixed: val.international_buy_fixed,
        international_sell_percentage: val.international_sell_percentage,
        international_sell_fixed: val.international_sell_fixed,
        convenience_percentage: val.convenience_percentage,
        convenience_fixed: val.convenience_fixed,
        domestic_convenience_percentage: val.domestic_convenience_percentage,
        domestic_convenience_fixed: val.domestic_convenience_fixed,
        international_convenience_percentage: val.international_convenience_percentage,
        international_convenience_fixed: val.international_convenience_fixed,
        cards: val.cards,
        telr_mid: val.telr_mid,
        telr_password: val.telr_password,
        sales_person: encDec.cjs_encrypt(val.sales_person),
      };
      sendRes.push(res);
    }
    let totalCount = await PspModel.get_count(
      allAndCond,
      andInSet,
      likeSearch
    );
    res.status(statusCode.ok).send(
      response.successdatamsg(
        sendRes,
        'List fetched successfully.',
        totalCount
      )
    );
  },
  psp_list: async (req, res) => {
    let limit = {
      perpage: 0,
      page: 0,
    };
    if (req.bodyString('perpage') && req.bodyString('page')) {
      let perpage = parseInt(req.bodyString('perpage'));
      let start = parseInt(req.bodyString('page'));

      limit.perpage = perpage;
      limit.start = (start - 1) * perpage;
    }
    let allAndCond = {};
    if (req.bodyString('status') === 'Active') {
      allAndCond.status = 0;
    }
    if (req.bodyString('status') === 'Deactivated') {
      allAndCond.status = 1;
    }

    let andInSet = {};
    let likeSearch = {};

    if (req.bodyString('search')) {
      likeSearch.email_to = req.bodyString('search');
      likeSearch.name = req.bodyString('search');
    }
    if (req.bodyString('mcc_codes')) {
      andInSet.mcc = encDec.cjs_decrypt(req.bodyString('mcc_codes'));
    }
    let result = await PspModel.select(
      'id,name,auth_currency,class,settlement_currency,protocol,mode,cvv_setting,class_setting,buy_percentage,sell_percentage,buy_fixed,sell_fixed',
      limit,
      allAndCond,
      andInSet,
      likeSearch
    );
    let sendRes = [];
    for (let val of result) {
      let res = {
        psp_id: val.id,
        enc_id: encDec.cjs_encrypt(val.id),
        name: val.name,
        class: val.class,
        auth_currency: val.auth_currency,
        settlement_currency: val.settlement_currency,
        protocol: val.protocol,
        mode: val.mode,
        class_setting: val.class_setting,
        cvv_setting: val.cvv_setting,
        sell_percentage: val.sell_percentage,
        sell_fixed: val.sell_fixed,
        buy_percentage: val.buy_percentage,
        buy_fixed: val.buy_fixed,
        //status: (val.status == 1) ? 'Deactivated' : 'Active',
      };
      sendRes.push(res);
    }
    let totalCount = await PspModel.get_count(
      allAndCond,
      andInSet,
      likeSearch
    );
    res.status(statusCode.ok).send(
      response.successdatamsg(
        sendRes,
        'List fetched successfully.',
        totalCount
      )
    );
  },
  get: async (req, res) => {
    try {
      let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));
      PspModel.selectOne('*', {
        id: pspId,
        deleted: 0
      }).then(async (result) => {
        let val = result;
        let ratesArray = [];
        let rates = await PspModel.selectRates('*', {
          acquirer: pspId,
          deleted: 0
        });
        if (rates) {
          for (let i = 0; i < rates.length; i++) {
            let rate = {
              rate_id: encDec.cjs_encrypt(rates[i].id),
              acquirer: encDec.cjs_encrypt(rates[i].acquirer),
              payment_method: rates[i].payment_method,
              scheme: rates[i].scheme,
              variant: rates[i].variant,
              domestic_international: rates[i].domestic_international,
              buy_rate_percentage: rates[i].buy_rate_percentage,
              buy_rate_fixed: rates[i].buy_rate_fixed,
              sell_rate_percentage: rates[i].sell_rate_percentage,
              sell_rate_fixed: rates[i].sell_rate_fixed,
              tax_in_percentage: rates[i].tax_in_percentage,
            };
            ratesArray.push(rate);
          }
        }
        let res1 = {
          psp_id: encDec.cjs_encrypt(val.id),
          name: val.name,
          status: val.status === 1 ? 'Deactivated' : 'Active',
          class: val.class,
          auth_currency: val.auth_currency,
          settlement_currency: val.settlement_currency,
          protocol: val.protocol,
          mode: val.mode,
          cvv_setting: val.cvv_setting,
          class_setting: val.class_setting,
          buy_percentage: val.buy_percentage,
          buy_fixed: val.buy_fixed,
          sell_percentage: val.sell_percentage,
          sell_fixed: val.sell_fixed,
          international_buy_percentage: val.international_buy_percentage,
          international_buy_fixed: val.international_buy_fixed,
          international_sell_percentage: val.international_sell_percentage,
          international_sell_fixed: val.international_sell_fixed,
          convenience_percentage: val.convenience_percentage,
          convenience_fixed: val.convenience_fixed,
          domestic_convenience_percentage: val.domestic_convenience_percentage,
          domestic_convenience_fixed: val.domestic_convenience_fixed,
          international_convenience_percentage: val.international_convenience_percentage,
          international_convenience_fixed: val.international_convenience_fixed,
          cards: val.cards,
          telr_mid: val.telr_mid,
          telr_password: val.telr_password,
          sales_person: encDec.cjs_encrypt(val.sales_person),
          applicable_rates: val.applicable_rates,
          rates: ratesArray
        };
        let sendRes = res1;
        res.status(statusCode.ok).send(
          response.successdatamsg(
            sendRes,
            'Details fetched successfully.'
          )
        );
      }).catch((error) => {
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  update: async (req, res) => {
    try {
      let pspId = encDec.cjs_decrypt(req.bodyString('psp_id'));
      let pspData = {
        name: req.bodyString('name'),
        class: req.bodyString('class'),
        // auth_currency: req.bodyString('auth_currency'),
        // settlement_currency: req.bodyString('settlement_currency'),
        // protocol: req.bodyString('protocol'),
        // mode: req.bodyString('mode'),
        // cvv_setting: req.bodyString('cvv_setting'),
        // class_setting: req.bodyString('class_setting'),
        // buy_percentage: req.bodyString('buy_percentage'),
        // buy_fixed: req.bodyString('buy_fixed'),
        // sell_percentage: req.bodyString('sell_percentage'),
        // sell_fixed: req.bodyString('sell_fixed'),
        // international_buy_percentage: req.bodyString(
        //     'international_buy_percentage'
        // ),
        // international_buy_fixed: req.bodyString(
        //     'international_buy_fixed'
        // ),
        // international_sell_percentage: req.bodyString(
        //     'international_sell_percentage'
        // ),
        // international_sell_fixed: req.bodyString(
        //     'international_sell_fixed'
        // ),
        // convenience_percentage: req.bodyString('convenience_percentage') ?
        //     req.bodyString('convenience_percentage') : 0,
        // convenience_fixed: req.bodyString('convenience_fixed') ?
        //     req.bodyString('convenience_fixed') : 0,
        // domestic_convenience_percentage: req.bodyString(
        //         'domestic_convenience_percentage'
        //     ) ?
        //     req.bodyString('domestic_convenience_percentage') : 0,
        // domestic_convenience_fixed: req.bodyString(
        //         'domestic_convenience_fixed'
        //     ) ?
        //     req.bodyString('domestic_convenience_fixed') : 0,
        // international_convenience_percentage: req.bodyString(
        //         'international_convenience_percentage'
        //     ) ?
        //     req.bodyString('international_convenience_percentage') : 0,
        // international_convenience_fixed: req.bodyString(
        //         'international_convenience_fixed'
        //     ) ?
        //     req.bodyString('international_convenience_fixed') : 0,
        cards: req.bodyString('cards'),
        // telr_mid: req.bodyString('telr_mid'),
        // telr_password: req.bodyString('telr_password'),
        // sales_person: encDec.cjs_decrypt(req.bodyString('sales_person')),
        applicable_rates: req.bodyString('applicable_rates')
      };
      let insId = await PspModel.updateDetails({id: pspId }, pspData);
        
      let incomingRates = req.body.rates;
      let rates = await PspModel.selectRates('id', {
        acquirer: pspId
      });
      if (incomingRates.length > 0) {
        let excistingRates = rates.map(val => {
          return encDec.cjs_encrypt(val.id);
        });
        let newRates = incomingRates.map(val => {
          return val.rate_id;
        });
        for (let i = 0; i < incomingRates.length; i++) {
          if (excistingRates.includes(newRates[i])) {
            let rateId = encDec.cjs_decrypt(newRates[i]);
            let insBody = {
              payment_method: incomingRates[i].payment_method,
              scheme: incomingRates[i].scheme,
              domestic_international: incomingRates[i].domestic_international,
              variant: incomingRates[i].variant,
              buy_rate_percentage: incomingRates[i].buy_rate_percentage,
              buy_rate_fixed: incomingRates[i].buy_rate_fixed,
              sell_rate_percentage: incomingRates[i].sell_rate_percentage,
              sell_rate_fixed: incomingRates[i].sell_rate_fixed,
              tax_in_percentage: incomingRates[i].tax_in_percentage
            };
            await PspModel.updateRates(insBody, {
              id: rateId
            });
          }
          if(newRates[i] === '') {
            let ratesArray = [];
            let insBody = {
              payment_method: incomingRates[i].payment_method,
              acquirer: pspId,
              scheme: incomingRates[i].scheme,
              domestic_international: incomingRates[i].domestic_international,
              variant: incomingRates[i].variant,
              buy_rate_percentage: incomingRates[i].buy_rate_percentage,
              buy_rate_fixed: incomingRates[i].buy_rate_fixed,
              sell_rate_percentage: incomingRates[i].sell_rate_percentage,
              sell_rate_fixed: incomingRates[i].sell_rate_fixed,
              tax_in_percentage: incomingRates[i].tax_in_percentage,
              deleted: 0
            };
            ratesArray.push(insBody);
            await PspModel.addRates(ratesArray);
          }
          if(!newRates.includes(excistingRates[i])) {
            let id = encDec.cjs_decrypt(excistingRates[i]);
            let insBody = {
              deleted: 1
            };
            await PspModel.updateRates(insBody, {
              id: id
            });
          }
        }
      }
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Databank',
        sub_module: 'PSP',
      };
      let headers = req.headers;
      adminActivityLogger
        .edit(moduleAndUser, pspId, headers)
        .then((result) => {
          res.status(statusCode.ok).send(
            response.successmsg('PSP updated successfully')
          );
        })
        .catch((error) => {
          res.status(statusCode.internalError).send(
            response.errormsg(error.message)
          );
        });
    } catch (error) {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
  deactivate: async (req, res) => {
    try {
      let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));
      let pspData = {
        status: 1,
      };
      let insId = await PspModel.updateDetails({
        id: pspId
      }, pspData);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Databank',
        sub_module: 'PSP',
      };
      let headers = req.headers;
      adminActivityLogger
        .deactivate(moduleAndUser, pspId, headers)
        .then((result) => {
          res.status(statusCode.ok).send(
            response.successmsg('PSP deactivated successfully')
          );
        })
        .catch((error) => {
          res.status(statusCode.internalError).send(
            response.errormsg(error.message)
          );
        });
    } catch (error) {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
  activate: async (req, res) => {
    try {
      let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));

      let pspData = {
        status: 0,
      };
      let insId = await PspModel.updateDetails({
        id: pspId
      }, pspData);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Data-bank',
        sub_module: 'PSP',
      };
      let headers = req.headers;
      adminActivityLogger
        .activate(moduleAndUser, pspId, headers)
        .then((result) => {
          res.status(statusCode.ok).send(
            response.successmsg('PSP activated successfully')
          );
        })
        .catch((error) => {
          res.status(statusCode.internalError).send(
            response.errormsg(error.message)
          );
        });
    } catch (error) {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },

  delete: async (req, res) => {
    try {
      let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));

      let pspData = {
        deleted: 1,
      };
      let insId = await PspModel.updateDetails({
        id: pspId
      }, pspData);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Designation',
      };
      let headers = req.headers;
      adminActivityLogger
        .delete(moduleAndUser, pspId, headers)
        .then((result) => {
          res.status(statusCode.ok).send(
            response.successmsg('PSP deleted successfully')
          );
        })
        .catch((error) => {
          res.status(statusCode.internalError).send(
            response.errormsg(error.message)
          );
        });
    } catch (error) {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
};
module.exports = Psp;