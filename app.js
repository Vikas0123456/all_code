var cors = require('cors');
var isMultipart = /^multipart\//i;
const express = require('express');
const app = express();

const httpLogger = require('./utilities/logmanager/httpLogger');
var useragent = require('express-useragent');
process.env.TZ = "Asia/Calcutta";
const nDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Calcutta'
});
var path = require('path');

var urlencodedMiddleware = express.urlencoded({ extended: true });
app.use(httpLogger)
app.use(cors())
app.use(require('sanitize').middleware);
app.use(useragent.express());
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({ extended: true,limit:'50mb' }))
app.use(function (req, res, next) {
    var type = req.get('Content-Type');
    if (isMultipart.test(type)) return next();
    return urlencodedMiddleware(req, res, next);
});


// using static files 
app.use('/static', express.static(path.join(__dirname, 'public')))
// using static files ends
const route = require('./routes/api/v1/index');
app.use('/api/v1', route);

module.exports = app;