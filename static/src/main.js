var raw_pingValues = [];
var sorted_data = {};
var displayConfig = {
  thresholds : {
    30 : {color : "#00FF00"},
    40 : {color : "#88FF00"},
    70 : {color : "#EEDD00"},
    100 : {color : "#FFAA00"},
    200 : {color : "#FF6600"},
  }, 
  overThreshold : {color : "#FF3300"},
  error : {color : "#FF0000"},
  timePerX : 1000*60*3,
  width : 900,
  xMargin : 75,
  yMargin : 100,
  elementSize : 25,
  xRange : 35,
  colorBoost : 3.0
}

//returns pretty and fitting format for y axis dates
function get_date_label(index){
  var date = new Date(index * displayConfig.timePerX);
  
  var hours = date.getHours();
  if(hours < 10){
    hours = "0"+hours;
  }
  var minutes = date.getMinutes();
  if(minutes < 10){
    minutes = "0"+minutes;
  }
  
  var label = hours+":"+minutes;
  
  if(displayConfig.timePerX <= 1000*60){
    var seconds = date.getSeconds();
    if(seconds < 10){
      seconds = "0"+seconds;
    }
    label = label + ":"+seconds;
  }
  
  return label;
}

//fecthes data from ajax call to api
function get_data(callback){
    var xmlhttp;			
    xmlhttp=new XMLHttpRequest();
    xmlhttp.onreadystatechange=function(){
        if (xmlhttp.readyState==4 && xmlhttp.status==200){
            var res=JSON.parse(xmlhttp.responseText);
            if(res.code==200){
                callback(null,res.data);
                
            }else{
              callback("No data",null)
            }

        }
     }
    xmlhttp.open("GET","/pingvalues?from="+0+"&to="+0,true);
    xmlhttp.send();
}

function sort_new_value(sorted_data, data){
  var timeIndex = Math.round(data.time/displayConfig.timePerX);
  if(sorted_data.index.indexOf(timeIndex)===-1){
    sorted_data.index.push(timeIndex);
    sorted_data.data[timeIndex]={};
    for(var j in displayConfig.thresholds){
      sorted_data.data[timeIndex][j]=0;
    }
    sorted_data.data[timeIndex].error=0;
    sorted_data.data[timeIndex].overThreshold=0;
    sorted_data.data[timeIndex].count=0;
  }
  sorted_data.data[timeIndex].count++;
  var isOut = false;
  if(data.delay === -1){
    sorted_data.data[timeIndex].error++;
    isOut=true;
  }else{
    for(var j in displayConfig.thresholds){      
      if(data.delay < j){
        sorted_data.data[timeIndex][j]++;
        isOut=true;
        break;
      }
    }
  }    
  if(!isOut){
    sorted_data.data[timeIndex].overThreshold++;
  }
  return sorted_data;
}

//sorts data to fit grid display structure
function sort_data(raw_data){
  var sorted_data = {index : [],data : {}};
  for(var i in raw_data){
    var data = raw_data[i];
    sorted_data = sort_new_value(sorted_data,data);
    
  }
  return sorted_data;
}

function draw_grid(sorted_data){
  var thresholds = [];
  var lastThreshold;
  for(var j in displayConfig.thresholds){
    thresholds.push({value : j, label: j, color : displayConfig.thresholds[j].color});
    lastThreshold = j;
  }
  thresholds.push({value : "overThreshold", label : ">" + lastThreshold, color : displayConfig.overThreshold.color});
  thresholds.push({value : null, label : ""});
  thresholds.push({value : "error", label : "Error", color : displayConfig.error.color});
  var thresholdCount = thresholds.length;
  var maxHeight = thresholdCount * displayConfig.elementSize+displayConfig.yMargin;
  var grid = d3.select(".ping-grid")
      .attr("width", displayConfig.width)
      .attr("height", maxHeight);
  
  var currentX = Math.round(Date.now()/displayConfig.timePerX);
  console.log(thresholds);
  //add y labels
  grid.selectAll('text')
    .data(thresholds,function(d){return d})
    .enter()
    .append("text")
    .text(function(d){
      return d.label;
    })
    .attr("text-anchor","middle")
    .attr("x",displayConfig.width-displayConfig.xMargin+displayConfig.elementSize)
    .attr("y",function(d,i){    
      return maxHeight - (i+0.25)*displayConfig.elementSize;
    });
  
  //add x labels 
  grid.selectAll('text')
    .data(sorted_data.index.filter(function(d){return currentX - d<displayConfig.xRange;}),function(d){return d})    
    .enter()
    .append("text")
    .text(function(d){
      return get_date_label(d);
    })
    .attr("text-anchor","end")
    .attr("x",function(d){
      return displayConfig.width - (displayConfig.xMargin + (currentX - d +0.75)*displayConfig.elementSize);
    })
    .attr("y",function(d){    
      return displayConfig.yMargin;
    })  
    .attr("transform",function(d){
      var el = d3.select(this);
      return "rotate(75, "+el.attr("x")+","+el.attr("y")+")";
    });
  //create the grid itself
  for(var i = 0; i<displayConfig.xRange;i++){
   var xPos = displayConfig.width-(i+1)*displayConfig.elementSize - displayConfig.xMargin;
    var x = d3.scaleLinear()
      .range([0, 1]);
    var currentXData = null;
    if(sorted_data.index.indexOf(currentX)!=-1){
      currentXData = sorted_data.data[currentX];
      x = x.domain([0, currentXData.count])
    }else{
      x = x.domain([0, 0]);
    }
    var height = maxHeight - displayConfig.elementSize;
    for(var j in thresholds){
      if(thresholds[j].value != null){
        grid.append("rect")
        .attr("width",displayConfig.elementSize)
        .attr("height",displayConfig.elementSize)
        .attr("fill",function(d){
          if(currentXData !=null){
            //set color saturation depending on value proportion in timespan
            return one.color(thresholds[j].color)
              .saturation(Math.min(x(currentXData[thresholds[j].value])*displayConfig.colorBoost,1))
              .hex();
          }else{
            return "#ffffff";
          }})
        .attr("x",xPos)
        .attr("y",height);
      }      
      
      height = height - displayConfig.elementSize;
    } 
    
    currentX--;
  }
  
}

function clear_grid(){
    var chart = d3.select(".ping-grid").selectAll("*").remove();
}

window.onload = function(e){
  
  
  get_data(function(err,data){
    raw_pingValues = data;
    sorted_data = sort_data(raw_pingValues);
    draw_grid(sorted_data);
    var socket = io();
    socket.on('pingValue', function(value){
      console.log(value);
      raw_pingValues.push(value);
      sorted_data = sort_new_value(sorted_data,value);
    });
  });
  
  setInterval(function(){
    //sorted_data = sort_data(raw_pingValues);
    clear_grid();
    draw_grid(sorted_data);
  },displayConfig.timePerX);
  
}