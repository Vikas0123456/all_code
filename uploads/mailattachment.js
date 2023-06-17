const multer = require('multer');
const path = require('path');
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") { 
      cb(null, 'public/Ekyc/video/');
    } else { 
      cb(null, 'public/Ekyc/video/');
    }
  },
  filename: (req, file, cb) => { 
    let filename = file.fieldname+"-"+Date.now() + '-' + Math.round(Math.random() * 1E9)+path.extname(file.originalname);
    if(req.all_files){
      req.all_files[file.fieldname] = filename
    }else{
      req.all_files = {}
      req.all_files[file.fieldname] = filename
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
      file.mimetype === 'image/jpeg'||
      file.mimetype === 'video/webm'
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};

let kycupload = multer({storage: fileStorage, limits:{fileSize:'1mb'}, fileFilter: fileFilter}).fields([
    { 
      name: 'video_kyc', 
      maxCount: 1 
    },
  ]
)

module.exports = kycupload