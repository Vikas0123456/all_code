const { default: axios } = require("axios");
const ServerResponse = require("../utilities/response/ServerResponse");
const StatusCode = require("../utilities/statuscode");
const SequenceUUID = require('sequential-uuid');
require('dotenv').config()
const encrypt_decrypt = require("../utilities/decryptor/encrypt_decrypt");
const efr_exportdata = require("../models/efr_reportdata");
const helpers = require("../utilities/helper/general_helper");
const qs = require('querystring');
const StatuCode = require("../utilities/statuscode");
const protector = require("../utilities/decryptor/decryptor");
const AdminUserModel = require('../models/adm_user')
const crypto = require('crypto');
const credeintals = require("../config/credeintals");
const moment = require('moment')
const os = require('os')

const Controller = {
    confirmDataElement: async (req, res) => {
        try {
            // console.log("hello");
            let data = {
                "email": process.env.EFR_EMAIL,
                "password": process.env.EFR_PASSWORD
            }

            let config = {
                method: "POST",
                url: process.env.EFR_BASE_URL + "/auth/access/login",
                headers: {
                    "Content-Type": "application/json"
                },
                data: data
            }

            let response = await axios(config);
            if (response.data.data) {
                let token = response.data.data.token
                let uuid = new SequenceUUID({
                    valid: true,
                    dashes: false,
                    unsafeBuffer: true
                })
                let unique_id = uuid.generate()
                let data1 = {
                    "registrantNumber": req.body.registrationNumber,
                    "documentIdentifiers": [],
                    "faces": [
                        {
                            "data": req.body.face,
                            "dataHash": req.body.dataHash,
                            "tag": req.body.tag
                        }
                    ]
                }

                let config1 = {
                    method: 'POST',
                    url: process.env.EFR_BASE_URL + "/rhapi/Onboard/ConfirmIdentity",
                    headers: {
                        "authorization": "Bearer " + token,
                        "X-Request-ID": unique_id,
                        "X-Channel-ID": 1,
                        "Content-Type": "application/json"
                    },
                    data: data1
                }

                let response1 = await axios(config1);
                if (response1.data.result.code == 1) {
                    // intermediaryAccountId
                    let accountId = response1.data.intermediaryAccountId
                    let uuid1 = new SequenceUUID({
                        valid: true,
                        dashes: false,
                        unsafeBuffer: true
                    })

                    let unique_id1 = uuid1.generate()
                    let data2 = {
                        "registrantNumber": req.body.registrationNumber,
                        "intermediaryAccountId": accountId,
                        "documentIdentifiers": [],
                        "faces": [
                            {
                                "data": req.body.face,
                                "dataHash": req.body.dataHash,
                                "tag": req.body.tag
                            }
                        ]
                    }

                    let config2 = {
                        method: "POST",
                        url: process.env.EFR_BASE_URL + "/rhapi/Onboard/ConfirmDataElementEnhanced",
                        headers: {
                            "authorization": "Bearer " + token,
                            "X-Request-ID": unique_id,
                            "X-Channel-ID": 1,
                            "Content-Type": "application/json",
                        },
                        data: data2
                    }
                    let response2 = await axios(config2);
                    console.log(response2);
                    if (response2.data) {
                        let reportData = response2.data.data.reportData
                        // console.log(reportData);
                        let buff = Buffer.from(reportData, 'base64')
                        let text = buff.toString('ascii');
                        // console.log(text, "lllllllllllll");

                        let ins_data = {
                            merchant_id: await encrypt_decrypt('decrypt', req.body.merchant_id),
                            registrationNumber: req.body.registrationNumber,
                            reportData: text
                        }

                        let ins_result = await efr_exportdata.add(ins_data);
                        console.log(ins_result);
                        res.status(StatusCode.ok).send(ServerResponse.successdatamsg(response2.data.registrantNumberResult))

                    } else {
                        res.status(StatusCode.internalError).send(ServerResponse.errormsg(resposne.errors[0].message))
                    }

                } else {
                    res.status(StatusCode.ok).send(ServerResponse.errormsg(response1.data.result.message))
                }

            } else {
                res.status(StatusCode.ok).send(ServerResponse.errormsg(response.data.errors[0]))
            }

        }
        catch (err) {
            res.status(StatusCode.internalError).send(ServerResponse.errormsg(err?.response?.data?.errors[0]?.message))
        }
    },
    vidoe_kyc: async (req, res) => {

        try {

            const { selfie, customer_id, comparison_message } = req.body;
            const uploadedselfie = helpers.base64toimage(selfie);
            const ekyc_video = req.files.video_kyc[0];
            const videopath = ekyc_video.path.replace("public", "static")
            let data = {
                selfie: req.protocol + '://' + req.get('host') + '/' + uploadedselfie,
                video_kyc: req.protocol + '://' + req.get('host') + '/' + videopath,
                comparison_message: req.body.comparison_message,
                customer_id: req.body.customer_id,
                // owner_id:req.body.customer_id,
            }
            config = {
                method: "POST",
                url: "https://dev.telr.adminekyc.ulis.live/SaveMerchant/video_kyc",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data: qs.stringify(data)
            }
            axios(config).then(result => {
                res.status(StatuCode.ok).send(ServerResponse.successdatamsg(result.data, result.data.Message));
            }).catch(error => {
                res.status(StatuCode.ok).send(ServerResponse.errormsg(error.message))
            })

        } catch (error) {
            res.status(StatuCode.ok).send(ServerResponse.errormsg(error.message));
        }


    },
    WroldCheckData: async (req, res) => {
        const merchant_id = protector.cjs_decrypt(req.body.merchant_id);
        try {
            const AdminUser = await AdminUserModel.get_username(merchant_id);
            let uthorisation;
            const date = moment().utc().local().format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
            const content = {
                "groupId": "5jb84dryswxt1hakignp5ucjb",
                "entityType": "ORGANISATION",
                "caseId": "",
                "providerTypes": [
                    "WATCHLIST"
                ],
                "caseScreeningState": {
                    "WATCHLIST": "INITIAL"
                },
                "name": AdminUser.name,
                "nameTransposition": false,
                "secondaryFields": [
                    {
                        "typeId": "SFCT_6",
                        "value": helpers.getWorldCheckCountryCode()
                    }
                ],
                "customFields": []
            };
            const requestMethod = 'post';
            const gateway_host = "api-worldcheck.refinitiv.com";
            const gateway_url = "/v2/cases/screeningRequest";
            const url = 'cases/screeningRequest';
            const dataToSign = '(request-target): ' + requestMethod + gateway_url + os.EOL +
                'host: ' + gateway_host + os.EOL +
                'date: ' + date + os.EOL +
                'content-type: application/json'.PHP_EOL +
                'content-length: ' + JSON.stringify(content).length + os.EOL + content;
            const hash = crypto.createHmac('sha256', credeintals.worldcheck.seceratekey).update(dataToSign).digest('base64');
            const Authorization = "Signature keyId=\"0c0bb693-491b-4d02-bc56-6e4eb5fd21e3\",algorithm=\"hmac-sha256\",headers=\"(request-target) host date content-type content-length\",signature=" + hash;
            config = {
                method: "POST",
                url: credeintals.worldcheck.endpoint,
                headers: {
                    'Date': date,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": Authorization,
                    'Content-Type': 'application/json'
                },
                data: content
            };

            axios(config).then(result => {
                console.log(result);
            }).catch(error => {
                res.status(StatuCode.ok).send(ServerResponse.errormsg(error.message))
            })

        } catch (error) {
            res.status(StatuCode.ok).send(ServerResponse.errormsg(error.message));
        }
    }
}

module.exports = Controller