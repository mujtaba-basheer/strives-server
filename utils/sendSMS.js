const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();
const applicationId = process.env.PINPOINT_APPLICATION_ID;

AWS.config.update({
  region: process.env.PINPINT_REGION,
  accessKeyId: process.env.PINPOINT_ACCESS_KEY,
  secretAccessKey: process.env.PINPOINT_SECRET_KEY,
});

const pinpoint = new AWS.Pinpoint();

const sendOtp = (destination) => {
  const destinationNumber = destination;
  const otp = Math.ceil(100000 + Math.random() * 900000);
  const message = `Hey there! You OTP is ${otp}. Thanks for signing up.`;
  const params = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [destinationNumber]: {
          ChannelType: "SMS",
        },
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: message,
          // Keyword: registeredKeyword,
          MessageType: "TRANSACTIONAL",
          // OriginationNumber: originationNumber,
          // SenderId: senderId,
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) rej(err);
      else {
        console.log("message sent");
        res({
          otp,
          data,
        });
      }
    });
  });
};

// TODO: Edit this function
const sendOrderDetails = (destination) => {
  const destinationNumber = destination;
  const otp = Math.ceil(100000 + Math.random() * 900000);
  const message = `Hey there! You OTP is ${otp}. Thanks for signing up.`;
  const params = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [destinationNumber]: {
          ChannelType: "SMS",
        },
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: message,
          // Keyword: registeredKeyword,
          MessageType: "TRANSACTIONAL",
          // OriginationNumber: originationNumber,
          // SenderId: senderId,
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) rej(err);
      else {
        console.log("message sent");
        res({
          otp,
          data,
        });
      }
    });
  });
};

module.exports = { sendOtp };
