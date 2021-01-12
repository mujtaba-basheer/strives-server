const { ObjectID } = require("mongodb");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// get user details
exports.get = asyncHandler(async (req, res, next, db) => {
    try {
        // fetching user details
        const user = await db
            .collection("users")
            .findOne({ _id: ObjectID(req.user["_id"]) });

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
