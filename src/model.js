
var fs = require('fs');
//initialize sqlite db
var sqlite3 = require("sqlite3").verbose();

var file = __dirname + "/../PingValues.db";
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE PingValues (address TEXT, time NUMERIC, delay INTEGER)");
	console.log("Database created.");
  }	
});


module.exports = {
  
  //fetches ping values from db
  getPingValues : function(callback){
    var res = []; 
    db.serialize(function() {
      db.each("SELECT * FROM PingValues",[], function(err, row) {
        if(err){
          console.log(err);
        }else{					
          res.push(row);
        }
      },function(err, nbRows){
          //all calls are done        
          callback(err,res);
        });
    });
  },
  //add ping values array to db
  addPingValues : function(pingValues,callback){  
    db.serialize(function() {
      db.run("BEGIN TRANSACTION");
      var stmt = db.prepare("INSERT INTO PingValues VALUES (?,?,?)");
      for(var i in pingValues){
        var pingValue = pingValues[i];
        stmt.run([pingValue.address ,pingValue.time, pingValue.delay]);
      }
      stmt.finalize();
      db.run("COMMIT");
      callback();
    });
  }
  
};