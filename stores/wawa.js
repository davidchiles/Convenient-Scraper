var request = require('request');
var turf = require('turf');
var async = require('async');
var log = require('loglevel');

var numberURL = "https://www.wawa.com/Handlers/LocationByStoreNumber.ashx"
var locationURL = "https://www.wawa.com/Handlers/LocationByLatLong.ashx"

exports.getStore = function(number,callback) {
  log.info('Looking up Store: '+number)
  var url = numberURL+"?storeNumber="+number
  request(url, function (error, response, body) {
    if (response != undefined && response.statusCode === 200) {
      log.info('Found store: '+number)
      var store = JSON.parse(body);
      callback(turf.point(store["addresses"][1].loc.reverse(),store));
    } else {
      log.warn('No store: '+number)
      callback(null);
    }
  })
}

exports.location = function(lat,lon,limit,callback) {

}

exports.findAll = function (callback) {
  log.info('Looking up all Wawa stores')
  var max = 9000;
  var numbers = Array.apply(null, {length: max}).map(Number.call, Number)
  var features = []

  async.eachLimit(numbers, 500, function(num, cb){
    exports.getStore(num,function(store){
      if (store != null) {
        features.push(store);
      }
      cb();
    })
  }, function(err) {
    log.info('Found All Wawa stores: '+features.length)
    callback(turf.featurecollection(features))
  });
}
