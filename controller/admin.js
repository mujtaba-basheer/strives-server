const { ObjectID } = require("mongodb");
const asyncHandler = require("express-async-handler");
const authUtil = require("../utils/auth");
const AppError = require("../utils/appError");
const slugify = require("slugify");
const slugOptions = {
    replacement: "-",
    lower: true,
};

// admin login
exports.login = asyncHandler(async (req, res, next, db) => {
    // fetching user with given email
    let user = await db.collection("admin").findOne({ email: req.body.email });

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

/* *********** CRUD OPERATIONS *********** */

/* ----------- Category ----------- */

exports.addCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // inserting category
        await db.collection("categories").insertOne(req.body);

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.getCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // getting category
        await db
            .collection("categories")
            .findOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.getCategories = asyncHandler(async (req, res, next, db) => {
    try {
        // getting categories
        const categories = await db.collection("categories").find().toArray();

        res.status(200).json({
            status: true,
            data: categories,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.updateCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // updating category
        await db
            .collection("categories")
            .updateOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.deleteCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // deleting category
        await db
            .collection("categories")
            .deleteOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

/* ----------- Sub-Category ----------- */

exports.addCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // inserting category
        await db.collection("categories").insertOne(req.body);

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.getCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // getting category
        await db
            .collection("categories")
            .findOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.getCategories = asyncHandler(async (req, res, next, db) => {
    try {
        // getting categories
        const categories = await db.collection("categories").find().toArray();

        res.status(200).json({
            status: true,
            data: categories,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.updateCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // updating category
        await db
            .collection("categories")
            .updateOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

exports.deleteCategory = asyncHandler(async (req, res, next, db) => {
    try {
        // deleting category
        await db
            .collection("categories")
            .deleteOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Category Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding category", 500));
    }
});

/* ----------- Tags ----------- */

exports.addTag = asyncHandler(async (req, res, next, db) => {
    const { tag } = req.body;

    try {
        // adding tag
        await db.collection("tags").insertOne({
            // storing sluggified form of entered tag
            name: slugify(tag, slugOptions),
        });

        res.status(201).json({
            status: true,
            message: "Tag Added Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error adding tag", 500));
    }
});

exports.deleteTag = asyncHandler(async (req, res, next, db) => {
    try {
        // deleting tag
        await db.collection("tags").deleteOne({ _id: ObjectID(req.params.id) });

        res.status(200).json({
            status: true,
            message: "Tag Deleted Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error deleting tag", 500));
    }
});

exports.getTags = asyncHandler(async (req, res, next, db) => {
    try {
        // fetching tags
        const tags = await db
            .collection("tags")
            .find()
            .sort({ name: 1 })
            .toArray();

        res.status(200).json({
            status: true,
            data: tags,
            message: "Tags Fetched Successfully",
        });
    } catch (error) {
        console.error(error);
        return next(new AppError("Error fetchings tag", 500));
    }
});
