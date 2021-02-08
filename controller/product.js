const { ObjectID } = require("mongodb");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

/* ----------- Products ----------- */

// get products with given queries
exports.getProducts = asyncHandler(async (req, res, next, db) => {
  const queryObj = Object.assign({}, req.query),
    filterObj = {},
    sortObj = {};

  // category
  if (queryObj.category) filterObj.category = ObjectID(queryObj.category);

  // sub-category
  if (queryObj["sub-category"])
    filterObj["sub_categories"] = {
      $elemMatch: { value: queryObj["sub-category"] },
    };

  // search
  if (queryObj.keyword) {
    const keywords = queryObj.keyword.toLowerCase().split(" ");
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

  // sort
  if (queryObj.sort) {
    const [field, order] = queryObj.sort;
    sortObj[field] = Number(order);
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
      .sort(sortObj)
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

// get product with given id
exports.getProduct = asyncHandler(async (req, res, next, db) => {
  const productId = ObjectID(req.params.id);

  try {
    const product = await db.collection("products").findOne({ _id: productId });

    res.status(200).json({
      status: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching product", 503));
  }
});

/* ----------- Favourites ----------- */

exports.getFavourites = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);

  try {
    const dbRes = await db
      .collection("favourites")
      .aggregate([
        {
          $match: { user_id: userId },
        },
        {
          $unwind: "$favourites",
        },
        {
          $lookup: {
            from: "products",
            as: "products",
            let: { productId: "$favourites" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
              {
                $project: {
                  name: 1,
                  available_sizes: 1,
                  mrp: 1,
                  sp: 1,
                  discount: 1,
                  "gallery.small.src": 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const favourites = dbRes.map((item) => item.products[0]);

    res.status(200).json({
      status: false,
      data: favourites,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching wishlist", 404));
  }
});

exports.addProductToFavourites = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);
  const { id: productId } = req.params;

  try {
    await db.collection("favourites").updateOne(
      { user_id: userId },
      {
        $addToSet: { favourites: ObjectID(productId) },
      }
    );

    res.status(200).json({
      status: true,
      message: "Product successfully added to wishlist",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding product to wishlist.", 502));
  }
});

exports.removeProductFromFavourites = asyncHandler(
  async (req, res, next, db) => {
    const userId = ObjectID(req.user["_id"]);
    const { id: productId } = req.params;

    try {
      await db.collection("favourites").updateOne(
        { user_id: userId },
        {
          $pull: { favourites: ObjectID(productId) },
        }
      );

      res.status(200).json({
        status: true,
        message: "Product removed from wishlist",
      });
    } catch (error) {
      console.error(error);
      return next(new AppError("Error removing product from wishlist.", 502));
    }
  }
);

exports.clearFavourites = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);

  try {
    await db.collection("favourites").updateOne(
      { user_id: userId },
      {
        $set: { favourites: [] },
      }
    );

    res.status(200).json({
      status: true,
      message: "Wishlist cleared.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error clearing wishlist.", 502));
  }
});

/* ----------- Cart ----------- */

exports.getCart = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);

  try {
    const dbRes = await db
      .collection("carts")
      .aggregate([
        {
          $match: { user_id: userId },
        },
        {
          $unwind: "$carts",
        },
        {
          $lookup: {
            from: "products",
            as: "products",
            let: { productId: "$carts.product_id", qty: "$carts.quantity" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
              {
                $project: {
                  name: 1,
                  available_sizes: 1,
                  mrp: 1,
                  sp: 1,
                  stocks_available: 1,
                  discount: 1,
                  "gallery.small.src": 1,
                },
              },
              {
                $set: {
                  quantity: "$$qty",
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const cart = dbRes.map((item) => item.products[0]);

    res.status(200).json({
      status: false,
      data: cart,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching cart", 404));
  }
});

exports.addProductToCart = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);
  const { productId, quantity } = req.body;

  try {
    const itemObj = {
      product_id: ObjectID(productId),
      quantity: quantity || 1,
    };

    const cart = await db.collection("carts").findOne({ user_id: userId });

    const index = cart.carts.findIndex(
      ({ product_id }) => product_id.toString() === productId
    );

    if (index === -1)
      await db.collection("carts").updateOne(
        { user_id: userId },
        {
          $addToSet: { carts: itemObj },
        }
      );
    else {
      const updateObj = {};
      updateObj[`carts.${index}.quantity`] = quantity || 1;
      await db.collection("carts").updateOne(
        { user_id: userId },
        {
          $set: updateObj,
        }
      );
    }

    res.status(200).json({
      status: true,
      message: "Product successfully added to cart",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding product to cart.", 502));
  }
});

exports.removeProductFromCart = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);
  const { id: productId } = req.params;

  try {
    await db.collection("carts").updateOne(
      { user_id: userId },
      {
        $pull: { carts: { product_id: ObjectID(productId) } },
      }
    );

    res.status(200).json({
      status: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error removing product from cart.", 502));
  }
});

exports.updateCart = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);
  const data = [...req.body];

  try {
    const cart = [];
    for (let item of data)
      cart.push({
        product_id: ObjectID(item["_id"]),
        quantity: (item.quantity && Number(item.quantity)) || 1,
      });

    await db.collection("carts").updateOne(
      { user_id: userId },
      {
        $set: { carts: cart },
      }
    );

    res.status(200).json({
      status: true,
      message: "Cart updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error updating cart.", 502));
  }
});

exports.clearCart = asyncHandler(async (req, res, next, db) => {
  const userId = ObjectID(req.user["_id"]);

  try {
    await db.collection("carts").updateOne(
      { user_id: userId },
      {
        $set: { carts: [] },
      }
    );

    res.status(200).json({
      status: true,
      message: "Cart cleared.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error clearing cart.", 502));
  }
});
