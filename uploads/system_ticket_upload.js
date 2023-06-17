const multer = require('multer');
const path = require('path');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") {
      cb(null, 'public/files');
    } else {
      cb(null, 'public/files');
    }
  },
  filename: (req, file, cb) => {
    let filename = file.fieldname + "-" + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    if (filename) {
      req.body.attachment = filename
    } else {
      req.body.attachment = ''
    }

    cb(null, filename);

  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "file") {
    if (
      file.mimetype === 'application/json') {

      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  } else { // else uploading image
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' || file.mimetype === 'application/pdf'
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};

let upload = multer({ storage: fileStorage, limits: { fileSize: '5mb' }, fileFilter: fileFilter }).fields([
  {
    name: 'attachment',
    maxCount: 1
  }
]
)

module.exports = upload