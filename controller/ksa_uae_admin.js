const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const adminUser = require('../models/adm_user');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const moment = require('moment');
require('dotenv').config({ path: '../.env' });
const adminKycUrl = process.env.ADMIN_KYC_URL;
const axios = require('axios');
const qs = require('qs');

let ksaUaeAdmin = {
  switchToCompliance: async (req, res) => {
    let adminId = req.user.id;
    adminUser.selectOne('name,mobile,email,password', {id:adminId}).then(async (result) => {
      let tokenData = result['email']+'__'+result['name']+'__'+encryptDecrypt('decrypt', result['password'])+'__'+result['email']+'__'+result['mobile']+'__'+moment().format('YYYY-MM-DD');

      let token = encryptDecrypt('encrypt', tokenData);
      let data = qs.stringify({
        'token': token
      });
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${adminKycUrl}/api/AdminUser`,
        headers: {
          xusername: process.env.X_Username,
          xpassword: process.env.X_Password,
        },
        data: data,
      };
      axios.request(config).then((resp) => {
        if(resp.data.status === 'Success'){
          res.status(statusCode.ok).send(response.successansmsg(resp.data, 'Verified successfully'));
        }else{
          res.status(statusCode.badRequest).send(
            response.validationResponse(resp.data.message));
        }
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error));
      });

    }).catch((error) => {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error));
    });
  }
};
module.exports = ksaUaeAdmin;