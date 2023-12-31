require('dotenv').config();
const express = require('express');
const path = require('path');
const AWS = require('aws-sdk');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const permissionsPolicy = require('permissions-policy');
const {
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
  routeNotFoundHandler,
  globalErrorHandler,
} = require('./config/functions/errorHandler');

// database
require('./config/database');

// aws
const region = 'ap-southeast-1';
const accessKeyId = process.env.ACCESS_KEYID;
const secretAccessKey = process.env.SECRET_ACCESSKEY;
AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

// init app
const app = express();

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// file upload
app.use(fileUpload());

app.use(cors());

//middlewares
// helmet
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [
//         'self',
//         'data:',
//         'test-2023.s3.ap-southeast-1.amazonaws.com',
//         'cdnjs.cloudflare.com',
//         'www.allfont.es',
//         'www.googletagmanager.com',
//         'gum.criteo.com',
//         'www.google-analytics.com',
//         'help.hotjar.com',
//         'test-sb.antlysis.com',
//         'unsafe-inline',
//         'none',
//       ],
//       scriptSrc: [
//         'self',
//         'unsafe-inline',
//         'www.googletagmanager.com',
//         'static.hotjar.com',
//         'connect.facebook.net',
//         'facebook.com',
//         'script.hotjar.com',
//         'dynamic.criteo.com',
//         'test-sb.antlysis.com',
//       ],
//       styleSrc: [
//         'self',
//         'unsafe-inline',
//         'cdnjs.cloudflare.com',
//         'allfont.net',
//         'fonts.googleapis.com',
//         'fonts.gstatic.com',
//         'www.allfont.es',
//         'test-sb.antlysis.com',
//       ],
//       imgSrc: [
//         'self',
//         'data:',
//         'test-2023.s3.ap-southeast-1.amazonaws.com',
//         'cdnjs.cloudflare.com',
//         'www.facebook.com',
//         'www.google-analytics.com',
//         'sslwidget.criteo.com',
//         'https://in.hotjar.com',
//         'test-sb.antlysis.com',
//         'unsafe-inline',
//       ],
//       mediaSrc: [
//         'self',
//         'data:',
//         'blob:',
//         'test-2023.s3.ap-southeast-1.amazonaws.com',
//         'cdnjs.cloudflare.com',
//         'www.facebook.com',
//         'www.google-analytics.com',
//         'sslwidget.criteo.com',
//         'https://in.hotjar.com',
//         'test-sb.antlysis.com',
//         'unsafe-inline',
//       ],
//       connectSrc: [
//         'self',
//         'www.googletagmanager.com',
//         'static.hotjar.com',
//         'connect.facebook.net',
//         'www.facebook.com',
//         'script.hotjar.com',
//         'www.google-analytics.com',
//         'test-sb.antlysis.com',
//         'unsafe-inline',
//       ],
//       fontSrc: [
//         'self',
//         'cdnjs.cloudflare.com',
//         'fonts.gstatic.com',
//         'www.allfont.es',
//         'allfont.net',
//         'test-sb.antlysis.com',
//         'unsafe-inline',
//       ],
//       objectSrc: ['none'],
//     },
//   })
// );

// defaultSrc: sets the default source for all types of resources to ‘self’.
// scriptSrc: sets the allowed sources for JavaScript code to ‘self’, ‘unsafe-inline’ (allows inline script), and ‘example.com’.
// styleSrc: sets the allowed sources for CSS styles to ‘self’ and ‘unsafe-inline’ (allows inline style).
// imgSrc: sets the allowed sources for images to ‘self’ and ‘example.com’.
// connectSrc: sets the allowed sources for network connections to ‘self’.
// fontSrc: sets the allowed sources for fonts to ‘self’.
// objectSrc: sets the allowed sources for objects (such as Flash and Java applets) to ‘none’ (disallows any object).
// mediaSrc: sets the allowed sources for media (such as audio and video) to ‘self’.

// permissions policy http header
app.use(
  permissionsPolicy({
    features: {
      fullscreen: ['self'], // fullscreen=()
      syncXhr: [], // syncXhr=()
    },
  })
);

// routes
app.use('/api/user', require('./routes/api/userApi'));
// app.use('/api/misc', require('./routes/api/miscApi')); // NOTE : Only uncomment when needed to use and comment back after use
app.use("/api/admin", require("./routes/api/adminApi"));
app.use("/api/report", require("./routes/api/reportApi"));
app.use("/api/store", require("./routes/api/storeApi"));
app.use("/api/retailer", require("./routes/api/retailerApi"));
app.use("/api/transaction", require("./routes/api/transactionApi"));
app.use("/api/shop", require("./routes/api/shopApi"));
app.use("/api/vouchers", require("./routes/api/vouchersApi"));

// short circuit with 500 status
app.use(globalErrorHandler);
// crash the app for any unhandledRejection or uncaughtExceptions
process.on("unhandledRejection", unhandledRejectionHandler);
process.on("uncaughtException", uncaughtExceptionHandler);

// serve static folder
app.use('/', express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) =>
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
);

// Attach the fallback Middleware
// function which sends back the response for invalid paths)
app.use(routeNotFoundHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
