var exports = module.exports;
var User 		= require('./database/user.js');
var Group 		= require('./modules/database/groups.js');



/**
 * Get User based on token
 * Parameters : req.token
 * It was authenticated first
 */
exports.getUser = function(req,res){
  User.findOne({token: req.token},function(err,user){
    /* Success if User is finded
    and no error, if err retur err
    if user is not finded return 403*/

    if (err)  {
      res.send(error);
      return
    }
    else if (user != null) {
       res.send(user);
       return
    }
    else {
      res.send(403);
      return
    }
  });
}



/**
 * When the app register for notification we need to get the device id to send notification
 * Paramenters: req.token and req.body.deviceId it was first authenticated
 */
exports.addDeviceId = function(req,res){
  //find the user to add the device ID based on token
  User.findOne({token: req.token},function(err,user){
    if (err) { res.send(err); return} //if the user is not finded it does not exist so we dont need to send notification return error
    else if (user != null){
      /* If finded add the device ID and save */
      user.deviceId = req.body.deviceId;
      user.save(function(err){
        if (err) { res.send(err);return }
        else {res.send({message:"device id updated"});return}
      });
    }
  });
}



/**
 *
 * When you receive a QR or you know the group name and password this function will be executed
 * Parameters: userToken and groupId.
 * It has been authenticated first
 *
 */
exports.addGroup = function(req,res){
  var userToken = req.token;
  var groupId = req.body.id;

  User.findOne({token:userToken},function(err, user){
    if (err) { res.send(err);return }
    if (user == null) { res.send(403);return } // if the user is not found we cannot add the group to a undefined user

    //if the user is found
    else{
      var continueExec = true;
      //it is not allowed to belongs to a group created by you it would create circular references and duplicated images
      user.belongsTo.forEach(function(element){
        if (element.to == groupId){
          continueExec = false;
          if (element.as == "server"){
            res.send({message:"pandicam can not also be pic of the same group"});
            return
          }
          //it does not make any sense to join twice to the same group
          else{
            res.send({message:"already in"});
            return
          }
        }
      });
      if (continueExec){
        //if prechecks are passed
        Group.findOne({_id:groupId},function(err,group){
          if (err) { res.send(err);return }
          if (group != null){
            if (group.blacklist.indexOf(user.id) === -1){
              group.update({$addToSet: {users: { deviceId:user.deviceId, username:user.username, as:"client"}}},function(err){
                if (err) { res.send(err);return }
                user.update({$addToSet: {belongsTo:{as:"client",to:group._id}}},function(err){
                  if (err) { res.send(err); return }
                  res.send({message:"updated", results:group});
                  return
                });
              });
            }
            else{
              console.log("user blacklisted");
              console.log(group.blacklist.indexOf(user.id));
              res.send(401,{message:"user backlisted"});
              return
            }
          }
          else{
            console.log("group not found");
            res.send({message:"group not found"});
            return
          }
        });
      }
    }
  });
}



/**
 * Exit from a group
 * Parameters: userToken and groupID
 */
exports.removeGroup = function(req,res){
  var userToken = req.token;
  var groupId = req.body.id;
  console.log("remove self");
  console.log("group id", groupId);
  User.findOne({token:userToken},function(err, user){
    if (err) { res.send(err); return }
    if (user == null){
      res.send(403);
      return
    }
    else{
      Group.update(
        {_id:groupId},
        {$pull: {users: { deviceId:user.deviceId}}},
        {safe:true},
        function(err,group){
          if (err) { res.send(err); return }
          User.update(
            {token:userToken},
            {$pull: {belongsTo: {to:mongoose.Types.ObjectId(groupId)}}},
            function(err){
              if (err){
                res.send(err);
                return;
              }
              console.log(groupId);
              res.send({message:"updated", results:user});
            });

        });
    }
  });
}
