var exports = module.exports = {};
var config	= require('./config.js');
var apn 		= config.apn;
var apnConnection = config.apnConnection;


exports.sendPushNotification = function(deviceID,image,img,number,name){
	console.log("trying to notify peer "+deviceID);
	if (image){
		var myDevice = new apn.Device(deviceID);
		var note = new apn.Notification();
		note.badge = Number(number) || 0;
		note.payload = {img:img};
		note.alert = "Nueva imagen recibida del grupo "+name;
		note.sound = "panda.caf";
	}
	else{
		var myDevice = new apn.Device(deviceID);
    var note = new apn.Notification();
    note.badge = Number(number) || 0;
		note.payload = {file:file};
		note.alert = "Nuevo fichero recibido del grupo " + name;
		note.sound = "panda.caf";
	}
	apnConnection.pushNotification(note, myDevice);
}
