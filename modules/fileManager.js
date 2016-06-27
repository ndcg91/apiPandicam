var exports   = module.exports
var fs 			  = require('fs');
var gm 			  = require('gm');
var archiver 	= require('archiver');

var User 		  = require('./database/user.js');
var Group 	  = require('./database/groups.js');
var apnManager= require('./apn.js');


exports.uploadLimiter = function(req,file,cb){
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
  var limit = req.group.groupMaxSize;
  var actual = req.group.groupCurrentSize;
  var remaining = (limit - actual);
  var fileSize = req.headers.content-length;

  req.group.groupCurrentSize = actual + fileSize;
  if (req.group.groupCurrentSize < req.group.groupMaxSize){

    group.save(function(err,group){
      if (err)  cb(null, false);
      else {
        cb(null, true)
      }
    });

  }
  else{
    cb(null, false);
  }
  console.log(remaining);
  console.log(fileSize);
  // To reject this file pass `false`, like so:


  // To accept the file pass `true`, like so:
}


exports.upload = function(req,res){
  var group = req.group;
  var user = req.user;

  var dir = '/app/pandicam/uploads/'+group._id;
  if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
  }
  var dirFile = dir + '/files'
  if (!fs.existsSync(dirFile)){
    fs.mkdirSync(dirFile);
  }
  var dirImage = dir + '/images'
  if (!fs.existsSync(dirImage)){
    fs.mkdirSync(dirImage);
  }
  //MOVE FILE TO DESTINATION

  //image case
  if (req.body.image != null || req.body.image != undefined){
    fs.rename(req.file.path,dirImage + '/' + req.file.filename,function(err){
      gm(dirImage + '/' + req.file.filename).autoOrient().write(dirImage + '/' + req.file.filename,function(err){console.log(err);});
      var pic = {picid:req.body.image, path:'/web/uploads/'+group._id + '/images/' + req.file.filename, timeStamp:new Date()};
      User.findOne({token:req.token},function(err,user){
        if (err){
          //cleanup
          fs.exists(dirImage + '/' + req.file.filename, function(exists) {
            if(exists) {
              fs.unlink(dirImage + '/' + req.file.filename);
            }
          });
          res.send(403);
        }
        else{
          addPic(user,group,pic,res);
        }
      });
    })
  }

  //file case
  else{
    fs.rename(req.file.path,dirFile + '/' + req.file.filename,function(err){
      console.log(" file moved ");
      ////check if its a file or a image an proceed accordly.
      if (err){
        //cleanup
        fs.exists(dirImage + '/' + req.file.filename, function(exists) {
          if(exists) {
            fs.unlink(dirImage + '/' + req.file.filename);
          }
        });
        fs.exists(req.file.path, function(exists) {
          if(exists) {
                  fs.unlink(req.file.path);
          }
        });
        res.send(403)
      }
      file = {"filename":req.file.filename,"fileOriginalName":req.file.originalname,"path":dirFile + '/' + req.file.filename,"datetime":Date.now()};
      if (group.files == null){
        group.files = [];
      }
      group.files.push(file);
      group.save(function(err,newGroup){
        if (err){
          //cleanup
          fs.exists(dirFile + '/' + req.file.filename, function(exists) {
            if(exists) {
              fs.unlink(dirFile + '/' + req.file.filename);
            }
          });
          res.send(404)
        }
        else{
          io.sockets.in(newGroup._id.toString()).emit('file_created', { file: file });
          res.send({message:"file uploaded",path:req.file.path});
        }
      });
    });
  }
};


exports.addUserPic = function(req,res){
  user.img = '/web' + req.file.path.substring(13);
  user.save(function(err,savedUser){
    res.send({pic:savedUser.img});
  });
}

function addPic(user,group,pic,res){
  group.update({$addToSet: {images:pic}},function(err){
    if (err){
      //cleaning
      fs.exists('/app/pandicam/' + pic.path, function(exists) {
        if(exists) {
          fs.unlink('/app/pandicam/' + pic.path);
        }
      });
      res.send(err);
      return
    }
    console.log("image updated");
    res.send({message:"updated", results:group});
    io.sockets.in(group._id.toString()).emit('new_pic', { pic: pic });
    var users = group.users;
    users.forEach(function(user){
      User.findOne({username:user.username},function(err,finalUser){
        if (!err) apnManager.sendPushNotification(finalUser.deviceId,true,pic,group.images.count,group.groupName);
      });
    });
    if (user.free){
      setTimeout(function(){
        removePic(group,pic);
      },14400000);
    }
    else{
      setTimeout(function(){
        removePic(group,pic);
      },604800000);
    }
  });
}




function removePic(group,pic){
	console.log("tratando de eliminar la imagen",pic);
	Group.update(
		{token:group.token},
		{$pull: {images: {picid:pic.picid}}},
		function(err){
			if (!err){
				console.log("pic removed");
				var path = pic.path.replace("/web", "/app/pandicam");
        			fs.exists(path, function(exists) {
                			if(exists) {
                        			fs.unlink(path);
          	      			}
        			});
			}
		});
}

exports.removeFile = function (group,file){
	fs.exists(file.path, function(exists) {
    if(exists) {
    	fs.unlink(file.path);
    }
  });
	console.log("tratando de eliminar fichero");
	console.log(file);
	group.update({$pull: {files :{filename:file.filename} } },function(err){
		if (err) console.log(err);
	});
}

exports.groupPics = function(group,res){
  var working_directory = '/app/pandicam/uploads/'+group._id.toString()+'/images';
  var dir = working_directory + '/tmp_copy';
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  zipImg(group.images,res);
}

function zipImg(pics,res) {
	console.log("zip creation started");
	var archiver =  require('archiver');
	var zipArchive = archiver('zip');

	zipArchive.pipe(res)
	pics.forEach(function(i){
		var path=i.path.replace('/web','/app/pandicam');
		zipArchive.file(path,{name:i.picid + '.jpeg'});
	})
	zipArchive.finalize();
}


exports.cleanGroupFolder = function(groupID){
  var path = '/app/pandicam/uploads/' + group._id;
  deleteFolderRecursive(path);
}
function deleteFolderRecursive(path){
	if (path != null && path != undefined && path.indexOf("/app/pandicam/uploads/") > -1){
		if( fs.existsSync(path) ) {
	    fs.readdirSync(path).forEach(function(file,index){
	      var curPath = path + "/" + file;
	      if(fs.lstatSync(curPath).isDirectory()) { // recurse
	        deleteFolderRecursive(curPath);
	      } else { // delete file
	        fs.unlinkSync(curPath);
	      }
	    });
	    fs.rmdirSync(path);
	  }
	}
}



exports.removeIndividualPic = function(group,pic){
	console.log("tratando de eliminar la imagen");
	console.log(pic);
	var path = pic.path.replace("/web", "/app/pandicam");
	fs.exists(path, function(exists) {
    		if(exists) {
    			fs.unlink(path);
    		}
 	});
	group.update({$pull: {images :{picid:pic.picid} } },function(err){
      if (err) console.log(err);
  });
}
