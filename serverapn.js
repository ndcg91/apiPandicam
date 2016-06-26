
var config								= require('./modules/config.js');
var User 									= require('./modules/database/user.js');
var Group 								= require('./modules/database/groups.js');
var Email 								= require('./modules/email.js');
var pandicamApn 					= require('./modules/apn.js');
var pandicamRegister 			= require('./modules/register.js');
var pandicamfileManager 	= require('./modules/fileManager.js');
var pandicamUserManagement= require('./modules/userManagement.js');
var pandicamGroupUM 			= require('./modules/groupUserManagement.js');
var pandicamAuth					= require('./modules/authChecker.js');
var pandicamGM 						= require('./modules/groupManagement.js');
var SocketManager  = require('./socket.js');

var router								= config.router;
var multer								= config.multer;
var app										= config.app;
var server								= config.server;
var port									= config.port;
var io 										= config.io;
/*++++++++++++++++++++++++++++++++++++++++++++
****Comment Section Seting the api parameters+
**********************************************/





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
router.route('/backup').post(Email.push)
router.route('/contact').post(Email.contactForm);
router.route('/email/new').post(Email.send);
router.route('/email/contactUs').post(Email.contactUs);
/**********************************
*			END EMAIL FUNCTIONS					*
***********************************/



/**********************************
*			UPLOAD FUNCTIONS		  			*
***********************************/
router.route('/user/upload').post(pandicamAuth.checkGroupAuth,	multer({dest: '/app/pandicam/uploads/'}).single('file'),pandicamfileManager.upload);
router.route('/user/addUserPic').post(pandicamAuth.checkAuth,multer({dest: '/app/pandicam/uploads/'}).single('file'),pandicamfileManager.addUserPic);

	/**********************************
	*		END	UPLOAD FUNCTIONS		 			*
	***********************************/



	/**********************************
	*			USER MANAGEMENT 		  			*
	***********************************/
router.route('/user/get').get(pandicamAuth.checkAuth,pandicamUserManagement.getUser);
router.route('/user/addDeviceId').post(pandicamAuth.checkAuth,pandicamUserManagement.addDeviceId);
router.route("/group/addSelf").post(pandicamAuth.checkAuth,pandicamUserManagement.addGroup);
router.route("/group/removeSelf").post(pandicamAuth.checkAuth,pandicamUserManagement.removeGroup);
router.route("/user/groupPics").get(pandicamAuth.checkAuth,pandicamUserManagement.getPics);
router.route("/group/get").get(pandicamAuth.checkAuth,pandicamUserManagement.getGroup);


	/**********************************
	*		END	USER MANAGEMENT 		  		*
	***********************************/


/*=============================================>>>>>
= Group user MANAGEMENT =
===============================================>>>>>*/
router.route("/group/removeUser").post(pandicamAuth.checkGroupAuth,pandicamGroupUM.removeUser);
router.route("/group/getUsers").get(pandicamAuth.checkGroupAuth,pandicamGroupUM.getUsers);
router.route('/group/blacklist').post(pandicamAuth.checkGroupAuth,pandicamGroupUM.blacklist);
router.route('/group/getblacklist').get(pandicamAuth.checkGroupAuth,pandicamGroupUM.getblacklist);
router.route("/group/whiteList").post(pandicamAuth.checkGroupAuth,pandicamGroupUM.whiteList);
/*= End of Group user MANAGEMENT =*/
/*=============================================<<<<<*/



/*=============================================>>>>>
= Group MANAGEMENT =
===============================================>>>>>*/


router.route("/group/create").post(pandicamAuth.checkAuth,pandicamGM.createGroup);
router.route("/group/delete").get(pandicamAuth.checkGroupAuth,pandicamGM.deleteGroup);
router.route("/group/getPics").get(pandicamAuth.checkGroupAuth,pandicamGM.getPics);
router.route("/group/addFile").post(pandicamAuth.checkGroupAuth,pandicamGM.addFile);
router.route("/pic/remove").post(pandicamAuth.checkGroupAuth,pandicamGM.removePic);
router.route("/file/remove").post(pandicamAuth.checkGroupAuth,pandicamGM.removeFile);


/*= End of Group MANAGEMENT =*/
/*=============================================<<<<<*/





app.use('/api',router);
server.listen(port);
io.on("connection", SocketManager.handleClient);
console.log('api started at port' + port);
