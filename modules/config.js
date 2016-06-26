var exports      = module.exports;
var express 							= require('express');
var cors 									= require('cors');
var app 									= express();
var server 								= require('http').createServer(app);
var https									= require('https');
var port 									= process.env.PORT || 8082;
var router 								= express.Router();
var bodyParser 						= require('body-parser');
var mongoose							= require('mongoose');
var jwt										= require('jsonwebtoken');
var morgan								= require('morgan');
var multer 								= require('multer');
var pandicamSocket				= require('./socket.js');

/* APN CONNECTION */
var apn                   = require('apn');
var read                  = require('fs').readFileSync
var pfx                   = read('./../_certs/pandicamPush.p12');
var pfxp                  = read('./../_certs/pandicamPushProd.p12');
var options               = { pfx: pfx, production:false };
var apnConnection         = new apn.Connection(options,manageApn);
function manageApn(err){
  if (err) console.log(err);
  else console.log("ok apn set");
}



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Headers,X-Requested-With, Content-Type, Accept');
	res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	next();
});

mongoose.connect('mongodb://pandicamProject:TemporaL1718@188.166.68.124:27017/pandicam');



exports.router          = router;
exports.server          = server;
exports.apnConnection   = apnConnection;
exports.apn             = apn;
