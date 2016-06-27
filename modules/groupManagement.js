var exports        = module.exports;
var qr 						 = require('qr-js');
var fs 						 = require('fs');
var User 		       = require('./database/user.js');
var Group 	       = require('./database/groups.js');
var FileManager    = require('./fileManager.js');
var SocketManager  = require('./socket.js');
var apnManager     = require('./apn.js');
var jwt						 = require('jsonwebtoken');


exports.createGroup = function(req,res){
  var user = req.user;
  if (req.body.groupName == null || req.body.password == null ||req.body.active == null ||req.body.pending == null ){
    if (req.body.groupName == null) res.send({message:"group name cannot be null"});
    if (req.body.password == null) res.send({message:"password cannot be null"});
    if (req.body.active == null) res.send({message:"active cannot be null"});
    if (req.body.pending == null) res.send({message:"pending cannot be null"});
  }
  else{
    var newGroup = new Group();
    newGroup.groupName = req.body.groupName;
    newGroup.groupDescription = req.body.groupDescription;
    newGroup.password = req.body.password;
    newGroup.active = req.body.active;
    newGroup.pending = req.body.pending;
    newGroup.date = new Date();

    newGroup.save(function(err,group){
      if (err) { res.send(err); return };
      group.token = jwt.sign(group,'secretkey',{noTimestamp:true});
      group.update({$addToSet :{users: { deviceId:user.deviceId, username:user.username, as:"server"} }}, function(err,groupWithUsers){
        if (err) { res.send(err); return };
        console.log(groupWithUsers);
        group.save(function(err,savedGroup){
          if (err) { res.send(err); return };
          user.update({$addToSet: {belongsTo: {as:"server", to:savedGroup._id} }},function(err){
            if (err) { res.send(err); return };
            qr.saveSync({
              value:'pandicam://'+group._id,
              size:10,
              path:'/var/www/html/web/qr/'+group._id+'.png'
            });
            SocketManager.newGroup(user._id.toString(),savedGroup);
            res.send({message:"Group Created",token:group.token,group:group});
          });
        });
      });
    });
  }
}




exports.deleteGroup = function(req,res){
  var user = req.user;
  var group = req.group;
  Group.findOneAndRemove({token:group.token},function(err,group){
    if (err) { res.send(err); return };
    user.update({$pull: {belongsTo:{as:"server",to:group._id}}},function(err){
      if (err) { res.send(err); return };
    });
    //cleaning
    FileManager.cleanGroupFolder(group._id);
    User.find(function(err,users){
      users.forEach(function(element){
        var temBelongs = [];
        var belongs = element.belongsTo;
        belongs.forEach(function(b){
          if (b.to != group._id){
            temBelongs.push(b);
          }
          else{
            //is equal should be removed
            SocketManager.removeGroup(element._id.toString(),b.to);
          }
        });
        if (temBelongs != belongs){
          element.belongsTo = temBelongs;
          element.save(function(err){
            if (err) { console.log(err)}
          })
        }
      });
    })
    SocketManager.removeGroup(user._id.toString(),group._id);
    res.send({message:"removed"});
  });
}

exports.getPics = function(req,res){
  var group = req.group;
  FileManager.groupPics(group,res);
}

exports.addFile = function(req,res){
  var user = req.user;
  var group = req.group;
  var fileToAdd = req.body.file;
  var path = req.body.path;
  var file = {fileId:fileToAdd, path:path,timeStamp:new Date(),name:req.body.fileName};
  var dir = './uploads/'+group._id;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  fs.rename('/app/pandicam/uploads/'+req.body.fileName,'/app/pandicam/uploads/'+group._id.toString()+'/'+req.body.fileName,function(err){
    if (err) console.log(err);
    group.update({$addToSet: {files:pic}},function(err){
      if (err) { res.send(err); return };
      res.send({message:"updated", results:group});
      io.sockets.in(group._id.toString()).emit('new_file', { file: file });
      var users = group.users;
      users.forEach(function(user){
        User.findOne({username:user.username},function(err,finalUser){
          if (err) { res.send(err); return };
          apnManager.sendPushNotification(finalUser.deviceId,false,file,group.files.count,group.groupName);
        });
      });
      if (user.free){
        setTimeout(function(){
          //removePic(group,pic);
        },14400000);
      }
      else{
        setTimeout(function(){
          //removePic(group,pic);
        },604800000);
      }
    });
  });
}

exports.removePic = function(req,res){
  var user = req.user;
  var group = req.group;
  var pic = req.body.pic;
  FileManager.removeIndividualPic(group,pic);
  res.send({message:"removed"});
}

exports.removeFile = function(req,res){
  var group = req.group;
  var file = req.body.file;
  FileManager.removeFile(group,file);
  res.send({message:"removed"});
}
