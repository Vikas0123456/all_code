require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
// const Bin_Address = process.env.Bin_Address;
const DB_User = process.env.DB_User;
const DB_Host = process.env.DB_Host;
const DB_Pass = process.env.DB_Pass;
const DB_Name = process.env.DB_Name;
const mysqldump = require("mysqldump");

const { spawn } = require("child_process");
const fs = require("fs");

var database_dump = {
    get_dump_file: async (req, res) => {
        const backupFilePath = "./database_dump.sql";

        mysqldump({
            connection: {
                host: DB_Host,
                user: DB_User,
                password: DB_Pass,
                database: DB_Name,
            },
            dumpToFile: backupFilePath,
        })
            .then(() => {
                const fileDownloadLink = `${req.protocol}://${req.get(
                    "host"
                )}/api/v1/dump-database/download?file=${backupFilePath}`;

                res.status(200).json({ downloadLink: fileDownloadLink });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).end();
            });
    },

    download_file: async (req, res) => {
        const filePath = req.query.file;

        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).end();
            } else {
                console.log("Database backup file downloaded successfully.");
            }
        });
    },
};

module.exports = database_dump;
