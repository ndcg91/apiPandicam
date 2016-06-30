var exports = module.exports;
var User 		= require('./database/user.js');
var Email 	= require('./email.js');
var jwt			= require('jsonwebtoken');


exports.register = function(req,res){
		var user= new User();
		user.username= req.body.username;
		user.password= req.body.password;
		user.free = true;
		user.email = req.body.email;
		user.deviceId = req.body.deviceId;
		if (user.username == null) res.send({message:"username cannot be null"});
		if (user.password == null) res.send({message:"password cannot be null"});
		if (user.free == null) res.send({message:"free cannot be null"});
		if (user.email == null) res.send({message:"email cannot be null"});
		var required = true;
		if (user.username == null || user.password == null || user.free == null || user.email == null){
			required = false;
		}
		else {
			required = true;
		}
		if (required){
			User.findOne({username:req.body.username}, function(err,fetchuser){
				if(err)
					res.send(err);
				if (fetchuser == null){
					User.findOne({email:req.body.email},function(err,emailUser){
						if (err) res.send(err);
						if (emailUser == null){
							user.save(function(err,user){
            		if (err) res.send(err);
            		user.token = jwt.sign(user,'secretkey',{noTimestamp:true});
            		user.save(function(err,user){
              		if (err) res.send(err);
									Email.registered(res,user)
            		});
          		});

						}
						else{
							res.json({message:"please chose another email"});
						}
					});
				}
				else{
					res.json({message:"please chose another user"});
				}
			});
		}
}

exports.login = function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	session = req.session;

	if (username == null || password == null){
		if (username == null) res.send({message:"username cannot be null"});
		if (password == null) res.send({message:"password cannot be null"});
	}
	else{
		User.findOne({username: username},function(err,user){
		 if (err) res.send(err);
		 if (user != null){
			 if (user.password == password){
				 //res.header("Access-Control-Allow-Origin", "*");
				 //res.send(user);
				 //join to user io
				 res.send(user);
			 }
			 else{
							 res.send(403);
			 }
		 }
		 else{
			 res.send(403);
		 }
		});
	}
}
