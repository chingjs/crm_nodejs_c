require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.post('/createDelivery', async (req, res) => {
  const {} = req.body;
  console.log('call');

  const url = 'https://api.trackingmore.com/v4/trackings/create';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Tracking-Api-Key': `${process.env.tmAPI}`,
    },
    body: '{"tracking_number":"9261290312833844954982","courier_code":"vietnam-post","order_number":"1234","customer_name":"Joe","title":"Product title","language":"en","note":"Test order"}',
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
    return res.status(200).json({ message: 'Created Successfully' });
  } catch (err) {
    console.log(err);
  }
});

router.post('/getDeliveryDetails', async (req, res) => {
  const {} = req.body;
  // const encoded = Buffer.from(
  // 	`${process.env.lockerClientId}:${process.env.lockerClientSecret}`
  // ).toString('base64');
  const trackingNumber = '9261290312833844954982';
  // https://api.trackingmore.com/v4/trackings/get/tracking_number
  const headers = {
    'Content-Type': 'application/json',
    'Tracking-Api-Key': `${process.env.tmAPI}`,
  };
  try {
    const checkStatus = await fetch(
      `https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${trackingNumber}&courier_code=vietnam-post`,
      {
        method: 'GET',
        headers,
      }
    );
    console.log(checkStatus);
    const data = await checkStatus.json();
    return res.status(200).json({ data });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
