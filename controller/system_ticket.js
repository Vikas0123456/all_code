const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const helpers = require("../utilities/helper/general_helper")
const enc_dec = require("../utilities/decryptor/decryptor")
// const merchant_model = require('../models/merchant_model');
const zendesk_client = require('../config/zendesk')
var axios = require('axios');
var path = require('path');
const queryString = require('querystring');
const moment = require('moment');

const addUser = async function (req, res) {
    var userNew = {
        "user": {
            "name": req.name,
            "email": req.email
        }
    };
    const user_search = await selectSpecificUser(userNew.user.email)
    if (user_search) {
        return new Promise((resolve, reject) => {
            resolve(user_search)
        })
    }
    else {
        return new Promise((resolve, reject) => {
            zendesk_client.client.users.create(userNew, function (err, req, result) {
                if (err) {
                    reject(err)
                }
                resolve(result, null, 2, true)
            });
        })
    }
}

const selectSpecificUser = async function (req, res) {
    var support_config = {
        method: 'GET',
        url: `${zendesk_client.remoteUri}/users.json`,
        headers: {
            'contentType': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${zendesk_client.encoded}`
        }
    };
    return new Promise((resolve, reject) => {
        axios(support_config)
            .then(function (result) {
                var obj = result.data.users.find(search => search.email === req)
                resolve(obj)
            })
            .catch(function (error) {
                reject(error.message)
            });
    })

}



var System_ticket = {
    add: async (req, res) => {
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        const { description, email, subject, priority } = req.body
        const user_resp = await addUser(req.body)
        if (req && req.body.attachment) {
            zendesk_client.client.attachments.upload(path.resolve('./public/files/' + req.body.attachment),
                {
                    filename: req.body.attachment
                },
                function (err, req, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    var ticket = {
                        "ticket": {
                            "subject": subject,
                            "comment": {
                                "body": description,
                                "uploads": [result.upload.token]
                            },
                            "priority": priority,
                            "requester": { "name": user_resp.name, "email": user_resp.email },
                            //"collaborators": [cc_emails],
                        }
                    };
                    zendesk_client.client.tickets.create(ticket, function (err, req, item) {
                    console.log("🚀 ~ file: system_ticket.js:89 ~ item:", item)
                        if (err) {
                            res.status(statusCode.internalError).send(response.errormsg(err));
                        }
                        let resp_obj = {
                            "message": "Ticket Raised Successfully",
                            "status": "success",
                            "code": "00"
                        }
                        res.status(statusCode.ok).send(resp_obj);
                    }).catch(function (error) {
                        res.status(statusCode.internalError).send(response.errormsg(error.message));
                    });
                });
        } else {
            var ticket = {
                "ticket": {
                    "subject": subject,
                    "comment": {
                        "body": description
                    },
                    "priority": priority,
                    "requester": { "name": user_resp.name, "email": user_resp.email },
                    //"collaborators": [cc_emails],
                }
            };
            zendesk_client.client.tickets.create(ticket, function (err, req, s) {
                console.log("🚀 ~ file: system_ticket.js:116 ~ result:", result)
                if (err) {
                    res.status(statusCode.internalError).send(response.errormsg(err));
                }
                let resp_obj = {
                    "message": "Ticket Raised Successfully",
                    "status": "success",
                    "code": "00"
                }
                res.status(statusCode.ok).send(resp_obj);
            })
                .catch(function (error) {
                    res.status(statusCode.internalError).send(response.errormsg(error.message));
                });

        }

    },
    update: async (req, res) => {
        let ticket_id = req.bodyString("ticket_id");
        const { comment, email, name, subject, priority, cc_emails } = req.body
        let added_date = new Date().toJSON().substring(0, 19).replace('T', ' ');
        if (req && req.body.attachment) {
            zendesk_client.client.attachments.upload(path.resolve('./public/files/' + req.body.attachment),
                {
                    filename: req.body.attachment
                },
                function (err, req, result) {
                    if (err) {
                        next(err);
                    }

                    var ticket = {
                        "ticket": {
                            "comment": {
                                "body": comment,
                                "uploads": [result.upload.token],
                            },
                            "requester": { "email": email },
                            //"collaborators": [cc_emails],
                        }
                    };
                    console.log(ticket)
                    zendesk_client.client.tickets.update(ticket_id, ticket, function (err, req, result) {
                        res.status(statusCode.ok).send(response.successmsg(result, 'Ticket comment successfully.'));
                    })
                        .catch(function (error) {
                            res.status(statusCode.internalError).send(response.errormsg(error.message));
                        });
                })
        } else {
            var ticket = {
                "ticket": {
                    "comment": {
                        "body": comment
                    },
                    "requester": { "email": email },
                    //"collaborators": [cc_emails],
                }
            };
            zendesk_client.client.tickets.update(ticket_id, ticket, function (err, req, result) {
                res.status(statusCode.ok).send(response.successmsg(result, 'Ticket comment successfully.'));
            })
                .catch(function (error) {
                    res.status(statusCode.internalError).send(response.errormsg(error.message));
                });
        }
    },
    list: async (req, res) => {
        var sd = new Date(req.body.startDate);
        var mm = sd.getMonth() + 1;
        var dd = sd.getDate();
        var yy = sd.getFullYear();
        var startDate = yy + '-' + mm + '-' + dd;
        var ed = new Date(req.body.endDate);
        var mm = ed.getMonth() + 1;
        var dd = ed.getDate();
        var yy = ed.getFullYear();
        var endDate = yy + '-' + mm + '-' + dd;
        var query = ``
        if (req && req.body.startDate && req.body.endDate) {
            query = `query=type:ticket ${req.body.query} created>${startDate}T00:00:00Z created<${endDate}T23:59:59Z sort:desc`
        } else {
            query = `query=type:ticket ${req.body.query} sort:desc`
        }
        var support_config = {
            method: 'GET',
            url: `${zendesk_client.remoteUri}/search/export.json?filter[type]=ticket&${query}&page[size]=${req.body.per_page}`,
            headers: {
                'contentType': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${zendesk_client.encoded}`
            }
        };
        axios(support_config)
            .then(function (result) {
                let totalRecords = result.data.results.length
                result.data.totalRecords = totalRecords
                res.status(statusCode.ok).send(response.successdatamsg(result.data, 'All ticket list fetched successfully.'));
            })
            .catch(function (error) {
                console.log(error);
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    userlist: async (req, res) => {
        var support_config = {}
        //var url = `${zendesk_client.remoteUri}/users.json?role=${req.body.role}&page[size]=10`
        if (req && req.body.role) {
            support_config = {
                method: 'GET',
                url: `${zendesk_client.remoteUri}/users.json?role=${req.body.role}&page[size]=${req.body.perpage}`,
                headers: {
                    'contentType': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${zendesk_client.encoded}`
                },
                // data: queryString.stringify({
                //     role:req.body.role
                //   })
            };
        } else {
            support_config = {
                method: 'GET',
                url: `${zendesk_client.remoteUri}/users.json?page[size]=${req.body.perpage}`,
                headers: {
                    'contentType': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${zendesk_client.encoded}`
                }
            };
        }

        axios(support_config)
            .then(function (result) {
                res.status(statusCode.ok).send(response.successmsg(result.data, 'All user list fetched successfully.'))
                // result.data.users.map(resp => {
                //     if (result.data.meta.has_more) {
                //         url = result.data.links.next
                //         let tempResp = {}
                //         tempResp.requester_id = resp.id
                //         tempResp.email = resp.email
                //         tempResp.name = resp.name
                //         tempResp.role = resp.role
                //         tempResp.created_at = resp.created_at
                //         tempResp.updated_at = resp.updated_at
                //         return tempResp
                //     } else {
                //         let tempResp = {}
                //         tempResp.requester_id = resp.id
                //         tempResp.email = resp.email
                //         tempResp.name = resp.name
                //         tempResp.role = resp.role
                //         tempResp.created_at = resp.created_at
                //         tempResp.updated_at = resp.updated_at
                //         return tempResp
                //     }
                // })));

            })
            .catch(function (error) {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    requesterTickets: async (req, res) => {
        var support_config = {
            method: 'GET',
            url: `${zendesk_client.remoteUri}/users/${req.body.zendesk_id}/tickets/requested`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Basic ${zendesk_client.encoded}`
            }
        };
        axios(support_config)
            .then(function (result) {
                res.status(statusCode.ok).send(response.successmsg(result.data.tickets.map(resp => {
                    let tempResp = {}
                    tempResp.ticket_id = resp.id
                    tempResp.subject = resp.subject
                    tempResp.comment = resp.description
                    tempResp.status = resp.status
                    tempResp.priority = resp.priority
                    tempResp.created_at = resp.created_at
                    tempResp.updated_at = resp.updated_at
                    return tempResp
                })));
                // res.send(response.data.comments.map(item => {
                //     let tempResp = {}
                //     tempResp.comment = item.body
                //     tempResp.attachments = item.attachments
                //     return tempResp

                // }));

            })
            .catch(function (error) {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    viewTicket: async (req, res) => {
        var support_config = {
            method: 'GET',
            //url: `${zendesk_client.remoteUri}/requests/${req.body.ticket_id}/comments.json`,
            url: `${zendesk_client.remoteUri}/tickets/${req.body.ticket_id}/comments.json`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Basic ${zendesk_client.encoded}`
            }
        };
        axios(support_config)
            .then(function (resp) {

                resp.data.comments[0].created_at = moment(resp.data.comments[0].created_at).format("DD-MM-YYYY H:mm:ss")
                res.status(statusCode.ok).send(response.successmsg(resp.data.comments, 'Ticket details fetched successfully.'))
                // res.json(resp.data.comments.map(item => {
                //     let tempResp = {}
                //     tempResp.comment = item.body
                //     tempResp.attachments = item.attachments,
                //     tempResp.created_at = item.created_at
                //     return tempResp
                // }));

            })
            .catch(function (error) {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },
    deleteTicket: async (req, res) => {
        var support_config = {
            method: 'DELETE',
            url: `${zendesk_client.remoteUri}/tickets/destroy_many.json?ids=${req.body.ids}`,
            headers: {
                'content-type': 'application/json',
                'Authorization': `Basic ${zendesk_client.encoded}`
            }
        };
        axios(support_config)
            .then(function (respon) {
                res.status(statusCode.ok).send(response.successmsg('Ticket deleted successfully.'));

            })
            .catch(function (error) {
                res.status(statusCode.internalError).send(response.errormsg(error.message));
            });
    },

}

module.exports = System_ticket