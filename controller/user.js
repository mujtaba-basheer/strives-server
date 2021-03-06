const { ObjectID } = require("mongodb");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

/* ----------- Details ----------- */

// get user details
exports.get = asyncHandler(async (req, res, next, db) => {
  try {
    // fetching user details
    const [user] = await db
      .collection("users")
      .aggregate([
        {
          $match: { _id: ObjectID(req.user["_id"]) },
        },
        {
          $lookup: {
            from: "addresses",
            foreignField: "_id",
            localField: "address",
            as: "address",
          },
        },
      ])
      .toArray();

    // checking if user exists
    if (user) {
      // deleting user password for security
      delete user.password;
      res.status(200).json({
        status: true,
        data: user,
      });
    } else return next(new AppError("User Not Found", 404));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Details.", 501));
  }
});

// update user details
exports.update = asyncHandler(async (req, res, next, db) => {
  // extracting user details to update
  const data = Object.assign({}, req.body);

  try {
    // updating user details
    await db.collection("users").updateOne(
      { _id: ObjectID(req.user["_id"]) },
      {
        $set: data,
      }
    );

    res.status(200).json({
      status: true,
      message: "Details Updated Successfully.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Updating Details.", 400));
  }
});

/* ----------- Newsletter ----------- */

// add to newsletter

exports.addToNewsLetter = asyncHandler(async (req, res, next, db) => {
  const { email } = req.body;

  try {
    // checking if email exists

    const subDoc = await db.collection("newsletter").findOne({ email });

    if (!subDoc) {
      await db.collection("newsletter").insertOne({
        email,
        date: new Date(),
      });

      res.status(200).json({
        status: true,
        message: "Successfully added to our newsletter.",
      });
    } else return next(new AppError("You've already subscribed.", 400));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error subscribing. Please try again.", 400));
  }
});

/* ----------- Addresses ----------- */

// add address
exports.addAddress = asyncHandler(async (req, res, next, db) => {
  const address = req.body;
  const userId = ObjectID(req.user["_id"]);

  try {
    // adding address
    const {
      ops: [{ _id: addressId }],
    } = await db.collection("addresses").insertOne(address);

    // linking address to user
    await db
      .collection("users")
      .updateOne({ _id: userId }, { $set: { address: ObjectID(addressId) } });

    res.status(200).json({
      status: true,
      message: "Address added successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Adding Address", 400));
  }
});

// update address
exports.updateAddress = asyncHandler(async (req, res, next, db) => {
  const address = req.body;
  const userId = ObjectID(req.user["_id"]);

  try {
    // fetching user
    const user = await db
      .collection("users")
      .findOne({ _id: ObjectID(userId) });

    // updating address
    await db
      .collection("addresses")
      .updateOne({ _id: ObjectID(user.address) }, { $set: address });

    res.status(200).json({
      status: true,
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Updating Address", 400));
  }
});

// get address
exports.getAddress = asyncHandler(async (req, res, next, db) => {
  const userId = req.user["_id"];

  try {
    // fetching user
    const user = await db
      .collection("users")
      .findOne({ _id: ObjectID(userId) });

    // checking for address
    if (user.address) {
      // fetching address
      const address = await db
        .collection("addresses")
        .findOne({ _id: ObjectID(user.address) });

      res.status(200).json({
        status: true,
        data: address,
      });
    } else return next(new AppError("Address Not Found", 404));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Address", 400));
  }
});

/* ----------- Orders ----------- */

exports.getOrders = asyncHandler(async (req, res, next, db) => {
  const userId = req.user ? req.user["_id"] : null;

  try {
    // checking for user
    if (!userId) return next(new AppError("User Not Found", 404));

    // fetching orders
    const orders = await db
      .collection("orders")
      .find({ user: ObjectID(userId) })
      .toArray();

    res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Orders", 400));
  }
});
