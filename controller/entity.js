const EntityModel = require('../models/entityModel');
const MerchantEkycModel = require('../models/merchant_ekycModel');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const helpers = require('../utilities/helper/general_helper');
const encDec = require('../utilities/decryptor/decryptor');
const adminActivityLogger = require('../utilities/activity-logger/admin_activity_logger');
const moment = require('moment');
const path = require('path');
require('dotenv').config({ path: '../.env' });
const env = process.env.ENVIRONMENT;
const config = require('../config/config.json')[env];
const serverAddr = process.env.SERVER_LOAD;
const port = process.env.SERVER_PORT;

let Entity = {
  add: async (req, res) => {
    let addedDate = new Date().toJSON().substring(0, 19).replace('T', ' ');
    let entityName = req.body.entity_type;
    let countryId = encDec.cjs_decrypt(req.bodyString('country_id'));
    let document = req.body.data;
    let result = await EntityModel.selectOne('id', { 'entity': entityName, deleted: 0 });
    if (result) {
      res.status(statusCode.ok).send(response.AlreadyExist(entityName));
    } else {
      let insDody = {
        'entity': entityName,
        'country_id': countryId,
        'user_id': req.user.id,
        'added_date': addedDate,
        'ip': await helpers.get_ip(req),
      };
      EntityModel.add(insDody).then(async (result) => {
        let resp = [];
        let documentAdd;
        for (let i = 0; i < document.length; i++) {
          documentAdd = {
            'entity_id': result.insert_id,
            'document': i + 1,
            'document_name': document[i].document,
            'is_applicable': document[i].is_applicable === 1 ? 1 : 0,
            'required': document[i].is_required === 1 ? 1 : 0,
            'issue_date_required': document[i].issue_date_required === 1 ? 1 : 0,
            'document_num_required': document[i].document_num_required === 1 ? 1 : 0,
            'expiry_date_required': document[i].expiry_date_required === 1 ? 1 : 0,
            'match_with_selfie': document[i].match_with_selfie === 1 ? 1 : 0,
            'issuing_authority': document[i].issuing_authority===1?1:0,
            'user_id': req.user.id,
            'added_date': addedDate,
            'ip': await helpers.get_ip(req),
          };
          resp.push(documentAdd);
        }
        await EntityModel.addDocument(resp);
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Merchants',
          sub_module: 'Entity type'
        };
        let addedName = req.body.entity_type;
        let headers = req.headers;
        adminActivityLogger.add(moduleAndUser, addedName, headers).then((result) => {
          res.status(statusCode.ok).send(response.successmsg('Added successfully.'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
      }).catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
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
      limit.start = (start - 1) * perpage;
    }
    // const doc2 = await EntityModel.list_of_document()

    let filterArr = { 'deleted': 0 };

    if (req.bodyString('status') === 'Active') {
      filterArr.status = 0;
    }
    if (req.bodyString('status') === 'Deactivated') {
      filterArr.status = 1;
    }
    if (req.bodyString('country_id')) {
      filterArr.country_id = encDec.cjs_decrypt(req.bodyString('country_id'));
    }
    EntityModel.select(filterArr, limit)
      .then(async (result) => {

        let sendRes = [];
        for (let val of result) {
          let listOfDocument = [];
          let list = await EntityModel.list_of_document({ entity_id: val.id, deleted: 0});
          for (let element of list) {
            listOfDocument.push({
              'id': encDec.cjs_encrypt(element.id),
              'document': 'document_' + element.document,
              'document_name':element.document_name,
              'is_applicable':element.is_applicable?1:0,
              'is_required': element.required ? 1 : 0,
              'issue_date_required': element.issue_date_required,
              'expiry_date_required': element.expiry_date_required ? 1 : 0,
              'match_with_selfie': element.match_with_selfie ? 1 : 0,
              'issuing_authority': element.issuing_authority,
            });
          }

          let res = {
            entity: val.entity,
            entity_id: encDec.cjs_encrypt(val.id),
            status: (val.status === 1) ? 'Deactivated' : 'Active',
            country_name: await helpers.get_country_name_by_id(val.country_id),
            document: listOfDocument,

          };
          sendRes.push(res);
        }

        let totalCount = await EntityModel.get_count(filterArr);
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'List fetched successfully.', totalCount));
      })
      .catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  entity_document_name_list: async (req, res) => {
    try{
      EntityModel.document_name_list()
        .then(async (result) => {
          res.status(statusCode.ok).send(response.successdatamsg(result, 'List fetched successfully.'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
    }catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  details: async (req, res) => {
    let entityId = encDec.cjs_decrypt(req.bodyString('entity_id'));
    let submerchantId = encDec.cjs_decrypt(req.bodyString('submerchant_id'));

    let listOfDocument = [];
    let list = await EntityModel.list_of_document(
      { entity_id: entityId, deleted: 0, is_applicable:1 });
    let i=1;
    for (let element of list) {
        
      let objList = {
        'id': encDec.cjs_encrypt(element.id),
        'sequence': i,
        'document': 'document_' + element.document,
        'document_name':element.document_name,
        'is_applicable':element.is_applicable===1?1:0,
        'is_required': element.required === 1 ? 1 : 0,
        'document_num_required': element.document_num_required === 1 ? 1 : 0,
        'issue_date_required': element.issue_date_required === 1 ? 1 : 0,
        'expiry_date_required': element.expiry_date_required ? 1 : 0,
        'match_with_selfie': element.match_with_selfie ? 1 : 0,
        'issuing_authority': element.issuing_authority,
      };

      let entityDocument = await MerchantEkycModel.selectDynamic('*', { merchant_id: submerchantId, document_id: element.id, deleted: 0 }, config.table_prefix + 'merchant_entity_document');
      if (entityDocument[0]) {
        let val = entityDocument[0];
        let seq = val.sequence;
        objList.entity_type = encryptDecrypt('encrypt', val.entity_id);
        objList['data_id'] = encryptDecrypt('encrypt', val.id);
        objList['document_id'] = encryptDecrypt('encrypt', val.document_id);
        objList['document_number'] = val.document_num ? val.document_num : '';
        objList['document_issue_date'] = val.issue_date!=='0000-00-00' ? moment(val.issue_date).format('YYYY-MM-DD') : '';
        objList['document_expiry_date'] = val.expiry_date!=='0000-00-00' ? moment(val.expiry_date).format('YYYY-MM-DD') : '';
        objList['document_file'] = val.document_name ? serverAddr + ':' + port + '/static/files/' + val.document_name : '';

      } else {
        objList.entity_type = '';
        objList['data_id'] = '';
        objList['document_id'] = '';
        objList['document_number'] = '';
        objList['document_issue_date'] = '';
        objList['document_expiry_date'] = '';
        objList['document_file'] = '';
      }
      listOfDocument.push(objList);
      i++;
    }

    EntityModel.selectOne('*', { id: entityId, deleted: 0 })
      .then((result) => {
        let sendRes = [];
        let res1 = {
          entity_id: encDec.cjs_encrypt(result.id),
          country_id: encDec.cjs_encrypt(result.country_id),
          entity: result.entity,
          status: result.status ? 'Deactivated' : 'Active',
          document: listOfDocument
        };
        sendRes = res1;
        res.status(statusCode.ok).send(response.successdatamsg(sendRes, 'Details fetched successfully.'));
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  update: async (req, res) => {
    try {
      let entityId = encDec.cjs_decrypt(req.bodyString('entity_id'));
      let entity = req.bodyString('entity_type');
      let countryId = encDec.cjs_decrypt(req.bodyString('country_id'));
      let document = req.body.data;

      let result = await EntityModel.selectOne('id', { 'entity': entity, deleted: 0, 'id !=': entityId });
      if (result) {
        res.status(statusCode.ok).send(response.AlreadyExist(entity));
      } else {
        let insdata = {
          'entity': entity,
          'country_id': countryId,
        };
        let addedDate = new Date().toJSON().substring(0, 19).replace('T', ' ');
        await EntityModel.updateDetails({ id: entityId }, insdata);
        await EntityModel.update_document({ entity_id: entityId }, { deleted: 1 });

        let resp = [];
        let documentAdd;
        for (let i = 0; i < document.length; i++) {
          documentAdd = {
            'entity_id': entityId,
            'document': i+1,
            'document_name':document[i].document,
            'is_applicable':document[i].is_applicable===1?1:0,
            'required': document[i].required === 1 ? 1 : 0,
            'issue_date_required': document[i].issue_date_required === 1 ? 1 : 0,
            'document_num_required': document[i].document_num_required === 1 ? 1 : 0,
            'expiry_date_required': document[i].expiry_date_required === 1 ? 1 : 0,
            'match_with_selfie': document[i].match_with_selfie === 1 ? 1 : 0,
            'issuing_authority': document[i].issuing_authority===1?1:0,
            'user_id': req.user.id,
            'added_date': addedDate,
            'ip': await helpers.get_ip(req),
          };

          resp.push(documentAdd);
        }
        await EntityModel.addDocument(resp);

        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Merchants',
          sub_module: 'Entity type'
        };
        let headers = req.headers;
        adminActivityLogger.edit(moduleAndUser, entityId, headers).then((result) => {
          res.status(statusCode.ok).send(response.successmsg('Entity type updated successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });

        if (documentAdd[0]) {
          EntityModel.addDocument(documentAdd);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  deactivate: async (req, res) => {
    try {
      let entityId = await encDec.cjs_decrypt(req.bodyString('entity_id'));
      let insdata = {
        'status': 1
      };
      let insId = await EntityModel.updateDetails({ id: entityId }, insdata);
      let insDoc = await EntityModel.update_document({ entity_id: entityId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Merchants',
        sub_module: 'Entity type'
      };
      let headers = req.headers;
      adminActivityLogger.deactivate(moduleAndUser, entityId, headers).then((result) => {
        res.status(statusCode.ok).send(response.successmsg('Entity type deactivated successfully'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
    } catch(error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  }, 
  activate: async (req, res) => {
    try {
      let entityId = await encDec.cjs_decrypt(req.bodyString('entity_id'));
      let insdata = {
        'status': 0
      };
      let insId = await EntityModel.updateDetails({ id: entityId }, insdata);
      let insDoc = await EntityModel.update_document({ entity_id: entityId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Merchants',
        sub_module: 'Entity type'
      };
      let headers = req.headers;
      adminActivityLogger.activate(moduleAndUser, entityId, headers).then((result) => {
        res.status(statusCode.ok).send(response.successmsg('Entity type activated successfully'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
    } catch(error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  delete: async (req, res) => {
    try {
      let entityId = await encDec.cjs_decrypt(req.bodyString('entity_id'));
      let insdata = {
        'deleted': 1
      };
      let insId = await EntityModel.updateDetails({ id: entityId }, insdata);
      let insDoc = await EntityModel.update_document({ entity_id: entityId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Merchants',
        sub_module: 'Entity type'
      };
      let headers = req.headers;
      adminActivityLogger.delete(moduleAndUser, entityId, headers).then((result) => {
        res.status(statusCode.ok).send(response.successmsg('Entity type deleted successfully'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
    } catch(error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

};

module.exports = Entity;