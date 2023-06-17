const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const invModel = require("../models/invoiceModel");
const enc_dec = require("../utilities/decryptor/decryptor");
require('dotenv').config({ path: "../.env" });
const helpers = require("../utilities/helper/general_helper");
const SequenceUUID = require('sequential-uuid');
const server_addr = process.env.SERVER_LOAD
const port = process.env.SERVER_PORT
const moment = require("moment");
const { testMobile } = require("express-useragent");

const inv = {
   add_customer: async (req, res) => {
      let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let ip = await helpers.get_ip(req);
      let ship_country = await enc_dec.cjs_decrypt(req.bodyString("ship_country"));
      let bill_country = await enc_dec.cjs_decrypt(req.bodyString("bill_country"));
      let cust_data = {
         merchant_id: req.user.id,
         prefix: req.bodyString("name_prefix"),
         name: req.bodyString("name"),
         logo: req.all_files.logo,
         code: req.bodyString("country_code"),
         mobile: req.bodyString("mobile"),
         email: req.bodyString("email"),
         ship_address: req.bodyString("ship_address"),
         ship_country: ship_country,
         ship_state: await enc_dec.cjs_decrypt(req.bodyString("ship_state")),
         ship_city: await enc_dec.cjs_decrypt(req.bodyString("ship_city")),
         ship_zip_code: req.bodyString("ship_zip_code"),
         bill_address: req.bodyString("bill_address"),
         bill_country: bill_country,
         bill_state: await enc_dec.cjs_decrypt(req.bodyString("bill_state")),
         bill_city: await enc_dec.cjs_decrypt(req.bodyString("bill_city")),
         bill_zip_code: req.bodyString("bill_zip_code"),
         added_by: req.user.id,
         ip: ip,
         created_at: added_date,
      }

      invModel.add(cust_data).then(async (result) => {
         let customerData = {
            'id': enc_dec.cjs_encrypt(result.insertId),
            'name': cust_data.name,
            'shipping_details': {
               'address': req.bodyString("ship_address"),
               'city': await helpers.get_city_name_by_id(enc_dec.cjs_decrypt(req.bodyString("ship_city"))),
               'state': await helpers.get_state_name_by_id(enc_dec.cjs_decrypt(req.bodyString("ship_state"))),
               'country': await helpers.get_country_name_by_id(enc_dec.cjs_decrypt(req.bodyString('ship_country'))),
               'zip_code': req.bodyString("ship_zip_code")
            },
            "billing_details": {
               'address': req.bodyString("bill_address"),
               'city': await helpers.get_city_name_by_id(enc_dec.cjs_decrypt(req.bodyString("bill_city"))),
               'state': await helpers.get_state_name_by_id(enc_dec.cjs_decrypt(req.bodyString("bill_state"))),
               'country': await helpers.get_country_name_by_id(enc_dec.cjs_decrypt(req.bodyString('bill_country'))),
               'zip_code': req.bodyString("bill_zip_code")
            }
         }
         res.status(statusCode.ok).send(response.successdatamsg(customerData, 'Added successfully.'));
         // }).catch((error) => {
         //       res.status(statusCode.internalError).send(response.errormsg(error.message));
         // })

      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })

   },
   list_customer: async (req, res) => {
      let limit = {
         perpage: 0,
         page: 0,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }
      let condition = {}
      if (req.user.type == 'merchant') {
         condition.merchant_id = req.user.id;
      }
      // let filter_arr = { "deleted":0 }

      // if(req.bodyString('status') == "Active"){
      //     filter_arr.status = 0
      // }
      // if(req.bodyString('status') == "Deactivated"){
      //     filter_arr.status = 1
      // }
      invModel.select(limit, condition)
         .then(async (result) => {
            let send_res = [];
            for (let val of result) {

               let res = {
                  customer_id: enc_dec.cjs_encrypt(val.id),
                  name: val.name,
                  email: val.email,
                  mobile_no: "+" + val.code + " " + val.mobile,
                  shipping_address: val.shipping_address,
                  ship_address: val.ship_address,
                  ship_country: enc_dec.cjs_encrypt(val.ship_country),
                  ship_country_name: await helpers.get_country_name_by_id(val.ship_country),
                  ship_state: enc_dec.cjs_encrypt(val.ship_state),
                  ship_state_name: await helpers.get_state_name_by_id(val.ship_state),
                  ship_city: enc_dec.cjs_encrypt(val.ship_city),
                  ship_city_name: await helpers.get_city_name_by_id(val.ship_city),
                  ship_zip_code: val.ship_zip_code,
                  billing_address: val.billing_address,
                  bill_country: enc_dec.cjs_encrypt(val.bill_country),
                  bill_country_name: await helpers.get_country_name_by_id(val.bill_country),
                  bill_state: enc_dec.cjs_encrypt(val.bill_state),
                  bill_state_name: await helpers.get_state_name_by_id(val.bill_state),
                  bill_city: enc_dec.cjs_encrypt(val.bill_city),
                  bill_city_name: await helpers.get_city_name_by_id(val.bill_city),
                  bill_zip_code: val.bill_zip_code,
                  logo: server_addr + ':' + port + "/static/logo/" + val.logo,
                  status: val.status == 1 ? "Deactivated" : "Activated",
               };

               send_res.push(res);
            }
            total_count = await invModel.get_count()
            res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
         })
         .catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         });
   },
   details_customer: async (req, res) => {
      let customer_id = await enc_dec.cjs_decrypt(req.bodyString("customer_id"));
      invModel.selectOne({ id: customer_id }).then(async (result) => {
         let send_res = [];
         let val = result

         let res1 = {
            customer_id: enc_dec.cjs_encrypt(val.id),
            prefix: val.prefix,
            name: val.name,
            email: val.email,
            country_code: val.code,
            mobile_no: val.mobile,
            shipping_address: val.shipping_address,
            ship_address: val.ship_address,
            ship_country: enc_dec.cjs_encrypt(val.ship_country),
            ship_country_name: await helpers.get_country_name_by_id(val.ship_country),
            ship_state: enc_dec.cjs_encrypt(val.ship_state),
            ship_state_name: await helpers.get_state_name_by_id(val.ship_state),
            ship_city: enc_dec.cjs_encrypt(val.ship_city),
            ship_city_name: await helpers.get_city_name_by_id(val.ship_city),
            ship_zip_code: val.ship_zip_code,
            billing_address: val.bill_address,
            bill_country: enc_dec.cjs_encrypt(val.bill_country),
            bill_country_name: await helpers.get_country_name_by_id(val.bill_country),
            bill_state: enc_dec.cjs_encrypt(val.bill_state),
            bill_state_name: await helpers.get_state_name_by_id(val.bill_state),
            bill_city: enc_dec.cjs_encrypt(val.bill_city),
            bill_city_name: await helpers.get_city_name_by_id(val.bill_city),
            bill_zip_code: val.bill_zip_code,
            logo: server_addr + ':' + port + "/static/logo/" + val.logo,
            status: val.status == 1 ? "Deactivated" : "Activated",
         };
         send_res = res1;


         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })
   },
   update_customer: async (req, res) => {
      try {
         let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
         let customer_id = await enc_dec.cjs_decrypt(req.bodyString("customer_id"));
         var insdata = {
            prefix: req.bodyString("name_prefix"),
            name: req.bodyString("name"),
            code: req.bodyString("country_code"),
            mobile: req.bodyString("mobile"),
            email: req.bodyString("email"),
            shipping_address: req.bodyString("shipping_address"),
            ship_address: req.bodyString("ship_address"),
            ship_country: await enc_dec.cjs_decrypt(req.bodyString("ship_country")),
            ship_state: await enc_dec.cjs_decrypt(req.bodyString("ship_state")),
            ship_city: await enc_dec.cjs_decrypt(req.bodyString("ship_city")),
            ship_zip_code: req.bodyString("ship_zip_code"),
            billing_address: req.bodyString("billing_address"),
            bill_address: req.bodyString("bill_address"),
            bill_country: await enc_dec.cjs_decrypt(req.bodyString("bill_country")),
            bill_state: await enc_dec.cjs_decrypt(req.bodyString("bill_state")),
            bill_city: await enc_dec.cjs_decrypt(req.bodyString("bill_city")),
            bill_zip_code: req.bodyString("bill_zip_code"),
            updated_at: added_date
         };

         if (req.all_files) {
            if (req.all_files.logo) {
               insdata.logo = req.all_files.logo
            }
         }


         $ins_id = await invModel.updateDetails({ id: customer_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },
   customer_deactivate: async (req, res) => {
      try {

         let customer_id = await enc_dec.cjs_decrypt(req.bodyString("customer_id"));
         var insdata = {
            'status': 1
         };


         $ins_id = await invModel.updateDetails({ id: customer_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Customer deactivated successfully'));
      } catch {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },
   customer_activate: async (req, res) => {
      try {

         let customer_id = await enc_dec.cjs_decrypt(req.bodyString("customer_id"));
         var insdata = {
            'status': 0
         };

         $ins_id = await invModel.updateDetails({ id: customer_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Customer activated successfully'));

      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   invoice_add: async (req, res) => {
      let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let ip = await helpers.get_ip(req);
      let total_amount = 0.0;
      let total_discount = 0.0;
      let total_tax = 0.0;
      let items = req.body.items;
      let product_items = [];
      for (i = 0; i < items.length; i++) {
         var rate = parseFloat(items[i].item_rate);
         var qty = parseInt(items[i].quantity);
         var tax = parseFloat(items[i].tax_per);
         var discount = parseFloat(items[i].discount_per);
         let temp_total = rate * qty;
         let tax_amount = 0
         if (tax > 0) {
            tax_amount = tax / 100 * temp_total;
         }
         let discount_amount = 0
         if (discount > 0) {
            discount_amount = discount / 100 * temp_total;
         }
         temp_total = temp_total + temp_total - discount_amount;
         total_amount = total_amount + temp_total;
         total_discount = total_discount + discount_amount;
         total_tax = total_tax + tax_amount;
         let temp_items = {
            invoice_master_id: "",
            item_id: enc_dec.cjs_decrypt(items[i].item),
            item_rate: rate,
            quantity: qty,
            tax_per: tax,
            discount_per: discount,
            total_amount: temp_total,
            added_by: req.user.id,
            ip: ip,
            status: 0,
            created_at: created_at,
            updated_at: created_at
         }
         product_items.push(temp_items);
      }

      let inv_data = {
         customer_id: enc_dec.cjs_decrypt(req.bodyString("customer_id")),
         merchant_id: req.user.id,
         sub_merchant_id: enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
         invoice_no: await helpers.make_order_number("INV"),
         currency: req.bodyString("currency"),
         total_amount: total_amount,
         total_tax: total_tax,
         total_discount: total_discount,
         description: req.bodyString("description"),
         special_note: req.bodyString("note"),
         issue_date: req.bodyString("issue_date"),
         expiry_date: req.bodyString("expiry_date"),
         payment_terms: req.bodyString("payment_terms"),
         status: 'Draft',
         added_by: req.user.id,
         ip: ip,
         created_at: created_at,
         updated_at: created_at
      }
      invModel.add_inv(inv_data).then((result) => {
         for (i = 0; i < product_items.length; i++) {
            product_items[i].invoice_master_id = result.insertId;
         }
         invModel.add_inv_items(product_items).then((result_meta) => {
            res.status(statusCode.ok).send(response.successdatamsg({invoice_id:enc_dec.cjs_encrypt(result.insertId)},'Invoice saved successfully.'));
         }).catch((error) => {
            res.status(statusCode.internalError).send(response.errormsg(error.message));
         })
      }).catch((error) => {
         console.log(error);
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })

   },

   invoice_list: async (req, res) => {
      // const merchant_name = await qrGenerateModule.getMerchantName();
      let limit = {
         perpage: 10,
         start: 0,
         page: 1,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }

      let and_filter_obj = {};
      let date_condition = {};

      let merchant = await enc_dec.cjs_decrypt(req.bodyString("merchant_id"));
      let sub_merchant = await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id"));
      let customer = await enc_dec.cjs_decrypt(req.bodyString("customer_id"));
      if (req.bodyString('status')) {
         and_filter_obj.status = req.bodyString('status')
      }
      // if (req.bodyString('customer_id')) {
      //    and_filter_obj.customer_id = req.bodyString('customer_id')
      // }
      if (merchant) {
         and_filter_obj.merchant_id = merchant
      }
      if (sub_merchant) {
         and_filter_obj.sub_merchant_id = sub_merchant
      }
      if (customer) {
         and_filter_obj.customer_id = customer
      }
      //   if(req.bodyString('email')){
      //       and_filter_obj.customer_email = req.bodyString('email')
      //   }
      //   if(req.bodyString('mobile')){
      //       and_filter_obj.customer_mobile = req.bodyString('mobile')
      //   }

      invModel.selectInv(and_filter_obj, limit).then(async (result) => {
         let send_res = [];
         for (let val of result) {

            let res = {
               invoice_master_id: enc_dec.cjs_encrypt(val.id),
               customer_id: await enc_dec.cjs_encrypt(val.customer_id),
               merchant_id: await enc_dec.cjs_encrypt(val.merchant_id),
               sub_merchant_id: await enc_dec.cjs_encrypt(val.sub_merchant_id),
               invoice_no: val.invoice_no,
               issue_date: moment(val.issue_date).format("YYYY-MM-DD"),
               expiry_date: moment(val.expiry_date).format("YYYY-MM-DD"),
               currency: val.currency,
               total_amount: val.total_amount,
               description: val.description,
               note: val.special_note,
               payment_terms: val.special_note,
               payment_status: val.status,

            }
            send_res.push(res);
         }
         let total_count = await invModel.get_countInv(and_filter_obj, date_condition)
         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })




      let email = req.bodyString('email');
      let date = req.bodyString("date");
      let merchant_id = enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id"));
      search = { "type_of_qr_code": "'Dynamic_QR'" }
      if (date) {
         search.transaction_date = "'" + date + "'";
      }
      if (email) {
         search.email = "'" + email + "'";
      }
      if (merchant_id) {
         search.merchant_qr_id = "'" + merchant_id + "'";
      }
      const filter = {}
      let result = await qrGenerateModule.select_payment_list(search, limit);
      let send_res = [];
      for (val of result) {
         let res;
         res = {
            id: enc_dec.cjs_encrypt(val.id),
            sub_merchant_id: await enc_dec.cjs_encrypt(val.merchant_qr_id),
            sub_merchant_name: merchant_name[val.merchant_qr_id],
            order_no: val.order_no,
            payment_id: val.payment_id,
            email: val.email,
            name: val.name,
            payment_status: val.payment_status,
            payment_date: moment(val.transaction_date).format("DD-MM-YYYY")
         };
         send_res.push(res);
      }
      let total_count = await qrGenerateModule.get_count_payment(search);
      res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.', total_count));

   },

   invoice_details: async (req, res) => {

      let invoice_id =  enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
      invModel.selectOneInv({ id: invoice_id }).then(async (result) => {
         let merchant_details = await invModel.getMerchantDetails({merchant_id:result.merchant_id});
         let send_res = [];
         let val = result
         let res1 = {
            invoice_master_id: enc_dec.cjs_encrypt(val.id),
            customer_id:  enc_dec.cjs_encrypt(val.customer_id),
            merchant_id:  enc_dec.cjs_encrypt(val.merchant_id),
            sub_merchant_id:  enc_dec.cjs_encrypt(val.sub_merchant_id),
            invoice_no: val.invoice_no,
            issue_date: moment(val.issue_date).format("YYYY-MM-DD"),
            expiry_date: moment(val.expiry_date).format("YYYY-MM-DD"),
            currency: val.currency,
            total_amount: val.total_amount,
            description: val.description,
            note: val.special_note,
            payment_terms: val.special_note,
            payment_status: val.status,
         };
         send_res = res1;


         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })
   },

   invoice_update: async (req, res) => {
      try {
         let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
         let invoice_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
         var insdata = {
            customer_id: await enc_dec.cjs_decrypt(req.bodyString("customer_id")),
            merchant_id: await enc_dec.cjs_decrypt(req.bodyString("merchant_id")),
            sub_merchant_id: await enc_dec.cjs_decrypt(req.bodyString("sub_merchant_id")),
            // invoice_no: await helpers.make_order_number("INV"),
            currency: req.bodyString("currency"),
            total_amount: req.bodyString("total_amount"),
            description: req.bodyString("description"),
            special_note: req.bodyString("note"),
            issue_date: req.bodyString("issue_date"),
            expiry_date: req.bodyString("expiry_date"),
            payment_terms: req.bodyString("payment_terms"),
            status: req.bodyString("payment_status"),
            updated_at: added_date
         };

         if (req.all_files) {
            if (req.all_files.logo) {
               insdata.logo = req.all_files.logo
            }
         }


         $ins_id = await invModel.updateDetailsInv({ id: invoice_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   invoice_deactivate: async (req, res) => {
      try {

         let invoice_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
         var insdata = {
            'status': 1
         };


         $ins_id = await invModel.updateDetails({ id: invoice_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Customer deactivated successfully'));
      } catch {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },

   invoice_activate: async (req, res) => {
      try {

         let invoice_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
         var insdata = {
            'status': 0
         };

         $ins_id = await invModel.updateDetails({ id: invoice_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Customer activated successfully'));

      } catch (error) {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },



   //invoice item start
   item_add: async (req, res) => {
      let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let ip = await helpers.get_ip(req);
      let item = req.body.item;
      let invoice_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
      let resp = [];
      for (i = 0; i < item.length; i++) {
         slab_data = {
            "invoice_master_id": invoice_id,
            "item_rate": item[i].item_rate,
            "quantity": item[i].quantity,
            "tax_per": item[i].tax_per,
            "discount_per": item[i].discount_per,
            "total_amount": item[i].total_amount,
            "added_by": req.user.id,
            "ip": ip,
            "created_at": added_date
         }
         resp.push(slab_data)
      }
      await invModel.add_item(resp);
      res.status(statusCode.ok).send(response.successmsg('Added successfully'));
      // let item_data={
      //    invoice_master_id: await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id")),
      // }

   },
   //invoice item stop

   item_list: async (req, res) => {
      // const merchant_name = await qrGenerateModule.getMerchantName();
      let limit = {
         perpage: 10,
         start: 0,
         page: 1,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))

         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }

      let invoice_master_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"))
      let and_filter_obj = {};
      // let date_condition = {};

      if (invoice_master_id) {
         and_filter_obj.invoice_master_id = invoice_master_id
      }
      // if (req.bodyString('customer_id')) {
      //    and_filter_obj.customer_id = req.bodyString('customer_id')
      // }
      // //   if(req.bodyString('email')){
      // //       and_filter_obj.customer_email = req.bodyString('email')
      // //   }
      // //   if(req.bodyString('mobile')){
      // //       and_filter_obj.customer_mobile = req.bodyString('mobile')
      // //   }
      // if (req.bodyString('from_date')) {
      //    date_condition.from_date = req.bodyString('from_date')
      // }

      // if (req.bodyString('to_date')) {
      //    date_condition.to_date = req.bodyString('to_date')
      // }


      invModel.select_item(limit).then(async (result) => {
         let send_res = [];
         for (let val of result) {
            let res = {
               item_id: await enc_dec.cjs_encrypt(val.id),
               invoice_merchant_id: await enc_dec.cjs_encrypt(val.invoice_master_id),
               item_rate: val.item_rate,
               quantity: val.quantity,
               tax_per: val.tax_per,
               discount_per: val.discount_per,
               total_amount: val.total_amount,
            }
            send_res.push(res);
         }
         // let total_count = await invModel.get_countInv(and_filter_obj, date_condition)
         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })
   },

   item_details: async (req, res) => {
      let invoice_master_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
      invModel.selectOneInv({ id: invoice_master_id }).then(async (result) => {
         let send_res = [];
         let val = result

         let res1 = {
            invoice_master_id: await enc_dec.cjs_encrypt(invoice_master_id),
            customer_id: await enc_dec.cjs_encrypt(val.customer_id),
            invoice_no: val.invoice_no,
            issue_date: moment(val.issue_date).format("YYYY-MM-DD"),
            expiry_date: moment(val.expiry_date).format("YYYY-MM-DD"),
            currency: val.currency,
            total_amount: val.total_amount,
            status: val.status,
            item_list: await invModel.list_of_item({ invoice_master_id: invoice_master_id, status: "0" })
         };
         send_res = res1;


         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })

   },

   item_update: async (req, res) => {
      let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
      let ip = await helpers.get_ip(req);
      let invoice_master_id = await enc_dec.cjs_decrypt(req.bodyString("invoice_master_id"));
      let item = req.body.item;
      let document_obj
      invModel.selectOne_item({ invoice_master_id: invoice_master_id }).then(async (result) => {
         let resp = [];
         for (i = 0; i < item.length; i++) {
            if (item[i].item_id) {
               document_obj = {
                  "item_rate": item[i].item_rate,
                  "quantity": item[i].quantity,
                  "tax_per": item[i].tax_per,
                  "discount_per": item[i].discount_per,
                  "total_amount": item[i].total_amount,
                  "updated_at": added_date,
               }
            }

            if (item[i].item_id == "") {
               document_obj = {
                  "invoice_master_id": invoice_master_id,
                  "item_rate": item[i].item_rate,
                  "quantity": item[i].quantity,
                  "tax_per": item[i].tax_per,
                  "discount_per": item[i].discount_per,
                  "total_amount": item[i].total_amount,
                  "added_by": req.user.id,
                  "ip": ip,
                  "created_at": added_date,
                  "updated_at": added_date,
               }
               await invModel.add_item(document_obj)
            } else {
               await invModel.update_item({ id: enc_dec.cjs_decrypt(item[i].item_id) }, document_obj)
            }
         }
         res.status(statusCode.ok).send(response.successmsg('Record updated successfully'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })



   },
   item_delete: async (req, res) => {
      try {

         let item_id = await enc_dec.cjs_decrypt(req.bodyString("item_id"));
         var insdata = {
            'status': 1
         };
         $ins_id = await invModel.update_item({ id: item_id }, insdata);
         res.status(statusCode.ok).send(response.successmsg('Item deleted successfully'));
      } catch {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },
   item_master_add: async (req, res) => {
      try {
         let created_at = new Date().toJSON().substring(0, 19).replace('T', ' ');
         var insdata = {
            item_name: req.bodyString("item_name"),
            item_rate: req.bodyString("item_rate"),
            item_description: req.bodyString("item_description"),
            status: 1,
            merchant_id: req.user.id,
            created_at: created_at
         };
         let ins_id = await invModel.item_master_add(insdata);
         res.status(statusCode.ok).send(response.successdatamsg({ item_id: enc_dec.cjs_encrypt(ins_id.insertId), item_rate: insdata.item_rate, item_name: insdata.item_name }, 'Item added successfully'));
      } catch {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      }
   },
   item_master_list: async (req, res) => {
      let condition = {};
      if (req.user.type == 'merchant') {
         condition.merchant_id = req.user.id
      }
      let limit = {
         perpage: 10,
         start: 0,
         page: 1,
      }
      if (req.bodyString('perpage') && req.bodyString('page')) {
         perpage = parseInt(req.bodyString('perpage'))
         start = parseInt(req.bodyString('page'))
         limit.perpage = perpage
         limit.start = ((start - 1) * perpage)
      }
      invModel.item_master_list(limit, condition).then(async (result) => {
         let send_res = [];
         for (let val of result) {
            let res = {
               item_id: enc_dec.cjs_encrypt(val.id),
               item_rate: enc_dec.cjs_encrypt(val.item_rate),
               item_name: val.item_name,
            }
            send_res.push(res);
         }
         // let total_count = await invModel.get_countInv(and_filter_obj, date_condition)
         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'List fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })

   },
   item_master_details: async (req, res) => {
      let item_id = enc_dec.cjs_decrypt(req.bodyString("item_id"));
      invModel.selectOneItem({ id: item_id }).then(async (result) => {
         let send_res = [];
         let val = result;
         let res1 = {
            item_name: val.item_name,
            item_rate: val.item_rate,
            item_description: val.item_description,
            status: val.status == 1 ? "Deactivated" : "Activated",
         };
         send_res = res1;
         res.status(statusCode.ok).send(response.successdatamsg(send_res, 'Details fetched successfully.'));
      }).catch((error) => {
         res.status(statusCode.internalError).send(response.errormsg(error.message));
      })
   }

}

module.exports = inv;
