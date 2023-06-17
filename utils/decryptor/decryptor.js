// require('dotenv').config({ path: '../.env' });
// let Sha256 = require('crypto-js/sha256');
// let Hex = require('crypto-js/enc-hex');
// let Utf8 = require('crypto-js/enc-utf8');
// let Base64 = require('crypto-js/enc-base64');
// let AES = require('crypto-js/aes');
// let base64 = require('base-64');
// const Crypto = require('crypto');

// let protector = {
//   cjs_encrypt: (nor_text) => {
//     const string = nor_text.toString();
//     const secret_key = process.env.SECRET_KEY;
//     const secret_iv = process.env.SECRET_IV;
//     const key = Sha256(secret_key).toString(Hex).substr(0, 32);
//     const iv = Sha256(secret_iv).toString(Hex).substr(0, 16);
//     const salt = Crypto.randomBytes(16).toString('hex'); // Generate a random 16-byte salt
//     const output = AES.encrypt(`${salt}${string}`, Utf8.parse(key), {
//       iv: Utf8.parse(iv),
//     }).toString();
//     return `${salt}:${output}`; // Return the salt and encrypted string separated by a colon
//   },
//   //   cjs_decrypt: (cipher_text) => {
//   //     // let bytes  = CryptoJS.AES.decrypt(cipher_text, sk);
//   //     // let originalText = bytes.toString(CryptoJS.enc.Utf8);
//   //     // return originalText;
//   //     try {
//   //         let string = cipher_text.toString();
//   //         let secret_key = process.env.SECRET_KEY;
//   //         let secret_iv = process.env.SECRET_IV;
//   //         var key = Sha256(secret_key).toString(Hex).substr(0, 32); // Use the first 32 bytes (see 2.)
//   //         var iv = Sha256(secret_iv).toString(Hex).substr(0, 16);
//   //         var output = false;

//   //         string = base64.decode(string);

//   //         output = AES.decrypt(string, Utf8.parse(key), {
//   //             iv: Utf8.parse(iv),
//   //         }).toString(Utf8);
//   //         return output;
//   //     } catch (error) {
//   //         return false;
//   //     }
//   // },
//   cjs_decrypt: (cipher_text) => {
//     const encryptedData = cipher_text.toString();
//     const secret_key = process.env.SECRET_KEY;
//     const secret_iv = process.env.SECRET_IV;
//     const key = Sha256(secret_key).toString('hex').substr(0, 32);
//     const iv = Sha256(secret_iv).toString('hex').substr(0, 16);
//     const [salt, encryptedString] = encryptedData.split(':');
//     const decrypted = AES.decrypt(encryptedString, Utf8.parse(key), {
//       iv: Utf8.parse(iv),
//     }).toString(Utf8);
//     const decryptedString = decrypted.replace(salt, '');
//     return decryptedString;
//   },
// };
// module.exports = protector;


const path = require('path')
require('dotenv').config({ path: "../.env" });
const sk = process.env.SECRET
const crypto = require('crypto');
const CryptoJS = require("crypto-js")
var Sha256 = require("crypto-js/sha256");
var Hex = require('crypto-js/enc-hex');
var Utf8 = require('crypto-js/enc-utf8');
var Base64 = require('crypto-js/enc-base64');
var AES = require("crypto-js/aes");
var base64 = require('base-64');

var protector = {

    cjs_encrypt: (nor_text) => {
        let string = nor_text.toString()
        let secret_key = process.env.SECRET_KEY;
        let secret_iv = process.env.SECRET_IV;
        var key = Sha256(secret_key).toString(Hex).substr(0, 32); // Use the first 32 bytes (see 2.)
        var iv = Sha256(secret_iv).toString(Hex).substr(0, 16);
        var output = false;

        output = AES.encrypt(string, Utf8.parse(key), {
            iv: Utf8.parse(iv),
        }).toString();
        output = Utf8.parse(output).toString(Base64);
        return output;
    },
    
    cjs_decrypt: (encrypted_text) => {
      let secret_key = process.env.SECRET_KEY;
      let secret_iv = process.env.SECRET_IV;
      var key = Sha256(secret_key).toString(Hex).substr(0, 32);
      var iv = Sha256(secret_iv).toString(Hex).substr(0, 16);
      var decrypted = false;
    
      encrypted_text = Base64.parse(encrypted_text).toString(Utf8);
      decrypted = AES.decrypt(encrypted_text, Utf8.parse(key), {
        iv: Utf8.parse(iv),
      }).toString(Utf8);
    
      return decrypted;
    },
    

}
module.exports = protector;