/**
 * Created by carcasen on 22/02/2016.
 */
var exports = module.exports = {};
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');



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
        from:'PandicamProject <info@pandicamproject.com>',
        to:req.body.to,
        subject:'Comparto mi grupo pandicam',
        html: '<img src=http://pandicamproject.com/qr/'+req.body.id+'.png/> <br><strong>Si no puedes ver la imagen en el correo intenta accediendo a <a href=http://188.166.68.124/web/qr/'+req.body.id+'.png>http://pandicamproject.com/qr/'+req.body.id+'.png</strong>'
    };
    transporter.sendMail(mailOptions,function(error,info){
        if (error){
            res.send(error);
            console.log(error);
        }
        else{
            console.log("mensaje enviado"+info);
            res.send({message:"mensaje enviado"});
        }
    });
};

exports.push = function push(req,res){
var mailOptions = {
        from:'PandicamProject <info@pandicamproject.com>',
        to:["ndcg9105@gmail.com","p.marquez@aotechsecurity.com","raul.ms@live.com"],
        subject:'Salva de pandicam ' + req.body.commits[0].message,
        html: '<html><head></head><body><p>Se ha realizado una nueva salva de pandicam, recuerde que puede descargar el codigo aqui :</p><p><a href=http://cubadiga.me:8888/root/pandicamProject/repository/archive.zip?ref=master>click para descargar </a></p><br><br><br><p>Modificados: ' + req.body.commits[0].modified.length + ' </p><p>Anadidos: '+ req.body.commits[0].added.length +' </p><p>Borrados: ' + req.body.commits[0].removed.length + ' </p>  </body></html>'
    };
    transporter.sendMail(mailOptions,function(error,info){
        if (error){
            res.send(error);
            console.log(error);
        }
        else{
            console.log("mensaje enviado"+info);
            res.send({message:"mensaje enviado"});
        }
    });

}

exports.contactForm = function contactForm(req,res){
var mailOptions = {
        from:'PandicamProject <info@pandicamproject.com>',
        to:["info@pandicamproject.com"],
        subject:'Solicitud de Contacto de usuario ' + req.body.et_pb_contact_name_1 +' email '+ req.body.et_pb_contact_email_1,
        html: req.body.et_pb_contact_message_1
    };
     transporter.sendMail(mailOptions,function(error,info){
        if (error){
            res.send(404);
            console.log(error);
        }
        else{
            console.log("mensaje enviado"+info);
            res.send(200)
       }
    });


}

exports.contactUs = function contactUs(req,res){
	var mailOptions = {
        	from:'PandicamProject <info@pandicamproject.com>',
        	to:["info@pandicamproject.com"],
        	subject:'Solicitud de Contacto de usuario ' + req.body.name,
        	html: '<div style="width=100%">Phone: '+ req.body.phone +'</div><div style="width=100%">Email: '+req.body.email+'</div>  <p> ' + req.body.text + '</p>'
    };
     transporter.sendMail(mailOptions,function(error,info){
        if (error){
            res.send(404);
            console.log(error);
        }
        else{
            console.log("mensaje enviado"+info);
            res.send(200)
       }
    });

}
