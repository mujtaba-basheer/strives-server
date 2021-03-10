const authUtil = require("../utils/auth");
const asyncHandler = require("express-async-handler");
const { ObjectID } = require("mongodb");
const AppError = require("../utils/appError");

// get user by _id
const getUser = (id, db) =>
  db.collection("users").findOne({ _id: ObjectID(id) });

// protect routes middleware
const protect = asyncHandler(async (req, res, next, db) => {
  let token;

  // check for authorisation bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // extracting token from headers
      token = req.headers.authorization.split(" ")[1];

      // verifying token
      const decoded = authUtil.verifyToken(token);

      // attaching user object to request object
      req.user = await getUser(decoded.user._id, db);

      next();
    } catch (error) {
      console.error(error);
      if (error.name === "TokenExpiredError")
        return next(new AppError("Session Expired", 401));
      return next(new AppError("Not Authorized, Token Failed.", 403));
    }
  }

  if (!token) return next(new AppError("Not Authorized, Token Failed.", 403));
});

// check user middleware
const checkUser = asyncHandler(async (req, res, next, db) => {
  let token;

  // check for authorisation bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // extracting token from headers
      token = req.headers.authorization.split(" ")[1];

      // verifying token
      const decoded = authUtil.verifyToken(token);

      // attaching user object to request object
      req.user = await getUser(decoded.user._id, db);

      next();
    } catch (error) {
      console.error(error);
      if (error.name === "TokenExpiredError")
        return next(new AppError("Session Expired", 401));
      return next(new AppError("Not Authorized, Token Failed.", 403));
    }
  }

  if (!token) {
    req.user = "";
    next();
  }
});

// admin check middleware
const checkAdmin = asyncHandler(async (req, res, next, db) => {
  let token;

  // check for authorisation bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // extracting token from headers
      token = req.headers.authorization.split(" ")[1];

      // verifying token
      const decoded = authUtil.verifyToken(token);

      // attaching admin object to request object
      req.user = await db
        .collection("admin")
        .findOne({ _id: ObjectID(decoded.user._id) });

      next();
    } catch (error) {
      console.error(error);
      return next(new AppError("Not Authorized, Token Failed.", 401));
    }
  }

  if (!token) return next(new AppError("Not Authorized, Token Failed.", 401));
});

module.exports = { protect, checkAdmin, checkUser };
