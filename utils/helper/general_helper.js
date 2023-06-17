require('dotenv').config({ path: '../.env' });

let helpers = {
  get_conditional_string: async (obj) => {
    let output_string = '';
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        output_string += 'and ' + key + ' = ' + obj[key] + ' ';
      }
    }

    let words = output_string.split(' ');
    let output_string1 = words.slice(1).join(' ');

    return output_string1;
  },
  get_ip: async (req) => {
    return req.socket.remoteAddress;
  },
  get_title: async () => {
    let qb = await pool.get_connection();
    let response = await qb
        .select('title')
        .get(config.table_prefix + 'title');
    qb.release();

    if (response[0]) {
        return response[0].title;
    } else {
        return '';
    }
},
};
module.exports = helpers;
