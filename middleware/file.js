const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const fName = file.originalname,
      index = fName.lastIndexOf(".");
    const name =
      fName.substring(0, index) +
      "_" +
      Math.ceil(Math.random() * 10000) +
      fName.substring(index);
    cb(null, name);
  },
});

const upload = multer({ storage });

const middleware = upload.single("image");

module.exports = middleware;
