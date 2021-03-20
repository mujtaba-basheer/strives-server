const { ObjectID } = require("mongodb");
const Razorpay = require("razorpay");
const uuid = require("uuid");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const sendSMS = require("../utils/sendSMS");
const slugify = require("slugify");
const slugOptions = {
  replacement: "-",
  lower: true,
};

/* ----------- Razorpay ----------- */

// get razorpay credentials
exports.getCredentials = asyncHandler(async (req, res, next, db) => {
  try {
    // extracting credentials from environment variables
    const { RAZORPAY_KEY_ID } = process.env;
    const credentials = {
      key_id: RAZORPAY_KEY_ID,
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
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

    // creating Razorpay instance
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // order options
    const options = {
      // TODO: remove hardcoded amount
      amount: 100,
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

/* ----------- Order ----------- */

exports.placeOrder = asyncHandler(async (req, res, next, db) => {
  const data = Object.assign({}, req.body),
    userId = req.user ? ObjectID(req.user["_id"]) : "guest";

  try {
    for (let item of data.items) {
      item["_id"] = ObjectID(item["_id"]);
      item.mrp = Number(item.mrp);
      item.sp = Number(item.sp);
      item.quantity = Number(item.quantity);
    }

    if (data.coupon) data.coupon["_id"] = ObjectID(data.coupon["_id"]);

    data.isDelivered = false;
    data.deliveredOn = "";
    data.user = userId;
    data.time = new Date();
    data.totalMP = Number(data.totalMP);
    data.totalSP = Number(data.totalSP);
    data.status = "on-hold";

    const {
      ops: [{ _id: order_id }],
    } = await db.collection("orders").insertOne(data);

    res.status(200).json({
      status: true,
      message: "Order Placed Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Oops! Error Placing Order.", 502));
  }

  // send SMS to user
  try {
    await sendSMS.orderPlacedUser(data.userDetails.mobile, order_id);
  } catch (error) {}
});

/* ----------- Coupon ----------- */

exports.useCoupon = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);
  const couponCode = slugify(req.params.code);

  try {
    await db.collection("coupons").updateOne(
      { slug_name: slugify(couponCode, slugOptions) },
      {
        $push: {
          users_used: userId,
        },
        $inc: { usage_count: 1 },
      }
    );

    res.status(200).json({
      status: true,
      message: "Coupon applied successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Applying Coupon", 503));
  }
});

// check if coupon can be applied for a given order by given user
exports.checkCoupon = asyncHandler(async (req, res, next, db) => {
  const userId = req.user ? ObjectID(req.user["_id"]) : "Guest",
    { coupon_code, amount } = req.body;

  try {
    const coupon = await db
      .collection("coupons")
      .findOne({ slug_name: slugify(coupon_code, slugOptions) });

    // checking if coupon exists
    if (coupon) {
      // checking for minimum  spend
      if (Number(amount) >= coupon.min_spend) {
        // checking coupon limit
        if (coupon.usage_count < coupon.limit_per_coupon) {
          const { users_used, limit_per_user } = coupon;
          let use_count = 0;

          for (let user of users_used)
            if (user.toString() === userId.toString()) use_count++;

          // checking coupon limit for user
          if (use_count < limit_per_user) {
            const todays_date = new Date(),
              { expiry_date: expiry_date_str } = coupon;
            const expiry_date = new Date(expiry_date_str);

            // checking for coupon validity
            if (todays_date <= expiry_date) {
              const { discount_type, amount, _id, name, slug_name } = coupon;

              res.status(200).json({
                status: true,
                data: { discount_type, amount, _id, name, slug_name },
                message: "Coupon Applied Successfully",
              });
            } else return next(new AppError(`Coupon expired`, 406));
          } else
            return next(
              new AppError(
                `Coupon use limit of ${limit_per_user} times reached`,
                402
              )
            );
        } else
          return next(
            new AppError(
              `Maximum coupon limit of ${coupon.limit_per_coupon} for users reached`,
              402
            )
          );
      } else
        return next(
          new AppError(
            `Minimum cart value should be ₹ ${coupon.min_spend}.`,
            404
          )
        );
    } else return next(new AppError("Coupon Not Found", 404));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error applying coupon", 502));
  }
});
