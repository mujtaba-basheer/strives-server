const { ObjectID } = require("mongodb");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const uploadFile = require("../utils/uploadFile");
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

// add category
exports.addCategory = asyncHandler(async (req, res, next, db) => {
  const data = Object.assign({}, req.body);

  try {
    // inserting category
    await db.collection("categories").insertOne(data);

    res.status(200).json({
      status: true,
      message: "Category Added Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding category", 500));
  }
});

// get category by id
exports.getCategory = asyncHandler(async (req, res, next, db) => {
  try {
    // getting category
    await db.collection("categories").findOne({ _id: ObjectID(req.params.id) });

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

// add sub-category
exports.addSubCategory = asyncHandler(async (req, res, next, db) => {
  const data = req.body;
  data.slug_name = slugify(data.name, slugOptions);

  try {
    // inserting sub-category
    await db.collection("sub-categories").insertOne(data);

    res.status(200).json({
      status: true,
      message: "Sub-Category Added Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding sub-category", 500));
  }
});

// get sub-category by id
exports.getSubCategory = asyncHandler(async (req, res, next, db) => {
  try {
    // getting sub-category
    const sub_category = await db
      .collection("sub-categories")
      .findOne({ _id: ObjectID(req.params.id) });

    res.status(200).json({
      status: true,
      data: sub_category,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding sub-category", 500));
  }
});

// get sub-categories
exports.getSubCategories = asyncHandler(async (req, res, next, db) => {
  try {
    // getting sub-categories
    const sub_categories = await db
      .collection("sub-categories")
      .find()
      .sort({ slug_name: 1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: sub_categories,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching sub-categories", 500));
  }
});

// update sub-category
exports.updateSubCategory = asyncHandler(async (req, res, next, db) => {
  const data = req.body;
  const { id } = req.params;

  data["slug_name"] = slugify(data.name, slugOptions);

  try {
    // updating sub-category
    await db.collection("sub-categories").updateOne(
      { _id: ObjectID(id) },
      {
        $set: data,
      }
    );

    res.status(200).json({
      status: true,
      message: "Sub-Category Updated Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error updating sub-category", 500));
  }
});

// delete sub-category by ID
exports.deleteSubCategory = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;

  try {
    // deleting sub-category
    await db.collection("sub-categories").deleteOne({ _id: ObjectID(id) });

    res.status(200).json({
      status: true,
      message: "Sub-Category Deleting Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error deleting sub-category", 500));
  }
});

/* ----------- Tags ----------- */

exports.addTag = asyncHandler(async (req, res, next, db) => {
  const { tag } = req.body;
  const name = slugify(tag, slugOptions);

  try {
    // fetching tag if present
    const tagDoc = await db.collection("tags").findOne({ name });

    // checking if tag already exists
    if (!tagDoc) {
      // adding tag
      await db.collection("tags").insertOne({
        // storing sluggified form of entered tag
        name: slugify(tag, slugOptions),
      });

      res.status(201).json({
        status: true,
        message: "Tag Added Successfully",
      });
    } else return next(new AppError("Tag with that name already exists", 401));
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
    const tags = await db.collection("tags").find().sort({ name: 1 }).toArray();

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

/* ----------- Product ----------- */

exports.uploadImage = asyncHandler(async (req, res, next, db) => {
  try {
    const { mimetype, path, originalname } = req.file;
    console.log(mimetype);
    const extension = originalname.substring(originalname.lastIndexOf("."));
    const data = fs.readFileSync(path);
    fs.unlinkSync(path);

    const resS3 = await uploadFile(mimetype, data, `generic${extension}`);
    console.log(resS3);
    res.send(true);
  } catch (error) {
    console.error(error);
    return next(new AppError("Error", 503));
  }
});
