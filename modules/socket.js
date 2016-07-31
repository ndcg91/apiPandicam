var exports = module.exports = {};
var config	= require('./config.js');
var server  = config.server;
var Group 	= require('./database/groups.js');
var User 		= require('./database/user.js');
var Device = require('./database/devices.js');
var apnManager     = require('./apn.js');

var socketio = require('socket.io')

module.exports.listen = function(server){
    io = socketio.listen(server,{ origins:'*:*',pingInterval:1000,pingTimeout:6000})
      //io = socketio.listen(server,{ origins:'*:*'})
		io.on("connection", handleClient);
    return io
}


console.log("socket init");

/////////ONE SOCKET FOR EACH GROUP
Group.find({},function(err,groups){
	groups.forEach(function(group){
		var s = io.of('/'+ group._id);
		s.emit('init','ok');
		s.on('message',function(data){
			s.emit('message',data);
		});

	})
})



var handleClient = function(socket) {

	// we've got a client connection
	console.log("client connected");
	socket.emit("connected_now", { connected: 'connect' });

  //User has joined a group
	socket.on('clearBadge',function(data){
		var deviceID = data.deviceID;
		console.log("clear badge called");
		Device.findOne({deviceID:deviceID},function(err,device){
			console.log(device);
			console.log(deviceID);
			if (!err && device != null){
				device.badge = 0;
				device.save();
			}
		})	
	})
	
	socket.on('join',function(data){
		console.log("joining to group"  + data.groupId);
		socket.join(data.groupId);
	});

  //User leave a group or logout
	socket.on('leave',function(data){
		console.log("leaving group",data)
		socket.leave(data.groupId)
	});
	socket.on('disconnect', function () {
		console.log("client has been disconnected");
        });
   

  //emit broadcast to group
	socket.on('broadcast',function(data,callback){
		callback();
		console.log(data);
		io.to(data.groupId).emit(data.event,data);
		if (data.event == "chat"){
			var chatObject = data.data;
			Group.findOne({_id:data.groupId},function(err,group){
				group.update({$addToSet: {chats:chatObject}},function(err){
					if (err){
						console.log(err)
					}
					else{
						console.log("newchat")
						apnManager.notifyChatGroup(group._id,chatObject);
					}
				});
			})
			
		}
	});

  //User login
	socket.on('login',function(data){
		console.log("user loged in");
		socket.join(data.userID);
	});

  //called to get all pics
	socket.on('getPics',function(data){
		console.log("get pics called");
		var clientID = data.client;
		User.find({_id:clientID},function(err,user){
			if (err) console.log(err);
			if (user.length == 1){
				var userGroups = user[0].belongsTo;
				var Ids=userGroups.map(function(a){return a.to});
				Group.find({_id: {$in:Ids}},function(err,groups){
					if (err) res.send(err);
					var imagesPerGroup = groups.map(function(a){
						return {groupName:a.groupName, groupID:a._id, images:a.images};
					});
					socket.emit("all_img",imagesPerGroup);
				});
			}
		});
	})


};

exports.removeGroup = function(userID,groupID){
	io.sockets.in(userID).emit('group_deleted', {groupID:groupID});
}
exports.newGroup = function(userID,group){
	io.sockets.in(userID).emit('new_group', group);
}



//init
