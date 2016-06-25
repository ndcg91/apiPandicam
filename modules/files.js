var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var FileSchema	=new Schema({
	timeStamp:String,
	name:String,
	path:String,
	group:String,
});

module.exports = mongoose.model('Files',FileSchema);
