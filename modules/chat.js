var config     = require('./config.js');
var User 	     = require('./database/user.js');
var Group      = require('./database/groups.js');
var noti       = require('./apn.js');
var firebaseDB = config.firebaseDB
Group.find({},function(err,groups){
  groups.forEach(group => {
    var dbRef = firebaseDB.ref('messages/' + group._id);
    dbRef.on("value",function(snapshot){
      console.log(snapshot.val());
    })

  });
})
