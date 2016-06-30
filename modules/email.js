/**
 * Created by carcasen on 22/02/2016.
 */
var exports       = module.exports = {};
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var ejs           = require('ejs');


var transporter = nodemailer.createTransport({
    host: 'mail.pandicamproject.com',
    auth: {
        user: 'info@pandicamproject.com',
        pass: 'TemporaL1718'
    },
    tls: {rejectUnauthorized: false}
});


exports.send = function send(req,res){
    var mailOptions = {
      ejs.render('./templates/shareGroup.ejs', req, function(err, str){
        from:'PandicamProject <info@pandicamproject.com>',
        to:req.body.to,
        subject:'Comparto mi grupo pandicam',
        html: str
      }
    });
    sendEmail(res,mailOptions);
};

exports.push = function (req,res){
var mailOptions = {
        from:'PandicamProject <info@pandicamproject.com>',
        to:["ndcg9105@gmail.com","p.marquez@aotechsecurity.com","raul.ms@live.com"],
        subject:'Salva de pandicam ' + req.body.commits[0].message,
        html: '<html><head></head><body><p>Se ha realizado una nueva salva de pandicam, recuerde que puede descargar el codigo aqui :</p><p><a href=http://cubadiga.me:8888/root/pandicamProject/repository/archive.zip?ref=master>click para descargar </a></p><br><br><br><p>Modificados: ' + req.body.commits[0].modified.length + ' </p><p>Anadidos: '+ req.body.commits[0].added.length +' </p><p>Borrados: ' + req.body.commits[0].removed.length + ' </p>  </body></html>'
    };
    sendEmail(res,mailOptions);
}

exports.register = function(res,user){
  ejs.render('./templates/registered.ejs', user.username, function(err, str){
    var mailOptions = {
      from:'PandicamProject <info@pandicamproject.com>',
      to:user.email,
      subject: 'Bienvenido a Pandicam!',
      html:str
    }
    sendEmail(res,mailOptions);
  });
}


exports.contactForm = function contactForm(req,res){
  var mailOptions = {
    from:'PandicamProject <info@pandicamproject.com>',
    to:["info@pandicamproject.com"],
    subject:'Solicitud de Contacto de usuario ' + req.body.et_pb_contact_name_1 +' email '+ req.body.et_pb_contact_email_1,
    html: req.body.et_pb_contact_message_1
  };
  sendEmail(req,mailOptions);
}

exports.contactUs = function contactUs(req,res){
  ejs.render('./templates/userContact.ejs', req, function(err, str){
  	var mailOptions = {
    	from:'PandicamProject <info@pandicamproject.com>',
    	to:["info@pandicamproject.com"],
    	subject:'Solicitud de Contacto de usuario ' + req.body.name,
    	html: str
    };
  });
  sendEmail(req,mailOptions);
}



func sendEmail(res,mailOptions){
  transporter.sendMail(mailOptions,function(error,info){
      if (error){
          res.send(error);
          console.log(error);
      }
      else{
          console.log("mensaje enviado");
          res.send({message:"mensaje enviado"});
      }
  });
}
