const authUtil = require("../utils/auth");
const appError = require("../utils/appError");
const AppError = require("../utils/appError");

exports.signup = async (req, res, next, db) => {
    // checking if user with given email already exists

    let user = await db.collection("users").findOne({ email: req.body.email });

    if (!user) {
        // hashing the password
        req.body.password = authUtil.hashPassword(req.body.password);

        // adding user data to db
        user = (await db.collection("users").insertOne(req.body))["ops"][0];

        res.status(200).json({
            status: true,
            data: user,
            token: authUtil.generateToken(user),
        });
    } else {
        return next(new AppError("User already exists.", 400));
    }
};
