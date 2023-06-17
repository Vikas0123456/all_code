const Joi = require('joi');
const StatusCode = require('../statuscode/index');
const ServerResponse = require('../response/ServerResponse');
const checkifrecordexist = require('./checkifrecordexist');

const KasToUaeValidator = {
  AdminLoginAuth: async (req, res, next) => {
    const schema = Joi.object().keys({
      email: Joi.string().required().error(() => {
        return new Error('Merchant email required.');
      }),
      token: Joi.string().required().error(() => {
        return new Error('Invalid token.');
      })
    });

    try {
      const result = schema.validate(req.query);
      if (result.error) {
        res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
      } else {
        let adminEmail = req.query.email;
        let recordExist = await checkifrecordexist({'email':adminEmail}, 'adm_user');
        if(!recordExist){
          res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Email not exist.' ));
        }else if(req.user.email !== adminEmail){
          res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Email with request is invalid.' ));
        } else{
          next();
        }
      }
    } catch (error) {
      res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
    }
  },
  loginAuth: async (req, res, next) => {
    const schema = Joi.object().keys({
      email: Joi.string().required().error(() => {
        return new Error('Merchant email required.');
      }),
      token: Joi.string().required().error(() => {
        return new Error('Invalid token.');
      })
    });

    try {
      const result = schema.validate(req.query);
      if (result.error) {
        res.status(StatusCode.ok).send(ServerResponse.errormsg(result.error.message));
      } else {
        let merchantEmail = req.query.email;
        let recordExist = await checkifrecordexist({'email':merchantEmail}, 'master_super_merchant');
        if(!recordExist){
          res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Merchant email not exist.' ));
        }else if(req.user.email !== merchantEmail){
          res.status(StatusCode.badRequest).send(ServerResponse.validationResponse('Email with request is invalid.' ));
        } else{
          next();
        }
      }
    } catch (error) {
      res.status(StatusCode.badRequest).send(ServerResponse.validationResponse(error));
    }

  }
};

module.exports = KasToUaeValidator;