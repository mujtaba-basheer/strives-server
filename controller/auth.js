const asyncHandler = require("express-async-handler");
const authUtil = require("../utils/auth");
const AppError = require("../utils/appError");
const { sendOtp } = require("../utils/sendSMS");
const { sendNewPassword } = require("../utils/sendEmail");
const { ObjectID } = require("mongodb");

// register a new user
exports.signup = asyncHandler(async (req, res, next, db) => {
  // checking if user with given email already exists

  let user = await db.collection("users").findOne({ email: req.body.email });

  if (!user) {
    // hashing the password
    req.body.password = authUtil.hashPassword(req.body.password);

    // adding user data to db
    user = (await db.collection("users").insertOne(req.body))["ops"][0];

    // adding cart and wishlist
    db.collection("carts")
      .insertOne({
        user_id: ObjectID(user["_id"]),
        carts: [],
      })
      .then(() => {})
      .catch(console.error);
    db.collection("favourites")
      .insertOne({
        user_id: ObjectID(user["_id"]),
        favourites: [],
      })
      .then(() => {})
      .catch(console.error);

    res.status(200).json({
      status: true,
      data: user,
      token: authUtil.generateToken(user),
    });
  } else return next(new AppError("User already exists.", 400));
});

// send OTP to user for verification
exports.sendOtpStep = asyncHandler(async (req, res, next, db) => {
  let { email, phone } = req.body;

  // fetching user with given email
  let user = await db.collection("users").findOne({ email: req.body.email });

  // checking if user with given email exists
  if (!user) {
    // formatting phone number if required
    if (!phone.startsWith("+91")) phone = "+91" + phone;

    // sending OTP to user's phone
    try {
      const { otp, data } = await sendOtp(phone);
      const msgId = data.MessageResponse.Result[phone].StatusMessage.split(
        " "
      )[1];

      // storing OTP in database
      await db.collection("otp").insertOne({
        msg_id: msgId,
        email,
        otp,
      });

      res.status(200).json({
        status: true,
        message: "OTP Sent Successfully",
      });
    } catch (error) {
      console.error(error);
      return next(new AppError("Error", 500));
    }
  } else return next(new AppError("User already exists", 404));
});

// resend OTP to user for verification
exports.resendOtp = asyncHandler(async (req, res, next, db) => {
  let { email, phone } = req.body;

  // formatting phone number if required
  if (!phone.startsWith("+91")) phone = "+91" + phone;

  // sending OTP to user's phone
  try {
    const { otp, data } = await sendOtp(phone);
    const msgId = data.MessageResponse.Result[phone].StatusMessage.split(
      " "
    )[1];

    // storing OTP in database
    await db.collection("otp").insertOne({
      msg_id: msgId,
      email,
      otp,
    });

    res.status(200).json({
      status: true,
      message: "OTP Sent Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error", 500));
  }
});

// verify user's OTP
exports.verifyOtp = asyncHandler(async (req, res, next, db) => {
  let { email, otp } = req.body;

  try {
    // fetching OTP for given email
    const doc = await db.collection("otp").findOne({ email, otp });

    if (doc) {
      // deleting otps for given email
      await db.collection("otp").deleteMany({ email });

      res.status(200).json({
        status: true,
        message: "OTP verified",
      });
    } else return next(new AppError("OTP incorrect", 404));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error", 404));
  }
});

// signin a user
exports.login = asyncHandler(async (req, res, next, db) => {
  // fetching user with given email
  let user = await db.collection("users").findOne({ email: req.body.email });

  // checking if user with given email exists
  if (user) {
    //checking if password is correct
    if (authUtil.comparePasswords(req.body.password, user.password)) {
      // deleting user's password for security
      delete user.password;

      res.status(200).json({
        status: true,
        data: user,
        token: authUtil.generateToken(user),
      });
    } else return next(new AppError("Incorrect Password.", 402));
  } else return next(new AppError("User not found.", 404));
});

// send a generated password to user's mail
exports.genPassword = asyncHandler(async (req, res, next, db) => {
  const { email } = req.body;
  try {
    // checking if user exists
    const user = await db.collection("users").findOne({ email });
    if (user) {
      // send new password to user's mail
      const { pass, data } = await sendNewPassword(email);
      console.log(data);

      // updating password in database
      await db.collection("users").updateOne(
        { email },
        {
          $set: {
            password: authUtil.hashPassword(pass),
          },
        }
      );

      res.status(200).json({
        status: true,
        message: "Password Sent",
      });
    } else return next(new AppError("Email not found", 500));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error generating password", 500));
  }
});

// reset password
exports.resetPass = asyncHandler(async (req, res, next, db) => {
  const { currentPass, newPassword } = req.body;

  try {
    // fetching user
    const user = await db
      .collection("users")
      .findOne({ _id: ObjectID(req.user["_id"]) });

    // checking if password is correct
    if (authUtil.comparePasswords(currentPass, user["password"])) {
      await db.collection("users").updateOne(
        { _id: ObjectID(req.user["_id"]) },
        {
          // storing hashed password to user object
          $set: {
            password: authUtil.hashPassword(newPassword),
          },
        }
      );

      res.status(200).json({
        status: true,
        message: "Password updated successfully",
      });
    } else return next(new AppError("Incorrect Password", 401));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error updating password", 500));
  }
});
