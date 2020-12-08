const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
dotenv.config();
require("colors");

// importing error middleware
const { notFound, errorHandler } = require("./middleware/error");

// importing the routes
const routes = require("./routes");

const app = express();

// logging api requests in development environment
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// using express.json() middleware for parsing json in req body
app.use(express.json());

// implementing routes handler
app.use("/api", routes);

// test endpoint
app.get("/", (req, res) => {
    res.send("API is running");
});

// custom error handlers
app.use(notFound);
app.use(errorHandler);

// spinning up the server
const port = process.env.PORT || 5001;
app.listen(
    port,
    console.log(
        `Server running in ${process.env.NODE_ENV} on port ${port}... 📡`.yellow
            .bold
    )
);
