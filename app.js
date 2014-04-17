var express = require('express');
var app = express();
var multer = require('multer');
var exec = require('child_process').exec;
var runner = require('./runner')
var test = new runner.TestSuite("timeout",function(){console.log("testing done")})

app.use(multer({
    dest: './static/uploads/',
    rename: function (fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase();
    }
}));

app.get('/loaded',function(req,res){
  console.log("Offerwall has loaded");
  res.send(200)
  test.deviceStart();
})

app.get('/started',function(req,res){
  console.log("app has started");
  res.send(200)
  var proxy = exec('ios_webkit_debug_proxy',{},function(err,stdout,stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if(err)
      console.log(err)
  })
})

app.post('/upload',test.upload.bind(test))

app.listen(3000);