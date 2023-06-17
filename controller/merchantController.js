const MerchantModel = require('../models/merchant_user_model');
const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const helpers = require('../utilities/helper/general_helper');
const encDec = require('../utilities/decryptor/decryptor');

let merchant = {
  add: async (req, res) => {
    let name = req.bodyString('name');
    let email = req.bodyString('email');
    let addressLine1 = req.bodyString('address_line_1');
    let addressLine2 = req.bodyString('address_line_2');
    let addressLine3 = req.bodyString('address_line_3');
    let country = req.bodyString('country');
    let state = req.bodyString('state');
    let city = req.bodyString('city');
    let zipCode = req.bodyString('zip_code');
    let mobileCode = req.bodyString('mobile_code');
    let mobileNo = req.bodyString('mobile_no');
    let altMobileCode = req.bodyString('alt_mobile_code');
    let altMobileNo = req.bodyString('alt_mobile_no');
    let roles = req.bodyString('roles');
    let allowStores = req.bodyString('allow_stores');

    let newData = {
      name: name,
      email: email,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      address_line_3: addressLine3,
      country: country,
      state: state,
      city: city,
      zip_code: zipCode,
      code: mobileCode,
      mobile_no: mobileNo,
      alt_code: altMobileCode,
      alt_mobile: altMobileNo,
      roles: roles,
      allow_stores: allowStores,
      ip: await helpers.get_ip(req),
    };

    MerchantModel.add(newData)
      .then((result) => {
        res.status(statusCode.ok).send(
          response.successmsg('Merchant added successfully.')
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
            perpage: 0,
            page: 0,
        };

        let condition = { deleted: 0, status: 0 };
        let condition2 = {};

        // pagination code
        if (req.bodyString("perpage") && req.bodyString("page")) {
            perpage = parseInt(req.bodyString("perpage"));
            start = parseInt(req.bodyString("page"));
            limit.perpage = perpage;
            limit.start = (start - 1) * perpage;
        }

        // filter code
        if (req.bodyString("email")) {
            const email = req.bodyString("email");
            condition.email = email;
        }
        if (req.bodyString("mobile_code") && req.bodyString("mobile_no")) {
            const mobile_code = req.bodyString("mobile_code");
            const mobile_no = req.bodyString("mobile_no");
            condition.code = mobile_code;
            condition.mobile_no = mobile_no;
            condition2.alt_mobile_code = mobile_code;
            condition2.alt_mobile_no = mobile_no;
        }

        MerchantModel.select(condition, condition2, limit)
            .then(async (result) => {
                let send_res = [];
                result.forEach(function (val, key) {
                    let res = {
                        user_id: encDec.cjs_encrypt(val.id),
                        name: val.name,
                        email: val.email,
                        address_line_1: val.address_line_1,
                        address_line_2: val.address_line_2,
                        address_line_3: val.address_line_3,
                        country: val.country,
                        state: val.state,
                        city: val.city,
                        zip_code: val.zip_code,
                        mobile_code: val.code,
                        mobile_no: val.mobile_no,
                        alt_code: val.alt_mobile_code,
                        alt_mobile: val.alt_mobile_no,
                        roles: val.roles,
                        allow_stores: val.allow_stores,
                        status: val.status == 1 ? "Deactivated" : "Active",
                    };
                    send_res.push(res);
                });
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        send_res,
                        "List fetched successfully."
                    )
                );
            })
            .catch((error) => {
                console.log("error", error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    details: async (req, res) => {
        let user_id = await encDec.cjs_decrypt(req.bodyString("user_id"));

        MerchantModel.selectOne("*", { id: user_id, deleted: 0 })
            .then((result) => {
                let send_res = [];
                let val = result;
                let data = {
                    user_id: encDec.cjs_encrypt(val.id),
                    name: val.name,
                    email: val.email,
                    address_line_1: val.address_line_1,
                    address_line_2: val.address_line_2,
                    address_line_3: val.address_line_3,
                    country: val.country,
                    state: val.state,
                    city: val.city,
                    zip_code: val.zip_code,
                    code: val.mobile_code,
                    mobile_no: val.mobile_no,
                    alt_code: val.alt_mobile_code,
                    alt_mobile: val.alt_mobile_no,
                    roles: val.roles,
                    allow_stores: val.allow_stores,
                    status: val.status == 1 ? "Deactivated" : "Active",
                };
                send_res = data;

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
            let user_id = await encDec.cjs_decrypt(req.bodyString("user_id"));
            let name = req.bodyString("name");
            let email = req.bodyString("email");
            let address_line_1 = req.bodyString("address_line_1");
            let address_line_2 = req.bodyString("address_line_2");
            let address_line_3 = req.bodyString("address_line_3");
            let country = req.bodyString("country");
            let state = req.bodyString("state");
            let city = req.bodyString("city");
            let zip_code = req.bodyString("zip_code");
            let mobile_code = req.bodyString("mobile_code");
            let mobile_no = req.bodyString("mobile_no");
            let alt_mobile_code = req.bodyString("alt_mobile_code");
            let alt_mobile_no = req.bodyString("alt_mobile_no");
            let roles = req.bodyString("roles");
            let allow_stores = req.bodyString("allow_stores");

            var insdata = {
                name: name,
                email: email,
                address_line_1: address_line_1,
                address_line_2: address_line_2,
                address_line_3: address_line_3,
                country: country,
                state: state,
                city: city,
                zip_code: zip_code,
                code: mobile_code,
                mobile_no: mobile_no,
                alt_code: alt_mobile_code,
                alt_mobile: alt_mobile_no,
                roles: roles,
                allow_stores: allow_stores,
            };

            $ins_id = await MerchantModel.updateDetails(
                { id: user_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("User updated successfully")
            );
        } catch (error) {
            console.log(error);
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },

    user_deactivate: async (req, res) => {
        try {
            let user_id = await encDec.cjs_decrypt(req.bodyString("user_id"));
            var insdata = {
                status: 1,
            };

            $ins_id = await MerchantModel.updateDetails(
                { id: user_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("User deactivated successfully")
            );
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },

    user_activate: async (req, res) => {
        try {
            let user_id = await encDec.cjs_decrypt(req.bodyString("user_id"));
            var insdata = {
                status: 0,
            };

            $ins_id = await MerchantModel.updateDetails(
                { id: user_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("User activated successfully")
            );
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },

    user_delete: async (req, res) => {
        try {
            let user_id = await encDec.cjs_decrypt(req.bodyString("user_id"));
            var insdata = {
                deleted: 1,
            };

            $ins_id = await MerchantModel.updateDetails(
                { id: user_id },
                insdata
            );
            res.status(statusCode.ok).send(
                response.successmsg("User deleted successfully")
            );
        } catch {
            res.status(statusCode.internalError).send(
                response.errormsg(error.message)
            );
        }
    },
};
module.exports = merchant;
