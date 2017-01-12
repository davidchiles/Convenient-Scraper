var exec = require('child_process').exec;
var util = require('util')
var async = require("async")
var turf = require('turf');
var log = require('loglevel');
var baseURL = "https://www.7-eleven.com/api/location/searchstores"

var centerLat = 39.828175;
var centerLon = -98.5795;

exports.getPage = function(lat, lon, radius, pageNumber,pageSize, callback) {
  log.info('Looking up page: '+pageNumber)
  var data = JSON.stringify({"Filters": [],
    "PageNumber": pageNumber.toString(),
    "PageSize": pageSize,
    "SearchRangeMiles": radius.toString(),
    "SourceLatitude": lat,
    "SourceLongitude": lon
  })

  var cmd = util.format("curl 'https://www.7-eleven.com/api/location/searchstores' -H 'Origin: https://www.7-eleven.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.8' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.27 Safari/537.36' -H 'Content-Type: application/json; charset=UTF-8' -H 'Accept: application/json, text/javascript, */*; q=0.01' -H 'Referer: https://www.7-eleven.com/Home/Locator' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H 'X-API-Key: A95D6FB9-A6FC-4F40-B00E-EBD4729D55B2' --data-binary '%s' --compressed",data)

  exec(cmd, function(error, stdout, stderr) {
    var result = JSON.parse(stdout)
    log.info('Finished page: '+pageNumber)
    callback(result)
  });
}

exports.getStores = function(lat, lon, radius, callback) {
  var pageSize = 50;
  exports.getPage(lat,lon,radius,0,pageSize, function(newStores){
    var lastStore = newStores[newStores.length-1]
    var total = lastStore["TotalResultCount"]
    var totalPage = Math.ceil(total/pageSize)

    var max = totalPage+1;
    var numbers = Array.apply(null, {length: max}).map(Number.call, Number)
    var features = []
    log.info('7-Eleven pages: '+max)
    async.eachLimit(numbers, 200, function(page, cb){
      exports.getPage(lat,lon,radius,page,pageSize,function(stores){
        features = features.concat(stores)
        cb();
      })
    }, function(err) {
      var points = []
      features.map(function(item){
        var point = turf.point([item["Longitude"],item["Latitude"]],point)
        points.push(point)
      })
      log.info('Found all 7-Eleven stores: '+ points.length);
      callback(turf.featurecollection(points))
    });
  });
}

exports.findAll = function(callback) {
  log.info('Look up all 7-Eleven stores');
  exports.getStores(centerLat, centerLon, 10000, function(stores){
    callback(stores)
  })
}
