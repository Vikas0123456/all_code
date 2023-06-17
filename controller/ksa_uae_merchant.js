const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const helpers = require('../utilities/helper/general_helper');
const MerchantRegistrationModel = require('../models/merchant_registration');
const MerchantModel = require('../models/merchantmodel');
const adminModel = require('../models/adm_user');
const accessToken = require('../utilities/tokenmanager/token');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const merchantToken = require('../utilities/tokenmanager/merchantToken');

const path = require('path');
require('dotenv').config({ path: '../.env' });
const region = process.env.REGION;
const adminLink = process.env.ADMIN_LINK;
const adminKycUrl = process.env.ADMIN_KYC_URL;
const switchRegionUrl = process.env.UAE_OR_KSA_NODE_API_URL;

let ksaUaeMerchant = {
  register: async (req, res) => {
    let superMerchantData = req.body.super_merchant_data;
    let kayData = req.body.kay_data;

    MerchantRegistrationModel.register(superMerchantData).then(async (result) => {
      kayData.merchant_id = result.insertId;
      await MerchantModel.add_key(kayData);
      res.status(statusCode.ok).send(response.successmsg('Registered successfully'));
    }).catch((error) => {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error));
    });
  },
  merchantLogin: async (req, res) => {
    let merchantEmail = req.query.email;
    let user =
        await MerchantModel.selectOneSuperMerchant('*', {
          email: merchantEmail,
        });
    let payload = {
      email: user.email,
      id: user.id,
      name: user.name,
      type: 'merchant',
    };
    const aToken = merchantToken(payload);
    let userLanguage = 1;
    if (user.language) {
      userLanguage = user.language;
    }

    let searchCondition = {};
    if (user.language) {
      searchCondition.id = user.language;
    } else {
      searchCondition.status = 0;
      searchCondition.deleted = 0;
    }

    let language =
        await helpers.get_first_active_language_json(
          searchCondition
        );

    res.status(statusCode.ok).send(
      response.loginSuccess({
        accessToken: aToken,
        name: user.name ? user.name : user.email,
        language: language,
        email: user.email,
        theme: user.theme,
        user_type: 'merchant',
        region:region
      })
    );
  },
  adminLogin: async (req, res) => {
    let adminEmail = req.query.email;
    let user =
        await adminModel.selectOne('*', {
          email: adminEmail,
        });
    let payload = {
      username: user.username,
      id: user.id,
      name: user.name,
      email: user.email,
      type: 'admin'
    };
    const aToken = accessToken(payload);

    let condition = {};
    if (user.language) {
      condition.id = user.language;
    } else {
      condition.status = 0;
      condition.deleted = 0;
    }

    let language = await helpers.get_first_active_language_json(condition);
    let userId = await encryptDecrypt('encrypt', user.id);
    //const rToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
    res.status(statusCode.ok).send(response.loginSuccess({
      accessToken: aToken, 
      name: payload.name,
      'language': language, 
      'theme': user.theme, 
      'user_type': 'admin', 
      user_id: userId, 
      roles: user.role, 
      region: region,
      email: adminEmail,
      admin_kyc_url: adminKycUrl,
      switch_region_url: switchRegionUrl
    }));
  }
};
module.exports = ksaUaeMerchant;