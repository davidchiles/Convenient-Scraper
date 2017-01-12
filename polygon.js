var turf = require('turf');
var fs = require('fs');
var log = require('loglevel');

var nopt = require("nopt")
  , path = require("path")
  , knownOpts = {
                "in" : path,
                "points": [path, Array],
                "out" : path
                }
  , shortHands = { "in" : ["--i"],
                   "points": ['--p'],
                   "out" : ["--o"]
                 }
  , parsed = nopt(knownOpts, shortHands, process.argv)

var polygonsFC = JSON.parse(fs.readFileSync(parsed.in));

var count = function(polygons,points,key,callback) {
  var pIndex;
  var result = [];
  for (pIndex = 0; pIndex < polygons.length; pIndex++){
    var polygon = polygons[pIndex];
    var count = 0;
    var ptIndex;
    for (ptIndex = 0; ptIndex < points.length; ptIndex++){
      var point = points[ptIndex];
      var isInside = turf.inside(point, polygon)
      if (isInside) {
        count++;
      }
    }
    polygon.properties[key] = count
    result.push(polygon)
  }
  return result
}

var winner = function(polygons,keys,callback) {
  var result = polygons.map(function(polygon){
    var winner = 'none';
    var winnerCount = 0;
    keys.map(function(key){
      if(polygon.properties[key] > winnerCount) {
        winnerCount = polygon.properties[key]
        winner = key;
      }
    })

    polygon.properties['winner'] = winner;
    return polygon
  })
  callback(result);
}

var polygons = polygonsFC.features
var keys = [];
parsed.points.map(function(pointsPath){
  var pointsFC = JSON.parse(fs.readFileSync(pointsPath))
  var key = path.basename(pointsPath,path.extname(pointsPath))
  keys.push(key);
  polygons = count(polygons,pointsFC.features,key)
});

polygons = winner(polygons,keys,function(result){
  console.log("%j",turf.featurecollection(polygons))
})
