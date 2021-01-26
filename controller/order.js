const { ObjectID } = require("mongodb");
const Razorpay = require("razorpay");
const uuid = require("uuid");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// get razorpay credentials
exports.getCredentials = asyncHandler(async (req, res, next, db) => {
  try {
    // extracting credentials from environment variables
    const { KEY_ID, KEY_SECRET } = process.env;
    const credentials = {
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    };

    res.status(200).json(credentials);
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Details.", 501));
  }
});

// create razorpay order
exports.createRazorpayOrder = asyncHandler(async (req, res, next, db) => {
  const { amount } = req.body;

  try {
    // extracting credentials from environment variables
    const { KEY_ID, KEY_SECRET } = process.env;

    // creating Razorpay instance
    const razorpay = new Razorpay({
      key_id: KEY_ID,
      key_secret: KEY_SECRET,
    });

    // order options
    const options = {
      amount,
      currency: "INR",
      receipt: uuid(),
    };

    // creating order
    razorpay.orders.create(options, (err, order) => {
      if (err) {
        console.error(err);
        return next(new AppError("Error Placing Order", 501));
      } else {
        console.log(order);
        res.status(200).json({
          status: true,
          order,
        });
      }
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Server Error", 501));
  }
});
