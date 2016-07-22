var exports = module.exports = {};
var config	= require('./config.js');
var apn 		= config.apn;
var apnConnection = config.apnConnection;
Device = require('./database/devices.js');


exports.testApn = function(req,res){
	var myDevice = new apn.Device('<eb49a009 630da047 d9dd8df9 fb4e1e0b 0c7f853e e361ff12 a250c03c b49969fd>')
	var note = new apn.Notification();
        note.badge = 100;
        note.payload = {img:'algo'};
        note.alert = "Nueva imagen recibida del grupo ";
        note.sound = "panda.caf";
        apnConnection.pushNotification(note, myDevice);
	res.send(200)
}

exports.sendPushNotification = function(deviceID,image,img,number,name){
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
                        var myDevice = new apn.Device(deviceID);
                        var note = new apn.Notification();
                        note.badge = number;//Number(device.badge) || 0;
                        note.payload = {img:img};
                        note.alert = "Nueva imagen recibida del grupo "+name;
                        note.sound = "panda.caf";
                }
		else{
        	     	var myDevice = new apn.Device(deviceID);
    			var note = new apn.Notification();
    			note.badge = Number(device.badge) || 0;
                	note.payload = {file:file};
               	 	note.alert = "Nuevo fichero recibido del grupo " + name;
                	note.sound = "panda.caf";
        	}
        	apnConnection.pushNotification(note, myDevice);
	});
}
