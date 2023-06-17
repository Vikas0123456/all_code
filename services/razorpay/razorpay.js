const express = require('express');
const Razorpay = require('razorpay');
const StatusCode = require('../../utils/statuscode/statusCode');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: 'rzp_test_ez6XKjFep8s460',
  key_secret: 'eWdgFSH1kDgl18jI0UO9lb2f',
});

router.post('/order', (req, res) => {
  let options = {
    amount: 20000,
    currency: 'INR',
  };
  razorpay.orders.create(options, function (err, order) {
    console.log(order);
    res.json(order);
  });
});

function sendPaymentRequestToPhonePe(email, amount) {
  if (method == 'phonepe') {
    email = req.body.payload.payment.entity.email;
    amount = req.body.payload.payment.entity.amount;
  }

  res.sendStatus(StatusCode.ok);

  console.log('Payment request sent to PhonePe');

}
router.post('/is-order-complete', (req, res) => {
  razorpay.payments.fetch(req.body.razorpay_payment_id).then((paymentDocument) => {
    if (paymentDocument.status == 'captured') {
      sendPaymentRequestToPhonePe(paymentDocument.email, paymentDocument.amount);
      res.send('payment successful');
    } else {
      res.redirect('/');
    }
  });
});

module.exports = router;
