var Chrome = require('chrome-remote-interface'),
    sim = require('./sim'),
    fs = require('fs'),
    http = require('http'),
    TestsIDS = 0;


function chooseDebugger(id,callback){
  http.get("http://localhost:9221/json",function(res){
    str = ""
    res.on('data',function(chunk){
      str += chunk;
    })
    res.on('end', function(){
      var devices = JSON.parse(str);
      var port = 9222
      for(var i=0;i<devices.length;i++){
        if(devices[i].deviceId == id){
          getLastTab({port:devices[i].url.replace("localhost:","")},callback)
          return;
        }
        port++;
      }
      //We couldn't find the device we wanted, assume it is on the next free port
      getLastTab({port:port},callback)
    })
  })
}

function getLastTab(options,callback){
  options = {
    chooseTab:function(tabs){
      //assume the last tab is always the one we want
      return tabs.length -1;
    },
    port: options.port || 9222 
  }
  Chrome(options,callback
    ).on("error",function(err){
      console.log(err)
    })
}


function TestSuite(options,callback){ 
  this.TEST_URLS = options.urls;
  this.DEVICES = options.devices
  this.runID = TestsIDS++;
  this.deviceIndex = -1;
  this.isRunning = true
  this.folderName = options.name;
  this.finishedCallback = callback
  this.currentOffer = -1
  this.socket = options.socket


  this.nextDevice();
  fs.mkdir("./public/tests/"+options.name)
}

TestSuite.prototype.isSimulator = function(){
  return this.DEVICES[this.deviceIndex].id == "SIMULATOR"
}

TestSuite.prototype.nextDevice = function(){
  console.log("next device")
  this.deviceIndex++
  this.currentOffer = -1
  //done with the test
  if(this.deviceIndex >= this.DEVICES.length){
    this.isRunning = false
    this.socket.emit("done")
    this.finishedCallback && this.finishedCallback()
    return
  }else if(this.DEVICES[this.deviceIndex].id == "SIMULATOR"){
    sim.startSim(this.DEVICES[this.deviceIndex].name,this.DEVICES[this.deviceIndex].os)
  }else{
    this.deviceStart()
  }
}


TestSuite.prototype.deviceStart = function(){
  if(this.isRunning)
    chooseDebugger(this.DEVICES[this.deviceIndex].id,function(chrome){
      chrome.on('Page.loadEventFired',this.pageLoad.bind(this))
      chrome.Page.enable();
      chrome.Runtime.enable();
      this.chrome = chrome

      if(!this.isSimulator()){
        this.pageLoad()
      }
    }.bind(this))
}

TestSuite.prototype.pageLoad = function(){
  if(this.currentOffer == -1){
    this.chrome.Page.navigate({'url': this.TEST_URLS[0].url})
    this.currentOffer++
  }else{
    //can only rotate the simulator
    if(this.isSimulator())
      this.chrome.Runtime.evaluate({expression:"var ad = new Tapjoy.AdUnit({});$(document).on('resize',function(){setTimeout(function(){ad.bridge.send('takeScreenShot',{testID:"+this.runID+",orientation: $(window).width() > $(window).height() ? 'landscape' : 'portrait',uploadUrl:'http://10.10.18.175:3000/upload'},function(){})},500)})"},function(){
         sim.rotate("Right")
      })
    else
      this.chrome.Runtime.evaluate({expression:"var ad = new Tapjoy.AdUnit({});ad.bridge.send('takeScreenShot',{testID:"+this.runID+",orientation: $(window).width() > $(window).height() ? 'landscape' : 'portrait',uploadUrl:'http://10.10.18.175:3000/upload'})"});
  }
}

TestSuite.prototype.upload = function(req,res){
  if(!this.isRunning)
    return;

  var fileString = this.DEVICES[this.deviceIndex].name+"_"+(this.DEVICES[this.deviceIndex].os||"")+"_"+req.body.orientation+"_"+this.TEST_URLS[this.currentOffer].name
  var filePath = '/tests/'+this.folderName+'/'+fileString+'.jpeg'
  filePath = filePath.replace(/ /g,"_")
  console.log('./public'+filePath)
  fs.rename(req.files.file.path,'./public'+filePath,function(err){
    if(err){
      console.log(err);
    }else{
      console.log(req.body.orientation)
      console.log("upload",this.currentOffer)
      this.socket.emit("screenshot",{filePath: filePath})
      if(req.body.orientation == 'landscape'){
          console.log("rotate left")
          sim.rotate("Left")
      }else{
        this.socket.emit("progress",{index:this.deviceIndex})
        this.currentOffer++
        if(this.currentOffer < this.TEST_URLS.length){
          console.log("go to offer",this.currentOffer)
          this.chrome.Page.navigate({'url': this.TEST_URLS[this.currentOffer].url})
        }else
          this.nextDevice()      
      }
      res.send(201)
    }
  }.bind(this))

}

exports.TestSuite = TestSuite;
