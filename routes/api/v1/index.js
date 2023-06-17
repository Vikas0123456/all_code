const express = require("express");
const app = express();
const multerUploader = require("../../../uploads/multer");
const multipleupload = require("../../../uploads/multipleupload");
const invlogoUpload = require("../../../uploads/inv_logoupload");
const multipleupload_logo = require("../../../uploads/multipleupload_logo");
const multipleupdateupload = require("../../../uploads/multipleupdateupload");
const multipledocupload = require("../../../uploads/multipledocupload");
const multipleupload_branding = require("../../../uploads/multipleupload_branding");
const multipleupload_owners = require("../../../uploads/multipleupload_owners");
const uploadCustomerProfilePic = require("../../../uploads/uploadcustomerprofile");
const compliancemail = require("../../../uploads/compliancemail")
const invoice = require("../../../controller/invoice");
const QR_payment = require('../../../controller/merchant_qr_payment');
const pricing = require('../../../controller/pricing');
const Validator = require('../../../utilities/validations/index');
const KasToUaeValidator = require('../../../utilities/validations/KasToUaeValidator');
const Auth = require('../../../controller/auth');
const Designation = require('../../../controller/designation');
const Documentation = require('../../../controller/documentation');
const Department = require('../../../controller/department');
const Entity = require('../../../controller/entity');
const MccCategory = require('../../../controller/mcc_category');
const Mcc = require('../../../controller/mcc');
const Currency = require('../../../controller/currency');
const Customers = require('../../../controller/customers');
const Type_of_business = require('../../../controller/type_of_business');
const Language = require('../../../controller/language');
const merchant = require('../../../controller/merchant');
const submerchant = require('../../../controller/submerchant');
const PspValidator = require('../../../utilities/validations/psp');
const CustomerValidator = require('../../../utilities/validations/customers');
const MerchantRegisterValidator = require('../../../utilities/validations/merchant_registration');
const MerchantEkycValidator = require('../../../utilities/validations/merchant_ekyc');
const Nationality = require("../../../controller/nationality");
const subs_plan = require('../../../controller/subs_plan')

const MerchantDetailsById = require('../../../utilities/validations/fetchMerchantDetails');
const MerchantOrderValidator = require('../../../utilities/validations/merchantOrderValidator');
const SubscriptionPlanValidator = require('../../../utilities/validations/subscription_plan_validation');
const SecurityQuestions = require('../../../controller/security_questions');
//admin
const admin_user = require('../../../controller/admin_user');
const partner = require('../../../controller/partner');
const Dashboard = require('../../../controller/dashboard');

//merchant
const merchant_category = require('../../../controller/merchant_category')
const countries = require('../../../controller/country')
const states = require('../../../controller/state')
const city = require('../../../controller/city')
const logs = require('../../../controller/logs')
const Setting = require('../../../controller/setting')
const Order = require('../../../controller/order')
const KSA_UAE_merchant = require('../../../controller/ksa_uae_merchant')
const ksaUaeAdmin = require('../../../controller/ksa_uae_admin')

/*Psp controller*/
const Psp = require('../../../controller/psp');
/*Merchant Register Controller*/
const MerchantRegister = require('../../../controller/merchant_registration');
const MerchantEkyc = require('../../../controller/merchant_ekyc')
const MerchantOrder = require('../../../controller/merchantOrder');
const QR_generate = require("../../../controller/merchant_qr_code");
const merchants = require('../../../controller/merchantController');
const payout = require('../../../controller/payout');
const password = require('../../../controller/password')
/* file upload start*/
//const multerUploader = require('../../../uploads/multer');
const uploadedPanel = require('../../../uploads/uploadedPanel');
/*File upload end*/
/* Transaction setup start*/
const Transaction_setup = require("../../../controller/charges_transaction_setup")
const Transaction_validation = require('../../../utilities/validations/charges_transaction_setup')
const merchant_charges = require('../../../utilities/validations/charges_merchant_maintenance');
const merchantMaintenance = require('../../../controller/charges_merchant_maintenance');
const QR_validation = require('../../../utilities/validations/qr_validation');
const invoiceValidation = require('../../../utilities/validations/invoiceValidation');
const MerchantUserValidator = require('../../../utilities/validations/merchantUserValidator');
const PricingPlanValidator = require('../../../utilities/validations/pricing_plan');
// const Transaction_validation = require('../../../utilities/validations/charges_transaction_setup')
/* Transaction setup end*/
/*O Auth2 Manager*/
const CheckHeader = require('../../../utilities/tokenmanager/headers');
const CheckAuth = require('../../../utilities/tokenmanager/authmanager');
const CheckToken = require('../../../utilities/tokenmanager/checkToken');
const checkMerchantShiftToken = require('../../../utilities/tokenmanager/checkMerchantShiftToken');

const CheckMerchantToken = require('../../../utilities/tokenmanager/checkMerchantToken');
const CheckCustomerToken = require('../../../utilities/tokenmanager/checkCustomerToken');
const CheckCustomToken = require('../../../utilities/tokenmanager/checkCustomToken');
const checkEKYCToken = require('../../../utilities/tokenmanager/checkEKYCToken');
const RefreshToken = require('../../../utilities/tokenmanager/refreshToken');
const MerchantRegistration = require("../../../controller/merchant_registration");
const CheckMerchantCred = require('../../../utilities/tokenmanager/checkMerchantCred');
const checkOrderToken = require('../../../utilities/tokenmanager/checkOrderToken');
const FraudCheck = require('../../../utilities/fraud_ip_detector/index.js')
const ChargeCalculator = require('../../../utilities/charges-calculator/index');
const checkMerchantKyc = require('../../../utilities/tokenmanager/checkForMerchantEkyc');

/** Look Up */
const lookupValidatior = require('../../../utilities/validations/lookupvalidation');
const lookup = require('../../../controller/lookup');
/** Look Up End */
/** Proxy API */
const leads = require("../../../controller/leadsController");
const BankDocument = require("../../../uploads/merchant_bank");
/** */
/** Zendesk API */
const SystemTicketAttachment = require('../../../uploads/system_ticket_upload')
const system_ticket = require('../../../controller/system_ticket');
const database_dump = require("../../../controller/database_dump");
const proxy = require("../../../utilities/validations/proxyapi_validation");
var cron = require('node-cron');
/** */
const Terminal = require("../../../controller/terminal");
const TerminalValidator = require("../../../utilities/validations/terminalValidator");
const MerchantKeyAndSecret = require("../../../controller/merchant_key_and_secret");
const MerchantKeyAndSecretValidator = require("../../../utilities/validations/merchantKeyAndSecretValidator");
const CardMasterValidator = require("../../../utilities/validations/CardMasterValidator");
const CardMaster = require("../../../controller/cardMaster");

/** Store Status*/
const StoreStatusValidator = require("../../../utilities/validations/storeStatusValidator")
const StoreStatus = require("../../../controller/storeStatus");
const webHook = require("../../../controller/webhook_settings");
const {
    webhook
} = require("twilio/lib/webhooks/webhooks");
const checkToken = require("../../../utilities/tokenmanager/checkToken");
const webHookValidator = require("../../../utilities/validations/webhook_validation");
const encrypt_decrypt = require("../../../utilities/decryptor/encrypt_decrypt");
const { dashboard } = require("../../../controller/dashboard");
const store_image_upload = require('../../../uploads/store_images');
const store_image_validator = require('../../../utilities/validations/store_qr_images');
const store_qr_validator = require('../../../utilities/validations/store_qr');
const store_image_controller = require('../../../controller/store_qr_images');
const store_qr = require('../../../controller/store_qr');

const txnValidation = require("../../../utilities/validations/txnValidation");
const EFRValidation = require("../../../utilities/validations/EFRValidation");
const Cotroller = require("../../../controller/EFR");
const kycupload = require("../../../uploads/videokycUpload");
const instructionValidation = require("../../../utilities/validations/instructionValidator");
const instructionMaster = require("../../../controller/instruction_master");
const prompterValidation = require("../../../utilities/validations/prompterValidator");
const masterPrompter = require("../../../controller/master_promter");
const cardVariantValidation = require("../../../utilities/validations/cardVariantValidation");
const cardVariantMaster = require("../../../controller/cardVariantMaster");
const walletMaster = require("../../../controller/walletMaster");
const paymentMode = require("../../../controller/paymentMode");
const newInvoice = require("../../../controller/newInvoice");
const newInvoiceValidation = require("../../../utilities/validations/newInvoiceValidation");

app.post('/login', CheckHeader, Validator.login, Auth.login);
app.post('/forget-password', CheckHeader, Validator.forget_password, Auth.forget_password);
app.post('/reset', CheckHeader, Validator.reset_forget_password, Auth.updateForgetPassword);
app.post('/change-password', CheckHeader, CheckToken, Validator.change_password, Auth.changepassword);
//app.post('/merchant/login',CheckHeader, Validator.partner_login, Auth.merchantlogin);

// app.post('/token', RefreshToken)
// app.get('/profile', CheckToken, Auth.profile);
// app.post('/update-password', Validator.updatePassword, Auth.updatePassword);

//Dashboard
app.post('/dashboard', CheckHeader, CheckToken, Dashboard.dashboard);
//app.post('/transaction-total', CheckHeader, CheckToken, Dashboard.transaction_total);
// app.post('/psp-total', CheckHeader, CheckToken, Dashboard.psp_total);
// app.post('/merchants-total', CheckHeader, CheckToken, Dashboard.merchant_total)
//Admin
app.post('/admin/register', CheckHeader, CheckToken, multerUploader.uploadUserProfilePic, Validator.register, admin_user.register);
app.post('/admin/create-password', CheckHeader, Validator.create_password, admin_user.create_password);
app.post('/admin/list', CheckHeader, CheckToken, admin_user.list);
app.post('/admin/password', CheckHeader, CheckToken, Validator.admin_details, admin_user.password);
app.post('/admin/details', CheckHeader, CheckToken, Validator.admin_details, admin_user.admin_details);
app.post('/admin/update', CheckHeader, CheckToken, multerUploader.uploadUserProfilePic, Validator.admin_details_update, admin_user.update);
app.post('/admin/altr-update', CheckHeader, CheckToken, multerUploader.uploadUserProfilePic,admin_user.altrupdate);
app.post('/admin/deactivate', CheckHeader, CheckToken, Validator.admin_deactivate, admin_user.deactivate);
app.post('/admin/otherserver/deactivate',CheckHeader, CheckToken, admin_user.server_deactivate);
app.post('/admin/activate', CheckHeader, CheckToken, Validator.admin_activate, admin_user.activate);
app.post('/admin/otherserver/activate',CheckHeader, CheckToken, admin_user.server_activate);
app.post('/admin/delete', CheckHeader, CheckToken, Validator.admin_delete, admin_user.delete);
app.post('/admin/otherserver/delete', CheckHeader, CheckToken, admin_user.server_delete);
app.post('/admin/block', CheckHeader, CheckToken, Validator.admin_blocked, admin_user.blocked);
app.post('/admin/otherserver/block', CheckHeader, CheckToken, admin_user.server_blocked);
app.post('/admin/unblock', CheckHeader, CheckToken, Validator.admin_unblocked, admin_user.unblocked);
app.post('/admin/otherserver/unblock', CheckHeader, CheckToken, admin_user.server_unblocked);
app.post('/admin/reset-password', CheckHeader, Validator.reset_password, Auth.reset_password);

//partner
app.post('/partner/add', CheckHeader, CheckToken, Validator.partner_add, partner.add);
app.post('/partner/list', CheckHeader, CheckToken, partner.list);
app.post('/partner/list/filter', CheckHeader, CheckToken, partner.filter_list);
app.post('/partner/details', CheckHeader, CheckToken, Validator.partner_details, partner.details);
app.post('/partner/password', CheckHeader, CheckToken, Validator.partner_details, partner.password);
app.post('/partner/update', CheckHeader, CheckToken, Validator.partner_update, partner.update);
app.post('/partner/deactivate', CheckHeader, CheckToken, Validator.partner_deactivate, partner.deactivate);
app.post('/partner/activate', CheckHeader, CheckToken, Validator.partner_activate, partner.activate);
app.post('/partner/delete', CheckHeader, CheckToken, Validator.partner_delete, partner.delete);
app.post('/partner/block', CheckHeader, CheckToken, Validator.partner_blocked, partner.blocked);
app.post('/partner/unblock', CheckHeader, CheckToken, Validator.partner_unblocked, partner.unblocked);

//merchant
app.post('/merchant/add', CheckHeader, CheckToken, Validator.merchant_add, merchant.add);
app.post('/merchant/list', CheckHeader, CheckToken, merchant.list);
//api updated in telr for store details
app.post('/store/details', CheckHeader, CheckToken, Validator.store_get, merchant.store_get);
app.post('/store/update', CheckHeader, CheckToken, Validator.store_update, merchant.store_update);
app.post('/merchant/list/filter', CheckHeader, CheckToken, merchant.filter_list);
app.post('/merchant/details', CheckHeader, CheckToken, Validator.merchant_details, merchant.details);
app.post('/merchant/password', CheckHeader, CheckToken, Validator.merchant_details, merchant.password);
app.post('/merchant/update', CheckHeader, CheckToken, Validator.merchant_update, merchant.update);
app.post('/merchant/deactivate', CheckHeader, CheckToken, Validator.merchant_deactivate, merchant.deactivate);
app.post('/merchant/activate', CheckHeader, CheckToken, Validator.merchant_activate, merchant.activate);
app.post('/merchant/delete', CheckHeader, CheckToken, Validator.merchant_delete, merchant.delete);
app.post('/merchant/block', CheckHeader, CheckToken, Validator.merchant_blocked, merchant.blocked);
app.post('/merchant/unblock', CheckHeader, CheckToken, Validator.merchant_unblocked, merchant.unblocked);
app.post('/merchant/branding', CheckHeader, CheckMerchantToken, multipleupload_branding, Validator.merchant_branding, merchant.branding_update);

//sub-merchant
app.post('/submerchant/add', CheckHeader, CheckMerchantToken, Validator.submerchant_add, submerchant.add);
app.post('/submerchant/list', CheckHeader, CheckMerchantToken, submerchant.list);
app.post('/submerchant/list-ekycpending', CheckHeader, CheckMerchantToken, submerchant.list_ekycPending);
app.post('/submerchant/details', CheckHeader, CheckMerchantToken, Validator.submerchant_details, submerchant.details);
app.post('/submerchant/psp-list', CheckHeader, CheckMerchantToken, Validator.submerchant_psp, submerchant.psp_list);
app.post('/submerchant/update', CheckHeader, CheckMerchantToken, Validator.submerchant_update, submerchant.update);
app.post('/submerchant/deactivate', CheckHeader, CheckMerchantToken, Validator.submerchant_deactivate, submerchant.deactivate);
app.post('/submerchant/activate', CheckHeader, CheckMerchantToken, Validator.submerchant_activate, submerchant.activate);
app.post('/submerchant/delete', CheckHeader, CheckMerchantToken, Validator.submerchant_delete, submerchant.delete);
app.post('/submerchant/add-mid', CheckHeader, CheckMerchantToken, submerchant.add_mid);
app.post('/submerchant/delete-mid', CheckHeader, CheckMerchantToken, Validator.submerchant_delete_mid, submerchant.delete_mid);
app.post('/submerchant/list-mid', CheckHeader, CheckMerchantToken, submerchant.list_mid);
app.post('/submerchant/branding_details', CheckHeader, CheckMerchantToken, submerchant.branding_details);
app.post('/submerchant/branding', CheckHeader, CheckMerchantToken, multipleupload_branding, Validator.merchant_branding, submerchant.branding_update);
//designation 
app.post('/designation/add', CheckHeader, CheckToken, Validator.designation_add, Designation.add);
app.post('/designation/list', CheckHeader, CheckToken, Designation.list);
app.post('/designation/details', CheckHeader, CheckToken, Validator.designation_details, Designation.details);
app.post('/designation/update', CheckHeader, CheckToken, Validator.designation_update, Designation.update);
app.post('/designation/deactivate', CheckHeader, CheckToken, Validator.designation_deactivate, Designation.deactivate);
app.post('/designation/activate', CheckHeader, CheckToken, Validator.designation_activate, Designation.activate);
app.post('/designation/delete', CheckHeader, CheckToken, Validator.designation_delete, Designation.delete);

//department 
app.post('/department/add', CheckHeader, CheckToken, Validator.department_add, Department.add);
app.post('/department/list', CheckHeader, CheckToken, Department.list);
app.post('/department/details', CheckHeader, CheckToken, Validator.department_details, Department.details);
app.post('/department/update', CheckHeader, CheckToken, Validator.department_update, Department.update);
app.post('/department/deactivate', CheckHeader, CheckToken, Validator.department_deactivate, Department.deactivate);
app.post('/department/activate', CheckHeader, CheckToken, Validator.department_activate, Department.activate);
app.post('/department/delete', CheckHeader, CheckToken, Validator.department_delete, Department.delete);

//type_of_business 
app.post('/type_of_business/add', CheckHeader, CheckToken, Validator.type_of_business_add, Type_of_business.add);
app.post('/type_of_business/list', CheckHeader, CheckToken, Type_of_business.list);
app.post('/type_of_business/details', CheckHeader, CheckToken, Validator.type_of_business_details, Type_of_business.details);
app.post('/type_of_business/update', CheckHeader, CheckToken, Validator.type_of_business_update, Type_of_business.update);
app.post('/type_of_business/deactivate', CheckHeader, CheckToken, Validator.type_of_business_deactivate, Type_of_business.deactivate);
app.post('/type_of_business/activate', CheckHeader, CheckToken, Validator.type_of_business_activate, Type_of_business.activate);
app.post('/type_of_business/delete', CheckHeader, CheckToken, Validator.type_of_business_delete, Type_of_business.delete);


//currency 
app.post('/currency/add', CheckHeader, CheckToken, Validator.currency_add, Currency.add);
app.post('/currency/list', CheckHeader, CheckToken, Currency.list);
app.post('/currency/details', CheckHeader, CheckToken, Validator.currency_details, Currency.details);
app.post('/currency/update', CheckHeader, CheckToken, Validator.currency_update, Currency.update);
app.post('/currency/deactivate', CheckHeader, CheckToken, Validator.currency_deactivate, Currency.deactivate);
app.post('/currency/activate', CheckHeader, CheckToken, Validator.currency_activate, Currency.activate);
app.post('/currency/delete', CheckHeader, CheckToken, Validator.currency_delete, Currency.delete);


// //merchant category 
// app.post('/merchant/category/add',CheckToken, Validator.merchant_category_add, merchant_category.add);
// app.post('/merchant/category/list',CheckToken,  merchant_category.list);
// app.post('/merchant/category/details',CheckToken, Validator.merchant_category_details, merchant_category.details);
// app.post('/merchant/category/update',CheckToken, Validator.merchant_category_update, merchant_category.update);


//countries 

app.post('/country/add', CheckHeader, CheckToken, Validator.country_add, countries.add);
app.post('/country/list', CheckHeader, countries.list);
app.post('/country/details', CheckHeader, CheckToken, Validator.country_details, countries.details);
app.post('/country/update', CheckHeader, CheckToken, Validator.country_update, countries.update);
app.post('/country/deactivate', CheckHeader, CheckToken, Validator.country_deactivate, countries.country_deactivate);
app.post('/country/activate', CheckHeader, CheckToken, Validator.country_activate, countries.country_activate);
app.post('/country/delete', CheckHeader, CheckToken, Validator.country_delete, countries.country_delete);

//state 
app.post('/state/add', CheckHeader, CheckToken, Validator.state_add, states.add);
app.post('/state/list', CheckHeader, CheckToken, Validator.state_list, states.list);
app.post('/state/details', CheckHeader, CheckToken, Validator.state_details, states.details);
app.post('/state/update', CheckHeader, CheckToken, Validator.state_update, states.update);
app.post('/state/deactivate', CheckHeader, CheckToken, Validator.state_deactivate, states.states_deactivate);
app.post('/state/activate', CheckHeader, CheckToken, Validator.state_activate, states.states_activate);
app.post('/state/delete', CheckHeader, CheckToken, Validator.state_delete, states.states_delete);

//city 
app.post('/city/add', CheckHeader, CheckToken, Validator.city_add, city.add);
app.post('/city/list', CheckHeader, CheckToken, Validator.city_list, city.list);
app.post('/city/details', CheckHeader, CheckToken, Validator.city_details, city.details);
app.post('/city/update', CheckHeader, CheckToken, Validator.city_update, city.update);
app.post('/city/deactivate', CheckHeader, CheckToken, Validator.city_deactivate, city.deactivate);
app.post('/city/activate', CheckHeader, CheckToken, Validator.city_activate, city.activate);
app.post('/city/delete', CheckHeader, CheckToken, Validator.city_delete, city.delete);

//language 
app.post('/language/add', CheckHeader, CheckToken, multipleupload, Validator.language_add, Language.add);
app.post('/language/list', CheckHeader, Language.list);
app.post('/language/details', CheckHeader, Validator.language_details, Language.details);
app.post('/language/update', CheckHeader, CheckToken, multipleupdateupload, Validator.language_update, Language.update);
app.post('/language/deactivate', CheckHeader, CheckToken, Validator.language_deactivate, Language.deactivate);
app.post('/language/activate', CheckHeader, CheckToken, Validator.language_activate, Language.activate);
app.post('/language/delete', CheckHeader, CheckToken, Validator.language_delete, Language.delete);


//setting
app.post('/setting/language/change', CheckHeader, CheckToken, Validator.language_details, Setting.change_language);
app.post('/setting/env/change', CheckHeader, CheckMerchantToken, Setting.change_env);
app.post('/setting/theme/change', CheckHeader, CheckToken, Validator.theme_change, Setting.change_theme);
app.post('/setting/header/info', CheckHeader, CheckToken, Setting.header_info);
app.post('/setting/header/login/info', CheckHeader, Setting.login_info);
app.post('/setting/company/details', CheckHeader, CheckToken, Setting.company_info);
app.post('/setting/smtp/details', CheckHeader, CheckToken, Setting.smtp_info);
app.post('/setting/company/update', CheckHeader, CheckToken, multipleupload_logo, Validator.company_update, Setting.company_update);
app.post('/setting/company/smtp', CheckHeader, CheckToken, Validator.smtp_update, Setting.smtp_update);
app.post('/transaction-limit', CheckHeader, CheckToken, Setting.add_transaction_limit);
app.post('/transaction-limit-details', CheckHeader, CheckToken, Setting.details_transaction_limit);
app.post('/transaction-limit/delete', CheckHeader, CheckToken, Setting.delete_transaction);
app.post('/suspicious-ip/list', CheckHeader, CheckToken, Setting.suspicious_ip_list);
app.post('/suspicious-ip/delete', CheckHeader, CheckToken, Setting.delete_suspicious_ip);
app.post('/suspicious-ip/add', CheckHeader, CheckToken, Validator.suspicious_ip_add, Setting.add_suspicious_ip)
app.post('/fraud-detection/details', CheckHeader, CheckToken, Setting.get_fraud_detection);
app.post('/fraud-detection/update', CheckHeader, CheckToken, Validator.fraud_detection_update, Setting.update_fraud_detections)
//documentation 
app.post('/documentation/tc/add', CheckHeader, CheckToken, Validator.tc_add, Documentation.add);
app.post('/documentation/tc/list', CheckHeader, CheckToken, Documentation.list);
app.post('/documentation/tc/details', CheckHeader, CheckToken, Validator.tc_details, Documentation.details);
app.post('/auth/tc/details', CheckHeader, Documentation.auth_tc);
app.post('/documentation/tc/update', CheckHeader, CheckToken, Validator.tc_update, Documentation.update);
app.post('/documentation/tc/delete', CheckHeader, CheckToken, Validator.tc_delete, Documentation.delete);



//Create Order
app.post('/transactions/list', CheckHeader, CheckToken, Order.list);
app.post('/transactions/list/pdf', CheckHeader, CheckToken, Order.exportPdf);
app.post('/transactions/list/excel', CheckHeader, CheckToken, Order.exportExcel);
app.post('/transactions/details', CheckHeader, CheckToken, Validator.transaction_details, Order.details);
app.post('/order/payment/mode', CheckHeader, CheckToken, Order.payment_status);
app.post('/transactions/high-risk', CheckHeader, CheckToken, Order.highrisk_list);
//update-profile-super-merchant
app.post('/update/supermerchant', CheckHeader, CheckMerchantToken, Validator.update_profile, MerchantEkyc.update_profile);
app.post('/list/supermerchant', CheckHeader, CheckToken, MerchantEkyc.super_merchant_list);
//logs
app.post('/logs/list', CheckHeader, CheckToken, logs.list);
// mcc code
app.post('/psp/get-mcc-code', CheckHeader, CheckToken, Psp.getMccCodes);
app.post('/psp/add', CheckHeader, CheckToken, PspValidator.add, Psp.add);
app.post('/psp/list', CheckHeader, CheckToken, Psp.list);
app.post('/psp/psp_list', CheckHeader, Psp.psp_list);
app.post('/psp/details', CheckHeader, CheckToken, PspValidator.get, Psp.get);
app.post('/psp/update', CheckHeader, CheckToken, PspValidator.update, Psp.update);
app.post('/psp/deactivate', CheckHeader, CheckToken, PspValidator.deactivate, Psp.deactivate);
app.post('/psp/activate', CheckHeader, CheckToken, PspValidator.activate, Psp.activate);
app.post('/psp/delete', CheckHeader, CheckToken, PspValidator.delete, Psp.delete);


// Register merchant
app.post('/pipe-drive/signup', CheckHeader, MerchantRegisterValidator.register, MerchantRegister.signup);
app.post('/merchant-onboarding/register', CheckHeader, MerchantRegisterValidator.register, MerchantRegister.register);
app.post('/merchant-onboarding/check-verification-link', CheckHeader, MerchantRegisterValidator.verify_link);
app.post('/merchant-onboarding/reset-password', CheckHeader, MerchantRegisterValidator.reset_password, MerchantRegister.reset_password);
app.post('/merchant-onboarding/generate-otp', CheckHeader, MerchantRegisterValidator.otp_registration, MerchantRegister.generate_otp)
app.post('/merchant-onboarding/resend-otp', CheckHeader, MerchantRegisterValidator.resend_otp, MerchantRegister.resend_otp)
app.post('/merchant-onboarding/verify-otp', CheckHeader, MerchantRegisterValidator.verify_otp, MerchantRegistration.verify_otp)
app.post('/merchant-onboarding/resend-verification-link', CheckHeader, MerchantRegisterValidator.resend_link, MerchantRegister.resend_link);

//Entity type
// app.post('/entity/add', CheckHeader, CheckToken, Entity.add);
app.post('/entity/list', CheckHeader, CheckToken, Entity.list);
app.post('/entity/document-name/list', CheckHeader, CheckToken, Entity.entity_document_name_list);
app.post('/entity/details', CheckHeader, CheckToken, Validator.entity_details, Entity.details);
// app.post('/entity/update', CheckHeader, CheckToken, Entity.update);
// app.post('/entity/deactivate', CheckHeader, CheckToken, Validator.entity_deactivate, Entity.deactivate);
// app.post('/entity/activate', CheckHeader, CheckToken, Validator.entity_activate, Entity.activate);
// app.post('/entity/delete', CheckHeader, CheckToken, Validator.entity_delete, Entity.delete);

//MCC category
app.post('/mcc_category/add', CheckHeader, CheckToken, Validator.mcc_category_add, MccCategory.add);
app.post('/mcc_category/list', CheckHeader, CheckToken, MccCategory.list);
app.post('/mcc_category/details', CheckHeader, CheckToken, Validator.mcc_category_details, MccCategory.details);
app.post('/mcc_category/update', CheckHeader, CheckToken, Validator.mcc_category_update, MccCategory.update);
app.post('/mcc_category/deactivate', CheckHeader, CheckToken, Validator.mcc_category_deactivate, MccCategory.deactivate);
app.post('/mcc_category/activate', CheckHeader, CheckToken, Validator.mcc_category_activate, MccCategory.activate);
app.post('/mcc_category/delete', CheckHeader, CheckToken, Validator.mcc_category_delete, MccCategory.delete);

//Merchant login and ekyc
app.post('/merchant/login', CheckHeader, MerchantEkycValidator.login, MerchantEkyc.login);
app.post('/merchant/login/verify-otp', CheckHeader, MerchantRegisterValidator.verify_otp, MerchantEkyc.verify_otp)

app.post('/merchant-ekyc/list-mcc-codes', CheckHeader, MerchantEkyc.getMccCodes);
app.post('/merchant-ekyc/psp-by-mcc', CheckHeader, MerchantEkycValidator.psp_by_mcc, MerchantEkyc.getPspByMcc)

app.post('/merchant-ekyc/business-type', CheckHeader, CheckMerchantToken,multipledocupload, MerchantEkycValidator.business_type, MerchantEkyc.business_type); //here

app.post('/merchant/forgot-password', CheckHeader, MerchantRegisterValidator.reset_merchant_password, MerchantRegister.reset_forgot_password);
app.post('/merchant-ekyc/update-business-details', CheckHeader, CheckMerchantToken, MerchantEkycValidator.business_details, MerchantEkyc.business_details);
app.post('/merchant-ekyc/business-owner-documents', CheckHeader, CheckMerchantToken, MerchantEkyc.business_owner_documents);
app.post('/merchant-ekyc/update-business-representative-details', CheckHeader, CheckMerchantToken, MerchantEkycValidator.representative_update, MerchantEkyc.representative_update);
app.post('/merchant-ekyc/add-business-owner', CheckHeader, CheckMerchantToken, multipleupload_owners, MerchantEkycValidator.add_business_owner, MerchantEkyc.add_business_owner)
app.use(function (err, req, res, next) {
    console.log(err);
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.send({
            message: "multiple file for single field not allowed",
            status: "fail",
            code: "E0044"
        })
        return
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.send({
            message: "File size should not be more than 5mb",
            status: "fail",
            code: "E0044"
        })
        return
    }
})
app.post('/merchant-ekyc/copy-owner', CheckHeader, CheckMerchantToken, MerchantEkycValidator.owners_copy, MerchantEkyc.business_owner_copy)
app.post('/merchant-ekyc/add-executives', CheckHeader, CheckMerchantToken, MerchantEkycValidator.add_executives, MerchantEkyc.add_executive)
app.post('/merchant-ekyc/update-public-details', CheckHeader, CheckMerchantToken, MerchantEkycValidator.update_public, MerchantEkyc.update_public);
app.post('/merchant-ekyc/add-bank', CheckHeader, CheckMerchantToken, BankDocument, MerchantEkycValidator.add_bank, MerchantEkyc.add_bank)
app.post('/merchant_ekyc/delete-business-owner', CheckHeader, CheckMerchantToken, MerchantEkycValidator.remove_business_owner, MerchantEkyc.delete_business_owner);
app.post('/merchant-ekyc/list-business-owner', CheckHeader, CheckMerchantToken, MerchantEkyc.list_business_owner);
app.post('/merchant-ekyc/business-owner-details', CheckHeader, CheckMerchantToken, MerchantEkycValidator.business_owner_details, MerchantEkyc.business_owner_details);
app.post('/merchant-ekyc/update-business-owner', CheckHeader, CheckMerchantToken, multipleupload_owners, MerchantEkycValidator.update_business_owner, MerchantEkyc.update_business_owner);


app.post('/merchant-ekyc/list-business-executives', CheckHeader, CheckMerchantToken, MerchantEkyc.list_business_executives);
app.post('/merchant_ekyc/delete-business-executive', CheckHeader, CheckMerchantToken, MerchantEkycValidator.remove_business_executive, MerchantEkyc.delete_business_executive);
app.post('/merchant_ekyc/submit-summary', CheckHeader, CheckMerchantToken, MerchantEkyc.submit_summary);
app.post('/merchant_ekyc/psp-mail', CheckHeader, MerchantEkyc.send_psp_mail);
app.post('/merchant_ekyc/submit-video-kyc', CheckHeader, MerchantEkyc.submit_video_kyc);

app.post('/merchant-ekyc/get-profile', CheckHeader, CheckMerchantToken, Validator.submerchant_profile_details,MerchantEkyc.get_profile);
app.post('/merchant-ekyc/get-submerchant-profile', CheckHeader, CheckMerchantToken, Validator.submerchant_profile_details, MerchantEkyc.get_sub_merchant_profile);
app.post('/merchant-ekyc/get-submerchant-profile-kyc', CheckHeader, Validator.submerchant_profile_details, checkMerchantKyc, MerchantEkyc.get_sub_merchant_profile);
/****Merchant Profile Fetching from Admin Ekyc*/
app.post('/merchant-ekyc/merchant-profile', CheckHeader, MerchantEkycValidator.checkMerchant, MerchantDetailsById, MerchantEkyc.get_profile);
app.post('/merchant-ekyc/update-merchant-ekyc', CheckHeader, MerchantEkycValidator.update_merchant_ekyc, MerchantDetailsById, MerchantEkyc.update_ekyc_status);
app.post('/merchant-ekyc/check-owner', CheckHeader, MerchantEkyc.owners_data)
app.post('/merchant-ekyc/update-ekyc-status', CheckHeader, MerchantEkycValidator.update_owners_status, MerchantEkyc.update_owners_status)

/**Merchant Profile Fetching from admin ekyc End */
//MCC
app.post('/mcc/add', CheckHeader, CheckToken, Validator.mcc_add, Mcc.add);
app.post('/mcc/list', CheckHeader, CheckToken, Mcc.list);
app.post('/mcc/details', CheckHeader, CheckToken, Validator.mcc_details, Mcc.details);
app.post('/mcc/update', CheckHeader, CheckToken, Validator.mcc_update, Mcc.update);
app.post('/mcc/deactivate', CheckHeader, CheckToken, Validator.mcc_deactivate, Mcc.deactivate);
app.post('/mcc/activate', CheckHeader, CheckToken, Validator.mcc_activate, Mcc.activate);
app.post('/mcc/delete', CheckHeader, CheckToken, Validator.mcc_delete, Mcc.delete);

// CREATE ORDER
app.post('/orders/create', CheckMerchantCred, MerchantOrderValidator.create, MerchantOrder.create);
app.post('/orders/details', checkOrderToken, MerchantOrderValidator.get, MerchantOrder.get);
app.post('/orders/check-order-status', checkOrderToken, MerchantOrder.status);
// Make a payment for order

app.post('/orders/pay', checkOrderToken, MerchantOrderValidator.pay, FraudCheck, MerchantOrder.addOrUpdateCustomer, MerchantOrder.saveCard, MerchantOrder.pay)
app.post('/orders/send-notification-for-pay-with-vault', checkOrderToken, MerchantOrderValidator.send_notification_pay_with_vault, MerchantOrder.send_notification_for_pay_with_vault);
app.post('/orders/pay-with-vault', checkOrderToken, MerchantOrderValidator.pay_with_vault, FraudCheck, ChargeCalculator, MerchantOrder.pay_with_vault)
app.post('/card/list', MerchantOrderValidator.card_list, MerchantOrder.cardList)
app.post('/orders/cancel', checkOrderToken, MerchantOrderValidator.cancel, MerchantOrder.cancel);
app.post('/orders/failed', checkOrderToken, MerchantOrderValidator.cancel, MerchantOrder.failed);
app.post('/orders/delete-card', MerchantOrderValidator.remove, MerchantOrder.remove_card)

//department 
app.post('/security-questions/add', CheckHeader, CheckToken, Validator.security_question_add, SecurityQuestions.add);
app.post('/security-questions/list', CheckHeader, CheckToken, SecurityQuestions.list);
app.post('/security-questions/list-mobile', CheckHeader, SecurityQuestions.list_all);
app.post('/security-questions/details', CheckHeader, CheckToken, Validator.security_question_details, SecurityQuestions.details);
app.post('/security-questions/update', CheckHeader, CheckToken, Validator.security_question_update, SecurityQuestions.update);
app.post('/security-questions/deactivate', CheckHeader, CheckToken, Validator.security_question_deactivate, SecurityQuestions.deactivate);
app.post('/security-questions/activate', CheckHeader, CheckToken, Validator.security_question_activate, SecurityQuestions.activate);
app.post('/security-questions/delete', CheckHeader, CheckToken, Validator.security_question_delete, SecurityQuestions.delete);

app.post('/encrypt-mobile-and-code', CheckHeader, Validator.check_mobile_and_code, Auth.encrypt_mobile_no_and_code)
app.post('/sms', Auth.receive_sms);
app.post('/sms/fail', Auth.receive_sms_fail);
app.post('/customers/register', CheckHeader, Validator.checkCustomerRegistration, Auth.registerCustomer)
app.post('/customers/pin', CheckHeader, Validator.checkCustomerPin, Auth.customerPin)
/* Moving customer_temp to customers */
app.post('/customers/store-answer', CheckHeader, Validator.security_question_answer, SecurityQuestions.store_answer)
app.get('/test-pushnotication', Validator.test_pushnotification)
app.post('/mobile/login', CheckHeader, CustomerValidator.login, Auth.customer_login);
app.post('/mobile/otp', CheckHeader, CustomerValidator.otp_Sent, Customers.otp_Sent);
app.post('/mobile/otp-verify', CheckHeader, CustomerValidator.otp_verify, Customers.otp_verity);
app.post('/mobile/otp-reset', CheckHeader, CustomerValidator.reset_otp_Sent, Customers.otp_Sent_email);
app.post('/mobile/reset-otp-verify', CheckHeader, CustomerValidator.reset_otp_verify, Customers.reset_otp_verity);
app.post('/customer/list', CheckHeader, CheckToken, Customers.list);
app.post('/customer/details', CheckHeader, CheckToken, Customers.customer_details);
app.post('/mobile/user-questions', CheckHeader, CustomerValidator.questions_list, Customers.customer_ques_list);
app.post('/mobile/verify-user-questions', CheckHeader, CustomerValidator.verify_cid, Customers.verify_question_answer);
app.post('/mobile/reset-user-pin', CheckHeader, CustomerValidator.reset_pin, Customers.reset_pin);
app.post('/mobile/profile', CheckHeader, CheckCustomerToken, Customers.details);
app.post('/mobile/profile-update', CheckHeader, CheckCustomerToken, uploadCustomerProfilePic, CustomerValidator.update_profile, Customers.update_profile);
app.use(function (err, req, res, next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.send({
            message: "File size should not be more than 2mb",
            status: "fail",
            code: "E0044"
        })
        return
    }
})
app.post('/mobile/transaction-list', CheckHeader, CheckCustomerToken, Customers.transaction_list);
app.post('/mobile/change-pin', CheckHeader, CheckCustomerToken, CustomerValidator.change_pin, Customers.change_pin);
app.post('/mobile/change-email-otp', CheckHeader, CheckCustomerToken, CustomerValidator.otp_sent_email, Customers.otp_Sent_email);
app.post('/mobile/change-email', CheckHeader, CheckCustomerToken, CustomerValidator.reset_otp_verify, Customers.change_email);
app.post('/mobile/add-card', CheckHeader, CheckCustomerToken, CustomerValidator.card_add, Customers.card_add)
app.post('/mobile/card-list', CheckHeader, CheckCustomerToken, CustomerValidator.card_list, Customers.cardList)
app.post('/mobile/card-delete', CheckHeader, CheckCustomerToken, CustomerValidator.card_delete, Customers.card_delete)
app.post('/mobile/card-primary_card', CheckHeader, CheckCustomerToken, CustomerValidator.card_primary, Customers.card_primary)
app.post('/mobile/card-hide', CheckHeader, CheckCustomerToken, CustomerValidator.card_hide, Customers.card_hide)
app.post('/mobile/card-delete-hide', CheckHeader, CheckCustomerToken, CustomerValidator.delete_hide_card, Customers.delete_hide_card)
app.post('/mobile/verify-mobile', CheckHeader, CheckCustomerToken, CustomerValidator.check_mobile_and_code, Customers.encrypt_mobile_no_and_code)
app.post('/mobile/sms', Customers.receive_sms);
app.post('/mobile/sms/fail', Customers.receive_sms_fail);
app.post('/mobile/cancel-order', CheckHeader, checkOrderToken, CheckToken, MerchantOrderValidator.cancel, MerchantOrder.mobile_cancel);
app.post('/mobile/failed-order', CheckHeader, checkOrderToken, CheckToken, MerchantOrderValidator.cancel, MerchantOrder.mobile_failed);
app.post('/mobile/order-details', CheckHeader, CheckToken, MerchantOrderValidator.order_details_fetch, MerchantOrder.order_details_for_mobile);
app.post('/mobile/dashboard', CheckHeader, CheckCustomerToken, Customers.dashboard);
app.post('/mobile/ios/otp', CheckHeader, CustomerValidator.send_otp_mobile, Customers.send_otp_mobile);
app.post('/mobile/ios/otp-verify', CheckHeader, CustomerValidator.mobile_otp_verify, Customers.mobile_otp_verify);
app.post('/mobile/ios/forgot-otp', CheckHeader, CustomerValidator.forgot_otp_mobile, Customers.send_otp_mobile);
app.post('/mobile/ios/forgot-otp-verify', CheckHeader, CustomerValidator.mobile_otp_verify, Customers.forgot_otp_verify);


//Merchant Maintenance 
app.post('/charges/merchant_maintenance/add', CheckHeader, CheckToken, merchant_charges.plan_add, merchantMaintenance.add);
app.post('/charges/merchant_maintenance/list', CheckHeader, CheckToken, merchantMaintenance.list);
app.post('/charges/merchant_maintenance/update', CheckHeader, CheckToken, merchant_charges.plan_update, merchantMaintenance.update);
app.post('/charges/merchant_maintenance/activate', CheckHeader, CheckToken, merchant_charges.plan_activate, merchantMaintenance.activate);
app.post('/charges/merchant_maintenance/deactivate', CheckHeader, CheckToken, merchant_charges.plan_deactivate, merchantMaintenance.deactivate);
app.post('/charges/merchant_maintenance/details', CheckHeader, CheckToken, merchant_charges.plan_details, merchantMaintenance.details);
app.post('/charges/features/list', CheckHeader, CheckToken, merchantMaintenance.features_list)
//Transaction Setup
app.post('/charges/transaction_setup/add', CheckHeader, CheckToken, Transaction_validation.add, Transaction_setup.transaction_add);
app.post('/charges/transaction_setup/list', CheckHeader, CheckToken, Transaction_setup.transaction_list);
app.post('/charges/transaction_setup/update', CheckHeader, CheckToken, Transaction_validation.update, Transaction_setup.transaction_update);
app.post('/charges/transaction_setup/activate', CheckHeader, CheckToken, Transaction_validation.activate, Transaction_setup.transaction_activate);
app.post('/charges/transaction_setup/deactivate', CheckHeader, CheckToken, Transaction_validation.deactivate, Transaction_setup.transaction_deactivate);
app.post('/charges/transaction_setup/slab_add', CheckHeader, CheckToken, Transaction_setup.slab_add);
app.post('/charges/transaction_setup/details', CheckHeader, CheckToken, Transaction_validation.details, Transaction_setup.transaction_details);

app.post('/charges/transaction_setup/slab_update', CheckHeader, CheckToken, Transaction_setup.slab_update);
app.post('/charges/transaction_setup/slab_list', CheckHeader, CheckToken, Transaction_setup.slab_list);
app.post('/charges/transaction_setup/slab_deactivate', CheckHeader, CheckToken, Transaction_validation.slab_deactivate, Transaction_setup.slab_deactivate);

//Transaction charges
app.post('/transaction/dynamic_pricing',CheckToken, CheckHeader, Transaction_setup.transaction_charges_testing);//Testing purpose only
app.post('/transaction/dynamic_pricing/list',CheckToken, CheckHeader, Transaction_setup.dynamic_pricing_list);
app.post('/transaction/dynamic_pricing/order/list',CheckToken, CheckHeader, Transaction_validation.dynamic_order,Transaction_setup.orders_list);
app.post('/transaction/dynamic_pricing/payout',CheckToken, CheckHeader,payout.add_dynamic_charges_payout_test);//Testing purpose only
app.post('/transaction/dynamic_pricing/list-excel', CheckHeader, CheckToken, Transaction_setup.dynamic_pricing_list_excel);
app.post('/transaction/dynamic_pricing/list-pdf', CheckHeader, CheckToken, Transaction_setup.dynamic_pricing_list_pdf);
cron.schedule('0 2 * * *', async () => {
    Transaction_setup.transaction_charges();
});

//qr code start 
app.post("/qr/add", CheckHeader, CheckToken, QR_validation.add, QR_generate.add);
app.post("/qr/list", CheckHeader, CheckToken, QR_generate.list);
app.post("/qr/reset", CheckHeader, CheckToken, QR_validation.reset, QR_generate.reset);
app.post("/qr/deactivate", CheckHeader, CheckToken, QR_validation.deactivate, QR_generate.deactivate);
app.post("/qr/activate", CheckHeader, CheckToken, QR_validation.activate, QR_generate.activate);
app.post("/qr/details", CheckHeader, CheckToken, QR_generate.details);
app.post("/qr/reset", CheckHeader, CheckToken, QR_validation.reset, QR_generate.reset);
app.post('/charges/payment_mode/list', CheckHeader, CheckToken, Transaction_setup.payment_mode_list);
app.post("/qr/update", CheckHeader, CheckToken, QR_validation.update, QR_generate.update);
app.post("/qr/payment", QR_validation.add_payment, QR_payment.add);
app.post("/qr/payment_collection", QR_validation.collection_payment, QR_payment.collection);
app.post("/qr/link_details", CheckHeader, QR_validation.link_details, QR_generate.link_details);
app.post("/qr/qr_detalis",CheckHeader,QR_payment.qr_details)

app.post("/qr/payment_link_details", CheckHeader, QR_validation.link_details, QR_generate.payment_link_details);


//Invoice start

app.post("/inv/add_customer", CheckHeader, CheckToken, invlogoUpload, invoiceValidation.add, invoice.add_customer);
app.post("/inv/list_customer", CheckHeader, CheckToken, invoice.list_customer);
app.post("/inv/details_customer", CheckHeader, CheckToken, invoiceValidation.details, invoice.details_customer);
app.post("/inv/update_customer", CheckHeader, CheckToken, invlogoUpload, invoiceValidation.update, invoice.update_customer);
app.post("/inv/deactivate_customer", CheckHeader, CheckToken, invoiceValidation.deactivate, invoice.customer_deactivate);
app.post("/inv/activate_customer", CheckHeader, CheckToken, invoiceValidation.activate, invoice.customer_activate);

app.post("/inv/invoice_add", CheckHeader, CheckToken, invoiceValidation.inv_add, invoice.invoice_add);
app.post("/inv/invoice_list", CheckHeader, CheckToken, invoice.invoice_list);
app.post("/inv/invoice_details", CheckHeader, CheckToken, invoiceValidation.inv_details, invoice.invoice_details);

app.post("/inv/invoice_update", CheckHeader, CheckToken, invoiceValidation.inv_update, invoice.invoice_update);

app.post("/inv/item_add", CheckHeader, CheckToken, invoiceValidation.item_add, invoice.item_add);
app.post("/inv/item_list", CheckHeader, CheckToken, invoice.item_list);
app.post("/inv/item_details", CheckHeader, CheckToken, invoiceValidation.item_details, invoice.item_details);
app.post("/inv/item_update", CheckHeader, CheckToken, invoice.item_update);
app.post("/inv/item_delete", CheckHeader, CheckToken, invoiceValidation.item_delete, invoice.item_delete);

app.post('/inv/items/add', CheckHeader, CheckToken, invoiceValidation.item_master_add, invoice.item_master_add);
app.post('/inv/items/list', CheckHeader, CheckToken, invoice.item_master_list);
app.post('/inv/items/details', CheckHeader, CheckToken, invoice.item_master_details, invoice.item_master_details);
app.post('/lookup/bin', CheckHeader, lookupValidatior.bin, lookup.bin);
app.post('/lookup/ip', CheckHeader, lookupValidatior.ip, lookup.ip);

// proxy routes
app.post("/leads/add", CheckHeader, leads.add);
// app.get("/leads/all", CheckHeader, leads.list);
// app.post("/leads/search", CheckHeader, proxy.search, leads.list_search);
app.post("/leads/list", CheckHeader, proxy.search, leads.list_search);
app.get("/leads/:id", CheckHeader, leads.details);
app.delete("/leads/:id", CheckHeader, leads.delete);
app.post("/leads/:id", CheckHeader, leads.update);

// Zendesk API

app.post('/support_system/add', CheckHeader, SystemTicketAttachment, system_ticket.add);
app.post('/support_system/update', CheckHeader, SystemTicketAttachment, system_ticket.update);
// app.post('/support_system/merchantlist',CheckHeader, system_ticket.viewMerchantList);
app.post('/support_system/userlist', CheckHeader, system_ticket.userlist);
app.post('/support_system/list', CheckHeader, system_ticket.list);
app.post('/support_system/requestersTickets', CheckHeader, system_ticket.requesterTickets);
app.post('/support_system/viewTicket', CheckHeader, system_ticket.viewTicket);

// Nationality Model start
app.post('/nationality/add', CheckHeader, CheckToken, Validator.nationality_add, Nationality.add);
app.post('/nationality/list', CheckHeader, /* CheckToken,*/ Nationality.list);
app.post('/nationality/details', CheckHeader, CheckToken, Validator.nationality_details, Nationality.details);
app.post('/nationality/update', CheckHeader, CheckToken, Validator.nationality_update, Nationality.update);
app.post('/nationality/deactivate', CheckHeader, CheckToken, Validator.nationality_deactivate, Nationality.deactivate);
app.post('/nationality/activate', CheckHeader, CheckToken, Validator.nationality_activate, Nationality.activate);
app.post('/nationality/delete', CheckHeader, CheckToken, Validator.nationality_delete, Nationality.delete);
// Nationality Model End
// Merchant user 
// merchants users routes
app.post("/merchant/list", CheckHeader, merchants.list);
app.post("/merchant/user/add", CheckHeader, MerchantUserValidator.user_add, merchants.add);
app.post("/merchant/user/details", CheckHeader, MerchantUserValidator.user_details, merchants.details);
app.post("/merchant/user/update", CheckHeader, MerchantUserValidator.user_update, merchants.update);
app.post("/merchant/user/deactivate", CheckHeader, MerchantUserValidator.user_deactivate, merchants.user_deactivate);
app.post("/merchant/user/activate", CheckHeader, MerchantUserValidator.user_activate, merchants.user_activate);
app.post("/merchant/user/delete", CheckHeader, MerchantUserValidator.user_delete, merchants.user_delete);

// database dump api 
app.post("/dump-database", CheckHeader, database_dump.get_dump_file);
app.get("/dump-database/download", database_dump.download_file);

// Pricing plan
app.post('/pricing_plan/list', CheckHeader, CheckToken, pricing.list);
app.post('/pricing_plan/details', CheckHeader, CheckToken, PricingPlanValidator.get, pricing.get);
app.post('/pricing_plan/add', CheckHeader, CheckToken, PricingPlanValidator.add, pricing.add);
app.post('/pricing_plan/update', CheckHeader, CheckToken, PricingPlanValidator.update, pricing.update);
app.post('/merchant/update/payment-status', CheckHeader, CheckToken, MerchantEkycValidator.paymentStatus,MerchantEkyc.updatePaymentStatus);
app.post('/merchant/compliance-manager/accept',CheckHeader,CheckToken, MerchantEkycValidator.CM_Accept,MerchantEkyc.CM_Accept)
app.post('/merchant/compliance-manager/accept',CheckHeader,CheckToken, MerchantEkycValidator.CM_Accept,MerchantEkyc.CM_Accept)
app.post('/merchant/compliance-manager/approve',CheckHeader,CheckToken, MerchantEkycValidator.CM_Approval, MerchantEkyc.CM_Approval)
app.post('/merchant/compliance-manager/notification',CheckHeader,CheckToken, MerchantEkyc.CM_Notification)
app.post('/merchant/compliance-manager/notification-seen',CheckHeader,CheckToken, MerchantEkyc.CM_NotificationSeen)
app.post('/merchant/compliance-manager/sendmail',CheckHeader,CheckToken,compliancemail ,  MerchantEkycValidator.CM_SendMail,  MerchantEkyc.CM_SendMail)
app.post('/merchant/compliance-manager/approval-logs',CheckHeader,CheckToken, MerchantEkycValidator.CM_Approvallogs,  MerchantEkyc.CM_Approvallogs)

app.post('/payouts/list', CheckHeader, CheckToken, payout.master_list);
app.post('/payouts/details/list', CheckHeader, CheckToken, MerchantUserValidator.payout_list, payout.list)
app.post('/payouts/list/export-to-excel', CheckHeader, CheckToken, MerchantUserValidator.payout_list, payout.payout_excel)
cron.schedule('0 9 * * *', () => {
    payout.add()
});
app.post('/crone-test',payout.add);  

app.post('/terminal/add', CheckHeader, TerminalValidator.add, Terminal.add);
app.post('/terminal/update', CheckHeader, TerminalValidator.update, Terminal.update);
app.post('/terminal/details', CheckHeader, TerminalValidator.details, Terminal.details);

app.post('/merchant_key_secret/details/list', CheckHeader, MerchantKeyAndSecretValidator.details, MerchantKeyAndSecret.details)
app.post('/txn/list', CheckHeader, CheckToken, Order.txn_list);

app.post('/card-master/details', CheckHeader, CardMasterValidator.details, CardMaster.details)
app.post('/card-master/list', CheckHeader, CardMaster.list)

app.post('/store-status/details', CheckHeader, StoreStatusValidator.details, StoreStatus.details)
app.post('/store-status/list', CheckHeader, StoreStatus.list)

cron.schedule('0 0 * * *', async () => {
    await password.start();
    await password.start_before_week();
    await password.start_before_day();
});
app.post('/txn/list-pdf', CheckHeader, CheckToken, Order.txn_list_pdf);
app.post('/txn/list-excel', CheckHeader, CheckToken, Order.txn_list_excel);


// webhook
app.get('/webhook/notification-secret', webHook.get)
app.post('/webhook/add-update-url', CheckHeader, checkToken, webHookValidator.add_update, webHook.add_update)

// analytics apis
app.post("/dashboard/analytics", CheckHeader, checkToken, Dashboard.analytics);
app.post("/dashboard/analytics/payment-method", CheckHeader, checkToken, Dashboard.analytics_payment);
app.post('/dashboard/merchant/profile', CheckHeader, CheckMerchantToken, MerchantEkyc.merchant_profile);


app.post("/dashboard/analytics/payment-by-status",CheckHeader,checkToken,Dashboard.analytics_status);
//Subscription plan module 
app.post('/subs_plan/add', CheckHeader,CheckToken, SubscriptionPlanValidator.add, subs_plan.add);
app.post('/subs_plan/list',CheckHeader,CheckToken, subs_plan.list);
app.post('/subscriber/details', CheckHeader,CheckToken, SubscriptionPlanValidator.get_subscriber, subs_plan.get_subscriber);
app.post('/subs_plan/subscriber_list',CheckHeader,CheckToken, subs_plan.subscriber_list);
app.post('/subs_plan/details', CheckHeader,CheckToken, SubscriptionPlanValidator.get, subs_plan.get);
app.post('/subs_plan/update',CheckHeader,CheckToken,SubscriptionPlanValidator.update, subs_plan.update);
app.post('/subs_plan/deactivate', CheckHeader,CheckToken, SubscriptionPlanValidator.deactivate, subs_plan.deactivate);
app.post('/subs_plan/activate', CheckHeader,CheckToken, SubscriptionPlanValidator.activate, subs_plan.activate);
app.post('/subs_plan/delete', CheckHeader,CheckToken, SubscriptionPlanValidator.delete, subs_plan.delete);
app.post("/subs_plan/send_mail", CheckHeader, CheckToken,SubscriptionPlanValidator.mail_send, subs_plan.mail_send);
app.post("/subs_plans/link_details",CheckHeader,SubscriptionPlanValidator.link_details, subs_plan.link_details);
app.post('/subs_plans/add-subscription', SubscriptionPlanValidator.subscription_details, MerchantOrder.add_subscription);
app.post('/subs_plan/cancel-subscription', CheckHeader,CheckToken, SubscriptionPlanValidator.cancel, subs_plan.cancel);
app.post('/subs_plans/order-create', SubscriptionPlanValidator.subscription_details, MerchantOrder.create_subs_order);

//UAE-to-KSA //KSA-to-UAE
app.post('/duplicate_super_merchant', CheckHeader, KSA_UAE_merchant.register);
app.get('/merchant/login/authentication',checkMerchantShiftToken, KasToUaeValidator.loginAuth, KSA_UAE_merchant.merchantLogin);
app.get('/admin/login/authentication',checkMerchantShiftToken, KasToUaeValidator.AdminLoginAuth, KSA_UAE_merchant.adminLogin);
app.post('/admin/delete/ksa-uae', CheckHeader, CheckToken, Validator.admin_delete, admin_user.delete_by_mail);
app.post('/admin/duplicate-user', CheckHeader, multerUploader.uploadUserProfilePic,/* Validator.register,*/ admin_user.clone_register);
app.post('/admin/switch/compliance', CheckHeader,CheckToken,ksaUaeAdmin.switchToCompliance);

app.post('/onboarding/logs',CheckHeader,CheckToken,MerchantEkyc.getOnboardingLogs);
app.post('/store-qr-images/add', CheckHeader, CheckToken, store_image_upload, store_image_validator.image_add, store_image_controller.add);
app.post('/store-qr-images/list', CheckHeader, CheckToken, store_image_controller.list);
app.post('/store-qr-images/details', CheckHeader, CheckToken,store_image_validator.image_details, store_image_controller.details);    
app.post('/store-qr-images/update', CheckHeader, CheckToken, store_image_upload,store_image_validator.image_update, store_image_controller.update);
app.post('/store-qr-images/deactivate', CheckHeader, CheckToken,store_image_validator.image_deactivate, store_image_controller.deactivate);
app.post('/store-qr-images/activate', CheckHeader, CheckToken,store_image_validator.image_activate, store_image_controller.activate);
app.post('/store-qr-images/delete', CheckHeader, CheckToken,store_image_validator.image_delete, store_image_controller.delete);

app.post('/store-qr/add',CheckHeader,CheckToken,store_qr_validator.qr_add,store_qr.add);
app.post('/store-qr/list',CheckHeader,CheckToken,store_qr_validator.qr_list,store_qr.list);
app.post('/store-qr/details',CheckHeader,CheckToken,store_qr_validator.qr_details,store_qr.details);
app.post('/store-qr/update',CheckHeader,CheckToken,store_qr_validator.qr_update,store_qr.update);
app.post('/store-qr/activate',CheckHeader,CheckToken,store_qr_validator.qr_activate,store_qr.activate);
app.post('/store-qr/deactivate',CheckHeader,CheckToken,store_qr_validator.qr_deactivate,store_qr.deactivate);
app.post('/store-qr/list-excel',CheckHeader,CheckToken,store_qr_validator.qr_list,store_qr.list_excel);
app.post('/store-qr/list-pdf',CheckHeader,CheckToken,store_qr_validator.qr_list,store_qr.list_pdf);
app.post('/store-qr/delete',CheckHeader,CheckToken,store_qr_validator.qr_delete,store_qr.delete);
app.post('/store-qr/details-by-code',CheckHeader,store_qr_validator.qr_code_details,store_qr.qr_code_details);
app.post('/store-qr-config/add',CheckHeader,CheckToken,store_image_validator.add_config,store_image_controller.add_config);
app.post('/store-qr-config/list',CheckHeader,CheckToken,store_image_controller.list_config);

app.post('/onboarding/logs',CheckHeader,CheckToken,MerchantEkyc.getOnboardingLogs);
app.post('/merchant/wrold-check',CheckHeader,EFRValidation.WroldCheckData,Cotroller.WroldCheckData )
app.post('/efr/confirm', CheckHeader, EFRValidation.confirmData, Cotroller.confirmDataElement)
app.post('/efr/video-kyc', CheckHeader,kycupload, EFRValidation.VideoKycData, Cotroller.vidoe_kyc)


// instruction master apis
app.post('/instruction/add', CheckHeader,CheckToken, instructionValidation.add, instructionMaster.add)
app.post('/instruction/update', CheckHeader,CheckToken, instructionValidation.update, instructionMaster.update)
app.post('/instruction/details', CheckHeader,CheckToken, instructionValidation.details, instructionMaster.details)
app.post('/instruction/list', CheckHeader,CheckToken, instructionMaster.list)


// prompter master apis
app.post('/prompter/add', CheckHeader,CheckToken, prompterValidation.add, masterPrompter.add)
app.post('/prompter/update', CheckHeader,CheckToken, prompterValidation.update, masterPrompter.update)
app.post('/prompter/details', CheckHeader,CheckToken, prompterValidation.details, masterPrompter.details)
app.post('/prompter/list', CheckHeader,CheckToken, masterPrompter.list)

//card variant apis
app.post('/cardvariant/list', CheckHeader,CheckToken,cardVariantValidation.list, cardVariantMaster.list )

//wallet apis
app.post('/wallet/list', CheckHeader,CheckToken, walletMaster.list )

//payment mode apis
app.post('/paymentmode/list', CheckHeader,CheckToken, paymentMode.list );

//exception-log
app.post('/orders/exception-log',CheckHeader,CheckToken,Order.exceptionlogs)


//new invoice module
app.post('/invoice/add',CheckHeader, newInvoiceValidation.add ,newInvoice.add)
app.post('/invoice/details',CheckHeader,CheckToken, newInvoice.details)
app.post('/invoice/template-list',CheckHeader,CheckToken, newInvoice.terminal_list)
app.post('/invoice/update',CheckHeader,CheckToken, newInvoiceValidation.update_details ,newInvoice.update_status)
app.post('/invoice/recent-invoices',CheckHeader,CheckToken, newInvoice.recent_invoices)
app.post('/invoice/send-email',CheckHeader,CheckToken, newInvoice.sendEmail)
app.post('/invoice/config-add',CheckHeader,CheckToken,newInvoiceValidation.add_config,newInvoice.add_config);
module.exports = app;