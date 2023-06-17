const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const encrypt_decrypt = require('../utilities/decryptor/encrypt_decrypt');
const helpers = require("../utilities/helper/general_helper");
const qrGenerateModule = require("../models/qrGenerateModule");
const merchantModule = require("../models/merchantmodel");
const enc_dec = require("../utilities/decryptor/decryptor");
const SequenceUUID = require('sequential-uuid');
const QRCode = require('qrcode');
require('dotenv').config({ path: "../.env" });
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
const qr_link_url = process.env.QR_PAY_URL
const moment = require('moment');


const qr_generate = {

   add: async (req, res) => {
      let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let type_of_qr = req.bodyString("type_of_qr");
      const uuid = new SequenceUUID({
         valid: true,
         dashes: false,
         unsafeBuffer: true
      })
      let qr_id = uuid.generate();
      if (type_of_qr == "Static_QR") {
         let qr_data = {
            merchant_id: req.user.id,
            sub_merchant_id: await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
            currency: req.bodyString("currency"),
            qr_id: qr_id,
            created_at: register_at,
            type_of_qr_code: "Static_QR",
         }
         qrGenerateModule.add(qr_data).then(async (result) => {
            if (result) {
               let id = (result.insertId);
               qrGenerateModule.selectOne({ id: id }).then(async (result) => {
                  let qrid = await enc_dec.cjs_encrypt(result.qr_id);
                  let datalink = server_addr + ':' + port + "/api/v1/qr?code=" + result.qr_id

                  QRCode.toDataURL((datalink), (err, url) => {


                     if (err) {
                        res.status(statusCode.internalError).send(response.errormsg(err));
                     }
                     res.status(statusCode.ok).send(response.successdatamsg({ qr_url: url }, 'QR code generated successfully.'))
                  })
               }).catch((error) => {
                  res.status(statusCode.internalError).send(response.errormsg(error.message));
               })
            }
            else {
               res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
            }


         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })
      }
      else if (type_of_qr == "Dynamic_QR") {
         let data_link = {
            merchant_id: req.user.id,
            sub_merchant_id: await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
            qr_id: qr_id,
            currency: req.bodyString("currency"),
            quantity: req.bodyString("quantity"),
            amount: req.bodyString("amount"),
            no_of_collection: req.bodyString("no_of_collection"),
            no_of_collection_frequency:req.bodyString('total_collection'),
            overall_qty_allowed: req.bodyString("overall_qty_allowed"),
            qty_frq: req.bodyString("qty_frq"),
            start_date: register_at,
            end_date: req.bodyString('end_date'),
            is_expiry: req.bodyString("is_expiry")==''?1:0,
            description: req.bodyString("description"),
            // // error_message: req.bodyString("error_message"),
            type_of_qr_code: type_of_qr,
            created_at: register_at,
         }
         qrGenerateModule.add(data_link).then(async (result) => {
            let link_d = await encrypt_decrypt('encrypt', result.insertId)
            qrGenerateModule.selectOne({ id: result.insertId }).then(async (result) => {
               let payment_link = CHECKOUT_URL+'/qr?code=' + result.qr_id
               let data1 = { payment_link: payment_link }

               QRCode.toDataURL((payment_link), (err, data) => {
                  if (err) {
                     res.status(statusCode.internalError).send(response.errormsg(err));
                  }
                  // res.status(statusCode.ok).send(response.successdatamsg({ qr_url: url }, 'Qr code generated successfully.'))

                  qrGenerateModule.updateDetails({ id: result.id }, data1)
                  res.status(statusCode.ok).send(response.success_linkmsg(data, payment_link, 'Payment link generated successfully'));

               })
            }).catch((error) => {
               res.status(statusCode.internalError).send(response.errormsg(error.message));
            })



            // await qrGenerateModule.updateDetails({ id: result.insertId }, data)
            // res.status(statusCode.ok).send(response.successdatamsg(data, 'Payment link generated successfully'));

         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })
      } else {
         res.status(statusCode.internalError).send(response.errormsg("Valid type of qr required."));
      }

   },
   update: async (req, res) => {
    
      let id = await enc_dec.cjs_decrypt(req.bodyString("id"));
      let check_data = await qrGenerateModule.selectOne({ id: id });
      if (check_data) {
         if (check_data.type_of_qr_code == "Dynamic_QR") {

           
            if (check_data.is_expiry == 1) {
               let date = new Date().toISOString().slice(0, 10);
               let exp_date = check_data.end_date.toISOString().slice(0, 10);
               if (exp_date < date) {
                  res.status(statusCode.ok).send(response.successmsg('Payment link expired.'));
               }
               else {
                  if (check_data) {
                     let type_of_qr = check_data.type_of_qr_code;
                     if (type_of_qr == 'Dynamic_QR') {
                        // let date = new Date().toISOString().slice(0, 10);
                        let data_link = {
                           merchant_id: req.user.id,
                           sub_merchant_id: await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
                           currency: req.bodyString("currency"),
                           quantity: req.bodyString("quantity"),
                           amount: req.bodyString("amount"),
                           no_of_collection: req.bodyString("no_of_collection"),
                           no_of_collection_frequency:req.bodyString('total_collection'),
                           overall_qty_allowed: req.bodyString("overall_qty_allowed"),
                           qty_frq: req.bodyString("qty_frq"),
                           is_expiry: req.bodyString("is_expiry")==''?1:0,
                           start_date: date,
                           end_date: req.bodyString('end_date'),
                           description: req.bodyString("description"),
                           // error_message: req.bodyString("error_message"),
                           // created_at: register_at,
                        }

                        qrGenerateModule.updateDetails({ id: id }, data_link).then(async (result) => {
                           let link_d = await encrypt_decrypt('encrypt', result.insertId)
                           let payment_link = server_addr + ':' + port + "/api/v1/qr?code=" + link_d
                           let data = { payment_link: payment_link }
                           await qrGenerateModule.updateDetails({ id: id }, data)

                           res.status(statusCode.ok).send(response.successdatamsg(data, 'Record updated successfully'));

                        }).catch((error) => {
                           res.status(statusCode.internalError).send(response.errormsg(error.message));
                        })
                     }
                     else {
                        res.status(statusCode.internalError).send(response.errormsg('Please select other type of qr'));
                     }
                  }
                  else {
                     res.status(statusCode.internalError).send(response.errormsg('Details not found, please try again'));
                  }
               }
            }
            else {
               let type_of_qr = check_data.type_of_qr_code;
               // let date = new Date().toISOString().slice(0, 10);
               let data_link = {
                  merchant_id: req.user.id,
                  sub_merchant_id: await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
                  currency: req.bodyString("currency"),
                  quantity: req.bodyString("quantity"),
                  amount: req.bodyString("amount"),
                  no_of_collection: req.bodyString("no_of_collection"),
                  overall_qty_allowed: req.bodyString("overall_qty_allowed"),
                  qty_frq: req.bodyString("qty_frq"),
                  is_expiry: req.bodyString("is_expiry"),
                  start_date: req.bodyString("start_date"),
                  end_date: req.bodyString('end_date'),
                  description: req.bodyString("description"),
                  // error_message: req.bodyString("error_message"),
                  // created_at: register_at,
               }

               qrGenerateModule.updateDetails({ id: id }, data_link).then(async (result) => {
                  let link_d = await encrypt_decrypt('encrypt', result.insertId)
                  let payment_link = server_addr + ':' + port + "/api/v1/qr?code=" + link_d
                  let data = { payment_link: payment_link }
                  await qrGenerateModule.updateDetails({ id: id }, data)

                  res.status(statusCode.ok).send(response.successdatamsg(data, 'Record updated successfully'));

               }).catch((error) => {
                  res.status(statusCode.internalError).send(response.errormsg(error.message));
               })

               // else{
               //  if(check_data.end_date >= date){
               //    res.status(statusCode.ok).send(response.successmsg('Payment link expired.'));
               //  }
               //  else{
               //    res.status(statusCode.ok).send(response.successmsg('Payment link not expired.'));
               //  }
               // }



               // else if (type_of_qr == "Static_QR") {
               //    let qr_data = {
               //       qr_id: qr_id,
               //       merchant_id: req.user.id,
               //       created_at: register_at,

               //    }
               //    qrGenerateModule.updateDetails({ id: id }, qr_data).then((result) => {
               //       res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));

               //    }).catch((error) => {
               //       res.status(statusCode.internalError).send(response.errormsg(error.message));
               //    })
               // }


            }
         }
         else {
            res.status(statusCode.internalError).send(response.errormsg('Update only dynamic qr'));
         }

      }
      else {
         res.status(statusCode.internalError).send(response.errormsg('Invalid id'));
      }

   },

   details: async (req, res) => {
      const merchant_name = await qrGenerateModule.getMerchantName();
      const merchant_code = await qrGenerateModule.getMerchantcode();
      const merchant_mobile = await qrGenerateModule.getMerchantmobile();
      const merchant_logo = await qrGenerateModule.getMerchantlogo();
      let id = await enc_dec.cjs_decrypt(req.bodyString("id"));

      let result
      if (req.user.type == "admin") {
         result = await qrGenerateModule.selectOne({ 'id': id, 'is_reseted': 0, 'is_expired': 0 });
      }
      else {
         result = await qrGenerateModule.selectOne({ 'id': id, 'is_reseted': 0, 'is_expired': 0, 'merchant_id': req.user.id });
      }

      let resp;
      let send_res;
      if (result) {
         if (result.type_of_qr_code == "Static_QR") {
            let datalink = await QRCode.toDataURL(server_addr + ':' + port + "/api/v1/qr?code=" + result.qr_id);
            resp = {
               id: enc_dec.cjs_encrypt(result.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(result.sub_merchant_id),
               sub_merchant_name: merchant_name[result.sub_merchant_id],
               country_code: merchant_code[result.sub_merchant_id],
               business_mobile_number: merchant_mobile[result.sub_merchant_id],
               currency: result.currency,
               type_of_qr: result.type_of_qr_code,
               qr_id: result.qr_id,
               datalink: datalink,
               merchant_id: result.merchant_id,
               reseted_qr: result.is_reseted,
               status: result.status == 1 ? "Deactivated" : "Activated",
               payment_list: await qrGenerateModule.list_of_payment({ merchant_qr_id: result.id })
            }
         }

         else if (result.type_of_qr_code == "Dynamic_QR") {
            let date = new Date().toISOString().slice(0, 10);
            let exp;
            let count_payment;
            let per_day_count;
            per_day_count = await qrGenerateModule.get_count_payment({
               'merchant_qr_id': id,
               'type_of_qr_code': "'Dynamic_QR'",
               'payment_status': "'completed'",
               'transaction_date': "'" + date + "'",
            })
            count_payment = await qrGenerateModule.get_count_payment({
               'merchant_qr_id': id,
               'type_of_qr_code': "'Dynamic_QR'",
               'payment_status': "'completed'",
              
            })

            let datalink = await QRCode.toDataURL(server_addr + ':' + port + "/api/v1/qr?code=" + result.qr_id);
            resp = {
               id: enc_dec.cjs_encrypt(result.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(result.sub_merchant_id),
               sub_merchant_name: merchant_name[result.sub_merchant_id],
               country_code: merchant_code[result.sub_merchant_id],
               business_mobile_number: merchant_mobile[result.sub_merchant_id],
               logo_url: server_addr + ':' + port + "/static/logo/",
               logo_file : merchant_logo[result.sub_merchant_id]? merchant_logo[result.sub_merchant_id]: "",
               type_of_qr: result.type_of_qr_code,
               qr_id: result.qr_id,
               qr_link: datalink,
               currency: result.currency,
               quantity: result.quantity,
               amount: result.amount,
               no_of_collection: result.no_of_collection,
               no_of_collection_frequency:result.no_of_collection_frequency?result.no_of_collection_frequency:'',
               overall_qty_allowed: result.overall_qty_allowed,
               qty_frq: result.qty_frq?result.qty_frq:'',
               todays_collection: per_day_count,
               overall_collection: count_payment,
               payment_link: result.payment_link,
               is_expiry: result.is_expiry,
               start_date: moment(result.start_date).format("DD-MM-YYYY"),
               end_date: result.is_expiry == 0 ? result.end_date : moment(result.end_date).format("DD-MM-YYYY"),
               description: result.description,
               status: result.status == 1 ? "Deactivated" : "Activated",
               payment_list: await qrGenerateModule.list_of_payment({ merchant_qr_id: result.id })
            };
         }
         res.status(statusCode.ok).send(response.successdatamsg(resp, 'Details fetched successfully.'));
      } else {
         res.status(statusCode.internalError).send(response.errormsg("Invalid id."));
      }



      // let send_res = [];
      // for (let val of result) {
      //    let res;
      //    if (val.type_of_qr_code == "Static_QR") {
      //       res = {
      //          id: enc_dec.cjs_encrypt(val.id),
      //          type_of_qr: val.type_of_qr_code,
      //          qr_id: val.qr_id,
      //          merchant_id: val.merchant_id,
      //          reseted_qr: val.is_reseted,
      //          status: val.status == 1 ? "Deactivated" : "Activated",
      //       }
      //    }
      //    else if (val.type_of_qr_code == "Dynamic_QR") {
      //       res = {
      //          id: enc_dec.cjs_encrypt(val.id),
      //          type_of_qr: val.type_of_qr_code,
      //          qr_id: val.qr_id,
      //          currency: val.currency,
      //          is_quantity_selected: val.is_quantity_selected,
      //          quantity: val.quantity,
      //          amount: val.amount,
      //          no_of_collection: val.no_of_collection,
      //          payment_link : val.payment_link,
      //          start_date: val.start_date,
      //          end_date: val.end_date,
      //          status: val.status == 1 ? "Deactivated" : "Activated",
      //       };
      //    }
      //    send_res.push(res);
      // }


   },

   link_details: async (req, res) => {
      let result
      let qr_id = req.bodyString("qr_id");
      result = await qrGenerateModule.selectOne({ 'qr_id': qr_id, 'is_reseted': 0, 'is_expired': 0});
      let resp;
      let send_res;
      if (result) {
         let merchant_details = await merchantModule.selectOneDynamicWithJoin('mm.email, md.company_name,mm.code,mm.mobile_no,', {'mm.id':result.sub_merchant_id});
         if (result.type_of_qr_code == "Static_QR") {

            let datalink = await QRCode.toDataURL(qr_link_url + result.qr_id);
            resp = {
               id: enc_dec.cjs_encrypt(result.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(result.sub_merchant_id),
               sub_merchant_name: merchant_details.company_name,
               country_code: merchant_details.code,
               business_mobile_number: merchant_details.mobile_no,
               currency: result.currency,
               type_of_qr: result.type_of_qr_code,
               qr_id: result.qr_id,
               datalink: datalink,
               merchant_id: result.merchant_id,
               reseted_qr: result.is_reseted,
               status: result.status == 1 ? "Deactivated" : "Activated",
               payment_list: await qrGenerateModule.list_of_payment({ merchant_qr_id: result.id })
            }
         } else if (result.type_of_qr_code == "Dynamic_QR") {
            let id = result.id;
            let date = new Date().toISOString().slice(0, 10);
            let exp;
            let count_payment;
            let per_day_count;
            per_day_count = await qrGenerateModule.get_count_payment({
               'merchant_qr_id': id,
               'type_of_qr_code': "'Dynamic_QR'",
               'payment_status': "'completed'",
               'transaction_date': "'" + date + "'",
            })
            count_payment = await qrGenerateModule.get_count_payment({
               'merchant_qr_id': id,
               'type_of_qr_code': "'Dynamic_QR'",
               'payment_status': "'completed'",

            })
            let datalink = await QRCode.toDataURL(qr_link_url + result.qr_id);
            resp = {
               id: enc_dec.cjs_encrypt(result.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(result.sub_merchant_id),
               sub_merchant_name: merchant_name[result.sub_merchant_id],
               country_code: merchant_code[result.sub_merchant_id],
               business_mobile_number: merchant_mobile[result.sub_merchant_id],
               logo_url: server_addr + ':' + port + "/static/logo/",
               logo_file: merchant_logo[result.sub_merchant_id] ? merchant_logo[result.sub_merchant_id] : "",
               type_of_qr: result.type_of_qr_code,
               qr_id: result.qr_id,
               qr_link: datalink,
               currency: result.currency,
               quantity: result.quantity,
               amount: result.amount,
               no_of_collection: result.no_of_collection,
               overall_qty_allowed: result.overall_qty_allowed,
               qty_frq: result.qty_frq,
               todays_collection: per_day_count,
               overall_collection: count_payment,
               payment_link: result.payment_link,
               is_expiry: result.is_expiry,
               start_date: moment(result.start_date).format("DD-MM-YYYY"),
               end_date: result.is_expiry == 0 ? result.end_date : moment(result.end_date).format("DD-MM-YYYY"),
               description: result.description,
               status: result.status == 1 ? "Deactivated" : "Activated",
               payment_list: await qrGenerateModule.list_of_payment({ merchant_qr_id: result.id })
            };
         }
         res.status(statusCode.ok).send(response.successdatamsg(resp, 'Details fetched successfully.'));
      } else {
         res.status(statusCode.internalError).send(response.errormsg("Invalid id."));
      }
   },

   payment_link_details: async (req, res) => {
      let qr_id = req.bodyString("qr_id");
      let result = await qrGenerateModule.selectOne({ 'qr_id': qr_id, 'is_reseted': 0, 'is_expired': 0 });

      let merchant_details = await merchantModule.selectOneDynamicWithJoin('mm.email, md.company_name,mm.code,mm.mobile_no,', {'mm.id':result.sub_merchant_id});

      let company_name = merchant_details.company_name;
      let company_details = await helpers.company_details({ id: 1 });
      let image_path = server_addr + ':' + port + "/static/images/";
      let data = {
         merchant_details: {},
         order_details: {},
         prefer_lang: ''
      }
      
      qrGenerateModule.selectOneMerchant({ id: result.sub_merchant_id }).then(async (rlt) => {
         data.merchant_details = {
            theme: rlt.theme,
            icon: process.env.STATIC_URL + '/static/files/' + rlt.icon,
            logo: process.env.STATIC_URL + '/static/files/' + rlt.logo,
            use_logo: rlt.use_logo,
            we_accept_image: process.env.STATIC_URL + '/static/files/' + rlt.we_accept_image,
            brand_color: rlt.brand_color,
            accent_color: rlt.accent_color,
            merchant_name: company_name? company_name : "",
            use_logo_instead_icon: rlt.use_logo,
            branding_language: enc_dec.cjs_encrypt(rlt.branding_language),
            company_details: {
               fav_icon: image_path + company_details.fav_icon,
               logo: image_path + company_details.company_logo,
               letter_head: image_path + company_details.letter_head,
               footer_banner: image_path + company_details.footer_banner,
               title: await helpers.get_title(),
            }
         }
         if (result.type_of_qr_code == "Dynamic_QR") {
            data.order_details = {
               qr_id: result.qr_id,
               amount: result.amount ? result.amount : "",
               currency: result.currency,
            }
         }
         else {
            data.order_details = {
               qr_id: result.qr_id,
               currency: result.currency,
            }
         }
         data.prefer_lang = await enc_dec.cjs_encrypt(rlt.branding_language),
         res.status(statusCode.ok).send(response.successansmsg(data, 'Details fetch successfully.'));

      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })
   },


   list: async (req, res) => {
      
      let limit = {
         perpage: 0,
         page: 0,
      }
      if(req.bodyString('perpage') && req.bodyString('page')){
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }
      
      let merchant_name = await qrGenerateModule.getMerchantName({"mm.super_merchant_id" : req.user.id});
      
      let search, like='', and_or='';
      if (req.user.type == "admin") {
         search = { 'is_reseted': 0, 'is_expired': 0 }
      }else {
         search = { 'merchant_id': req.user.id }
      }

      if (req.bodyString('sub_merchant_id')){
         let sub_merchant_id = await enc_dec.cjs_decrypt(req.bodyString('sub_merchant_id'));
         if(sub_merchant_id)
            search.sub_merchant_id = sub_merchant_id 
      }

      if (req.bodyString('type_of_qr')) { 
         let type_of_qr = req.bodyString('type_of_qr');
         search.type_of_qr_code = type_of_qr 
      }

      if (req.bodyString('currency')) { 
         let currency = req.bodyString('currency');
         search.currency = currency 
      }
      if(req.bodyString('description')){
          like= req.bodyString('description').toString();
      }
      if (req.bodyString('status') == 'Deactivated'){
         search.status = 1 
      }else if(req.bodyString('status') == 'Activated'){
         search.status = 0
         and_or = '((end_date >= \''+moment().format("YYYY-MM-DD")+'\' AND is_expiry = 1)  OR  is_expiry = 0)';
      }else if(req.bodyString('status') == 'Link expired'){
         search['end_date <'] = moment().format("YYYY-MM-DD");
         search['end_date !='] = "0000-00-00";
         search['is_expiry'] = 1;
      }
      
      let result = await qrGenerateModule.select_qr_list(search, limit,like,and_or);
      let send_res = [];

      for (val of result) {
         let res;
         if (val.type_of_qr_code == "Static_QR") {
            let datalink = await QRCode.toDataURL(server_addr + ':' + port + "/api/v1/qr?code=" + val.qr_id);
            res = {
               id: enc_dec.cjs_encrypt(val.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(val.sub_merchant_id),
               sub_merchant_name: merchant_name[val.sub_merchant_id],
               currency: val.currency,
               type_of_qr: val.type_of_qr_code,
               qr_url: datalink,
               qr_id: val.qr_id,
               status: val.status == 1 ? "Deactivated" : "Activated",
            }
         }
         else if (val.type_of_qr_code == "Dynamic_QR") {
          

            let count_payment = await qrGenerateModule.get_count_payment({
               'merchant_qr_id': val.id,
               'type_of_qr_code': "'Dynamic_QR'"
            })

            let datalink = await QRCode.toDataURL(server_addr + ':' + port + "/api/v1/qr?code=" + val.qr_id);
            let day = new Date().toLocaleDateString("sv");
            res = {
               id: enc_dec.cjs_encrypt(val.id),
               sub_merchant_id: await enc_dec.cjs_encrypt(val.sub_merchant_id),
               sub_merchant_name: merchant_name[val.sub_merchant_id],
               currency: val.currency,
               type_of_qr: val.type_of_qr_code,
               qr_id: val.qr_id,
               qr_url: datalink,
               quantity: val.quantity,
               qty_frq:val.qty_frq,
               amount: val.amount,
               no_of_collection: val.no_of_collection,
               collection_done: count_payment,
               payment_link: val.payment_link,
               overall_qty_allowed:val.overall_qty_allowed,
               is_expiry: val.is_expiry,
               start_date: moment(val.start_date).format("DD-MM-YYYY"),
               end_date: val.is_expiry == 0 ? val.end_date : moment(val.end_date).format("DD-MM-YYYY"),
               status: val.status == 1 ? "Deactivated" : "Activated",
               expiry_status:
               val.is_expiry == 1
                   ? moment(val.end_date).format("YYYY-MM-DD") < day
                       ? "Expired"
                       : "No expiry"
                   : "No expiry",
               description:val.description?val.description:''
            };
         }
         if(res.expiry_status=='Expired'){
            res.status='Expired';
         }
         send_res.push(res);
      }
      let total_count = await qrGenerateModule.get_count_search(search,like,and_or);
      res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
   },

   reset: async (req, res) => {
      let id = await enc_dec.cjs_decrypt(req.bodyString("id"));
      let find_data = await qrGenerateModule.selectOne_type({ id: id, type_of_qr_code: "Static_QR" });

      if (find_data) {
         qr_data = {
            is_reseted: 1,
         }
         qrGenerateModule.updateDetails({ id: id }, qr_data).then(async (result) => {
            let find_date = await qrGenerateModule.selectOne({ id: id }).then(async (result) => {
               let register_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
               const uuid = new SequenceUUID({
                  valid: true,
                  dashes: false,
                  unsafeBuffer: true
               })
               let qr_id = uuid.generate();
               let qr_data = {
                  qr_id: qr_id,
                  type_of_qr_code: "Static_QR",
                  sub_merchant_id: result.sub_merchant_id,
                  currency: result.currency,
                  created_at: register_at,
                  updated_at: register_at,
               }
               qrGenerateModule.add(qr_data).then(async (result) => {

                  if (result) {
                     let id = (result.insertId);
                     qrGenerateModule.selectOne({ id: id }).then(async (resut) => {
                        let qrid = await enc_dec.cjs_encrypt(resut.qr_id)
                        // let datalink = await QRCode.toDataURL(server_addr + ':' + port + "/api/v1/qr?code=" + val.qr_id); 
                        QRCode.toDataURL((qrid), (err, url) => {
                           if (err) {
                              res.status(statusCode.internalError).send(response.errormsg(err));
                           }
                           res.status(statusCode.ok).send(response.successdatamsg({ qr_url: url }, 'QR code generated successfully.'))
                        })
                     }).catch((error) => {
                        res.status(statusCode.internalError).send(response.errormsg(error.message));
                     })
                  } else {
                     res.status(statusCode.internalError).send(response.errormsg('User details not found, please try again'));
                  }

               })
            }).catch((error) => {
               res.status(statusCode.internalError).send(response.errormsg(error.message));
            })

         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })
      }
      else {
         res.status(statusCode.internalError).send(response.errormsg("Invalid Id."));
      }

   },
   deactivate: async (req, res) => {
      try {
         let id = await enc_dec.cjs_decrypt(req.bodyString("id"));
         let find_data = await qrGenerateModule.selectOne({ id: id });
         if (find_data.is_expiry == 1) {
            let exp_date = find_data.end_date.toISOString().slice(0, 10);
            let date = new Date().toISOString().slice(0, 10);
            if (exp_date < date) {
               res.status(statusCode.ok).send(response.successmsg('Payment link expired.'));
            }
            else {
               var insdata = {
                  'status': 1
               };
               $ins_id = await qrGenerateModule.updateDetails({ id: id }, insdata)
                  .then((result) => {
                     res.status(statusCode.ok).send(response.successmsg('QR deactivated successfully'));
                  }).catch((error) => {
                     res.status(statusCode.internalError).send(response.errormsg(error.message));
                  })
            }
         }
         else {
            var insdata = {
               'status': 1
            };
            $ins_id = await qrGenerateModule.updateDetails({ id: id }, insdata)
               .then((result) => {
                  res.status(statusCode.ok).send(response.successmsg('QR deactivated successfully'));
               }).catch((error) => {
                  res.status(statusCode.internalError).send(response.errormsg(error.message));
               })
         }



      } catch(error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   activate: async (req, res) => {
      try {
         let id = await enc_dec.cjs_decrypt(req.bodyString("id"));
         let find_data = await qrGenerateModule.selectOne({ id: id });
         let exp_date = find_data.end_date;
         let date = new Date().toISOString().slice(0, 10);

         if (find_data.is_expiry == 1) {
            if (exp_date < date) {
               res.status(statusCode.ok).send(response.successmsg('Payment link expired.'));
            }
            else {
               var insdata = {
                  'status': 0
               };
               $ins_id = await qrGenerateModule.updateDetails({ id: id }, insdata)
                  .then((result) => {
                     res.status(statusCode.ok).send(response.successmsg('QR activated successfully'));
                  }).catch((error) => {
                     res.status(statusCode.internalError).send(response.errormsg(error.message));
                  })
            }
         }
         else {
            var insdata = {
               'status': 0
            };
            $ins_id = await qrGenerateModule.updateDetails({ id: id }, insdata)
               .then((result) => {
                  res.status(statusCode.ok).send(response.successmsg('QR activated successfully'));
               }).catch((error) => {
                  res.status(statusCode.internalError).send(response.errormsg(error.message));
               })
         }


      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },
}

module.exports = qr_generate;
