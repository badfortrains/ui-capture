var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var multer = require('multer');
var exec = require('child_process').exec;
var runner = require('./runner')
var connect = require('connect')
var offers = require('./offers')
var devices = require('./devices')
var test = []
var simRun;
//var test = new runner.TestSuite("rotate",function(){console.log("testing done")})

exec('ios_webkit_debug_proxy');

app.use(connect.urlencoded());
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

app.use(express.static(__dirname + '/public'));

app.post('/run/:name/:id',function(req,res){
  var options = {
    name: req.params.name,
    id: req.params.id,
    urls: req.body.urls,
    devices: req.body.devices
  }
  console.log(options)
  var t = new runner.TestSuite(options,function(){
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

app.get('/offers',function(req,res){
  offers.getAll(function(err,data){
    if(err){
      res.send(500,err);
    }else{
      res.send(data)
    }
    
  })
})

app.post('/offers',function(req,res){
  var desc = req.body.description,
      type = req.body.type,
      offer_id = req.body.offer_id;

  console.log(req.body)
  if(desc && type && offer_id)
    offers.insert(offer_id,desc,type,function(err){
      if(err){
        console.log(err)
        res.send(500);
      }else{
        res.send({id:this.lastID})
      }
    })
  else
    res.send(500);
})

app.delete('/offers/:id',function(req,res){
  var del = offers.db.prepare("DELETE FROM offers WHERE id=?")
  del.run(req.params.id,function(err){
    if(err)
      res.send(500,err);
    else
      res.send(200)
  })
})

app.get('/devices',devices.all);

io.sockets.on('connection', function (socket) {
  socket.on('run', function (options) {
    console.log(options)
    options.socket = socket;
    var t = new runner.TestSuite(options,function(){
      if(simRun == t.runID)
        simRun = undefined;
      delete test[t.runID];
      console.log("All done")
    })
    test[t.runID] = t;
    if(t.isSimulator)
      simRun = t.runID
  });
});


server.listen(3000);