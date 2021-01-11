const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
require("dotenv").config();
require("colors");

// importing controllers
const adminController = require("./controller/admin");

// importing middleware
const { protect, checkAdmin } = require("./middleware/auth");

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

        /* ----------- Tags Routes ----------- */

        // add tag
        router.post(
            "/tag",
            (req, res, next) => checkAdmin(req, res, next, db),
            (req, res, next) => adminController.addTag(req, res, next, db)
        );
        // get tags
        router.get(
            "/tag",
            (req, res, next) => checkAdmin(req, res, next, db),
            (req, res, next) => adminController.getTags(req, res, next, db)
        );
        // delete tag
        router.delete(
            "/tag/:id",
            (req, res, next) => checkAdmin(req, res, next, db),
            (req, res, next) => adminController.deleteTag(req, res, next, db)
        );
    }
});

module.exports = router;