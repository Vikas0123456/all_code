const path = require("path");
require("dotenv").config({ path: "../.env" });
const env = process.env.ENVIRONMENT;
const config = require("../config/config.json")[env];
const pool = require("../config/database");
const dbtable = config.table_prefix + "mada_bin";
const helpers = require("../utilities/helper/general_helper");

var dbModel = {

      selectOne: async (selection, condition) => {
            let qb = await pool.get_connection();
            response = await qb
                  .select(selection)
                  .where(condition)
                  .get(dbtable);
            qb.release();
            console.log(qb.last_query());
            return response[0];
      },
}

module.exports = dbModel;