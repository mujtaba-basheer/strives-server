const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
require("dotenv").config();
require("colors");

// importing controllers
const authController = require("./controller/auth");
const userController = require("./controller/user");
const orderController = require("./controller/order");

// importing middleware
const { protect } = require("./middleware/auth");

// getting db uri
const db_uri = process.env.DB_URI.replace(
  "<password>",
  process.env.DB_PASSWORD
);

// connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// connecting to database
MongoClient.connect(db_uri, options, (err, client) => {
  if (err) {
    console.log(`${err.message}`.red);
    console.error(err);
  } else {
    console.log(`Connected to database. 🔛`.blue.bold);
    const db = client.db(process.env.DB_NAME);

    /* *********** SETTING UP ROUTES *********** */

    /* ----------- Auth Routes ----------- */

    // register
    router.post("/register", (req, res, next) =>
      authController.signup(req, res, next, db)
    );
    // send OTP
    router.post("/send-otp", (req, res, next) =>
      authController.sendOtpStep(req, res, next, db)
    );
    // resend OTP
    router.post("/resend-otp", (req, res, next) =>
      authController.resendOtp(req, res, next, db)
    );
    // verify OTP
    router.post("/verify-otp", (req, res, next) =>
      authController.verifyOtp(req, res, next, db)
    );
    // send new generated password
    router.post("/gen-pass", (req, res, next) =>
      authController.genPassword(req, res, next, db)
    );
    //login
    router.post("/login", (req, res, next) =>
      authController.login(req, res, next, db)
    );
    // reset password
    router.post(
      "/reset-pass",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => authController.resetPass(req, res, next, db)
    );

    /* ----------- User Details Routes ----------- */

    router.get(
      "/get-details",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => userController.get(req, res, next, db)
    );
    router.put(
      "/update-details",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => userController.update(req, res, next, db)
    );

    /* ----------- User Address Routes ----------- */

    router.get(
      "/get-address",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => userController.getAddress(req, res, next, db)
    );
    router.put(
      "/update-address",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => userController.updateAddress(req, res, next, db)
    );
    router.post(
      "/add-address",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => userController.addAddress(req, res, next, db)
    );

    /* ----------- Order Routes ----------- */

    router.get(
      "/credentials",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) => orderController.getCredentials(req, res, next, db)
    );
    router.post(
      "/razorpay-order",
      (req, res, next) => protect(req, res, next, db),
      (req, res, next) =>
        orderController.createRazorpayOrder(req, res, next, db)
    );

    /* ----------- Action Routes ----------- */
    router.get("/kill", (req, res) => {
      console.log(`closing database connection...`.yellow);
      client.close();
      res.send(1);
    });
  }
});

module.exports = router;
