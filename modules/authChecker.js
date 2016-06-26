var exports = module.exports;
var User 	  = require('./database/user.js');
var Group   = require('./database/groups.js');

exports.checkAuth = function(req,res,next){
	console.log("checking user token");
	console.log(req.headers["authorization"]);
	var usertoken;
	var tokenFromHeader = req.headers["authorization"];
	if (typeof tokenFromHeader !== 'undefined'){
		var token = tokenFromHeader.split(" ")[1];
		req.token = token;

		//we are making sure here that the user exists and return the user on req.user
		User.findOne({token:token},function(err, user){
	    if (err) { res.send(err); return };
	    if (user == null) { res.sendStatus(403); return }
			else { req.user = user; next() }
	  });

	}
	else{
		res.sendStatus(403)
	}
}

exports.checkGroupAuth = function(req,res,next){
	console.log("checking group token");
	var usertoken;
	var tokenFromHeader = req.headers["authorization"];
	if (typeof tokenFromHeader !== 'undefined'){
		var token = tokenFromHeader.split(" ")[1];
		var grouptoken = tokenFromHeader.split(" ")[2];
		req.token = token;
		req.groupToken = grouptoken;

		User.findOne({token:token},function(err, user){
	    if (err) { res.send(err); return };
	    if (user == null) { res.sendStatus(403); return }
			else {
				req.user = user;
				Group.findOne({token:grouptoken},function(err,group){
					if (err) { res.send(err); return };
					if (group != null){
						req.group = group;
						next();
					}
					else{
						res.sendStatus(403);
					}
				});
			}
	  });
	}
	else{
		res.sendStatus(403)
	}
}
