var Chrome = require('chrome-remote-interface'),
    //DEVICES = ["iPhone","iPhone Retina (3.5-inch)","iPhone Retina (4-inch)","iPad","iPad Retina"],
    DEVICES = ["iPhone Retina (3.5-inch)","iPhone Retina (4-inch)","iPad"]
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
  console.log(options)
  options = {
    chooseTab:function(tabs){
      //assume the last tab is always the one we want
      return tabs.length -1;
    },
    port: options.port || 9222 
  }
  console.log(options)
  Chrome(options,callback
    ).on("error",function(err){
      console.log(err)
    })
}


function TestSuite(name,id,TEST_URLS,callback){
  this.TEST_URLS = TEST_URLS;
  this.runID = TestsIDS++;
  this.deviceId = id
  this.isSimulator = this.deviceId == "SIMULATOR"
  this.deviceIndex = -1;
  this.osVersion = 7;
  this.isRunning = true
  this.folderName = name;
  this.finishedCallback = callback
  this.currentOffer = -1
  if(this.isSimulator )
    this.nextDevice();
  else{
    this.deviceStart()
    this.deviceIndex = DEVICES.length;
    this.osVersion = 6;
  }
  fs.mkdir("./tests/"+name)
}

TestSuite.prototype.nextDevice = function(){
  console.log("next device")
  this.deviceIndex++
  this.currentOffer = -1
  //switch os and reset devices
  if(this.deviceIndex >= DEVICES.length && this.osVersion == 7){
    this.osVersion = 6
    this.deviceIndex = 0
  }

  //done with the test
  if(this.deviceIndex >= DEVICES.length && this.osVersion == 6){
    this.isRunning = false
    this.finishedCallback && this.finishedCallback()
    return
  }else{
    sim.startSim(DEVICES[this.deviceIndex],this.osVersion)
  } 
}


TestSuite.prototype.deviceStart = function(){
  if(this.isRunning)
    chooseDebugger(this.deviceId,function(chrome){
      chrome.on('Page.loadEventFired',this.pageLoad.bind(this))
      chrome.Page.enable();
      chrome.Runtime.enable();
      this.chrome = chrome

      if(!this.isSimulator){
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
    if(this.isSimulator)
      this.chrome.Runtime.evaluate({expression:"var ad = new Tapjoy.AdUnit({});$(document).on('resize',function(){ad.bridge.send('takeScreenShot',{testID:"+this.runID+",orientation: $(window).width() > $(window).height() ? 'landscape' : 'portrait',uploadUrl:'http://10.10.18.175:3000/upload'},function(){})})"},function(){
         sim.rotate("Right")
      })
    else
      this.chrome.Runtime.evaluate({expression:"var ad = new Tapjoy.AdUnit({});ad.bridge.send('takeScreenShot',{testID:"+this.runID+",orientation: $(window).width() > $(window).height() ? 'landscape' : 'portrait',uploadUrl:'http://10.10.18.175:3000/upload'})"});
  }
}

TestSuite.prototype.upload = function(req,res){
  if(!this.isRunning)
    return;

  var fileString = DEVICES[this.deviceIndex]+"_"+this.osVersion+"_"+req.body.orientation+"_"+this.TEST_URLS[this.currentOffer].name
  console.log(req.body)
  fs.rename(req.files.file.path,'./tests/'+this.folderName+'/'+fileString.replace(" ","_")+'.jpeg',function(err){
    if(err){
      console.log(err);
    }else{
      console.log(req.body.orientation)
      console.log("upload",this.currentOffer)
      if(req.body.orientation == 'landscape'){
          console.log("rotate left")
          sim.rotate("Left")
      }else{
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
