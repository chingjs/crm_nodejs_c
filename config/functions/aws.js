/* eslint-disable no-console */
const AWS = require('aws-sdk');
require('dotenv').config();

const region = 'ap-southeast-1';
const accessKeyId = process.env.ACCESS_KEYID;
const secretAccessKey = process.env.SECRET_ACCESSKEY;
const bucketName = process.env.BUCKETNAME;
AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const s3Upload = async (param) => {
  const s3 = new AWS.S3();

  try { 
    const data = await s3.upload(param).promise(); 
    if(data) {
      return data;
    }
    console.log('Successfully uploaded:', data);
    
  } catch (err) { 
    console.error('Error uploading:', err);
  }
};

module.exports = {
  s3Upload,
};
