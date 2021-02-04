const { ObjectID } = require("mongodb");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// get products with given queries
exports.getProducts = asyncHandler(async (req, res, next, db) => {
  const queryObj = Object.assign({}, req.query),
    filterObj = {};

  // category
  if (queryObj.category) filterObj.category = ObjectID(queryObj.category);

  // sub-category
  if (queryObj["sub-category"])
    filterObj["sub_categories"] = {
      $elemMatch: { value: queryObj["sub-category"] },
    };

  // search
  if (queryObj.keyword) {
    const keywords = queryObj.keyword.split(" ");
    filterObj["tags"] = { $all: keywords };
  }

  // material
  if (queryObj.material) filterObj.material = queryObj.material;

  // min-price
  if (queryObj.min) filterObj.sp = { $gte: Number(queryObj.min) };

  // max-price
  if (queryObj.max) {
    if (filterObj.sp) filterObj.sp["$lte"] = Number(queryObj.max);
    else filterObj.sp = { $lte: Number(queryObj.max) };
  }

  try {
    const products = await db
      .collection("products")
      .find(filterObj)
      .project({
        isBlocked: 0,
        date: 0,
        "gallery.main.name": 0,
        "gallery.main.extension": 0,
        "gallery.main.type": 0,
        "gallery.main.details": 0,
        "gallery.small.name": 0,
        "gallery.small.extension": 0,
        "gallery.small.type": 0,
        "gallery.small.details": 0,
      })
      .toArray();

    res.status(200).json({
      status: true,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error", 503));
  }
});
