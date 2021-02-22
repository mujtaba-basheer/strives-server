require("dotenv");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const uploadFile = (type, file, fileName) =>
  new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `assets/${fileName}`,
      Body: Buffer.from(file, "base64"),
      ACL: "public-read",
      ContentType: `${type}`,
    };

    s3.upload(params, (err, datas) => {
      if (err) {
        console.error(err);
        reject(null);
      } else resolve(datas);
    });
  });

const deleteAsset = (key) =>
  new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) reject(err);
      else {
        console.log(data);
        resolve(data);
      }
    });
  });

module.exports = { uploadFile, deleteAsset };
