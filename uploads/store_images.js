const multer = require('multer');
const path = require('path');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") { 
      cb(null, 'public/store-qr-images');
    } else { 
      cb(null, 'public/store-qr-images');
    }
  },
  filename: (req, file, cb) => { 
    let filename = file?.originalname;
   ;
    if(req.all_files){
      req.all_files[file.fieldname] = filename
      req.all_files['original_name'] = file.originalname
    }else{
      req.all_files = {}
      req.all_files[file.fieldname] = filename
      req.all_files['original_name'] = file.originalname
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
      file.mimetype === 'image/jpeg'
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};

let upload = multer({storage: fileStorage, limits:{fileSize:'1mb'}, fileFilter: fileFilter}).fields([
    { 
      name: 'image', 
      maxCount: 1 
    }
  ]
)

module.exports = upload