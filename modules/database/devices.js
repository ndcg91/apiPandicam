var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var DeviceSchema	=new Schema({
	deviceID:String,
	badge:String,
});

module.exports = mongoose.model('Device',DeviceSchema);
