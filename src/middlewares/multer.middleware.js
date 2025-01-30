import multer from 'multer';

//cb means callback  

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") //null, means i don't want to handle the error
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
      //cb(null, file.originalname) //original name of file
      //there are many feild in file object, like mimetype, size, originalname, etc
    }
  })
  
  export const upload = multer({ storage: storage })