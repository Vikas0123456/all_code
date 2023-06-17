const multer = require('multer');
const path = require('path');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/files');
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
  
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' || file.mimetype==="application/pdf"
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
      console.log(`in true`)
    } else {
     
      cb(null, false); // else fails
    }
  
};

let upload = multer({storage: fileStorage, limits:{fileSize:1024*1024*5}, fileFilter: fileFilter}).fields([
    { 
      name: 'emirates_id', 
      maxCount: 1,
    }, 
    {
      name:'passport',
      maxCount:1,
    },
    {
      name:'visa',
      maxCount:1,
    },
    {
      name:'trade_license',
      maxCount:1,
    },
    {
      name:'passport_of_ubo',
      maxCount:1,
    },
    {
      name:'moa',
      maxCount:1,
    }

 
  ]
)

module.exports = upload