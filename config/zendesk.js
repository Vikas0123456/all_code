require('dotenv').config({ path: '../.env' });
let zendesk = require('node-zendesk');
let base64 = require('base-64');
let utf8 = require('utf8');
const zendeskToken = `${process.env.ZENDESK_NAME}/token:${process.env.TOKEN}`;
let bytes = utf8.encode(zendeskToken);
let encoded = base64.encode(bytes);
let zendeskApi = require('zendesk-node-api');

const client = zendesk.createClient({
  username:process.env.ZENDESK_NAME,
  token:process.env.TOKEN,
  remoteUri:process.env.REMOTE_URL
});

const zendeskClientInfo = {
  encoded:encoded,
  client:client,
  remoteUri:process.env.REMOTE_URL
};

module.exports = zendeskClientInfo;
