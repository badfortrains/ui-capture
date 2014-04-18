var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var multer = require('multer');
var exec = require('child_process').exec;
var runner = require('./runner')
var connect = require('connect')
var offers = require('./offers')
var test = []
var simRun;
//var test = new runner.TestSuite("rotate",function(){console.log("testing done")})

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

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


server.listen(3000);