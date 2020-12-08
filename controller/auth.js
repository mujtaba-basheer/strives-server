const asyncHandler = require("express-async-handler");
const authUtil = require("../utils/auth");
const AppError = require("../utils/appError");

// register a new user
exports.signup = asyncHandler(async (req, res, next, db) => {
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
    } else return next(new AppError("User already exists.", 400));
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
        } else return next(new AppError("Incorrect Password.", 401));
    } else return next(new AppError("User not found.", 404));
});

// reset password
exports.resetPass = asyncHandler(async (req, res, next, db) => {
    try {
        // updating user details
        await db.collection("users").updateOne(
            { email: req.user.email },
            {
                // storing hashed password to user object
                $set: { password: authUtil.hashPassword(req.body.password) },
            }
        );

        res.status(200).json({
            status: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error updating password", 500));
    }
});
