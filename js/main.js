// var scale =  10;
// var fraction = 20;

var scale =  25;
var fraction = 15;


var markerMap = [];
var startingPoints = null;
var canvasContext = null;
var img = null;
var imageContext = null;

$(document).ready(function () {
  initSeed();

  $(document).keypress(function (e) {
  if (e.which == 13) {
    iterateSeedGrowing();
    return false;    //<---- Add this line
  }
});
});

function initSeed() {
  scale = $('#scale').val();
  fraction = $('#seeds').val();
  canvasContext = document.getElementById('applet');
  if (canvasContext.getContext) {
    canvasContext = canvasContext.getContext('2d');
    canvasContext.clearRect(0, 0, 100000 , 100000);

    //Loading of the home test image - img
    img = new Image();

    //drawing of the test image - img
    img.onload = function () {
      //draw background image
      canvasContext.imageSmoothingEnabled= false;
      canvasContext.drawImage(img, 0, 0,scale * img.width, scale * img.height);

      // render image in offscreen canvas to get RGB values
      var offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      imageContext = offscreenCanvas.getContext('2d');
      imageContext.drawImage(img, 0, 0);

      // build marker map
      for(var i=0;i<img.width;i++) {
        markerMap[i] = [];
      }

      // generate starting points
      startingPoints = setStartingPoints(img.width,img.height,fraction);
      drawPoints(canvasContext,startingPoints,'#33F');
    };

    img.src = 'images/simple1.jpg';
  }
}

function iterateSeedGrowing() {
  // for all starting points
  for(var startingPoint of startingPoints) {
    // draw regions
    drawRectangles(canvasContext,startingPoint.region,startingPoint.regionColor);

    // get neighbours
    var neightbourPixels = getNeighbourPixel(startingPoint, img.width,img.height);
    drawPoints(canvasContext,neightbourPixels,shadeBlendConvert(0.5,startingPoint.regionColor));
    // setTimeout(drawPoints,250,canvasContext,neightbourPixels,shadeBlendConvert(0.5,startingPoint.regionColor));
    // console.log(neightbourPixels);

    // get the next region pixel
    var regionLuminance = getRegionLuminance(imageContext,startingPoint.region);
    var mostSimiliarPixel = null;
    var currentLuminanceDifference = 0;

    // get smallest luminance difference
    for(var neightbourPixel of neightbourPixels) {
      // set initial pixel
      if(mostSimiliarPixel == null) {
        mostSimiliarPixel = neightbourPixel;
        currentLuminanceDifference = Math.abs(regionLuminance-getLuminance(imageContext,mostSimiliarPixel.x,mostSimiliarPixel.y));
      } else {
        // check every neighbour for smallest distance
        var luminanceDifference = Math.abs(regionLuminance-getLuminance(imageContext,neightbourPixel.x,neightbourPixel.y));
        if(luminanceDifference < currentLuminanceDifference) {
          // set new difference
          mostSimiliarPixel = neightbourPixel;
          currentLuminanceDifference = luminanceDifference;
        }
      }
    }
    // -> new nearest pixel found 'mostSimiliarPixel'
    startingPoint.region.push(mostSimiliarPixel);
    markerMap[mostSimiliarPixel.x][mostSimiliarPixel.y] = startingPoint; // save starting point/region for faster access
    // drawRectangles(canvasContext,[mostSimiliarPixel],startingPoint.regionColor);
    setTimeout(drawRectangles,3000,canvasContext,[mostSimiliarPixel],startingPoint.regionColor);
    // break;
  }
}

function checkIfPointIsInMarkerMap(point) {
  if(markerMap[point.x][point.y]) {
    return true;
  } else {
    return false;
  }
}

function getRegionLuminance(imageContext,region) {
  var luminance = 0;
  for(var point of region) {
    luminance += getLuminance(imageContext,point.x,point.y);
  }
  return luminance/region.length;
}

function getLuminance(imageContext,x,y) {
  return (imageContext.getImageData(x, y, 1, 1).data[0] + imageContext.getImageData(0, 0, 1, 1).data[1] + imageContext.getImageData(0, 0, 1, 1).data[2])/3;
}

function getNeighbourPixel(startingPoint, width, height) {
  // console.log(startingPoint);
  var result = [];

  // for whole region
  for(var regionPoint of startingPoint.region) {
    var neighbourPixels = [];
    // neighbourPixels.push({x:regionPoint.x-1,y:regionPoint.y-1}); // top left
    neighbourPixels.push({x:regionPoint.x+0,y:regionPoint.y-1}); // top middle
    // neighbourPixels.push({x:regionPoint.x+1,y:regionPoint.y-1}); // top right
    neighbourPixels.push({x:regionPoint.x-1,y:regionPoint.y+0}); // middle left
    neighbourPixels.push({x:regionPoint.x+1,y:regionPoint.y+0}); // middle right
    // neighbourPixels.push({x:regionPoint.x-1,y:regionPoint.y+1}); // bottom left
    neighbourPixels.push({x:regionPoint.x+0,y:regionPoint.y+1}); // bottom middle
    // neighbourPixels.push({x:regionPoint.x+1,y:regionPoint.y+1}); // bottom right
    // console.log(neighbourPixels);

    // for all new neighbours
    for(var neighbourPixel of neighbourPixels) {
      // check if in boundary of image and if not already in region
      if(checkIfPointIsInBoundary(neighbourPixel) && !checkIfPointIsInArray(neighbourPixel,startingPoint.region) && !checkIfPointIsInMarkerMap(neighbourPixel)) {
        result.push(neighbourPixel);
      }
    }
    // console.log(result);
  }
  return result;

  function checkIfPointIsInBoundary(point) {
    if(point.x < width && point.x >= 0 && point.y < height && point.y >= 0) return true;
    return false;
  }

  function checkIfPointIsInArray(point,array) {
    for(var arrayPoint of array) {
      if(arrayPoint.x == point.x && arrayPoint.y == point.y) return true;
    }
    return false;
  }
}

function drawPoints(ctx,listOfPoints,color) {
  for(var point of listOfPoints) {
    var radius = scale/6;
    ctx.beginPath();
    ctx.arc(point.x*scale+scale/2, point.y*scale+scale/2, radius, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawRectangles(ctx,listOfPoints,color) {
  // console.log(listOfPoints);
  for(var point of listOfPoints) {
    var radius = scale/2;
    ctx.beginPath();
    ctx.rect(point.x*scale-(radius/2)+scale/2,point.y*scale-(radius/2)+scale/2,radius,radius);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}


function setStartingPoints(width,height,fraction) {
  var startingPoints = [];

  // calc points
  for(var x=1;x<width;x++) {
    for(var y=1;y<height;y++) {
      if(x%fraction == 0 && y%fraction == 0) {
        var newStartingPoint = {
          x:x,
          y:y,
          region:[{
            x:x,
            y:y
          }],
          regionColor: '#'+Math.floor(Math.random()*16777215).toString(16)
        };
        startingPoints.push(newStartingPoint);
        markerMap[x][y] = newStartingPoint; // save starting point/region for faster access
      }
    }
  }
  return startingPoints;
}

function shadeBlendConvert(p, from, to) {
    if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
    if(!this.sbcRip)this.sbcRip=function(d){
        var l=d.length,RGB=new Object();
        if(l>9){
            d=d.split(",");
            if(d.length<3||d.length>4)return null;//ErrorCheck
            RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
        }else{
            if(l==8||l==6||l<4)return null; //ErrorCheck
            if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
            d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
        }
        return RGB;}
    var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=sbcRip(from),t=sbcRip(to);
    if(!f||!t)return null; //ErrorCheck
    if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
    else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
}
