const statusCode = require("../utilities/statuscode/index");
const response = require("../utilities/response/ServerResponse");
const { default: axios } = require("axios");

var leads = {
    add: async (req, res) => {
        let title = req.bodyString("title");
        let expected_close_date = req.bodyString("expected_close_date");
        let visible_to = req.bodyString("visible_to");
        let was_seen = JSON.parse(req.bodyString("was_seen"));
        let person_id = JSON.parse(req.bodyString("person_id"));
        let owner_id = JSON.parse(req.bodyString("owner_id"));
        let organization_id = JSON.parse(req.bodyString("organization_id"));
        let value = req.body.value;
        let label_ids = req.bodyString("label_ids");

        var bodyData = {
            title: title,
            expected_close_date: expected_close_date,
            visible_to: visible_to,
            was_seen: was_seen,
            person_id: person_id,
            owner_id: owner_id,
            organization_id: organization_id,
            value: value,
            label_ids: label_ids.split(","),
        };

        axios
            .post(
                `${process.env.CMS_URL}v1/leads?api_token=${process.env.CMS_API}`,
                bodyData
            )
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        result.data.data,
                        "Lead added successfully."
                    )
                );
            })
            .catch((error) => {
                console.log(error);
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    // list: async (req, res) => {
    //     axios
    //         .get(
    //             `${process.env.CMS_URL}v1/leads?api_token=${process.env.CMS_API}`
    //         )
    //         .then((result) => {
    //             let list = result.data.data;
    //             const final_data = list.filter((item) => {
    //                 return item.is_archived === false;
    //             });
    //             res.status(statusCode.ok).send(
    //                 response.successdatamsg(
    //                     final_data,
    //                     "Leads fetched successfully."
    //                 )
    //             );
    //         })
    //         .catch((error) => {
    //             res.status(statusCode.internalError).send(
    //                 response.errormsg(error.message)
    //             );
    //         });
    // },

    list_search: async (req, res) => {
        const term = req.bodyString("search_term");
        const person_id = req.bodyString("person_id");
        const organization_id = req.bodyString("organization_id");
        const start = req.bodyString("start");
        const limit = req.bodyString("limit");
        let base_url = `${process.env.CMS_URL}v1/leads/search?api_token=${process.env.CMS_API}`;

        if (req.bodyString("search_term")) {
            base_url = base_url + `&term=${term}`;
        }
        if (req.bodyString("person_id")) {
            base_url = base_url + `&person_id=${person_id}`;
        }
        if (req.bodyString("organization_id")) {
            base_url = base_url + `&organization_id=${organization_id}`;
        }
        if (req.bodyString("start")) {
            base_url = base_url + `&start=${start}`;
        }
        if (req.bodyString("limit")) {
            base_url = base_url + `&limit=${limit}`;
        }

        if (req.bodyString("search_term")) {
            axios
                .get(base_url)
                .then(async (result) => {
                    let data_all = result.data.data.items;
                    let final_res = [];
                    let temp = {};
                    let total_count = data_all.length;
                    for (let i = 0; i < data_all.length; i++) {
                        
                        const { data } = await axios.get(
                            `${process.env.CMS_URL}v1/leads/${data_all[i].item.id}?api_token=${process.env.CMS_API}`
                        );

                        temp = {
                            id: data_all[i].item.id,
                            title: data_all[i].item.title,
                            owner_id: data_all[i].item?.owner?.id
                                ? data_all[i].item?.owner?.id
                                : "",
                            label_ids: data.data?.label_ids
                                ? data.data?.label_ids
                                : [],
                            value: {
                                amount: data_all[i].item?.value
                                    ? data_all[i].item?.value
                                    : "",
                                currency: data_all[i].item?.currency
                                    ? data_all[i].item?.currency
                                    : "",
                            },
                            person_id: data_all[i].item?.person?.id,
                            organization_id: data_all[i].item?.organization?.id
                                ? data_all[i].item?.organization?.id
                                : "",
                            is_archived: data_all[i].item?.is_archived,
                            source_name: data?.data?.source_name
                                ? data.data.source_name
                                : "",
                            custom_email: data_all[i].item?.custom_fields[0]
                                ? data_all[i].item?.custom_fields[0]
                                : "",
                            custom_phone: data_all[i].item?.custom_fields[1]
                                ? data_all[i].item?.custom_fields[1]
                                : "",
                            visible_to: data_all[i].item?.visible_to
                                ? data_all[i].item?.visible_to
                                : "",
                            creator_id: data.data.creator_id,
                            expected_close_date: data.data?.expected_close_date
                                ? data.data?.expected_close_date
                                : "",
                            add_time: data.data.add_time,
                            update_time: data.data.update_time,
                        };
                        final_res.push(temp);
                    }

                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            final_res,
                            "Leads fetched successfully.",
                            total_count
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(
                        response.errormsg(error.message)
                    );
                });
        } else {
            axios
                .get(
                    `${process.env.CMS_URL}v1/leads?api_token=${process.env.CMS_API}`
                )
                .then((result) => {
                    let list = result.data.data;
                    const final_data = list.filter((item) => {
                        return item.is_archived === false;
                    });

                    let final_res = [];
                    let temp = {};
                    let total_count = final_data.length;
                    for (let i = 0; i < final_data.length; i++) {
                        console.log(final_data[i]);
                        temp = {
                            id: final_data[i]?.id,
                            title: final_data[i]?.title,
                            owner_id: final_data[i]?.owner_id
                                ? final_data[i]?.owner_id
                                : "",
                            label_ids: final_data[i]?.label_ids
                                ? final_data[i]?.label_ids
                                : [],
                            value: {
                                amount: final_data[i]?.value?.amount
                                    ? final_data[i]?.value?.amount
                                    : "",
                                currency: final_data[i]?.value?.currency
                                    ? final_data[i]?.value?.currency
                                    : "",
                            },
                            person_id: final_data[i]?.person_id,
                            organization_id: final_data[i]?.organization_id
                                ? final_data[i]?.organization_id
                                : "",
                            is_archived: final_data[i]?.is_archived,
                            custom_email: final_data[i]?.[
                                "b15d061deb5b2cd25509e48d7c348b2adad7e1cb"
                            ]
                                ? final_data[i]?.[
                                      "b15d061deb5b2cd25509e48d7c348b2adad7e1cb"
                                  ]
                                : "",
                            custom_phone: final_data[i]?.[
                                "aa43a0db5eb6407e2f49b961a9574221d3589cd6"
                            ]
                                ? final_data[i]?.[
                                      "aa43a0db5eb6407e2f49b961a9574221d3589cd6"
                                  ]
                                : "",
                            source_name: final_data[i]?.source_name
                                ? final_data[i]?.source_name
                                : "",
                            visible_to: final_data[i]?.visible_to
                                ? final_data[i]?.visible_to
                                : "",
                            creator_id: final_data[i]?.creator_id,
                            expected_close_date: final_data[i]
                                ?.expected_close_date
                                ? final_data[i]?.expected_close_date
                                : "",
                            add_time: final_data[i]?.add_time,
                            update_time: final_data[i]?.update_time,
                        };
                        final_res.push(temp);
                    }
                    res.status(statusCode.ok).send(
                        response.successdatamsg(
                            final_res,
                            "Leads fetched successfully.",
                            total_count
                        )
                    );
                })
                .catch((error) => {
                    console.log(error);
                    res.status(statusCode.internalError).send(
                        response.errormsg(error.message)
                    );
                });
        }
    },

    details: async (req, res) => {
        const id = req.params.id;
        axios
            .get(
                `${process.env.CMS_URL}v1/leads/${id}?api_token=${process.env.CMS_API}`
            )
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        result.data.data,
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
        const id = req.params.id;

        let title = req.bodyString("title");
        let owner_id = JSON.parse(req.bodyString("owner_id"));
        let person_id = JSON.parse(req.bodyString("person_id"));
        let organization_id = JSON.parse(req.bodyString("organization_id"));
        let is_archived = JSON.parse(req.bodyString("is_archived"));
        let expected_close_date = req.bodyString("expected_close_date");
        let visible_to = req.bodyString("visible_to");
        let was_seen = JSON.parse(req.bodyString("was_seen"));
        let value = req.body.value;
        let label_ids = req.bodyString("label_ids");

        var bodyData = {
            title: title,
            expected_close_date: expected_close_date,
            visible_to: visible_to,
            was_seen: was_seen,
            person_id: person_id,
            owner_id: owner_id,
            organization_id: organization_id,
            value: value,
            label_ids: label_ids.split(","),
            is_archived: is_archived,
        };

        axios
            .patch(
                `${process.env.CMS_URL}v1/leads/${id}?api_token=${process.env.CMS_API}`,
                bodyData
            )
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        result.data.data,
                        "Details updated successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },

    delete: async (req, res) => {
        const id = req.params.id;
        axios
            .delete(
                `${process.env.CMS_URL}v1/leads/${id}?api_token=${process.env.CMS_API}`
            )
            .then((result) => {
                res.status(statusCode.ok).send(
                    response.successdatamsg(
                        result.data.data,
                        "Lead deleted successfully."
                    )
                );
            })
            .catch((error) => {
                res.status(statusCode.internalError).send(
                    response.errormsg(error.message)
                );
            });
    },
};

module.exports = leads;
