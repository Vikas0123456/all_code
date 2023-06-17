const activityLogsModel = require('../models/activityLogs');
const StatusCode = require('../utils/statuscode/statusCode');
const enc_dec = require('../utils/decryptor/decryptor');
const serverResponse = require('../utils/response/serverResponse');
const moment = require('moment');

const activityLogsController = {
  activityLogs: async (email, activity, req_data, error_name, status) => {
    try {
      const created_at = moment().format('YYYY-MM-DD HH:mm:SS');

      const log = {
        email,
        activity,
        req_data,
        error_name,
        created_at: created_at,
        status,
      };

      await activityLogsModel.add(log);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },
  activityLogsList: async (req, res) => {
    try {
      let limit = {
        perpage: 0,
        offset: 0,
      };
      if (req.body.perpage && req.body.page) {
        limit.perpage = parseInt(req.body.perpage);
        limit.offset = parseInt(req.body.page) - 1;
        limit.offset *= limit.perpage;
      }

      let filter_arr = { deleted: 0 };
      let total_count = await activityLogsModel.get_count(filter_arr);

      if (limit.perpage > 0 && limit.offset >= total_count) {
        limit.offset = Math.floor(total_count / limit.perpage) * limit.perpage;
      }

      let result = await activityLogsModel.select(filter_arr, limit);
      let send_res = [];
      result.forEach((val, key) => {
        let res = {
          id: enc_dec.cjs_encrypt(val.id),
          email: val.email,
          activity: val.activity,
          req_data: val.req_data,
          error_name: val.error_name,
          created_at: val.created_at,
          status: val.status,
        };
        send_res.push(res);
      });

      let response = serverResponse.successDataMessage(
        send_res,
        'List fetched successfully...',
        total_count,
      );
      res.status(StatusCode.ok).send(response);
    } catch (error) {
      console.log(error);
      res
        .status(StatusCode.internalError)
        .send(serverResponse.errorMessage(error.message));
    }
  },
};

module.exports = activityLogsController;
