const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
dotenv.config();
require("colors");

// importing error middlewares
const { notFound, errorHandler } = require("./middleware/error");

// importing the routes
const routes = require("./routes");
const adminRoutes = require("./adminRoutes");

// logging api requests in development environment
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// adding cors for allowing API calls
app.use(cors());

// using express.json() middleware for parsing json in req body
app.use(express.json());

// implementing routes handler
app.use("/api", routes);
app.use("/admin/api", adminRoutes);

// test endpoint
app.get("/", (req, res) => {
    res.send("API is running\n");
});

// custom error handlers
app.use(notFound);
app.use(errorHandler);

// spinning up the server
const port = process.env.PORT || 5001;
const server = app.listen(
    port,
    console.log(
        `Server running in ${process.env.NODE_ENV} on port ${port}... 📡`.yellow
            .bold
    )
);

process.listeners((ev) => ev);

// handling process kill
process.on("SIGINT", () => {
    console.info("\nSIGINT signal received.".black.inverse);
    console.log("Closing http server...".red.bold);
    server.close(() => {
        console.log("Http server closed.".red);
        console.log("EXITING".red.inverse.bold);
        process.exit(0);
    });
});
