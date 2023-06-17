const StoreImageModel = require("../models/store_qr_images");
const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper");
const enc_dec = require("../utilities/decryptor/decryptor");
const admin_activity_logger = require("../utilities/activity-logger/admin_activity_logger");
const moment = require('moment');
let StoreQr = {
  add: async (req, res) => {
    let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
    console.log(req.all_files);
    let ins_body = {
      store_id: enc_dec.cjs_decrypt(req.bodyString('store_id')),
      merchant_id: req.user.id,
      file: req.all_files.image,
      file_original_name: req.bodyString('title'),
      deleted: 0,
      status: 0,
      created_at: created_at
    };
    StoreImageModel.add(ins_body)
      .then((result) => {
        res.status(statusCode.ok).send(
          response.successmsg('Image uploaded successfully.')
        );
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
  },
  list: async (req, res) => {
    let limit = {
      perpage: 10,
      start: 0,
      page: 1,
    };
    if (req.bodyString('perpage') && req.bodyString('page')) {
      perpage = parseInt(req.bodyString('perpage'));
      start = parseInt(req.bodyString('page'));

      limit.perpage = perpage;
      limit.start = (start - 1) * perpage;
    }
    let filter_arr = { deleted: 0, merchant_id: req.user.id };

    if (req.bodyString('store_id')) {
      filter_arr.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'));
    }

    if (req.bodyString('status') === 'Active') {
      filter_arr.status = 0;
    }

    if (req.bodyString('status') === 'Deactivated') {
      filter_arr.status = 1;
    }

    StoreImageModel.select(filter_arr, limit)
      .then(async (result) => {
        let send_res = [];
        for (let val of result) {
          let res = {
            image_id: enc_dec.cjs_encrypt(val.id),
            store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
            store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
            title: val.file_original_name,
            image_name: val.file,
            file_url: process.env.STATIC_URL + '/static/store-qr-images/' + val.file,
            status: val.status == 1 ? "Deactivated" : "Active",
          };
          send_res.push(res);
        }
        total_count = await StoreImageModel.get_count(filter_arr, limit);
        res.status(statusCode.ok).send(
          response.successdatamsg(send_res, 'List fetched successfully.', total_count));
      })
      .catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });
  },
  details: async (req, res) => {
    let image_id = await enc_dec.cjs_decrypt(
      req.bodyString("image_id")
    );
    StoreImageModel.selectOne('*', { id: image_id, deleted: 0 })
      .then(async (result) => {
        let send_res = [];
        let val = result;
        let res1 = {
          merchant_id: enc_dec.cjs_encrypt(val.merchant_id),
          image_id: enc_dec.cjs_encrypt(val.id),
          store_id: enc_dec.cjs_encrypt(val.store_id),
          file: process.env.STATIC_URL + '/static/store-qr-images/' + val.file,
          title: val.file_original_name,
          status: val.status === 1 ? 'Deactivated' : 'Active',
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
  update: async (req, res) => {
    try {
      let store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'));
      let image_id = enc_dec.cjs_decrypt(req.bodyString('image_id'));
      let ins_body = {
        store_id: store_id,
        file_original_name: req.bodyString('title'),
      };
      if (req.all_files?.image) {
        ins_body.file = req.all_files?.image;
      }
      let result = await StoreImageModel.updateDetails(
        { id: image_id },
        ins_body
      );
      res.status(statusCode.ok).send(
        response.successmsg("Image updated successfully")
      );
    } catch (error) {
      console.log(error);
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
  deactivate: async (req, res) => {
    try {
      let image_id = enc_dec.cjs_decrypt(
        req.bodyString("image_id")
      );
      let insdata = {
        status: 1,
      };

      $ins_id = await StoreImageModel.updateDetails(
        { id: image_id },
        insdata
      );
      res.status(statusCode.ok).send(
        response.successmsg("Image deactivated successfully")
      );
    } catch {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
  activate: async (req, res) => {
    try {
      let image_id = enc_dec.cjs_decrypt(
        req.bodyString("image_id")
      );
      let insdata = {
        status: 0,
      };

      $ins_id = await StoreImageModel.updateDetails(
        { id: image_id },
        insdata
      );
      res.status(statusCode.ok).send(
        response.successmsg("Image activated successfully")
      );
    } catch {
      res.status(statusCode.internalError).send(
        response.errormsg(error.message)
      );
    }
  },
  delete: async (req, res) => {
    try {
      let image_id = await enc_dec.cjs_decrypt(req.bodyString('image_id'));
      let insdata = {
        'deleted': 1
      };
      StoreImageModel.updateDetails({ id: image_id }, insdata)
        .then((result) => {
          res.status(statusCode.ok).send(response.successmsg('Image deleted successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  add_config: async (req, res) => {
    try {
      let condition = {merchant_id:req.user.id,store_id:enc_dec.cjs_decrypt(req.bodyString('store_id'))};
      let result = await StoreImageModel.selectOneConfig('*',condition); 
      console.log(result);
      if(result){
        let updateData ={
          store_id : enc_dec.cjs_decrypt(req.bodyString('store_id')),
          auth_url_use_for:req.bodyString('authorized_url_use_for'),
          authorized_url:req.bodyString('authorized_url'),
          cancel_url_use_for:req.bodyString('cancelled_url_use_for'),
          cancel_url:req.bodyString('cancelled_url'),
          declined_url_use_for:req.bodyString('declined_url_use_for'),
          declined_url:req.bodyString('declined_url'),

        }
        let updateRes = await StoreImageModel.updateConfigDetails({id:result.id},updateData);
        res.status(statusCode.ok).send(response.successmsg('Config updated successfully'));
      }else{
        let insData ={
          merchant_id:req.user.id,
          store_id : enc_dec.cjs_decrypt(req.bodyString('store_id')),
          auth_url_use_for:req.bodyString('authorized_url_use_for'),
          authorized_url:req.bodyString('authorized_url'),
          cancel_url_use_for:req.bodyString('cancelled_url_use_for'),
          cancel_url:req.bodyString('cancelled_url'),
          declined_url_use_for:req.bodyString('declined_url_use_for'),
          declined_url:req.bodyString('declined_url'),
          created_at:moment().format('YYYY-MM-DD hh:mm'),
          status:0,
          deleted:0
        }
        let insertRes = await StoreImageModel.addConfig(insData);
        res.status(statusCode.ok).send(response.successmsg('Config updated successfully'));
      }

    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }


  },
  list_config:async(req,res)=>{
    let limit = {
      perpage: 10,
      start: 0,
      page: 1,
    };
    if (req.bodyString('perpage') && req.bodyString('page')) {
      perpage = parseInt(req.bodyString('perpage'));
      start = parseInt(req.bodyString('page'));

      limit.perpage = perpage;
      limit.start = (start - 1) * perpage;
    }
    let filter_arr = { deleted: 0, merchant_id: req.user.id };

    if (req.bodyString('store_id')) {
      filter_arr.store_id = enc_dec.cjs_decrypt(req.bodyString('store_id'));
    }

    if (req.bodyString('status') === 'Active') {
      filter_arr.status = 0;
    }

    if (req.bodyString('status') === 'Deactivated') {
      filter_arr.status = 1;
    }

    StoreImageModel.selectConfig(filter_arr, limit)
      .then(async (result) => {
        let send_res = [];
        for (let val of result) {
          let res = {
            config_id: enc_dec.cjs_encrypt(val.id),
            enc_store_id:enc_dec.cjs_encrypt(val.store_id),
            store_id: await helpers.get_store_id_by_merchant_id(val.store_id),
            store_name: await helpers.get_business_name_by_merchant_id(val.store_id),
            auth_url_use_for:val.auth_url_use_for,
            authorized_url:val.authorized_url,
            declined_url_use_for:val.declined_url_use_for,
            declined_url:val.declined_url,
            cancel_url_use_for:val.cancel_url_use_for,
            cancel_url:val.cancel_url,
            status:val.status == 1 ? "Deactivated" : "Active",
          };
          send_res.push(res);
        }
        total_count = await StoreImageModel.get_count_config(filter_arr, limit);
        res.status(statusCode.ok).send(
          response.successdatamsg(send_res, 'List fetched successfully.', total_count));
      })
      .catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(
          response.errormsg(error.message)
        );
      });

  }
};
module.exports = StoreQr;
