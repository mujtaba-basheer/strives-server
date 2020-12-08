const authUtil = require("../utils/auth");
const asyncHandler = require("express-async-handler");
const { ObjectID } = require("mongodb");
const AppError = require("../utils/appError");

const protect = asyncHandler(async (req, res, next, db) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = authUtil.verifyToken(token);

            req.user = await db
                .collection("users")
                .findOne({ _id: ObjectID(decoded._id) });

            next();
        } catch (error) {
            console.error(error);
            return next(new AppError("Not Authorized, Token Failed.", 401));
        }
    }

    if (!token) return next(new AppError("Not Authorized, Token Failed.", 401));
});

module.exports = { protect };
