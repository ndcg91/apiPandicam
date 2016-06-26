var express 		= require('express');
var cors 		= require('cors');
var app 		= express();
var server 		= require('http').createServer(app);
var https		= require('https');
var bodyParser 		= require('body-parser');
var mongoose		= require('mongoose');
var jwt			= require('jsonwebtoken');
var morgan		= require('morgan');
var User 		= require('./modules/daabase/user.js');
var Group 		= require('./modules/database/groups.js');
var File 		= require('./modules/database/files.js');
var Email = require('./modules/email.js');
var localStorage 	= require('localStorage');
var archiver 		= require('archiver');
var async = require('async');
var request = require('request');
var fs = require('fs');
var qr = require('qr-js');
var gm = require('gm');
var io 			= require("socket.io").listen(server, { origins:'*:*'});
var pandicamApn = require('./modules/apn.js');
var pandicamSocket = require('./modules/socket.js');
var pandicamRegister = require('./modules/register.js');
var pandicamfileManager = require('./modules/fileManager.js');




var multer = require('multer');

var storage = multer.diskStorage({ //multers disk storage settings
	destination: function (req, file, cb) {
		cb(null, '/app/pandicam/uploads/')
	},
	filename: function (req, file, cb) {
		var datetimestamp = Date.now();
		cb(null,file.originalname);
		console.log(req.body);
		console.log(file);
	}
});

var upload = multer({ //multer settings
	storage: storage
}).single('file');



/*++++++++++++++++++++++++++++++++++++++++++++
****Comment Section Seting the api parameters+
**********************************************/
mongoose.connect('mongodb://pandicamProject:TemporaL1718@188.166.68.124:27017/pandicam');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	//res.setHeader('Access-Control-Allow-Credentials','true');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Headers,X-Requested-With, Content-Type, Accept');
	res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	next();
});


var port = process.env.PORT || 8080;


var router = express.Router();

router.use(function(req, res, next) {
	console.log("algo ha pasado");
	next();
});

router.get('/', function(req, res) {
	res.json({message: 'ok api set'});
});

/*++++++++++++++++++++++++++
++END SETTING parameters +++
***************************/



/**********************************
*			LOGIN AND register					*
***********************************/
//Register
router.route('/user/register').post(pandicamRegister.register);
//LOGIN
router.route("/user/login")	.post(pandicamRegister.login);
/**********************************
*			END LOGIN AND register			*
***********************************/



/**********************************
*			EMAIL FUNCTIONS   					*
***********************************/
router.route('/contact').post(Email.contactForm);
router.route('/email/new').post(Email.send);
router.route('/email/contactUs').post(Email.contactUs);
/**********************************
*			END EMAIL FUNCTIONS					*
***********************************/



/**********************************
*			UPLOAD FUNCTIONS		  			*
***********************************/
router.route('/user/upload')
	.post(
		checkGroupAuth,
		multer({dest: '/app/pandicam/uploads/'}).single('file'),
		pandicamfileManager.upload);

router.route('/user/addUserPic')
	.post(
			checkAuth,
			multer({dest: '/app/pandicam/uploads/'}).single('file'),
			pandicamfileManager.addUserPic);

	/**********************************
	*		END	UPLOAD FUNCTIONS		 			*
	***********************************/





	/**********************************
	*			USER MANAGEMENT 		  			*
	***********************************/

router.route('/user/get')
	.get(checkAuth,function(req,res){
		User.findOne({token: req.token},function(err,user){
			if (err){
				res.send(error);
			}
			else if (user != null){
				res.send(user);
			}
			else{
				console.log(req.token);
				res.send(403);
			}
		});
	});

	router.route('/user/addDeviceId')
		.post(checkAuth,function(req,res){
			console.log(req.body.deviceId);
			User.findOne({token: req.token},function(err,user){
				if (err){
					res.send(err);
				}
				else if (user != null){
					user.deviceId = req.body.deviceId;
					user.save(function(err){
						if (err){
							res.send(err)
						}
						else{
							res.send({message:"device id updated"});
						}
					});
				}
			});
		});


	/**********************************
	*		END	USER MANAGEMENT 		  		*
	***********************************/




router.route("/user/groupPics")
	.get(checkAuth,function(req,res){
		User.findOne({token:req.token},function(err,user){
			if (err) res.send(err);
			var userGroups = user.belongsTo;
			var Ids=userGroups.map(function(a){return a.to});
			Group.find({_id: {$in:Ids}},function(err,groups){
				if (err) res.send(err);
				var imagesPerGroup = groups.map(function(a){
					return {groupName:a.groupName, images:a.images};
				});
				res.send(imagesPerGroup);
			});
		});
	});


router.route("/group/create")
	.post(checkAuth,function(req,res){
		if (req.body.groupName == null || req.body.password == null ||req.body.active == null ||req.body.pending == null ){
			if (req.body.groupName == null) res.send({message:"group name cannot be null"});
			if (req.body.password == null) res.send({message:"password cannot be null"});
			if (req.body.active == null) res.send({message:"active cannot be null"});
			if (req.body.pending == null) res.send({message:"pending cannot be null"});
		}
		else{
			var newGroup = new Group();
			newGroup.groupName = req.body.groupName;
			newGroup.groupDescription = req.body.groupDescription;
			newGroup.password = req.body.password;
			newGroup.active = req.body.active;
			newGroup.pending = req.body.pending;
			newGroup.date = new Date();
			User.findOne({token:req.token},function(err,user){
				if (err)
					res.send(err);
				if (user != null){
					newGroup.save(function(err,group){
						if (err)
							res.send(err);
						group.token = jwt.sign(group,'secretkey',{noTimestamp:true});
						group.update({$addToSet :{users: { deviceId:user.deviceId, username:user.username, as:"server"} }}, function(err,groupWithUsers){
							if (err) res.send(err);
							console.log(groupWithUsers);
							group.save(function(err,savedGroup){
								if (err) res.send(err);
								user.update({$addToSet: {belongsTo: {as:"server", to:savedGroup._id} }},function(err){
									if (err) res.send(err);
									qr.saveSync({
										//value:JSON.stringify('pandicam://'+group._id),
										value:'pandicam://'+group._id,
										size:10,
										path:'/var/www/html/web/qr/'+group._id+'.png'
									});
									io.sockets.in(user._id.toString()).emit('new_group', savedGroup);
									res.send({message:"Group Created",token:group.token,group:group});
								});
							});
						});
					});
				}
			});
		}
	});



router.route("/group/delete")
	.get(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		console.log(req.groupToken);
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}

			Group.findOneAndRemove({token:groupToken},function(err,group){
				if (err) res.send(err);
				user.update({$pull: {belongsTo:{as:"server",to:group._id}}},function(err){
                    if (err) res.send(err);
               });

				//cleaning
				var path = '/app/pandicam/uploads/' + group._id;
				deleteFolderRecursive(path);
				User.find(function(err,users){
					users.forEach(function(element){
						var temBelongs = [];
						var belongs = element.belongsTo;
						belongs.forEach(function(b){
							if (b.to != group._id){
								temBelongs.push(b);
							}
							else{
								//is equal should be removed
								io.sockets.in(element._id.toString()).emit('picgroup_deleted', {groupID:b.to});
							}
						});
						if (temBelongs != belongs){
							element.belongsTo = temBelongs;
							element.save(function(err){
								if (err) { console.log(err)}
							})
						}
					});
				})
				io.sockets.in(user._id.toString()).emit('group_deleted', {groupID:group._id});
				res.send({message:"removed"});
			});
		});
	});




router.route("/group/getPics")
	.get(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}
		});
		Group.findOne({token:groupToken},function(err, group){
			if (err) res.send(err);
			var working_directory = '/app/pandicam/uploads/'+group._id.toString()+'/images';
			var dir = working_directory + '/tmp_copy'
                        if (!fs.existsSync(dir)){
                        	fs.mkdirSync(dir);
                        }

			/*group.images.forEach(function(i){
				var path=i.path.replace('/web','/app/pandicam');
				var picid = i.picid;
 	                       	fs.createReadStream(path).pipe(fs.createWriteStream(dir + '/' + picid + '.jpeg'))
        		})*/

			zipImg(group.images,res);
		});
	});

router.route("/group/editActive")
	.get(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}
		});
		Group.findOne({token:groupToken},function(err,group){
			if (err) res.send(err);
			group.active = !group.active;
			group.pending = !group.pending;
			group.save(function(err){
				if (err){
					res.send(err)
				}
				else{
					res.send({message:"group active toggled"});
				}
			});
		});
	});

router.route("/group/get")
	.get(checkAuth,function(req,res){
		var token = req.token;
		User.findOne({token:token},function(err,user){
			if(err) res.send(err);
			if (user != null){
				var userGroups = user.belongsTo;///FixMe: modify later
				var Ids=userGroups.map(function(a){return a.to});
				console.log(Ids);
				Group.find({_id: {$in:Ids}},function(err,groups){
					if (err) res.send(err);
					res.send(groups);
				});

			}
			else { res.send(403) }
		});
	});


router.route("/group/addSelf")
	.post(checkAuth,function(req,res){
		var userToken = req.token;
		var groupId = req.body.id;

		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				console.log("user not finded");
				res.send(403);
			}
			else{
				var continueExec = true;
				user.belongsTo.forEach(function(element){
					if (element.to == groupId){
						continueExec = false;
						if (element.as == "server"){
							res.send({message:"pandicam can not also be pic of the same group"});
						}
						else{
							res.send({message:"already in"});
						}
					}
				});
				if (continueExec){
					Group.findOne({_id:groupId},function(err,group){
						if (err) {
							res.send(err);
							return;
						}
						console.log(groupId);
						if (group != null){
							if (group.blacklist.indexOf(user.id) === -1){
								group.update({$addToSet: {users: { deviceId:user.deviceId, username:user.username, as:"client"}}},function(err){
									if (err) res.send(err);
									user.update({$addToSet: {belongsTo:{as:"client",to:group._id}}},function(err){
										if (err) res.send(err);
										res.send({message:"updated", results:group});
									});
								});
							}
							else{
								console.log("user blacklisted");
								console.log(group.blacklist.indexOf(user.id));
								res.send(401,{message:"user backlisted"});
							}
						}
						else{
							console.log("group not found");
							res.send({message:"group not found"});
						}
					});
				}
			}
		});
	});




router.route("/group/removeSelf")
	.post(checkAuth,function(req,res){
		var userToken = req.token;
		var groupId = req.body.id;
		console.log("remove self");
		console.log("group id", groupId);
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				console.log("user not finded");
				res.send(403);
			}
			else{
				Group.update(
					{_id:groupId},
					{$pull: {users: { deviceId:user.deviceId}}},
					{safe:true},
					function(err,group){
						if (err) {
							res.send(err);
							return;
						}
						User.update(
							{token:userToken},
							{$pull: {belongsTo: {to:mongoose.Types.ObjectId(groupId)}}},
							function(err){
								if (err){
									res.send(err);
									return;
								}
								console.log(groupId);
								res.send({message:"updated", results:user});
							});

					});
			}
		});
	});


router.route("/group/addUser")
	.post(checkGroupAuth,function(req,res){
		if (req.body.user == null) res.send({message:"user name cannot be null"});

		else{

			var userToken = req.token;
			var groupToken = req.groupToken;
			var userToAdd = req.body.user;
			User.findOne({token:userToken},function(err, user){
				if (err) res.send(err);
				if (user == null){
					console.log("user not finded");
					res.send(403);
				}
			});
			Group.findOne({token:groupToken},function(err,group){
				if (err) res.send(err);
				if (group != null){
					User.findOne({username:userToAdd},function(err,user){
						if (err) res.send(err);
						if (user != null){
							if (group.blacklist.indexOf(user.id) === -1){
								group.update({$addToSet: {users: { deviceId:user.deviceId, username:user.username, as:"client"}}},function(err){
									if (err) res.send(err);
									user.update({$addToSet: {belongsTo:{as:"client",to:group._id}}},function(err){
										if (err) res.send(err);
										res.send({message:"updated", results:user});
									});
								});
							}
							else{
								console.log("user blacklisted");
								console.log(group.blacklist.indexOf(user.id));
								res.send(401,{message:"user backlisted"});
							}
						}
						else{
							res.send(401,{message:"user not found"});
						}
					});
				}
				else{
					console.log("group not found");
					res.send(401,{message:"group not found"});
				}
			});
		}
	});
router.route("/pic/remove")
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var pic = req.body.pic;
		Group.findOne({token:groupToken},function(err,group){
			if (err) res.send(err);
			removeIndividualPic(group,pic);
			res.send({message:"removed"});
		});
	});

router.route("/file/remove")
        .post(checkGroupAuth,function(req,res){
                var userToken = req.token;
                var groupToken = req.groupToken;
                var file = req.body.file;
                Group.findOne({token:groupToken},function(err,group){
                        if (err) res.send(err);
			removeFile(group,file);
                        res.send({message:"removed"});
                });
        });



router.route("/group/removeUser")
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var userToRemove = req.body.user;
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}
		});
		Group.findOne({token:groupToken},function(err,group){
			if (err) res.send(err);
			if (group != null){
				User.findOne({username:userToRemove},function(err,user){
					if (err) res.send(err);
					if (user != null){
						group.update({$pull: {users: { deviceId:user.deviceId, username:user.username, as:"client"}}},function(err){
							if (err) res.send(err);
							user.update({$pull: {belongsTo:{as:"client",to:group._id}}},function(err){
								if (err) res.send(err);
								res.send({message:"updated", results:user});
							});
						});
					}
				});
			}
			else{
				res.send(403);
			}
		});
	});
router.route("/test")
	.get(function(req,res){
		testNotif('<54032e98 15bba87d cac4142c 350971cb dbab3e56 7f41a2f4 5406c6d0 56a9e356>');
	});

router.route("/group/getUsers")
	.get(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;

		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}
		});
		Group.findOne({token:groupToken},function(err,group){
			if (err) res.send(err);
			if (group != null){
				res.send(group.users);
			}
			else{
				res.send(403);
			}
		});
	});


router.route('/group/blacklist')
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var userToBlackList = req.body.user;
		User.findOne({ token:userToken },function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(401,{message:"Not authorized, please login"});
			}
			else{
				Group.findOne({token:groupToken},function(err,group){
					if (err) res.send(err);
					if (group != null){
						User.findOne({username:userToBlackList},function(err,baduser){
							if (err) res.send(err);
							if (user != null){
								group.blacklist.push({blacklist:baduser._id,username:baduser.username});
								group.save(function(err){
									if (err) res.send(err);
									res.send({message:"user has been blacklisted "});
								});
							}
							else{
								res.send(401,{message:"user you are trying blackist do not exist"});
							}
						});
					}
					else{
						res.send(401,"Group do not exist or is not your group");
					}
				});
			}

		});
	});

router.route('/group/getblacklist')
	.get(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		User.findOne({ token:userToken },function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(401,{message:"Not authorized, please login"});
			}
			else{
				Group.findOne({token:groupToken},function(err,group){
					if (err) res.send(err);
					if (group != null){
						var users = [];
						if (group.blacklist.length == 0) res.send({});
						group.blacklist.forEach(function(element){
							User.findOne({_id: mongoose.Types.ObjectId(element.blacklist) },function(err,user){
								if (err) res.send(err);
								users.push(user);
								if (users.length == group.blacklist.length){
									res.send(users);
								}
							});
						});
					}
					else{
						res.send(401,"Group do not exist or is not your group");
					}
				});
			}

		});
	});


router.route("/group/whiteList")
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var userToWhiteList = req.body.user;
		User.findOne({token:userToken},function(err, user){
			if (err) res.send(err);
			if (user == null){
				res.send(401,{message:"please authenticate"});
			}
			else{
				Group.findOne({token:groupToken},function(err,group){
					if (err) res.send(err);
					if (group != null){
						User.findOne({username:userToWhiteList},function(err,user){
							if (err) res.send(err);
							if (user != null){
								var temp = [];
								group.blacklist.forEach(function(buser){
									if (buser.username != req.body.user){
										temp.push(buser);
									}
								})
								group.blacklist = temp;
								group.save(function(err){
									if (err) res.send(err);
									res.send({message:"user has been whitelisted "});

								})
							}
							else{
								res.send(401,{message:"User was not in the black list"});
							}
						});
					}
					else{
						res.send(401,{message:"group not found"});
					}
				});
			}
		});
	});




router.route("/group/addFile")
	.post(checkGroupAuth,function(req,res){
		var userToken = req.token;
		var groupToken = req.groupToken;
		var fileToAdd = req.body.file;
		var path = req.body.path;
		User.findOne({token:userToken},function(err,user){
			if (err) res.send(err);
			if (user == null){
				res.send(403);
			}
			else{
				Group.findOne({token:groupToken},function(err,group){
					if (err) res.send(err);
					if (group != null){
						var file = {fileId:fileToAdd, path:path,timeStamp:new Date(),name:req.body.fileName};
						var fs = require('fs');
						var dir = './uploads/'+group._id;
						if (!fs.existsSync(dir)){
							fs.mkdirSync(dir);
						}
						fs.rename('/app/pandicam/uploads/'+req.body.fileName,'/app/pandicam/uploads/'+group._id.toString()+'/'+req.body.fileName,function(err){
							if (err)
								console.log(err);
								group.update({$addToSet: {files:pic}},function(err){
									if (err) res.send(err);
									console.log("file updated");
									res.send({message:"updated", results:group});
									io.sockets.in(group._id.toString()).emit('new_file', { file: file });
									var users = group.users;
									users.forEach(function(user){
										User.findOne({username:user.username},function(err,finalUser){
											if (err)
												res.send(err);
											sendPushNotification(finalUser.deviceId,false,file,group.files.count,group.groupName);
										});
									});
									if (user.free){
										setTimeout(function(){
											//removePic(group,pic);
										},14400000);
									}
									else{
										setTimeout(function(){
											//removePic(group,pic);
										},604800000);
									}
								});
							});




						//},
						//error:function(){
						//	res.send({message:"nothing done"});
						//}
						//	});

					}
					else{
						res.send(403);
					}
				});
			}
		});
	});




// This need to be changed as now the location of the image is dinamically created. We will return the image path on upload
	function addPic(user,group,pic,res){
		group.update({$addToSet: {images:pic}},function(err){
			if (err){
				//cleaning
				fs.exists('/app/pandicam/' + pic.path, function(exists) {
					if(exists) {
                                        	fs.unlink('/app/pandicam/' + pic.path);
                                       	}
                                });
				res.send(err);
				return
			}
			console.log("image updated");
			res.send({message:"updated", results:group});
			io.sockets.in(group._id.toString()).emit('new_pic', { pic: pic });
			var users = group.users;
			users.forEach(function(user){
				User.findOne({username:user.username},function(err,finalUser){
					if (!err) sendPushNotification(finalUser.deviceId,true,pic,group.images.count,group.groupName);
				});
			});
			if (user.free){
				setTimeout(function(){
					removePic(group,pic);
				},14400000);
			}
			else{
				setTimeout(function(){
					removePic(group,pic);
				},604800000);
			}
		});
	}


function testNotif(deviceID){
	console.log("testing push notification to device " + deviceID);
	var myDevice = new apn.Device(deviceID);
	var note = new apn.Notification();
	note.sound = "panda.caf";
	note.alert = "Nueva imagen recibida";
	apnConnection.pushNotification(note, myDevice);
}

function sendPushNotification(deviceID,image,img,number,name){
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

//agentprod.createMessage()
//.device(deviceID)
//.alert('Nueva foto Pandicam')
//.send();
}

function sendFilePushNotif(deviceID,image,img,number,name){

}
function deleteFolderRecursive(path){
	if (path != null && path != undefined && path.indexOf("/app/pandicam/uploads/") > -1){
		if( fs.existsSync(path) ) {
	    fs.readdirSync(path).forEach(function(file,index){
	      var curPath = path + "/" + file;
	      if(fs.lstatSync(curPath).isDirectory()) { // recurse
	        deleteFolderRecursive(curPath);
	      } else { // delete file
	        fs.unlinkSync(curPath);
	      }
	    });
	    fs.rmdirSync(path);
	  }
	}
}

function removePic(group,pic){
	console.log("tratando de eliminar la imagen",pic);
	Group.update(
		{token:group.token},
		{$pull: {images: {picid:pic.picid}}},
		function(err){
			if (!err){
				console.log("pic removed");
				var path = pic.path.replace("/web", "/app/pandicam");
        			fs.exists(path, function(exists) {
                			if(exists) {
                        			fs.unlink(path);
          	      			}
        			});
			}
		});
}

function removeFile(group,file){
	fs.exists(file.path, function(exists) {
        	if(exists) {
        		fs.unlink(file.path);
        	}
        });
	console.log("tratando de eliminar fichero");
	console.log(file);
	group.update({$pull: {files :{filename:file.filename} } },function(err){
		if (err) console.log(err);
	});

}


function removeIndividualPic(group,pic){
	console.log("tratando de eliminar la imagen");
	console.log(pic);
	var path = pic.path.replace("/web", "/app/pandicam");
	fs.exists(path, function(exists) {
    		if(exists) {
    			fs.unlink(path);
    		}
 	});

	group.update({$pull: {images :{picid:pic.picid} } },function(err){
                if (err) console.log(err);
        });




	//group.update({$pull: {images :{picid:pic}}},function(err){
	//	if (err) console.log(err);
	//});
}


function download(uri, filename, group, callback){
	request.head(uri, function(err, res, body){
		console.log('content-type:', res.headers['content-type']);
		console.log('content-length:', res.headers['content-length']);
		request(uri).pipe(fs.createWriteStream(group+'/'+filename)).on('close', callback);
	});
}


///edit later
function uploaded(req, res) {
	var filename = "33.jpg";
	var filePath = path.join(__dirname, '..', '..', 'downloads', filename);
	var stat = fs.statSync(filePath);
	var fileToSend = fs.readFileSync(filePath);
	res.set('Content-Type', 'image/jpeg');
	res.set('Content-Length', stat.size);
	res.set('Content-Disposition', filename);
	res.send(fileToSend);
}

function checkAuth(req,res,next){
	console.log("checking user token");
	console.log(req.headers["authorization"]);
	var usertoken;
	var tokenFromHeader = req.headers["authorization"];
	if (typeof tokenFromHeader !== 'undefined'){
		var token = tokenFromHeader.split(" ")[1];
		req.token = token;
		next()
	}
	else{
		res.send(403)
	}
}

function checkGroupAuth(req,res,next){
	console.log("checking group token");
	var usertoken;
	var tokenFromHeader = req.headers["authorization"];
	if (typeof tokenFromHeader !== 'undefined'){
		var token = tokenFromHeader.split(" ")[1];
		var grouptoken = tokenFromHeader.split(" ")[2];
		req.token = token;
		req.groupToken = grouptoken;
		next()
	}
	else{
		res.send(403)
	}
}
router.route("/test/download")
	.get(function(req,res){
		zipImg('56aa888d112c8d26101fc670',res);
	});

function zipImg(pics,res) {
	console.log("zip creation started");
	var archiver =  require('archiver');
	var zipArchive = archiver('zip');

	zipArchive.pipe(res)
	pics.forEach(function(i){
		var path=i.path.replace('/web','/app/pandicam');
		zipArchive.file(path,{name:i.picid + '.jpeg'});
	})
	zipArchive.finalize();
}

app.use('/api',router);

server.listen(port);

console.log('api started at port' + port);
console.log(' get => /api/users to list users, (authorization required) only for testing, we will change this to make sure only admin can check this');
console.log(' post => /api/users to create user, params username ,password, free bool and email');

console.log('post=> /api/login to enter site, params username and password, will return user info. Most important is user.token\n' +

	'post => api/newGroup : (authorization required) will create a group and return a group token. Params groupName, password, active, pending\n' +

	'get => /api/getGroups (authorization required)\n return the belongsTo association of the user \n' +

	'post => api/group/addUser (authorization required) , add user to group. params token grouptoken on header user \n' +

	'post => /api/group/addPic (group authorization required) params pic. Add a pic to the group. The group is catched ussing the hea');
