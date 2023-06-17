const statusCode = require('../utilities/statuscode/index');
const response = require('../utilities/response/ServerResponse');
const encDec = require('../utilities/decryptor/decryptor');
const AdminModel = require('../models/adm_user');
const encryptDecrypt = require('../utilities/decryptor/encrypt_decrypt');
const helpers = require('../utilities/helper/general_helper');
require('dotenv').config({ path: '../.env' });
const serverAddress = process.env.SERVER_LOAD;
const port = process.env.SERVER_PORT;
const adminActivityLogger = require('../utilities/activity-logger/admin_activity_logger');
const mailSender = require('../utilities/mail/mailsender');
const moment = require('moment');
const uuid = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });
let adminUser = {
  register: async (req, res) => {
    try {
      // let hashPassword = await encryptDecrypt('encrypt',req.bodyString("password"));
      // let username = await encryptDecrypt('encrypt',req.bodyString("username"));
      let designation = await encDec.cjs_decrypt(req.bodyString('designation'));
      let department = await encDec.cjs_decrypt(req.bodyString('department'));

      let userData = {
        name: req.bodyString('name'),
        admin_type: 'admin',
        designation: designation,
        department: department,
        // username: username,
        // password: hashPassword,
        role: req.bodyString('role'),
        added_date: new Date().toJSON().substring(0, 19).replace('T', ' '),
        ip: await helpers.get_ip(req),
      };

      if (req.bodyString('email')) {
        userData.email = req.bodyString('email');
      } else {
        userData.email = '';
      }
      if (req.bodyString('mobile_no')) {
        userData.mobile = req.bodyString('mobile_no');
        userData.country_code = req.bodyString('country_code');
      } else {
        userData.mobile = '';
      }
      if (req.all_files) {
        if (req.all_files.image) {
          userData.avatar = req.all_files.image;
        }
      }

      let insId = await AdminModel.add(userData);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manage user',
      };
      let addedName = req.bodyString('username');
      let headers = req.headers;
      adminActivityLogger
        .add(moduleAndUser, addedName, headers)
        .then(async (result) => {
          let token = uuid.v1();
          let createdAt = new Date().toJSON().substring(0, 19).replace('T', ' ');
          let resetData = {
            admin_id: insId.insert_id,
            token: token,
            is_expired: 0,
            created_at: createdAt,
          };
          await AdminModel.addResetPassword(resetData);
          let verifyUrl =
            process.env.FRONTEND_URL + 'auth/admin/create-password/' + token;
          let title = await helpers.get_title();
          let subject = 'Welcome to ' + title;

          await mailSender.welcomeAdminMail(
            req.bodyString('email'),
            req.bodyString('name'),
            subject,
            verifyUrl
          );
          res
            .status(statusCode.ok)
            .send(
              response.successmsg(
                'User registered successfully, to set password the link is sent to the registered email id.'
              )
            );
        })
        .catch((error) => {
          console.log(error);
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
    } catch (error) {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error));
    }
  },
  create_password: async (req, res) => {
    AdminModel.select_password_reset({ token: req.bodyString('token') })
      .then(async (resultPasswordReset) => {
        let passwordHash = await encryptDecrypt('encrypt', req.bodyString('password'));
        let checkIfRecentPassword = await helpers.check_in_last_five_password(
          'admin',
          passwordHash,
          resultPasswordReset.admin_id
        );
        if (!checkIfRecentPassword) {
          let adminData = {
            password: passwordHash,
          };
          let condition = {
            id: resultPasswordReset.admin_id,
          };
          AdminModel.updateDetails(condition, adminData).then(async (result) => {
            let resetTableData = {
              is_expired: 1,
            };
            let conditionToken = {
              token: req.bodyString('token'),
            };
            await AdminModel.updateResetPassword(conditionToken, resetTableData);
            let passwordData = {
              password: passwordHash,
              admin_id: resultPasswordReset.admin_id,
              created_at: moment().format('YYYY-MM-DD'),
            };
            await AdminModel.add_password(passwordData);
            await helpers.updatePasswordChanged(
              'admin',
              passwordHash,
              resultPasswordReset.admin_id
            );
            AdminModel.selectOne('*', condition)
              .then(async (result) => {
                // let adm_user_password = await AdminModel.get_password_data(
                //   '*',
                //   condition
                // );
                let data = new FormData();
                data.append('password', passwordData.password);
                data.append('name', result.name);
                data.append('designation', result.designation);
                data.append('department', result.department);
                data.append('email', result.email);
                data.append('country_code', result.country_code);
                data.append('mobile_no', result.mobile);
                data.append('role', result.role);
                data.append(
                  'image',
                  fs.createReadStream('./public/images/' + result.avatar)
                );
                let config = {
                  method: 'post',
                  maxBodyLength: Infinity,
                  url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/duplicate-user`,
                  headers: {
                    xusername: process.env.X_Username,
                    xpassword: process.env.X_Password,
                    ...data.getHeaders(),
                  },
                  data: data,
                };
                axios
                  .request(config)
                  .then((response) => {
                    console.log(JSON.stringify(response.data));
                  })
                  .catch((error) => {
                    console.log(error);
                  });
                res
                  .status(statusCode.ok)
                  .send(response.successmsg('Password created successfully.'));
              })
              .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error));
              });
          });
        } else {
          res
            .status(statusCode.ok)
            .send(
              response.errormsg(
                'This password is recently use, please choose another one.'
              )
            );
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(statusCode.internalError).send(response.errormsg(error));
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
    const searchText = req.bodyString('search');
    const designation = await helpers.get_designation_id_by_name(
      req.bodyString('designation')
    );
    const department = await helpers.get_department_id_by_name(
      req.bodyString('department')
    );
    const status = await helpers.get_status(req.bodyString('status'));
    const search = { deleted: 0 };
    const filter = { name: '' };
    if (searchText) {
      filter.name = searchText;
      filter.email = searchText;
      filter.mobile = searchText;
    }
    if (req.bodyString('designation')) {
      search.designation = designation;
    }
    if (req.bodyString('department')) {
      search.department = department;
    }
    if (req.bodyString('status')) {
      search.status = status;
    }
    AdminModel.select(search, filter, limit)
      .then(async (result) => {
        let sendRes = [];
        for (let val of result) {
          let res = {
            user_id: encDec.cjs_encrypt(val.id),
            name: val.name,
            designation: await helpers.get_designation_by_id(val.designation),
            designation_id: encDec.cjs_encrypt(val.designation),
            department: await helpers.get_department_by_id(val.department),
            department_id: encDec.cjs_encrypt(val.department),
            username: await encryptDecrypt('decrypt', val.username),
            email: val.email,
            mobile_no: val.mobile,
            country_code: val.country_code ? val.country_code : '',
            status: val.status === 1 ? 'Deactivated' : 'Active',
            blocked_status: val.is_blocked === 1 ? 'Blocked' : 'Active',
            address: val.address,
          };
          sendRes.push(res);
        }
        let totalCount = await AdminModel.get_count(search, filter);
        res
          .status(statusCode.ok)
          .send(
            response.successdatamsg(sendRes, 'List fetched successfully.', totalCount)
          );
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },
  admin_details: async (req, res) => {
    let userId = await encDec.cjs_decrypt(req.bodyString('user_id'));
    AdminModel.selectOne('*', { id: userId, deleted: 0 })
      .then(async (result) => {
        let sendRes = [];
        let val = result;
        let res1 = {
          user_id: encDec.cjs_encrypt(val.id),
          name: val.name,
          designation: await helpers.get_designation_by_id(val.designation),
          designation_id: encDec.cjs_encrypt(val.designation),
          department: await helpers.get_department_by_id(val.department),
          department_id: encDec.cjs_encrypt(val.department),
          username: await encryptDecrypt('decrypt', val.username),
          password: await encryptDecrypt('decrypt', val.password),
          email: val.email,
          mobile_no: val.mobile,
          country_code: val.country_code ? val.country_code : '',
          role: val.role,
          image: val.avatar
            ? serverAddress + ':' + port + '/static/images/' + val.avatar
            : '',
          status: val.status === 1 ? 'Deactivated' : 'Active',
          blocked_status: val.is_blocked === 1 ? 'Blocked' : 'Active',
        };

        sendRes = res1;

        res
          .status(statusCode.ok)
          .send(response.successdatamsg(sendRes, 'Details fetched successfully.'));
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },
  password: async (req, res) => {
    let userId = await encDec.cjs_decrypt(req.bodyString('user_id'));
    AdminModel.selectOne('password', { id: userId, deleted: 0 })
      .then(async (result) => {
        let sendRes = [];
        let val = result;
        let res1 = {
          password: await encryptDecrypt('decrypt', val.password),
        };
        sendRes = res1;

        res
          .status(statusCode.ok)
          .send(response.successdatamsg(sendRes, 'Password fetched successfully.'));
      })
      .catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
  },

  update: async (req, res) => {

    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let finduser = await AdminModel.selectOne('*', { id: userId });
      if (finduser) {
        let designation = encDec.cjs_decrypt(req.bodyString('designation'));
        let department = encDec.cjs_decrypt(req.bodyString('department'));
        let userData = {
          name: req.bodyString('name'),
          designation: parseInt(designation),
          department: parseInt(department),
          role: req.bodyString('role'),
        };
        if (req.all_files) {
          if (req.all_files.image) {
            userData.avatar = req.all_files.image;
          }
        }
        // if (req.bodyString('email')) {
        //   userData.email = req.bodyString('email');
        // } else {
        //   userData.email = '';
        // }

        if (req.bodyString('mobile_no')) {
          userData.mobile = req.bodyString('mobile_no');
        } else {
          userData.mobile = '';
        }
        let insId = await AdminModel.updateDetails({ id: userId }, userData);

        if (insId) {
          let headers = req.headers;
          const config = {
            headers: {
              Authorization: headers.authorization,
              xusername: headers.xusername,
              xpassword: headers.xpassword,
              'Content-Type': 'multipart/form-data',
            },
          };
          axios
            .post(
              process.env.UAE_OR_KSA_NODE_API_URL + '/admin/altr-update',
              {
                admin_type: finduser.admin_type,
                name: req.bodyString('name'),
                designation: req.bodyString('designation'),
                address: finduser.address,
                country: finduser.country,
                state: finduser.state,
                city: finduser.city,
                pincode: finduser.pincode,
                country_code: finduser.country_code,
                mobile: finduser.mobile,
                email: finduser.email,
                username: finduser.username,
                password: finduser.password,
                avatar: finduser.avatar,
                department: req.bodyString('department'),
                status: finduser.status,
                language: finduser.language,
                theme: finduser.theme,
                role: req.bodyString('role'),
                added_by: req.user.id,
                ip: finduser.ip,
                is_blocked: finduser.is_blocked,
                deleted: finduser.deleted,
                password_expired: finduser.password_expired,
                last_password_updated: finduser.last_password_updated,
              },
              config
            )
            .then((result) => {
              console.log(result);
              if (result.data.status === 'success') {
                res
                  .status(statusCode.ok)
                  .send(response.successmsg('User updated successfully'));
              }
            })
            .catch((error) => {
              console.log(error);
              res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
        }
      } else {
        res
          .status(statusCode.internalError)
          .send(response.errormsg('No User is Regitered!!'));
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  altrupdate: async (req, res) => {
    let finduser = await AdminModel.selectOne('*', { email: req.body.email });
    try {
      let headers = req.headers;
      let designation = encDec.cjs_decrypt(req.bodyString('designation'));
      let department = encDec.cjs_decrypt(req.bodyString('department'));
      let splittedrole = req.body.role.split(',');
      if (splittedrole.includes(process.env.REGION)) {
        let userData = {
          name: req.bodyString('name'),
          designation: parseInt(designation),
          department: parseInt(department),
          role: req.bodyString('role')
        };
        if (req.all_files) {
          if (req.all_files.image) {
            userData.avatar = req.all_files.image;
          }
        }
        // if (req.bodyString("email")) {
        //   userData.email = req.bodyString("email")
        // } else {
        //   userData.email = "";
        // }

        if (req.bodyString('mobile_no')) {
          userData.mobile = req.bodyString('mobile_no');
        } else {
          userData.mobile = '';
        }
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manager user',
          department: parseInt(department),
        };
        if (finduser) {
          const updatedetails = await AdminModel.updateDetails({
            id: finduser.id
          }, userData);
          if (updatedetails) {
            // const updateactivity = await adminActivityLogger.edit(
            // '/ moduleAndUser, user_id, headers);
            res.status(statusCode.ok).send(response.successmsg('User updated successfully'));
          }
        }
        else {
          const userdata = {
            'admin_type': req.body.admin_type,
            'name': req.body.name,
            'designation': designation,
            'address': req.body.address,
            'country': req.body.country,
            'state': req.body.state,
            'city': req.body.city,
            'pincode': req.body.pincode,
            'country_code': req.body.country_code,
            'mobile': req.body.mobile,
            'email': req.body.email,
            'username': req.body.username,
            'password': req.body.password,
            'avatar': req.body.avatar,
            'department': department,
            'status': req.body.status,
            'language': req.body.language,
            'theme': req.body.theme,
            'role': req.body.role,
            'added_by': req.user.id,
            'ip': req.body.ip,
            'is_blocked': req.body.is_blocked,
            'deleted': req.body.deleted,
            'password_expired': req.body.password_expired,
          };
          let insId = await AdminModel.add(userdata);
          if (insId) {
            let passwordData = {
              password: req.body.password,
              admin_id: finduser?.id,
              created_at: moment().format('YYYY-MM-DD'),
            };
            const addpas = await AdminModel.add_password(passwordData);
            res.status(statusCode.ok).send(response.successmsg('User updated successfully'));
          }
        }
      }
      else {
        if (finduser) {
          let delusr = await AdminModel.delete_user_by_EMail(req.bodyString('email'));
          if (delusr) {
            res.status(statusCode.ok).send(response.successmsg('User updated successfully'));
          }
        } else {
          res.status(statusCode.ok).send(response.successmsg('User updated successfully'));
        }
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  deactivate: async (req, res) => {
    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let insdata = {
        status: 1,
      };
      const userdetails = await AdminModel.selectOne('email', { id: userId });
      let insId = await AdminModel.updateDetails({ id: userId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manage User',
      };
      let headers = req.headers;
      const log_deactive = await adminActivityLogger.deactivate(moduleAndUser, userId, headers)
      let config = {
        method: 'post',
        url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/otherserver/deactivate`,
        headers: {
          xusername: process.env.X_Username,
          xpassword: process.env.X_Password,
          'Authorization': req.header('authorization')
        },
        data: {
          "email": userdetails.email,
        },
      };
      const serverresponse = await axios.request(config);
      if (serverresponse.data.status === 'fail') {
        res.status(statusCode.internalError).send(response.errormsg(serverresponse.data.message));
      } else {
        res.status(statusCode.ok).send(response.successmsg('User deactivated successfully'));
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  server_deactivate: async (req, res) => {

    try {
      let userdetails = await AdminModel.selectOne('*',{ 'email': req.body.email, 'status': 0, 'deleted': 0 });
      if (userdetails) {
        var insdata = {
          'status': 1
        };
        await AdminModel.updateDetails({ id: userdetails.id }, insdata);
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manage User'
        }
        let headers = req.headers;
        adminActivityLogger.deactivate(moduleAndUser, userdetails.id, headers).then((result) => {
          res.status(statusCode.ok).send(response.successmsg('User deactivated successfully'));
        }).catch((error) => {
          res.status(statusCode.ok).send(response.errorMsg(error.message));
        })
      }
      else {
        res.status(statusCode.ok).send(response.successmsg('User deactivated successfully'));
      }
    } catch (error) {
      res.status(statusCode.ok).send(response.successmsg('User deactivated successfully'));

    }

  },

  activate: async (req, res) => {
    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let insdata = {
        status: 0,
      };
      const userdetails = await AdminModel.selectOne('email', { id: userId });
      let insId = await AdminModel.updateDetails({ id: userId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manage user',
      };
      let headers = req.headers;
      const log_active = await adminActivityLogger.activate(moduleAndUser, userId, headers);
      let config = {
        method: 'post',
        url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/otherserver/activate`,
        headers: {
          xusername: process.env.X_Username,
          xpassword: process.env.X_Password,
          'Authorization': req.header('authorization')
        },
        data: {
          "email": userdetails.email
        },
      };
      axios.request(config).then(respo => {
        res.status(statusCode.ok).send(response.successmsg('User activated successfully'));
      }).catch((error) => {
        res.status(statusCode.internalError).send(response.errormsg(error.message));
      });
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  server_activate: async (req, res) => {

    try {
      let userdetails = await AdminModel.selectOne('*', { 'email': req.body.email });
      if (userdetails) {
        var insdata = {
          'status': 0
        };
        
        await AdminModel.updateDetails({ id: userdetails.id }, insdata);
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manage user'
        }
        let headers = req.headers;
        adminActivityLogger.activate(moduleAndUser, userdetails.id, headers).then((result) => {
          res.status(statusCode.ok).send(response.successmsg('User activated successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
      }
      else {
        res.status(statusCode.ok).send(response.successmsg('User activated successfully'));
      }
    } catch (error) {
      res.status(statusCode.ok).send(response.successmsg('User activated successfully'));
    }



  },

  delete: async (req, res) => {
    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let admUser = await AdminModel.selectOne('email', { id: userId });
      let insdata = {
        deleted: 1,
      };
      let insId = await AdminModel.updateDetails({ id: userId }, insdata);
      let moduleAndUser = {
        user: req.user.email,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manager user',
      };
      let headers = req.headers;
      adminActivityLogger
        .delete(moduleAndUser, userId, headers)
        .then((result) => {
          let options = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            data: {
              email: admUser.email,
            },
            url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/delete/ksa-uae`,
          };
          axios(options)
            .then((response) => {
              console.log(JSON.stringify(response.data));
            })
            .catch((error) => {
              console.log('email not available for another server', error);
            });
          res
            .status(statusCode.ok)
            .send(response.successmsg('User deleted successfully'));
        })
        .catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  server_delete: async (req, res) => {
    try {

      let userdetails = await AdminModel.selectOne('*',{ 'email': req.body.email,  'deleted': 0 });
      if(userdetails){
        var insdata = {
          'deleted': 1
        };
       await AdminModel.updateDetails({ id: user_id }, insdata);
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manager user'
        }
        let headers = req.headers;
        adminActivityLogger.delete(moduleAndUser, userdetails.id, headers).then((result) => {
          res.status(statusCode.ok).send(response.successmsg('User deleted successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        })
      }
      else{
        res.status(statusCode.ok).send(response.successmsg('User deleted successfully'));
      }
     
    } catch {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
  blocked: async (req, res) => {
    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let insdata = {
        is_blocked: 1,
      };
      const userdetails = await AdminModel.selectOne('email', { id: userId });
      let insId = await AdminModel.updateDetails({ id: userId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manage User',
      };
      let headers = req.headers;
      const log_deactive = await adminActivityLogger.block(moduleAndUser, userId, headers)
      if (insId) {
        let config = {
          method: 'post',
          url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/otherserver/block`,
          headers: {
            xusername: process.env.X_Username,
            xpassword: process.env.X_Password,
            'Authorization': req.header('authorization')
          },
          data: {
            "email": userdetails.email,
          },
        };
        axios.request(config).then(respo => {
          res.status(statusCode.ok).send(response.successmsg('Record blocked successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  server_blocked: async (req, res) => {

    try {
      let userdetails = await AdminModel.selectOne('*',{ 'email': req.body.email, 'is_blocked': 0, 'deleted': 0 });
      if (userdetails) {
        var insdata = {
          'is_blocked': 1
        };

        await AdminModel.updateDetails({ id: userdetails.id }, insdata)
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manage User',
        };
        let headers = req.headers;
        adminActivityLogger.block(moduleAndUser, userdetails.id, headers).then(result => {
          return res.status(statusCode.ok).send(response.successmsg('Record blocked successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
      }
      else {
        return res.status(statusCode.ok).send(response.successmsg('Record blocked successfully'));
      }
    } catch (error) {
      res.status(statusCode.ok).send(response.successmsg('Record blocked successfully'));
    }

  },

  unblocked: async (req, res) => {
    try {
      let userId = encDec.cjs_decrypt(req.bodyString('user_id'));
      let insdata = {
        is_blocked: 0,
      };
      const userdetails = await AdminModel.selectOne('email', { id: userId });
      let insId = await AdminModel.updateDetails({ id: userId }, insdata);
      let moduleAndUser = {
        user: req.user.id,
        admin_type: req.user.type,
        module: 'Users',
        sub_module: 'Manage User',
      };
      let headers = req.headers;
      const log_deactive = await adminActivityLogger.unblock(moduleAndUser, userId, headers)
      if (insId) {
        let config = {
          method: 'post',
          url: `${process.env.UAE_OR_KSA_NODE_API_URL}/admin/otherserver/unblock`,
          headers: {
            xusername: process.env.X_Username,
            xpassword: process.env.X_Password,
            'Authorization': req.header('authorization')
          },
          data: {
            "email": userdetails.email,
          },
        };
        axios.request(config).then(respo => {
          res.status(statusCode.ok).send(response.successmsg('Record unblocked successfully'));
        }).catch((error) => {
          res.status(statusCode.internalError).send(response.errormsg(error.message));
        });
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },

  server_unblocked: async (req, res) => {
    try {
      let userdetails = await AdminModel.selectOne('*',{ 'email': req.body.email, 'is_blocked': 1, 'deleted': 0 });
      if (userdetails) {
        let insdata = {
          is_blocked: 0,
        };
        await AdminModel.updateDetails({ id: userdetails.id }, insdata);
        let moduleAndUser = {
          user: req.user.id,
          admin_type: req.user.type,
          module: 'Users',
          sub_module: 'Manage User',
        };
        let headers = req.headers;
        adminActivityLogger.unblock(moduleAndUser, userdetails.id, headers).then(result => {
          res
            .status(statusCode.ok)
            .send(response.successmsg('Record unblocked successfully'));

        }).catch(error => {
          res
            .status(statusCode.badRequest)
            .send(response.errorMsg(error.message));
        });

      }
      else {
        res.status(statusCode.ok).send(response.successmsg('Record unblocked successfully'));
      }

    } catch (error) {
      res.status(statusCode.ok).send(response.successmsg('Record unblocked successfully'));
    }
  },

  clone_register: async (req, res) => {
    try {
      let userData = {
        name: req.body.name,
        admin_type: 'admin',
        designation: req.body.designation,
        password: req.body.password,
        department: req.body.department,
        role: req.body.role,
        added_date: new Date().toJSON().substring(0, 19).replace('T', ' '),
        ip: await helpers.get_ip(req),
      };
      if (req.body.email) {
        userData.email = req.body.email;
      }
      if (req.body.mobile_no) {
        userData.mobile = req.body.mobile_no;
        userData.country_code = req.body.country_code;
      }
      if (req.all_files && req.all_files?.image) {
        userData.avatar = req.all_files.image;
      }
      let insId = await AdminModel.add(userData);

      let passwordData = {
        admin_id: insId.insert_id,
        password: req.body.password,
        created_at: new Date().toJSON().substring(0, 19).replace('T', ' '),
      };
      await AdminModel.add_password(passwordData);

      res.status(statusCode.ok).send(response.successmsg('User registered successfully'));
    } catch (error) {
      console.log(error);
      res.status(statusCode.internalError).send(response.errormsg(error));
    }
  },
  delete_by_mail: async (req, res) => {
    try {
      let email = req.bodyString('email');
      let insdata = {
        deleted: 1,
      };

      let admUser = await AdminModel.selectOne('*', { email: email });
      if (admUser) {
        await AdminModel.updateDetails({ id: admUser.id }, insdata);
        let moduleAndUser = {
          user: admUser.id,
          admin_type: admUser.admin_type,
          module: 'Users',
          sub_module: 'Manager user',
        };
        let headers = req.headers;
        adminActivityLogger
          .delete(moduleAndUser, admUser.id, headers)
          .then((result) => {
            res
              .status(statusCode.ok)
              .send(response.successmsg('User deleted successfully.'));
          })
          .catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
          });
      } else {
        res.status(statusCode.ok).send(response.successmsg('User not found'));
      }
    } catch (error) {
      res.status(statusCode.internalError).send(response.errormsg(error.message));
    }
  },
};
module.exports = adminUser;
