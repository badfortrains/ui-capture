var express = require('express');
var app = express();
var multer = require('multer');
var exec = require('child_process').exec;
var runner = require('./runner')
var test = []
var simRun;
//var test = new runner.TestSuite("rotate",function(){console.log("testing done")})


app.use(multer({
    dest: './static/uploads/',
    rename: function (fieldname, filename) {
        return filename.replace(/\W+/g, '-').toLowerCase();
    }
}));

app.get('/loaded',function(req,res){
  console.log("Offerwall has loaded");
  res.send(200)
  console.log(simRun)
  if(simRun !== undefined)
    test[simRun].deviceStart();
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

app.get('/run/:name/:id',function(req,res){
  var id = req.params.id,
      name = req.params.name
  var t = new runner.TestSuite(name,id,function(){
    if(simRun == t.runID)
      simRun = undefined;
    delete test[t.runID];
    console.log("All done")
  })
  test[t.runID] = t;
  if(t.isSimulator)
    simRun = t.runID
  res.send(201)
})

app.post('/upload',function(req,res){
  var id = req.body.testID
  test[id].upload(req,res)
})

app.listen(3000);