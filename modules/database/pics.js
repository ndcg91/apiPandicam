var mongoose	=require('mongoose');
var Schema	=mongoose.Schema;

var PicSchema	=new Schema({
	timeStamp:String,
	parseId:String,
	fromGroup:String
});

module.exports = mongoose.model('Pics',PicSchema);
