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
      console.log(snapshot.val(),group._id);
    },function(err){console.log(err)})
  });
})
