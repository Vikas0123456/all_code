const encDec = require('../utilities/decryptor/decryptor');
const SubmerchantModel = require('../models/submerchantmodel');
const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const currency = require('./currency');
const SequenceUUID = require('sequential-uuid');
const helpers = require('../utilities/helper/general_helper');
const qrGenerateModel = require('../models/qrGenerateModule');
const checkifrecordexist = require('../utilities/validations/checkifrecordexist');
const PspModel = require('../models/psp');

const Terminal = {
  add: async (req, res) => {
    let submerchantId = await encDec.cjs_decrypt(
      req.bodyString('submerchant_id')
    );
    let mid = req.bodyString('mid');
    let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));
    let txnClass = req.bodyString('class');
    let authCurrency = req.bodyString('auth_currency');
    let settlementCurrency = req.bodyString('settlement_currency');
    let protocol = req.bodyString('protocol');
    let threeds = req.bodyString('threeds');
    let password = req.bodyString('password');
    let mode = req.bodyString('mode');
    let cvvSetting = req.bodyString('cvv_setting');
    // let buy_percentage = req.bodyString('buy_percentage');
    // let buy_fixed = req.bodyString('buy_fixed');
    // let sell_percentage = req.bodyString('sell_percentage');
    // let sell_fixed = req.bodyString('sell_fixed');
    let payoutDelay = req.bodyString('payout_delay');
    let classSetting = req.bodyString('class_setting');
    let addedAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
    let submerchantName = req.bodyString('submerchant_name');
    let submerchantCity = req.bodyString('submerchant_city');
    let salesPerson = encDec.cjs_decrypt(req.bodyString('sales_person'));
    let conveniencePercentage = req.bodyString('convenience_percentage');
    let convenienceFixed = req.bodyString('convenience_fixed');
    let domesticConveniencePercentage = req.bodyString(
      'domestic_convenience_percentage'
    );
    let domesticConvenienceFixed = req.bodyString(
      'domestic_convenience_fixed'
    );
    let internationalConveniencePercentage = req.bodyString(
      'international_convenience_percentage'
    );
    let internationalConvenienceFixed = req.bodyString(
      'international_convenience_fixed'
    );
    let cards = req.bodyString('cards');
    //let telr_mid = req.bodyString('telr_mid');
    //let telr_password = req.bodyString('telr_password');
    let internationalBuyPercentage =" " ;
    //  req.bodyString(
    //   'international_buy_percentage'
    // );
    let internationalBuyFixed = "";
    // req.bodyString('international_buy_fixed');
    let internationalSellPercentage =  "";
    // req.bodyString(
    //   'international_sell_percentage'
    // );
    let internationalSellFixed =  "";
    // req.bodyString(
    //   'international_sell_fixed'
    // );

    let insBody = {
      submerchant_id:submerchantId,
      mid,
      psp_id:pspId,
      auth_currency:authCurrency,
      settlement_currency:settlementCurrency,
      protocol,
      threeds,
      class: txnClass,
      password,
      mode,
      cvv_setting:cvvSetting,
      // buy_percentage,
      // buy_fixed,
      // sell_percentage,
      // sell_fixed,
      payout_delay:payoutDelay,
      currency: '',
      status: '',
      class_setting:classSetting,
      added_at:addedAt,
      deleted: '0',
      submerchant_name:submerchantName,
      submerchant_city:submerchantCity,
      sales_person:salesPerson,
      convenience_percentage: conveniencePercentage
        ? conveniencePercentage
        : 0,
      convenience_fixed: convenienceFixed ? convenienceFixed : 0,
      domestic_convenience_percentage: domesticConveniencePercentage
        ? domesticConveniencePercentage
        : 0,
      domestic_convenience_fixed: domesticConvenienceFixed
        ? domesticConvenienceFixed
        : 0,
      international_convenience_percentage:internationalConveniencePercentage
        ? internationalConveniencePercentage
        : 0,
      international_convenience_fixed: internationalConvenienceFixed
        ? internationalConvenienceFixed
        : 0,
      cards,
      //telr_mid: telr_mid ? telr_mid : '',
      //telr_password: telr_password ? telr_password : '',
      international_buy_percentage: internationalBuyPercentage
        ? internationalBuyPercentage
        : 0,
      international_buy_fixed: internationalBuyFixed
        ? internationalBuyFixed
        : 0,
      international_sell_percentage: internationalSellPercentage
        ? internationalSellPercentage
        : 0,
      international_sell_fixed: internationalSellFixed
        ? internationalSellFixed
        : 0,
    };

    SubmerchantModel.add_mid(insBody)
      .then(async (result) => {
        let terminalId = 100000+result.insertId;
        await SubmerchantModel.update_mid({id:result.insertId}, {terminal_id:terminalId});
        let rates = req.body.rates;
        if (rates.length > 0) {
          let ratesArray = [];
          for (let i = 0; i < rates.length; i++) {
            let arrayData = {
              store_id: submerchantId, //submerchant Auto-Increment ID
              terminal_id: result.insertId,
              acquirer: pspId,
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
          await PspModel.addTerminalRates(ratesArray);
        }
        
        let planExist = await checkifrecordexist({ 'sub_merchant_id': submerchantId, 'currency': authCurrency }, 'merchant_qr_codes');
        if (!planExist) {
          const uuid = new SequenceUUID({
            valid: true,
            dashes: false,
            unsafeBuffer: true
          });
          let qrId = uuid.generate();
          let createdAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
          let qrData = {
            merchant_id: await helpers.get_super_merchant_id(submerchantId),
            sub_merchant_id: submerchantId,
            currency: authCurrency,
            qr_id: qrId,
            created_at: createdAt,
            type_of_qr_code: 'Static_QR',
          };
            
          await qrGenerateModel.add(qrData);

          let kayData = {
            merchant_id: submerchantId,
            type: 'live',
            merchant_key: await helpers.make_order_number('live-'),
            merchant_secret: await helpers.make_order_number('sec-'),
            created_at: new Date().toJSON().substring(0, 19).replace('T', ' ')
          };
          await SubmerchantModel.add_key(kayData);
          let addLiveData = {
            live: 1,
          };
          await SubmerchantModel.update_merchant({ id: submerchantId }, addLiveData);
        }
        res.status(statusCode.ok).send(
          response.successmsg('Terminal added successfully.')
        );
      }).catch((error) => {
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
  },
  update: async (req, res) => {
    const id = req.bodyString('id');
    let submerchantId = await encDec.cjs_decrypt(
      req.bodyString('submerchant_id')
    );
    let mid = req.bodyString('mid');
    let pspId = await encDec.cjs_decrypt(req.bodyString('psp_id'));
    let txnClass = req.bodyString('class');
    let authCurrency = req.bodyString('auth_currency');
    let settlementCurrency = req.bodyString('settlement_currency');
    let protocol = req.bodyString('protocol');
    let threeds = req.bodyString('threeds');
    let password = req.bodyString('password');
    let mode = req.bodyString('mode');
    let cvvSetting = req.bodyString('cvv_setting');
    // let buy_percentage = req.bodyString('buy_percentage');
    // let buy_fixed = req.bodyString('buy_fixed');
    // let sell_percentage = req.bodyString('sell_percentage');
    // let sell_fixed = req.bodyString('sell_fixed');
    let payoutDelay = req.bodyString('payout_delay');
    let classSetting = req.bodyString('class_setting');
    let status = req.bodyString('status');
    let deleted = req.bodyString('deleted');
    let submerchantName = req.bodyString('submerchant_name');
    let submerchantCity = req.bodyString('submerchant_city');
    let salesPerson = encDec.cjs_decrypt(req.bodyString('sales_person'));
    let conveniencePercentage = req.bodyString('convenience_percentage');
    let convenienceFixed = req.bodyString('convenience_fixed');
    let domesticConveniencePercentage = req.bodyString(
      'domestic_convenience_percentage'
    );
    let domesticConvenienceFixed = req.bodyString(
      'domestic_convenience_fixed'
    );
    let internationalConveniencePercentage = req.bodyString(
      'international_convenience_percentage'
    );
    let internationalConvenienceFixed = req.bodyString(
      'international_convenience_fixed'
    );
    let cards = req.bodyString('cards');
    //let telr_mid = req.bodyString('telr_mid');
    //let telr_password = req.bodyString('telr_password');
    let internationalBuyPercentage = " ";
    // req.bodyString(
    //   'international_buy_percentage'
    // );
    let internationalBuyFixed = " ";
      // req.bodyString('international_buy_fixed');
    let internationalSellPercentage =  " ";
    // req.bodyString(
    //   'international_sell_percentage'
    // );
    let internationalSellFixed =  " ";
    // req.bodyString(
    //   'international_sell_fixed'
    // );

    let insBody = {
      submerchant_id:submerchantId,
      mid,
      psp_id:pspId,
      auth_currency:authCurrency,
      settlement_currency:settlementCurrency,
      protocol,
      threeds,
      class: txnClass,
      password,
      mode,
      cvv_setting:cvvSetting,
      // buy_percentage,
      // buy_fixed,
      // sell_percentage,
      // sell_fixed,
      payout_delay:payoutDelay,
      currency: '',
      status,
      class_setting:classSetting,
      deleted,
      submerchant_name:submerchantName,
      submerchant_city:submerchantCity,
      sales_person:salesPerson,
      convenience_percentage: conveniencePercentage
        ? conveniencePercentage
        : 0,
      convenience_fixed: convenienceFixed ? convenienceFixed : 0,
      domestic_convenience_percentage:
        domesticConveniencePercentage 
          ? domesticConveniencePercentage
          : 0,
      domestic_convenience_fixed: domesticConvenienceFixed 
        ? domesticConvenienceFixed
        : 0,
      international_convenience_percentage:
        internationalConveniencePercentage ? internationalConveniencePercentage: 0,
      international_convenience_fixed:
        internationalConvenienceFixed ? internationalConvenienceFixed: 0,
      cards,
      //telr_mid,
      //telr_password,
      international_buy_fixed:internationalBuyFixed,
      international_buy_percentage:internationalBuyPercentage,
      international_sell_fixed:internationalSellFixed,
      international_sell_percentage:internationalSellPercentage,
    };

    SubmerchantModel.update_mid({ id }, insBody)
      .then(async (result) => {

        let incomingRates = req.body.rates;
        let rates = await PspModel.selectTerminalRates('id', {
          terminal_id: id
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
              await PspModel.updateTerminalRates(insBody, {
                id: rateId
              });
            }
            if(newRates[i] === '') {
              let ratesArray = [];
              let insBody = {
                terminal_id: id,
                store_id: submerchantId,
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
              await PspModel.addTerminalRates(ratesArray);
            }
            if(!newRates.includes(excistingRates[i])) {
              let id = encDec.cjs_decrypt(excistingRates[i]);
              let insBody = {
                deleted: 1
              };
              await PspModel.updateTerminalRates(insBody, {
                id: id
              });
            }
          }
        }

        res.status(statusCode.ok).send(
          response.successmsg('Terminal updated successfully')
        );
      }).catch((error) => {
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
  },
  details: async (req, res) => {
    let terminalId = await encDec.cjs_decrypt(
      req.bodyString('terminal_id')
    );
    SubmerchantModel.selectOneMID('*', { id: terminalId })
      .then(async (result) => {
        let sendRes = [];
        let val = result[0];
        let res1 = {
          terminal_id: val.id,
          submerchant_id: encDec.cjs_encrypt(val.submerchant_id),
          psp_id: encDec.cjs_encrypt(val.psp_id),
          MID: val.MID,
          class: val.class,
          auth_currency: val.auth_currency,
          settlement_currency: val.settlement_currency,
          status: val.status === 1 ? 'Deactivated' : 'Active',
          protocol: val.protocol,
          threeds: val.threeds,
          password: val.password,
          mode: val.mode,
          cvv_setting: val.cvv_setting,
          class_setting: val.class_setting,
          // buy_percentage: val.buy_percentage.toFixed(2),
          // buy_fixed: val.buy_fixed,
          // sell_percentage: val.sell_percentage.toFixed(2),
          // sell_fixed: val.sell_fixed,
          payout_delay: val.payout_delay,
          deleted: val.deleted,
          added_at: val.added_at,
          submerchant_name: val.submerchant_name,
          submerchant_city: val.submerchant_city,
          sales_person: encDec.cjs_encrypt(val.sales_person),
          convenience_percentage: val.convenience_percentage,
          convenience_fixed: val.convenience_fixed,
          domestic_convenience_percentage:
                val.domestic_convenience_percentage,
          domestic_convenience_fixed: val.domestic_convenience_fixed,
          international_convenience_percentage:
            val.international_convenience_percentage,
          international_convenience_fixed:
            val.international_convenience_fixed,
          cards: val.cards,
          // telr_mid: val.telr_mid,
          // telr_password: val.telr_password,
          international_buy_percentage:
            val.international_buy_percentage,
          international_buy_fixed: val.international_buy_fixed,
          international_sell_percentage:
            val.international_sell_percentage,
          international_sell_fixed: val.international_sell_fixed,
        };
        let rates = await PspModel.selectTerminalRates('*', {
          terminal_id: terminalId,
          deleted: 0
        });
        let ratesArray = [];
        if (rates) {
          for (let i = 0; i < rates.length; i++) {
            let rate = {
              rate_id: encDec.cjs_encrypt(rates[i].id),
              store_id: encDec.cjs_encrypt(rates[i].store_id),
              terminal_id: encDec.cjs_encrypt(rates[i].terminal_id),
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

        res1.rates = ratesArray;
        sendRes = res1;
        res.status(statusCode.ok).send(
          response.successdatamsg(
            sendRes,
            'Terminal Details fetched successfully.'
          )
        );
      }).catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
  },
};

module.exports = Terminal;
