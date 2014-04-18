var Chrome = require('chrome-remote-interface'),
    completeUrl = "/videos/OFFERID/complete",
    params = "?action=webpage&ad_tracking_enabled=true&ad_view_id=41fd482e-ef59-4402-ab9a-8707dd470eee&advertising_id=3586ace381b04d5ea34e8f0a0f10075e&algorithm=324&algorithm_options[skip_country]=true&algorithm_options[skip_currency]=true&app_id=13b0ae6a-8516-4405-9dcf-fe4e526486b2&app_version=1.0&bridge_version=1.0.3&connection_type=wifi&controller=get_offers&country_code=US&currency_id=13b0ae6a-8516-4405-9dcf-fe4e526486b2&currency_selector=0&device_location=true&device_name=x86_64&device_type=iPhone+Simulator&display_multiplier=1.000000&exp=short_list_control&identifiers_provided=&impression_id=26ddd0bf-7c69-4061-8ac2-bf2351c680d6&install_id=2546BC97-6989-474F-AE4C-48767CCCBE60-73283-000106A057180D7B&lad=0&language_code=en&library_revision=8b68cf&library_version=10.0.0&mac_address=7cd1c3db3ceb&offer_id=b34ba460-aceb-477a-9c30-5f1c78b75272&offers_in_premium_feed=&offerwall_rank=1&os_version=6.0&platform=iOS&plugin=native&premium_feed_rank=&publisher_user_id=3586ace381b04d5ea34e8f0a0f10075e&sdk_type=event&session_id=99bb757dbef06db7cabb6040d83e486e57c7909be40b0ce9139fc7a6f2b80503&sha1_mac_address=353be8ef8df33087b1b720a133daecd42484e318&source=offerwall&store_view=true&threatmetrix_session_id=c98387e00ef34e848948056b9a5148e0&timestamp=1390429456&udid=3586ace381b04d5ea34e8f0a0f10075e&udid_is_temporary=false&udid_lookup_via=params&udid_via_lookup=false&verifier=3143b0ec35ed324d49d033eb74c866d8ce08d155330abef826ed9f9ac42aff32&view_id=short_list_control",
    offers = { 
      //"b34ba460-aceb-477a-9c30-5f1c78b75272": "complete 2 secondary, no creative",
      //"ff070656-3197-4cf5-a258-98370ecdff50": "complete no end card creative"
      // "f578f935-63b0-4124-a37a-8b95a26ed2aa": "complete deprecated end card creative no brand logo",
      // "fbfe7fa4-53d4-44ff-a2a2-e4e6d9198a1d": "complete deprecated end card creative, brand logo",
       "fedc1682-559a-4b15-80fb-6f0a2ab0cddf": "complete deprecated end card creative, big brand logo",
       "878c999a-4965-4e05-b3ec-ccdf1ddd34dc": "complete new end card creative"
      // "e9bea55c-a084-41a0-b6b1-d3c6e9ff5e09": "geo location",
      // "3a3a307f-b80b-436a-b64d-4762965a3147": "third party vast",
      // "a89f6c1f-7215-4cce-af5a-2fec0261c5fd": "complete new end card creative tall brand logo",
      // "8956a37a-0d70-4ee3-b264-bb1d2f05a170": "complete 2 buttons, end creative"
    },
    TEST_URLS = [],
    //DEVICES = ["iPhone","iPhone Retina (3.5-inch)","iPhone Retina (4-inch)","iPad","iPad Retina"],
    DEVICES = ["iPhone Retina (3.5-inch)","iPhone Retina (4-inch)","iPad"]
    sim = require('./sim'),
    fs = require('fs');

for(var o in offers){
  TEST_URLS.push({
    name: offers[o].replace(" ","_"),
    url: 'https://ws.tapjoyads.com/'+completeUrl.replace("OFFERID",o)+params + "&offer_id="+o
  })
}



function getLastTab(callback){
  Chrome({
      chooseTab:function(tabs){
        return tabs.length -1;
      }
    },callback
    ).on("error",function(err){
      console.log(err)
    })
}


function TestSuite(name,callback){
  this.deviceIndex = -1;
  this.osVersion = 7;
  this.isRunning = true
  this.folderName = name;
  this.finishedCallback = callback
  this.currentOffer = -1
  this.nextDevice();

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
    getLastTab(function(chrome){
      chrome.on('Page.loadEventFired',this.pageLoad.bind(this))
      chrome.Page.enable();
      chrome.Runtime.enable();
      this.chrome = chrome
    }.bind(this))
}

TestSuite.prototype.pageLoad = function(){
  if(this.currentOffer == -1){
    this.chrome.Page.navigate({'url': TEST_URLS[0].url})
    this.currentOffer++
  }else{
    console.log("TAKE THE SCREENSHOT",this.currentOffer)
    this.chrome.Runtime.evaluate({expression:"var ad = new Tapjoy.AdUnit({});$(document).on('resize',function(){ad.bridge.send('takeScreenShot',{orientation: $(window).width() > $(window).height() ? 'landscape' : 'portrait'},function(){})})"},function(){
      sim.rotate("Right")
    })
    
  }
}

TestSuite.prototype.upload = function(req,res){
  if(!this.isRunning)
    return;

  var fileString = DEVICES[this.deviceIndex]+"_"+this.osVersion+"_"+req.body.orientation+"_"+TEST_URLS[this.currentOffer].name
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
        if(this.currentOffer < TEST_URLS.length){
          console.log("go to offer",this.currentOffer)
          this.chrome.Page.navigate({'url': TEST_URLS[this.currentOffer].url})
        }else
          this.nextDevice()      
      }
      res.send(201)
    }
  }.bind(this))

}

exports.TestSuite = TestSuite;
