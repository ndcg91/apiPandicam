var exports = module.exports;
var User 		= require('./database/user.js');
var Group 	= require('./database/groups.js');



/**
 *
 * Remove a user from a group
 * if the group does not belongs to the user the action will return unauthorized 403
 * Parameters: user and group token, username to remove
 */
exports.removeUser = function(req,res){
  var userToken = req.token;
  var groupToken = req.groupToken;
  var userToRemove = req.body.user;
  var group = req.group;

  User.findOne({username:userToRemove},function(err,user){
    if (err) { res.send(err); return };
    if (user != null){
      group.update({$pull: {users: { deviceId:user.deviceId, username:user.username, as:"client"}}},function(err){
        if (err) { res.send(err); return };
        user.update({$pull: {belongsTo:{as:"client",to:group._id}}},function(err){
          if (err) { res.send(err); return };
          res.send({message:"updated", results:user});
        });
      });
    }
    else  res.send(403);
  });

}

exports.getUsers = function(req,res){
  res.send(req.group.users);
}


exports.blacklist = function(req,res){
  var userToBlackList = req.body.user;
  var group = req.group;
  User.findOne({username:userToBlackList},function(err,user){
    if (err) { res.send(err); return };
    if (user != null){
      group.blacklist.push({blacklist:user._id,username:user.username});
      group.save(function(err){
        if (err) { res.send(err); return };
        res.send({message:"user has been blacklisted "});
      });
    }
    else{
      res.send(401,{message:"user you are trying blackist do not exist"});
    }
  });
}

exports.getblacklist = function(req,res){
  var group = req.group;
  var users = [];
  if (group.blacklist.length == 0) res.send({});
  group.blacklist.forEach(function(element){
    User.findOne({_id: mongoose.Types.ObjectId(element.blacklist) },function(err,user){
      if (err) { res.send(err); return };
      users.push(user);
      if (users.length == group.blacklist.length){
        res.send(users);
      }
    });
  });
}


exports.whiteList = function(req,res){
  var group = req.group;
  var userToWhiteList = req.body.user;

  User.findOne({username:userToWhiteList},function(err,user){
    if (err) { res.send(err); return };
    if (user != null){
      var temp = [];
      group.blacklist.forEach(function(buser){
        if (buser.username != req.body.user){
          temp.push(buser);
        }
      })
      group.blacklist = temp;
      group.save(function(err){
        if (err) { res.send(err); return };
        res.send({message:"user has been whitelisted "});
      })
    }
    else{
      res.send(401,{message:"User was not in the black list"});
    }
  });
}
