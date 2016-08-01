var config     = require('./config.js');
var User 	     = require('./database/user.js');
var Group      = require('./database/groups.js');
var noti       = require('./apn.js');
var firebaseDB = config.firebaseDB

console.log("chat init");
Group.find({},function(err,groups){
  groups.forEach(group => {
    var dbRef = firebaseDB.ref('messages/' + group._id);
    dbRef.on("child_added",function(snapshot){
      if (group.chats != snapshot.numChildren(){

        console.log(group.groupName, "updating chat", snapshot.val())
      }
      group.chats = snapshot.numChildren();
      console.log(snapshot.numChildren());
      group.save();
    },function(err){console.log(err)})
  });
})
