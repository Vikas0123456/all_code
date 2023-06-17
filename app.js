const cors = require('cors');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cron = require('node-cron');
const path = require('path');
const routes = require('./routes/routes');
const swagger = require('./services/swagger/swagger');
const backupDatabase = require('./services/db_backup/backup');
const httpLogger = require('./utils/logmanager/httpLogger');
const razorpay = require('./services/razorpay/razorpay');

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(httpLogger);
app.use('/app', routes);
swagger(app);

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('razorpay');
});

app.use(razorpay);

// Schedule backup to run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  backupDatabase();
});

module.exports = app;
