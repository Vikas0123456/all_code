const Joi = require("joi")
const ServerResponse = require("../response/ServerResponse")
const protector = require("../decryptor/decryptor")
const checkifrecordexist = require("./checkifrecordexist")
const StatusCode = require("../statuscode")



const prompterValidation = {

    add: async (req, res, next) => {
        const schema = Joi.object().keys({
            language: Joi.string().required().error(() => {
                throw new Error("Valid language string required")
            }),
            prompter: Joi.string().required().error(() => {
                throw new Error("Valid prompter required")
            })
        })

        try {
            console.log("hello");
            const {
                error
            } = schema.validate(req.body)
            if (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.errormsg(error.message))
            } else {
                let language = await protector.cjs_decrypt(req.bodyString("language"))
                record_exist = await checkifrecordexist({
                    language: language
                },'master_prompter')
                console.log(language);
                if (!record_exist) {
                    next()
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.errormsg("Record already exist"))
                }
            }

        } catch (err) {
            res.status(StatusCode.badRequest).send(ServerResponse.errormsg(err.message))
        }
    },

    update: async (req, res, next) => {
        const schema = Joi.object().keys({
            language: Joi.string().required().error(() => {
                throw new Error("Valid language string required")
            }),
            prompter: Joi.string().required().error(() => {
                throw new Error("Valid prompter required")
            })
        })

        try {

            const {
                error
            } = schema.validate(req.body)
            if (error) {
                res.status(StatusCode.badRequest).send(ServerResponse.errormsg(error.message))
            } else {
                let language = await protector.cjs_decrypt(req.bodyString('language'))
                let record_exist = await checkifrecordexist({
                    language: language
                },'master_prompter')
                if (record_exist) {
                    next()
                } else {
                    res.status(StatusCode.badRequest).send(ServerResponse.errormsg("Unable to update instructions"))
                }
            }
        } catch (err) {
            res.status(StatusCode.badRequest).send(ServerResponse.errormsg(err.message))
        }
    },

    details: async (req, res, next) => {
        const schema = Joi.object().keys({
            id: Joi.string().allow(" ").error(() => {
                throw new Error('Invalid id')
            }),
            language: Joi.string().allow(" ").error(() => {
                throw new Error("Invalid language string ")
            }),
        })

        try {
            const {
                error
            } = schema.validate(req.body)

            if (error) {
                res.status(StatusCode.internalError).send(ServerResponse.errormsg(error.message))
            } else {
                let language_id = await protector.cjs_decrypt(req.bodyString('language'))
                let row_id = await protector.cjs_decrypt(req.bodyString('id'))
                let condition = {}
                if (row_id) {
                    condition.id = row_id
                }
                if (language_id) {
                    condition.language = language_id
                }

                record_exist = await checkifrecordexist(condition,'master_prompter')

                if(record_exist) {
                    next()
                }else{
                    res.status(StatusCode.internalError).send(ServerResponse.errormsg('Unable to get details'))
                }
            }
        } catch (err) {
            res.status(StatusCode.internalError).send(ServerResponse.errormsg(err.message))
        }
    }

}
module.exports = prompterValidation