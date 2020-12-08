const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
require("colors");

// importing error middleware
const { notFound, errorHandler } = require("./middleware/error");

// importing the routes
const routes = require("./routes");

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
    res.send("API is running");
});

// custom error handlers

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5001;
app.listen(
    port,
    console.log(
        `Server running in ${process.env.NODE_ENV} on port ${port}... 📡`.yellow
            .bold
    )
);
