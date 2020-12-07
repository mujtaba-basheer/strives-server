const authUtil = require("../utils/auth");
const asyncHandler = require("express-async-handler");
const { ObjectID } = require("mongodb");

const protect = asyncHandler(async (req, res, next, db) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = authUtil.verifyToken(token);

            req.user = await db.findOne({ _id: ObjectID(decoded.id) });

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not Authorized, Token Failed.");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not Authorized, No Token.");
    }
});

module.exports = { protect };
