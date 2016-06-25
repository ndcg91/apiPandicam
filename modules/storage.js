/**
 * Created by carcasen on 22/02/2016.
 */

var multer = require('multer');

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, '/app/pandicam/uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();

        cb(null,file.originalname);
        console.log(file);
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');
