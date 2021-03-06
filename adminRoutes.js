const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const sendSMS = require("./utils/sendSMS");
const sendEmail = require("./utils/sendEmail");
require("dotenv").config();
require("colors");

// importing controllers
const adminController = require("./controller/admin");

// importing middleware
const { protect, checkAdmin } = require("./middleware/auth");
const fileMiddleware = require("./middleware/file");

// getting db uri
const db_uri = process.env.DB_URI.replace(
  "<password>",
  process.env.DB_PASSWORD
);

// connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// connecting to database
MongoClient.connect(db_uri, options, (err, client) => {
  if (err) {
    console.log(`${err.message}`.red);
    console.error(err);
  } else {
    console.log(`Connected to database. 🔛`.blue.bold);
    const db = client.db(process.env.DB_NAME);

    /* *********** SETTING UP ROUTES *********** */

    /* ----------- Auth Routes ----------- */

    //login
    router.post("/login", (req, res, next) =>
      adminController.login(req, res, next, db)
    );

    /* ----------- Category Routes ----------- */

    // add category
    router.post(
      "/category",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addCategory(req, res, next, db)
    );
    // get categories
    router.get(
      "/categories",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getCategories(req, res, next, db)
    );
    // get category by id
    router.get(
      "/category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getCategory(req, res, next, db)
    );
    // delete category
    router.delete(
      "/category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteCategory(req, res, next, db)
    );
    // update category
    router.put(
      "/category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateCategory(req, res, next, db)
    );

    /* ----------- Tags Routes ----------- */

    // add tag
    router.post(
      "/tag",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addTag(req, res, next, db)
    );
    // get tags
    router.get(
      "/tags",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getTags(req, res, next, db)
    );
    // delete tag
    router.delete(
      "/tag/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteTag(req, res, next, db)
    );

    /* ----------- Materials Routes ----------- */

    // add material
    router.post(
      "/material",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addMaterial(req, res, next, db)
    );
    // get materials
    router.get(
      "/materials",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getMaterials(req, res, next, db)
    );
    // delete material
    router.delete(
      "/material/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteMaterial(req, res, next, db)
    );

    /* ----------- Colours Routes ----------- */

    // add colour
    router.post(
      "/colour",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addColour(req, res, next, db)
    );
    // get colours
    router.get(
      "/colours",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getColours(req, res, next, db)
    );
    // delete colour
    router.delete(
      "/colour/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteColour(req, res, next, db)
    );

    /* ----------- Collections ----------- */

    // add collection
    router.post(
      "/collection",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addCollection(req, res, next, db)
    );
    // update collection
    router.put(
      "/collection/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateCollection(req, res, next, db)
    );
    // get collections
    router.get(
      "/collections",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getCollections(req, res, next, db)
    );
    // get collection
    router.get(
      "/collection/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getCollection(req, res, next, db)
    );
    // delete collection
    router.delete(
      "/collection/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteCollection(req, res, next, db)
    );

    /* ----------- Sub-Category Routes ----------- */

    // add sub-category
    router.post(
      "/sub-category",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addSubCategory(req, res, next, db)
    );
    // get sub-categories
    router.get(
      "/sub-categories",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getSubCategories(req, res, next, db)
    );
    // get sub-category
    router.get(
      "/sub-category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getSubCategory(req, res, next, db)
    );
    // delete sub-category
    router.delete(
      "/sub-category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteSubCategory(req, res, next, db)
    );
    // update sub-category
    router.put(
      "/sub-category/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateSubCategory(req, res, next, db)
    );

    /* ----------- Assets Routes ----------- */

    router.post(
      "/image",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.uploadImage(req, res, next, db)
    );
    router.get(
      "/images",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getImages(req, res, next, db)
    );
    router.delete(
      "/image/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteImage(req, res, next, db)
    );

    /* ----------- Product Routes ----------- */

    router.post(
      "/product",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addProduct(req, res, next, db)
    );
    router.get(
      "/product/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getProduct(req, res, next, db)
    );
    router.put(
      "/product/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateProduct(req, res, next, db)
    );
    router.put(
      "/product-images/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) =>
        adminController.updateProductImages(req, res, next, db)
    );
    router.get(
      "/products",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getProducts(req, res, next, db)
    );
    router.get(
      "/products-num",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getProductNum(req, res, next, db)
    );
    router.put(
      "/product/status/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) =>
        adminController.blockUnblockProduct(req, res, next, db)
    );
    router.delete(
      "/product/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteProduct(req, res, next, db)
    );

    /* ----------- Coupon ----------- */

    router.post(
      "/coupon",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.addCoupon(req, res, next, db)
    );
    router.get(
      "/coupons",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getCoupons(req, res, next, db)
    );
    router.put(
      "/coupon/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateCoupon(req, res, next, db)
    );
    router.delete(
      "/coupon/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.deleteCoupon(req, res, next, db)
    );

    /* ----------- Order Routes ----------- */

    router.get(
      "/orders",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.getOrders(req, res, next, db)
    );
    router.put(
      "/order/status/:id",
      (req, res, next) => checkAdmin(req, res, next, db),
      (req, res, next) => adminController.updateOrderStatus(req, res, next, db)
    );

    /* ----------- Test Routes ----------- */

    router.get("/test/sms", async (req, res) => {
      try {
        const resp = await sendSMS.sendTestSMS();
        res.json({
          status: true,
          message: resp,
        });
      } catch (error) {
        res.status(501).json({
          status: false,
          message: "Error :-/",
        });
      }
    });
    router.get("/test/mail", async (req, res) => {
      try {
        const resp = await sendEmail.sendTestMail();
        res.json({
          status: true,
          message: resp,
        });
      } catch (error) {
        res.status(501).json({
          status: false,
          message: "Error :-/",
        });
      }
    });
  }
});

module.exports = router;
