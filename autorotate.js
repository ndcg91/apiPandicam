var fs = require('fs');
var gm = require('gm');

//reading files inside uploads
fs.readdir('/app/pandicam/uploads', (err, data) => {
  if (err) throw err;
  data.forEach( function(element, index) {
    // statements
    if (fs.lstatSync('/app/pandicam/uploads/'+ element).isDirectory()){
      fs.stat('/app/pandicam/uploads/'+ element+'/images', (err, data) => {
        if (!err){
          fs.readdir('/app/pandicam/uploads/'+ element+'/images', (err, data) =>{
          if (err) throw err;
          data.forEach( function(imageElement, index) {
            gm('/app/pandicam/uploads/'+ element+'/images/' + imageElement).autoOrient().write('/app/pandicam/uploads/'+ element+'/images' + imageElement, (err) => {
              if (!err) console.log("done")
	      else console.log(err);
            })
          });
        });
        }
      })
    }
  });
});
