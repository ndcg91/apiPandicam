var exports = module.exports = {};
var Group 		= require('./modules/database/groups.js');


exports.handleClient = function (socket) {
	// we've got a client connection
	console.log("client connected");
	socket.emit("connected_now", { connected: 'connect' });

  //User has joined a group
	socket.on('join',function(data){
		console.log("joining to group"  + data.groupId);
		socket.join(data.groupId);
	});

  //User leave a group or logout
	socket.on('leave',function(data){
		socket.leave(data.groupId)
	});

  //emit broadcast to group
	socket.on('broadcast',function(data){
		console.log(data);
		io.to(data.groupId).emit(data.event,data.data);
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



//init
io.on("connection", pandicamSocket.handleClient);
router.route('/backup')
	.post(function(req,res){
	Email.push(req,res);
	console.log(req.body.commits[0]);
	//res.send(200);
})
