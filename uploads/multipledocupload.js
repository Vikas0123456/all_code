const multer = require('multer');
const path = require('path');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/files');
  },
  filename: (req, file, cb) => {
    let filename = file.fieldname + "-" + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    req.body[file.fieldname] = filename
    if (req.all_files) {
      req.all_files[file.fieldname] = filename
     
    } else {
      req.all_files = {}
      req.all_files[file.fieldname] = filename
    }
    cb(null, filename);

  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "document_1" ||
    file.fieldname === "document_2" ||
    file.fieldname === "document_3" ||
    file.fieldname === "document_4" ||
    file.fieldname === "document_5" || 
    file.fieldname === 'document_6' ||
    file.fieldname === "document_7" ||
    file.fieldname === "document_8"
  ) {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'application/pdf'
    ) {

      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  } else { // else uploading image
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};

let upload = multer({ storage: fileStorage, limits: { fileSize: '1mb' }, fileFilter: fileFilter }).fields([
  {
    name: 'document_1',
    maxCount: 1
  },
  {
    name: 'document_2',
    maxCount: 1
  },
  {
    name: 'document_3',
    maxCount: 1
  },
  {
    name: 'document_4',
    maxCount: 1
  },
  {
    name: 'document_5',
    maxCount: 1
  },
  {
    name: 'document_6',
    maxCount: 1
  },
  {
    name: 'document_7',
    maxCount: 1
  },
  {
    name: 'document_8',
    maxCount: 1
  }
]
)

module.exports = upload