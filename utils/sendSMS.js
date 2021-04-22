const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();
const applicationId = process.env.PINPOINT_APPLICATION_ID;

AWS.config.update({
  region: process.env.PINPINT_REGION,
  accessKeyId: process.env.PINPOINT_ACCESS_KEY,
  secretAccessKey: process.env.PINPOINT_SECRET_KEY,
});

const phonebook = [
  { name: "Mujtaba", phone: "+917686886489" },
  { name: "Admin", phone: "+917980915048" },
];

const reference = {
  maintainer: "+917686886489",
  admin: "+917980915048",
  me: "+917686886489",
};

const pinpoint = new AWS.Pinpoint();

const sendTestSMS = () => {
  const destinationNumber = reference["maintainer"];

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
          Body: `Your 'The Strives' verification OTP code is 4543. Code valid for 10 minutes only, one-time use. Please DO NOT share this OTP with anyone.`,
          MessageType: "TRANSACTIONAL",
          EntityId: "110135350000049663",
          TemplateId: "1107161701552665238",
          SenderId: "STRVES",
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) {
        console.error(err);
        rej(null);
      } else res(data.MessageResponse.Result);
    });
  });
};

const notifyError = async (type, details) => {
  const destinationNumber = reference["maintainer"];

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
          Body: `SMS Sending Error\nTopic: ${type}\nDetails: ${details}`,
          MessageType: "TRANSACTIONAL",
        },
      },
    },
  };

  pinpoint.sendMessages(params, (err, data) => {
    if (err) console.log(err);
  });
};

const sendOtp = (destination) => {
  const destinationNumber = destination.startsWith("+91")
    ? destination
    : "+91" + destination;
  const otp = Math.ceil(100000 + Math.random() * 900000);
  const message = `Your 'The Strives' verification OTP code is ${otp}. Code valid for 10 minutes only, one-time use. Please DO NOT share this OTP with anyone.`;
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
          MessageType: "TRANSACTIONAL",
          EntityId: "110135350000049663",
          TemplateId: "1107161701552665238",
          SenderId: "STRVES",
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) {
        notifyError("OTP", `User Contact: ${destination}`);
        rej(err);
      } else {
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

const orderPlacedUser = async (user_contact, order_id) => {
  if (!user_contact.startsWith("+91")) user_contact = "+91" + user_contact;
  const order_link = "www.thestrives.com/order/" + order_id;
  console.log(order_link);
  return;
  const message = `Hey there! Your 'The Strives' order ${order_id}, is getting ready and will be dispatched soon. Sit back & relax while we have this delivered to you. For more details, please click here ${order_link}.`;

  const params = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [user_contact]: {
          ChannelType: "SMS",
        },
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: message,
          MessageType: "TRANSACTIONAL",
          EntityId: "110135350000049663",
          TemplateId: "1107161701563048828",
          SenderId: "STRVES",
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) {
        notifyError("User Order Placed", `Order ID: ${order_id}`);
        rej(err);
      } else res(true);
    });
  });
};

const orderConfirmedUser = async (destination, items = [], price, order_id) => {
  const destinationNumber = "+917686886489" || destination;

  let itemsStr = "";
  for (let i = 0; i < items.length; i++) {
    const { name: itemName, qty, size } = items[i];
    itemsStr += `${i + 1}. ${itemName} - ${
      size === "C" ? "Custom" : size
    } - ${qty} Nos.\n`;
  }
  let message = `Placed: Order for\n ${itemsStr}\n worth Rs. ${price} is placed & will be delivered within 2 weeks.
  You will be notified once your order is dispatched.`;
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
          MessageType: "TRANSACTIONAL",
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) {
        notifyError("User Order Confirmation", `Order ID: ${order_id}`);
        rej(err);
      } else res(true);
    });
  });
};

const orderPlacedAdmin = async (user_contact, price, order_id) => {
  const message = `ORDER PLACED\n Order ID: ${order_id}\nValue: ${price}\nContact: ${user_contact}`;

  const params = {
    ApplicationId: applicationId,
    MessageRequest: {
      Addresses: {
        [reference["admin"]]: {
          ChannelType: "SMS",
        },
        [reference["maintainer"]]: {
          ChannelType: "SMS",
        },
      },
      MessageConfiguration: {
        SMSMessage: {
          Body: message,
          MessageType: "TRANSACTIONAL",
        },
      },
    },
  };

  return new Promise((res, rej) => {
    pinpoint.sendMessages(params, (err, data) => {
      if (err) {
        notifyError("Admin Order Placed", `Order ID: ${order_id}`);
        rej(err);
      } else res(true);
    });
  });
};

module.exports = {
  sendOtp,
  orderConfirmedUser,
  orderPlacedAdmin,
  orderPlacedUser,
  sendTestSMS,
};
