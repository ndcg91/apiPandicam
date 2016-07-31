var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var GroupSchema	=new Schema({
	groupName:String,
	groupDescription:String,
	password:String,
	images:Array,
	users:Array,
	pending:Boolean,
	active:Boolean,
	token:String,
	blacklist:Array,
	date:String,
	files:Array,
	groupMaxSize:Number,
	groupCurrentSize:Number,
	chats:Array
});

module.exports = mongoose.model('Group',GroupSchema);
