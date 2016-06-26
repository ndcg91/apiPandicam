var export = module.exports

export.upload = function(req,res){
  Group.findOne({token: req.groupToken},function(err,group){ //change later to Group
    if (err){
      res.send(error);
    }
    else if (group != null){
      // handle upload;
      console.log("group finded");
      //Mark: create directories in case they dont exist
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
    }
    else{
      console.log(req.token);
      res.send(403);
    }
  });
};

export.addUserPic = function(req,res){
  User.findOne({token: req.token},function(err,user){
    if (err){
      res.send(error);
    }
    else if (user != null){
      // handle upload;
      console.log("user finded");
      user.img = '/web' + req.file.path.substring(13);
      user.save(function(err,savedUser){
        res.send({pic:savedUser.img});
      })
    }
    else{
      console.log(req.token);
      res.send(403);
    }
  });
}
