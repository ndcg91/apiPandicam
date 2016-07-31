var exports = module.exports = {};
var config	= require('./config.js');
var Apn 	= config.apn;
var apnConnection = config.apnConnection;
var Device = require('./database/devices.js');
var Group = require('./database/groups.js');
var User = require('./database/user.js');
exports.testApn = function(req,res){
	var Apn = config.apn;
	console.log(req.params)
        var apnConnection = config.apnConnection;
	var deviceID = req.params.deviceId;
	var myDevice = new Apn.Device(deviceID);
	var note = new Apn.Notification();
        note.badge = 200;
        note.payload = {img:'algo'};
        note.alert = "Esto es una prueba el contador se te debe de poner a 200";
        note.sound = "panda.caf";
        apnConnection.pushNotification(note, myDevice);
	res.send(200)
}

exports.notifyChatGroup = function(groupID,chat){
	var Apn = config.apn;
	var apnConnection = config.apnConnection;
	//chat will have from and text
	Group.findOne({_id:groupID},function(err,group){
		group.users.forEach(function(user){
			var deviceId = user.deviceId			
			var username = user.username
			if (deviceId == null){
				User.findOne({username:username},function(err,newuser){
					var newdeviceId = newuser.deviceId;
					var newusername = newuser.username;
					console.log(newuser);
					console.log("trying to change value from username",newusername,"to deviceId",newdeviceId);
					Group.update({_id:groupID,"users.username": 'ndcg9105'}, {'$set': {
    						'users.$.deviceId': newdeviceId,
						}},function(err){console.log(err)});
				})			
			}
			if (deviceId != null){
				Device.findOne({deviceID:deviceId},function(err,device){
					var number = 0
					console.log(device);
                			if (!err && device != null){
                  		      		if (!isNaN(device.badge)){
                                			number = Number(device.badge);
                               	 			device.badge ++;
                                			device.save(function(err,savedDevice){});
                        			}
                        			else{
                                			device.badge = 0;
                        	        		device.save();
                        			}
               				}
					var myDevice = new Apn.Device(deviceId);
     	                   		var note = new Apn.Notification();
        	                	note.badge = Number(device.badge) || 0;
                        		note.alert = chat.from + ": " + chat.text;
                        		note.sound = "panda.caf";
					console.log("sending notification to ",deviceId);
					apnConnection.pushNotification(note, myDevice);
				})
			}
			else{
				console.log("impossible to notify user ",user.username);
			}
			
		})
	})	
}

exports.sendPushNotification = function(deviceID,image,img,number,name){
        var Apn = config.apn;
        var apnConnection = config.apnConnection;

	Device.findOne({deviceID:deviceID},function(err,device){
		var number = 0
		if (!err && device != null){
			if (!isNaN(device.badge)){
				number = Number(device.badge);
				device.badge ++;
				device.save(function(err,savedDevice){});
			}
			else{
				device.badge = 0;
                                device.save();
			}
		}
		console.log("trying to notify peer "+deviceID);				
		if (image){
			console.log(number);
                        var myDevice = new Apn.Device(deviceID);
                        var note = new Apn.Notification();
                        note.badge = number;//Number(device.badge) || 0;
                        note.payload = {img:img};
                        note.alert = "Nueva imagen recibida del grupo "+name;
                        note.sound = "panda.caf";
                }
		else{
        	     	var myDevice = new Apn.Device(deviceID);
    			var note = new Apn.Notification();
    			note.badge = Number(device.badge) || 0;
                	note.payload = {file:file};
               	 	note.alert = "Nuevo fichero recibido del grupo " + name;
                	note.sound = "panda.caf";
        	}
        	apnConnection.pushNotification(note, myDevice);
	});
}
