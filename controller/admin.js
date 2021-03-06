const { ObjectID } = require("mongodb");
const uuid = require("uuid");
const asyncHandler = require("express-async-handler");
const { uploadFile, deleteAsset } = require("../utils/s3Utils");
const authUtil = require("../utils/auth");
const AppError = require("../utils/appError");
const sendSMS = require("../utils/sendSMS");
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
    // converting sub-categories id to ObjectID type
    for (let i = 0; i < data.sub_categories.length; i++)
      data.sub_categories[i]["_id"] = ObjectID(data.sub_categories[i]["_id"]);

    // adding name slug
    data.slug_name = slugify(data.name, slugOptions);

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
    const category = await db
      .collection("categories")
      .findOne({ _id: ObjectID(req.params.id) });

    res.status(200).json({
      status: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching category", 500));
  }
});

// get categories
exports.getCategories = asyncHandler(async (req, res, next, db) => {
  try {
    // getting categories
    const categories = await db.collection("categories").find().toArray();

    res.status(200).json({
      status: true,
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching categories", 500));
  }
});

// update category
exports.updateCategory = asyncHandler(async (req, res, next, db) => {
  const data = Object.assign({}, req.body);

  try {
    // converting sub-categories id to ObjectID type
    for (let i = 0; i < data.sub_categories.length; i++)
      data.sub_categories[i]["_id"] = ObjectID(data.sub_categories[i]["_id"]);

    // updating category
    await db
      .collection("categories")
      .updateOne({ _id: ObjectID(req.params.id) }, { $set: data });

    res.status(200).json({
      status: true,
      message: "Category Updated Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error updating category", 500));
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
    return next(new AppError("Error fetching tags", 500));
  }
});

/* ----------- Colours ----------- */

exports.addColour = asyncHandler(async (req, res, next, db) => {
  const { full_name, common_name, hexcode } = req.body;
  const slug_name = slugify(common_name, slugOptions);

  try {
    // fetching colour if present
    const colourDoc = await db.collection("colours").findOne({ hexcode });

    // checking if colour already exists
    if (!colourDoc) {
      // adding colour
      await db.collection("colours").insertOne({
        full_name,
        hexcode,
        common_name,
        slug_name,
      });

      res.status(201).json({
        status: true,
        message: "Colour Added Successfully",
      });
    } else
      return next(new AppError("Colour with that hexcode already exists", 401));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding colour", 500));
  }
});

exports.deleteColour = asyncHandler(async (req, res, next, db) => {
  try {
    // deleting colour
    await db.collection("colours").deleteOne({ _id: ObjectID(req.params.id) });

    res.status(200).json({
      status: true,
      message: "Colour Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error deleting colour", 500));
  }
});

exports.getColours = asyncHandler(async (req, res, next, db) => {
  try {
    // fetching colours
    const colours = await db
      .collection("colours")
      .find()
      .sort({ full_name: 1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: colours,
      message: "Colours Fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching colours.", 500));
  }
});

/* ----------- Materials ----------- */

exports.addMaterial = asyncHandler(async (req, res, next, db) => {
  const { name } = req.body;
  const slug_name = slugify(name, slugOptions);

  try {
    // fetching material if present
    const materialDoc = await db.collection("materials").findOne({ slug_name });

    // checking if material already exists
    if (!materialDoc) {
      // adding material
      await db.collection("materials").insertOne({ name, slug_name });

      res.status(200).json({
        status: true,
        message: "Material Added Successfully",
      });
    } else return next(new AppError("Material already exists", 401));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding material", 500));
  }
});

exports.deleteMaterial = asyncHandler(async (req, res, next, db) => {
  try {
    // deleting colour
    await db
      .collection("materials")
      .deleteOne({ _id: ObjectID(req.params.id) });

    res.status(200).json({
      status: true,
      message: "Material Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error deleting material", 500));
  }
});

exports.getMaterials = asyncHandler(async (req, res, next, db) => {
  try {
    // fetching materials
    const materials = await db
      .collection("materials")
      .find()
      .sort({ full_name: 1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: materials,
      message: "Materials Fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching materials.", 500));
  }
});

/* ----------- Assets ----------- */

exports.uploadImage = asyncHandler(async (req, res, next, db) => {
  try {
    const { mimeType, base64, extension, size } = req.body;
    const fileName = uuid() + extension;

    const resS3 = await uploadFile(mimeType, base64, fileName);
    const { ETag, Key, Location } = resS3;

    await db.collection("images").insertOne({
      name: fileName,
      src: Location,
      details: {
        key: Key,
        size,
        eTag: ETag,
      },
    });

    res.status(200).json({
      status: true,
      message: "Image Uploaded Successfully",
      data: Location,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Uploading File", 503));
  }
});

exports.deleteImage = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;
  try {
    const imgObj = await db.collection("images").findOne({ _id: ObjectID(id) });

    await deleteAsset(imgObj.details.key);

    await db.collection("images").deleteOne({ _id: ObjectID(id) });

    res.status(200).json({
      status: true,
      message: "Image Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Deleting Image", 503));
  }
});

exports.getImages = asyncHandler(async (req, res, next, db) => {
  try {
    const images = await db
      .collection("images")
      .find()
      .sort({ _id: -1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: images,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching images", 404));
  }
});

/* ----------- Collection ----------- */

// add new collection
exports.addCollection = asyncHandler(async (req, res, next, db) => {
  const { name, tagline } = req.body;
  const slug_name = slugify(name, slugOptions);

  try {
    // fetching collection if present
    const collectionDoc = await db
      .collection("collections")
      .findOne({ slug_name });

    // checking if collection already exists
    if (!collectionDoc) {
      // adding collection
      await db
        .collection("collections")
        .insertOne({ name, slug_name, tagline });

      res.status(200).json({
        status: true,
        message: "Collection Added Successfully",
      });
    } else return next(new AppError("Collection already exists", 401));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error adding collection", 500));
  }
});

// edit single collection
exports.updateCollection = asyncHandler(async (req, res, next, db) => {
  const collectionId = ObjectID(req.params.id);

  const { name, tagline } = req.body;
  const slug_name = slugify(name, slugOptions);

  try {
    // fetching collection if present
    const collectionDoc = await db
      .collection("collections")
      .findOne({ slug_name });

    // checking if collection already exists
    if (!collectionDoc || collectionId !== collectionDoc["_id"]) {
      // adding collection
      await db
        .collection("collections")
        .updateOne(
          { _id: collectionId },
          { $set: { name, slug_name, tagline } }
        );

      res.status(200).json({
        status: true,
        message: "Collection Added Successfully",
      });
    } else return next(new AppError("Collection already exists", 401));
  } catch (error) {
    console.error(error);
    return next(new AppError("Error updating collection", 500));
  }
});

// get all collections
exports.getCollections = asyncHandler(async (req, res, next, db) => {
  try {
    // fetching collections
    const collections = await db
      .collection("collections")
      .find()
      .sort({ slug_name: 1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: collections,
      message: "Collections Fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching collections.", 500));
  }
});

// delete collection
exports.deleteCollection = asyncHandler(async (req, res, next, db) => {
  try {
    // deleting collection
    await db
      .collection("collections")
      .deleteOne({ _id: ObjectID(req.params.id) });

    res.status(200).json({
      status: true,
      message: "Collection Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error deleting collection", 500));
  }
});

// get all collection
exports.getCollection = asyncHandler(async (req, res, next, db) => {
  try {
    // fetching collections
    const collections = await db
      .collection("collections")
      .find()
      .sort({ slug_name: 1 })
      .toArray();

    res.status(200).json({
      status: true,
      data: collections,
      message: "Collections Fetched Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching collections.", 500));
  }
});

/* ----------- Product ----------- */

// get all products
exports.getProducts = asyncHandler(async (req, res, next, db) => {
  const filterObj = Object.assign({}, req.query);
  const queryObj = {};
  let skip = 0,
    limit = 20;

  if (filterObj.name)
    queryObj["name"] = {
      $regex: filterObj.name,
      $options: "i",
    };

  if (filterObj.page) {
    const page = Number(filterObj.page);

    skip = parseInt((page - 1) * limit);
  }

  if (filterObj.category) queryObj["category"] = ObjectID(filterObj.category);

  try {
    const products = await db
      .collection("products")
      .aggregate([
        {
          $match: queryObj,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "categories",
            as: "category",
            let: { categoryId: "$category" },
            pipeline: [
              {
                $match: { $expr: { $eq: ["$_id", "$$categoryId"] } },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    res.status(200).json({
      status: true,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching products", 503));
  }
});

// get number of products
exports.getProductNum = asyncHandler(async (req, res, next, db) => {
  const filterObj = Object.assign({}, req.query);
  const queryObj = {};
  limit = 20;

  if (filterObj.name)
    queryObj["name"] = {
      $regex: filterObj.name,
      $options: "i",
    };

  try {
    const productsNum = await db
      .collection("products")
      .countDocuments(queryObj);

    res.status(200).json({
      status: true,
      data: productsNum,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching no. of products", 503));
  }
});

// get product by id
exports.getProduct = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;

  try {
    const product = await db
      .collection("products")
      .findOne({ _id: ObjectID(id) });

    res.status(200).json({
      status: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error fetching product", 503));
  }
});

// add product
exports.addProduct = asyncHandler(async (req, res, next, db) => {
  const data = Object.assign({}, req.body);

  try {
    data.category = ObjectID(data.category);

    if (data.collection) data.collection = ObjectID(data.collection);
    if (data.sub_categories) {
      for (let subcat of data.sub_categories)
        subcat["_id"] = ObjectID(subcat["_id"]);
    }

    // checking for null images

    data.gallery.main = data.gallery.main.filter((val) => !!val);
    data.gallery.small = data.gallery.small.filter((val) => !!val);

    if (process.env.NODE_ENV === "development")
      console.log("Uploading Main Images...");
    for (let i = 0; i < data.gallery.main.length; i++) {
      try {
        const { mimeType, data: base64data, extension } = data.gallery.main[i];
        const fileName = uuid() + extension;

        const res3 = await uploadFile(mimeType, base64data, fileName);
        const { Location, ETag, Key } = res3;

        data.gallery.main[i].src = Location;
        data.gallery.main[i].details = { ETag, Key };

        delete data.gallery.main[i].data;

        if (process.env.NODE_ENV === "development")
          console.log(`Uploaded [${i + 1}/${data.gallery.main.length}]`);
      } catch (error) {
        console.error(error);
        console.log(`Error @ gallery.main[${i}]: ${error.message}.`);
      }
    }

    if (process.env.NODE_ENV === "development")
      console.log("Uploading Thumbnail Images...");

    for (let i = 0; i < data.gallery.small.length; i++) {
      try {
        const { mimeType, data: base64data, extension } = data.gallery.small[i];
        const fileName = uuid() + extension;

        const res3 = await uploadFile(mimeType, base64data, fileName);
        const { Location, ETag, Key } = res3;

        data.gallery.small[i].src = Location;
        data.gallery.small[i].details = { ETag, Key };

        delete data.gallery.small[i].data;

        if (process.env.NODE_ENV === "development")
          console.log(`Uploaded [${i + 1}/${data.gallery.small.length}]`);
      } catch (error) {
        console.error(error);
        console.log(`Error @ gallery.small[${i}]: ${error.message}.`);
      }
    }

    // adding timestamp
    data.date = new Date().toISOString();

    // adding name-slug
    data.slug_name = slugify(data.name, slugOptions);

    // adding block
    data.isBlocked = false;

    await db.collection("products").insertOne(data);

    res.status(200).json({
      status: true,
      message: "Product Added Successfully.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Adding Product", 502));
  }
});

// update product
exports.updateProduct = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;
  const data = Object.assign({}, req.body);

  try {
    data.category = ObjectID(data.category);

    if (data.collection) data.collection = ObjectID(data.collection);
    if (data.sub_categories) {
      for (let subcat of data.sub_categories) {
        subcat["_id"] = ObjectID(subcat["_id"]);
        console.log(subcat["_id"]);
      }
    }

    if (data.colour) data.colour._id = ObjectID(data.colour._id);

    delete data._id;

    // adding name-slug
    data.slug_name = slugify(data.name, slugOptions);

    await db
      .collection("products")
      .updateOne({ _id: ObjectID(id) }, { $set: data });

    res.status(200).json({
      status: true,
      message: "Product Updated Successfully.",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Updating Product", 502));
  }
});

// update product images
exports.updateProductImages = asyncHandler(async (req, res, next, db) => {
  const productId = ObjectID(req.params.id);
  const gallery = Object.assign({}, req.body);

  try {
    const { gallery: oldGallery } = await db
      .collection("products")
      .findOne({ _id: productId });

    // checking for null images

    gallery.main = gallery.main.filter((val) => !!val);
    gallery.small = gallery.small.filter((val) => !!val);

    // initializing sets

    const mainSet = new Set(),
      smallSet = new Set();

    if (process.env.NODE_ENV === "development")
      console.log("Uploading Main Images...");
    for (let i = 0; i < gallery.main.length; i++) {
      try {
        if (gallery.main[i].details)
          mainSet.add(gallery.main[i].details["Key"]);
        else {
          const { mimeType, data: base64data, extension } = gallery.main[i];
          const fileName = uuid() + extension;

          const res3 = await uploadFile(mimeType, base64data, fileName);
          const { Location, ETag, Key } = res3;

          gallery.main[i].src = Location;
          gallery.main[i].details = { ETag, Key };

          delete gallery.main[i].data;
        }
      } catch (error) {
        console.error(error);
        console.log(`Error @ gallery.main[${i}]: ${error.message}.`);
      }
    }

    if (process.env.NODE_ENV === "development")
      console.log("Uploading Thumbnail Images...");

    for (let i = 0; i < gallery.small.length; i++) {
      try {
        if (gallery.small[i].details)
          smallSet.add(gallery.small[i].details["Key"]);
        else {
          const { mimeType, data: base64data, extension } = gallery.small[i];
          const fileName = uuid() + extension;

          const res3 = await uploadFile(mimeType, base64data, fileName);
          const { Location, ETag, Key } = res3;

          gallery.small[i].src = Location;
          gallery.small[i].details = { ETag, Key };

          delete gallery.small[i].data;
        }
      } catch (error) {
        console.error(error);
        console.log(`Error @ gallery.small[${i}]: ${error.message}.`);
      }
    }

    await db
      .collection("products")
      .updateOne({ _id: productId }, { $set: { gallery } });

    res.status(200).json({
      status: true,
      message: "Product Images Updated Successfully.",
    });

    // deleting unrequired assets

    try {
      for (let main_image of oldGallery.main) {
        if (main_image.details && !mainSet.has(main_image.details["Key"])) {
          await deleteAsset(main_image.details["Key"]);
          if (process.env.NODE_ENV === "development")
            console.log(`Deleted: ${main_image.details["Key"]}`);
        }
      }

      for (let small_image of oldGallery.small) {
        if (small_image.details && !smallSet.has(small_image.details["Key"])) {
          await deleteAsset(small_image.details["Key"]);
          if (process.env.NODE_ENV === "development")
            console.log(`Deleted: ${small_image.details["Key"]}`);
        }
      }
    } catch (error) {
      console.error(error);
      console.log(`Error deleting asset`);
    }
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Updating Product Images", 502));
  }
});

// block/unblock product
exports.blockUnblockProduct = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db
      .collection("products")
      .updateOne({ _id: ObjectID(id) }, { $set: { isBlocked: status } });

    res.json({
      status: true,
      message: `Product ${status ? "Unb" : "B"}locked Successfully`,
    });
  } catch (error) {
    console.error(error);
    return next(new Error(`Error ${status ? "Unb" : "B"}locking Product`));
  }
});

// deleting product
exports.deleteProduct = asyncHandler(async (req, res, next, db) => {
  const { id } = req.params;

  try {
    await db.collection("products").deleteOne({ _id: ObjectID(id) });

    res.json({
      status: true,
      message: "Product Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new Error("Error Deleting Product"));
  }
});

/* ----------- Coupon ----------- */

// add coupon
exports.addCoupon = asyncHandler(async (req, res, next, db) => {
  const data = Object.assign({}, req.body);
  data.valid_category.forEach((cat_id) => {
    cat_id = ObjectID(cat_id);
  });
  data.slug_name = slugify(data.name, slugOptions);

  try {
    await db.collection("coupons").insertOne(data);

    res.status(200).json({
      status: true,
      message: "Coupon added successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Adding Coupon", 400));
  }
});

// get coupons
exports.getCoupons = asyncHandler(async (req, res, next, db) => {
  try {
    const coupons = await db.collection("coupons").find().toArray();

    res.status(200).json({
      status: true,
      data: coupons,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Coupon", 400));
  }
});

// edit coupon
exports.updateCoupon = asyncHandler(async (req, res, next, db) => {
  const couponId = ObjectID(req.params.id);
  const data = Object.assign({}, req.body);

  try {
    // typecasting category ids from string to ObjectID
    data.valid_category = data.valid_category.map((id) => ObjectID(id));

    // typecasting user ids from string to ObjectID
    data.users_used = data.users_used.map((id) => ObjectID(id));

    await db.collection("coupons").updateOne({ _id: couponId }, { $set: data });

    res.status(200).json({
      status: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Deleting Coupon", 400));
  }
});

// delete coupon
exports.deleteCoupon = asyncHandler(async (req, res, next, db) => {
  const couponId = ObjectID(req.params.id);

  try {
    await db.collection("coupons").deleteOne({ _id: couponId });

    res.status(200).json({
      status: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Deleting Coupon", 400));
  }
});

/* ----------- Order ----------- */

// get orders
exports.getOrders = asyncHandler(async (req, res, next, db) => {
  try {
    const orders = await db
      .collection("orders")
      .find()
      .sort({ time: -1 })
      .project({
        userDetails: 0,
        totalMP: 0,
        paymentDetails: 0,
        user: 0,
      })
      .toArray();

    res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Fetching Orders", 400));
  }
});

// update order status
exports.updateOrderStatus = asyncHandler(async (req, res, next, db) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await db
      .collection("orders")
      .updateOne({ _id: ObjectID(id) }, { $set: { status } });

    res.status(200).json({
      status: true,
      message: "Status Updated Successfully",
    });

    switch (status) {
      case "rejected":
        await db.collection("orders").deleteOne({ _id: ObjectID(id) });
        break;
      case "confirmed":
        try {
          const order = await db
            .collection("orders")
            .findOne({ _id: ObjectID(id) });
          const items = order.items.map(({ name, quantity: qty, size }) => ({
            name,
            qty,
            size,
          }));
          let user_contact = order.userDetails.phone;
          user_contact = user_contact.startsWith("+91")
            ? user_contact
            : "+91" + user_contact;
          const price = order.totalSP;

          await sendSMS.orderConfirmedUser(user_contact, items, price, id);
        } catch (error) {
          console.error(error);
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);
    return next(new AppError("Error Updating Status", 400));
  }
});
