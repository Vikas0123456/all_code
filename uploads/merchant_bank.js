const multer = require('multer');
const path = require('path');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "document") {
      cb(null, 'public/files');
    } else {
      cb(null, 'public/files');
    }
  },
  filename: (req, file, cb) => {
    let filename = file.fieldname + "-" + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    if (filename) {
      req.body.document = filename
    } else {
      req.body.document = ''
    }

    cb(null, filename);

  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "document") {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' || file.mimetype === 'application/pdf'
    ) {

      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};

let upload = multer({ storage: fileStorage, limits: { fileSize: '5mb' }, fileFilter: fileFilter }).fields([
  {
    name: 'document',
    maxCount: 1
  }
]
)

module.exports = upload