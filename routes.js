const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
require("dotenv").config();
require("colors");

// importing controllers

const authController = require("./controller/auth");

// getting db uri
const db_uri = process.env.DB_URI.replace(
    "<password>",
    process.env.DB_PASSWORD
);

// setting connection options
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
        console.log(`Connected to database. 🔛`.blue);
        const db = client.db(process.env.DB_NAME);

        // setting up routes

        // USER routes
        router.post("/register", (req, res, next) =>
            authController.signup(req, res, next, db)
        );
    }
});

module.exports = router;
