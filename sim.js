var exec = require('child_process').exec;
var SIM_PATH = '"/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Applications/iPhone\ Simulator.app/Contents/MacOS/iPhone\ Simulator" -u "tapjoyDevTest://"';
var WRITE_DEVICE = 'defaults write com.apple.iphonesimulator SimulateDevice -string "*device*"'
var WRITE_OS_7 = 'defaults write com.apple.iphonesimulator currentSDKRoot "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator7.0.sdk"'
var WRITE_OS_6 = 'defaults write com.apple.iphonesimulator currentSDKRoot "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator6.0.sdk"'
var current_sim;

exec('pkill "iPhone Simulator"')

function startSim(device,os){
  exec(WRITE_DEVICE.replace("*device*",device),{},function(err){
    if(err){
      console.log("ERROR setting default deivce",err)
      return;
    }
    var version = os == 7 ? WRITE_OS_7 : WRITE_OS_6
    exec(version,{},function(err){
      if(err){
        console.log("ERROR setting default os",err)
        return;
      }
      if(current_sim){
        current_sim.kill();
      }
      exec('pkill "ios_webkit_debug_proxy"')
      current_sim = exec(SIM_PATH)
    })
  })
}

exports.startSim = startSim
//Left or Right
exports.rotate = function(direction){
  exec("./testsim "+direction,{},function(err,stdout,stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if(err)
      console.log(err)
  })
}