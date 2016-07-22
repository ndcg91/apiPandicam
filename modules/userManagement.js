
var exports = module.exports;
var mongoose                                                    = require('mongoose');
var User 		= require('./database/user.js');
var Group 	= require('./database/groups.js');
var Device = require('./database/devices.js');



/**
 * Get User based on token
 * Parameters : req.token
 * It was authenticated first
 */
exports.getUser = function(req,res){
  res.send(req.user);
}

exports.buildUser = function(req,res){
  var fullUser = {}
  var user = req.user;
  fullUser.username = user.username
  fullUser.password = user.password
  fullUser.deviceId = user.deviceId
  fullUser.token = user.token
  fullUser.email = user.email
  fullUser.pandicamGroups = []
  fullUser.picGroups = []

  var belongsPics = user.belongsTo.filter(elem => {
    // body..
    return elem.as == "client"
  });
  var belongsPandicam = user.belongsTo.filter(elem => {
    // body...
    return elem.as == "server"
  });

  var picsIdArray = belongsPics.map( elem => {
    // body...
    return mongoose.Types.ObjectId(elem.to)
  });
  var pandicamIdArray = belongsPandicam.map( elem => {
    // body...
    return mongoose.Types.ObjectId(elem.to)
  });
  console.log(pandicamIdArray)
  Group.find({_id:{$in:picsIdArray}},function(err,picsGroups){
    if (err) {console.log(err);res.send(err);return}
    else {fullUser.picGroups = picsGroups};
    Group.find({_id:{$in:pandicamIdArray}},function(err,pandicamGroups){
      if (err) {console.log(err);res.send(err);return}
      else {fullUser.pandicamGroups = pandicamGroups;res.send(fullUser)};

    })
  })
  user.belongsTo.forEach(belongs => {
    // body...
      var groupID = belongs.to
      Group.findOne({_id:groupID},function(err,group){
        if (belongs.as == "client"){
          fullUser.picGroups.push(group)
        }
        else{
          fullUser.pandicamGroups.push(group)
        }
      })
  });
  res.send(fullUser)
}



/**
 * When the app register for notification we need to get the device id to send notification
 * Paramenters: req.token and req.body.deviceId it was first authenticated
 */
exports.addDeviceId = function(req,res){
  var user = req.user;
  user.deviceId = req.body.deviceId;
  deviceId  = req.body.deviceId;
  //Add a new DeviceID

  //Find if exist
  Device.findOne({deviceID:deviceId},function(err,device){
	if (err || device == null){
		var dev = new Device();
		dev.deviceID = deviceId;
		dev.save()
	}
	else{
		device.deviceID = deviceId;
		device.save(function(err,newDevice){
			console.log(newDevice);
		});
	}
  })


  user.save(function(err){
    if (err) { res.send(err);return }
    else {res.send({message:"device id updated"});return}
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
  var user = req.user;
  var groupId = req.body.id;

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



/**
 * Exit from a group
 * Parameters: userToken and groupID
 */
exports.removeGroup = function(req,res){
  var user = req.user;
  var groupId = req.body.id;
  console.log("remove self");
  console.log("group id", groupId);

  Group.update(
    {_id:groupId},
    {$pull: {users: { deviceId:user.deviceId}}},
    {safe:true},
    function(err,group){
      if (err) { res.send(err); return }
      User.update(
        {token:user.token},
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

exports.getPics = function(req,res){
  var user = req.user;
  var userGroups = user.belongsTo;
  var Ids=userGroups.map(function(a){return a.to});
  Group.find({_id: {$in:Ids}},function(err,groups){
    if (err) { res.send(err); return };
    var imagesPerGroup = groups.map(function(a){
      return {groupName:a.groupName, images:a.images};
    });
    res.send(imagesPerGroup);
  });
}


exports.getGroup = function(req,res){
  var user = req.user;
  var userGroups = user.belongsTo;
  var Ids=userGroups.map(function(a){return a.to});
  Group.find({_id: {$in:Ids}},function(err,groups){
    if (err) res.send(err);
    res.send(groups);
  });
}
