const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const axios = require('axios');
const binModel = require('../models/binModel');

var lookup = {
    bin: async (req, res) => {
        let lookup_result;
        const params = {
            bin_number: req.bodyString('bin_number'),
        };
        binModel.selectOne('bin', { bin: req.bodyString('bin_number') }).then((result) => {
            if (result) {
                lookup_result = {
                    card_brand: "MADA",
                }
                res.status(statusCode.ok).send(response.successdatamsg(lookup_result, 'Details fetched successfully.'));
            } else {
                const data = Object.keys(params)
                    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&');



                const options = {
                    method: 'POST',
                    headers: { 'content-type': 'application/x-www-form-urlencoded', 'User-ID': process.env.LOOKUP_USER_ID, 'API-Key': process.env.LOOKUP_USER_ID_SECRET },
                    data,
                    url: process.env.LOOKUP_URL + 'bin-lookup',
                };

                axios(options).then((result) => {
                     lookup_result = {
                        country: result.data['country'],
                        country_code: result.data['country-code'],
                        card_brand: result.data['card-brand'],
                        ip_city: result.data['ip-city'],
                        ip_blocklists: result.data['ip-blocklists'],
                        ip_country_code3: result.data['ip-country-code3'],
                        is_commercial: result.data['is-commercial'],
                        ip_country: result.data['ip-country'],
                        bin_number: result.data['bin-number'],
                        issuer: result.data['issuer'],
                        issuer_website: result.data['issuer-website'],
                        ip_region: result.data['ip-region'],
                        valid: result.data['valid'],
                        card_type: result.data['card-type'],
                        is_prepaid: result.data['is-prepaid'],
                        ip_blocklisted: result.data['ip-blocklisted'],
                        card_category: result.data['card-category'],
                        issuer_phone: result.data['issuer-phone'],
                        currency_code: result.data['currency-code'],
                        ip_matches_bin: result.data['ip-matches-bin'],
                        country_code3: result.data['country-code3'],
                        ip_country_code: result.data['ip-country-code']
                    }

                    
                   

                    if(lookup_result.card_brand =='VISA'||lookup_result.card_brand=='MASTERCARD'||lookup_result.card_brand=='MASTERO'||lookup_result.card_brand== 'MADA'||lookup_result.card_brand=='AMERICAN EXPRESS'){
                        res.status(statusCode.ok).send(response.successdatamsg(lookup_result, 'Details fetched successfully.'));
                    }else{
                        res.status(statusCode.ok).send(response.errormsg('We do not accept this card.'));
                    }

                }).catch((error) => {
                    res.status(statusCode.ok).send(response.errormsg(error.message));
                });  // wrap in async function
            }
        })
    },
    ip: async (req, res) => {

        const params = {
            ip: req.bodyString('ip'),
        };

        const data = Object.keys(params)
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');



        const options = {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded', 'User-ID': process.env.LOOKUP_USER_ID, 'API-Key': process.env.LOOKUP_USER_ID_SECRET },
            data,
            url: process.env.LOOKUP_URL + 'ip-info',
        };

        axios(options).then((result) => {
            console.log(result);
            let lookup_result = {
                region_code: result.data['region-code'],
                country_code: result.data['country-code'],
                country: result.data['country'],
                city: result.data['city'],
                timezone: result.data['timezone'],
                ip: result.data['ip'],
                latitude: result.data['latitude'],
                valid: result.data['valid'],
                is_v4_mapped: result.data['is-v4-mapped'],
                hostname: result.data[' hostname'],
                continent_code: result.data['continent-code'],
                host_domain: result.data['host-domain'],
                currency_code: result.data['currency-code'],
                region: result.data['region'],
                is_bogon: result.data['is-bogon'],
                country_code3: result.data['country-code3'],
                is_v6: result.data['is-v6'],
                longitude: result.data['longitude'],

            }
            res.status(statusCode.ok).send(response.successdatamsg(lookup_result, 'Details fetched successfully.'));
        }).catch((error) => {
            console.log(error);
            res.status(statusCode.ok).send(response.errormsg(error.message));
        });  // wrap in async function

    },


}
module.exports = lookup;