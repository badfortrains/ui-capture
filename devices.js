var DEVICES = [
  {
    name: "iPhone",
    id: "SIMULATOR",
    os: 6
  },
  {
    name: "iPhone Retina (4-inch)",
    id: "SIMULATOR",
    os: 7
  },
  {
    name: "iPhone Retina (4-inch)",
    id: "SIMULATOR",
    os: 6
  },
  {
    name: "iPhone Retina (3.5-inch)",
    id: "SIMULATOR",
    os: 7
  },
  {
    name: "iPhone Retina (3.5-inch)",
    id: "SIMULATOR",
    os: 6
  },
  {
    name: "iPad",
    id: "SIMULATOR",
    os: 7
  },
  {
    name: "iPad",
    id: "SIMULATOR",
    os: 6
  },
  {
    name: "iPad Retina",
    id: "SIMULATOR",
    os: 7
  },
  {
    name: "iPad Retina",
    id: "SIMULATOR",
    os: 6
  }
];


var http = require("http")

exports.all = function(req,response){
  http.get("http://localhost:9221/json",function(res){
    str = ""
    res.on('data',function(chunk){
      str += chunk;
    })
    res.on('end', function(){
      var realDevices = JSON.parse(str);
      var port = 9222
      var deviceList = DEVICES.slice(0)
      for(var i=0;i<realDevices.length;i++){
        if(realDevices[i].deviceId != "SIMULATOR"){
          deviceList.push({
            name: realDevices[i].deviceName,
            id: realDevices[i].deviceId
          })
        }
      }
      response.send(deviceList)
    })
  }).on("error",function(){
    response.send(DEVICES)
  })
}