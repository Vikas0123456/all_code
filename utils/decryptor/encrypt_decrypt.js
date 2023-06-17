let Sha256 = require('crypto-js/sha256');
let Hex = require('crypto-js/enc-hex');
let Utf8 = require('crypto-js/enc-utf8');
let Base64 = require('crypto-js/enc-base64');
let AES = require('crypto-js/aes');
let base64 = require('base-64');

module.exports = function encryptDecrypt(type, inpString) {
  let string = inpString.toString();
  let secretKey = process.env.SECRET_KEY;
  let secretIv = process.env.SECRET_IV;
  let key = Sha256(secretKey).toString(Hex).substr(0, 32); 
  // Use the first 32 bytes (see 2.)
  let iv = Sha256(secretIv).toString(Hex).substr(0, 16);
  let output = false;
  if(type === 'encrypt'){
    output = AES.encrypt(string, Utf8.parse(key), {
      iv: Utf8.parse(iv),
    }).toString();
    output = Utf8.parse(output).toString(Base64);
  }else{
    string = base64.decode(string);
    output = AES.decrypt(string, Utf8.parse(key), {
      iv: Utf8.parse(iv),
    }).toString(Utf8);
  }
  return output;
};