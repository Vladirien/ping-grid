//importation des modules
var bodyParser =  require('body-parser');
var serveStatic = require('serve-static');
var tcpp = require('tcp-ping');
var express= require("express");
var model = require(__dirname + "/src/model.js");

var config = require(__dirname + "/serverConfig.json");

var sockets = [];
var pingValuesBuffer = [];

//initialize express app
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

//static routes
app.use("/",express.static(__dirname + '/static', {'index': ['index.html']}));


//get ping values
app.get("/pingvalues",function (req, res) {	
  model.getPingValues(function(err,data){
    if(err){
      console.log("Database error");
      console.log(err);
      res.statusCode=500;
      res.send({code: 500, err : err});
    }else{
      res.statusCode=200;
      data = data.concat(pingValuesBuffer);//also add values that are not yet stored in the base 
      res.send({code: 200, data : data});
    }
    
  });
});

//ping all hosts in config and add value to db
var pingAllHosts = function(){
  for(var i =0, l = config.HOSTS.length;i<l;i++){
    tcpp.ping({ address: config.HOSTS[i].address ,port : config.HOSTS[i].port, timeout : config.TIMEOUT, attempts : 1 }, function(err, data) {
      var delay;
      if(err||!data.results||data.results[0].err){
        var delay = -1;
      }else{
        var delay = Math.round(data.results[0].time);
      }
      var time = Date.now();
      var pingValue = {address : data.address+":"+data.port, delay : delay, time : time};
      console.log(pingValue.time+" : "+pingValue.address+"   -   "+pingValue.delay);
      pingValuesBuffer.push(pingValue);
      for(i in sockets){
        sockets[i].emit('pingValue',pingValue);
      }
    });
  }  
}

//add all ping values in buffer and empties it
var addPingValuesInBuffer = function(){
  //empty 1st buffer to avoid data loss during inserts  
  var currentBuffer = [];
  for(i in pingValuesBuffer){
    currentBuffer.push(pingValuesBuffer[i]); 
  }  
  pingValuesBuffer = [];
  //save the ping values
  model.addPingValues(currentBuffer,function(){    
    console.log("Ping values saved");  
  });
  
  
}

io.on('connection', function(socket){
  sockets.push(socket);
  console.log('a user connected');
  io.on('disconnect',function(){
    console.log('user disconnected')
    sockets.slice(sockets.indexOf[socket]);
  })
});

//ping all hosts on some interval...
setInterval(pingAllHosts,config.PING_INTERVAL);

//but save data on db on a larger interval to reduce disk usage
setInterval(addPingValuesInBuffer,config.PING_INTERVAL*10);

http.listen(config.PORT, function(){
  console.log('app started');
});