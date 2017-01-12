var jsdom = require("jsdom");
var exec = require('child_process').exec;
var util = require('util')
var async = require("async")
var turf = require('turf');
var log = require('loglevel');

exports.storesForState = function(state,callback) {
  var cmd = util.format("curl 'https://www.sheetz.com/locations/create_state_list.jsp' -H 'Cookie: JSESSIONID=43668E842B1572F77FE3367ECDFB1112.node1' -H 'Origin: https://www.sheetz.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: en-US,en;q=0.8' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.27 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Accept: text/html, */*; q=0.01' -H 'Referer: https://www.sheetz.com/locations/locations.jsp' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' --data 'slctRadius=5&slctResults=10&txtLocationFrom=%s&latFrom=&lngFrom=&txtLocationTo=&latTo=&lngTo=&quicksearch=%s' --compressed",state)
  log.info('Looking up Sheetz in '+state)
  var cmdResult = '';
  var child = exec(cmd,{maxBuffer: 1024*1024}, function(error, stdout, stderr) {

    var doneFunc = function(err,window) {
      var stores = [];

      if (window.pins != undefined) {
        window.pins.map(function(item){
          var lat = item.location.latLng.lat
          var lon = item.location.latLng.lng
          stores.push(turf.point([lon,lat],item))
        });
      }


      callback(stores)
    };

    var config =  {
      html:stdout,
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },
      done:doneFunc
    }

    jsdom.env(config);
  });
}

exports.findAll = function(callback) {

  var states = ['MD','PA','VA','WV','OH','NC']
  var stores = [];
  async.eachLimit(states, 3, function(state, cb){
    exports.storesForState(state,function(newStores) {
      stores = stores.concat(newStores)
      log.info('Found '+stores.length+' Sheetz in '+state)
      cb();
    });
  }, function(err) {
    log.info('Found all Sheetz Stores: '+stores.length)
    callback(turf.featurecollection(stores))
  });
}
