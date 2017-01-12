const fs = require('fs');
const turf = require('turf');

var nopt = require("nopt")
  , path = require("path")
  , knownOpts = {
                "stores" : path,
                "boundaries" : path
                }
  , shortHands = { "stores" : ["--s"],
                   "boundaries" : ["--b"]
                 }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)


var loadGeoJSON = function(path) {
	var files = fs.readdirSync(path)
	var stores = {};
	console.log(files);
	files.forEach(file => {
		if (file.endsWith("geojson")) {
			
			var jsonData = fs.readFileSync(path+"/"+file)
			var json = JSON.parse(jsonData);

			stores[file.split('.')[0]] = json;
		}
	});
	return stores;
}

var stores = loadGeoJSON(parsed.stores);
var boundaries = loadGeoJSON(parsed.boundaries);

Object.keys(boundaries).map(function(key, index) {
	var features = boundaries[key].features;
	boundaries[key].features = features.map(function(boundary) {
		Object.keys(stores).forEach(function(storeName){
			boundary.properties[storeName] = 0;
			var storeFeatures = stores[storeName].features;
			storeFeatures.forEach(function(store){
				var isInside = turf.inside(store,boundary);
				if (isInside) {
					boundary.properties[storeName] += 1
				}
			});
		});
		return boundary;
	});
});
var features = []
Object.keys(boundaries).forEach(function(key) {
	features = features.concat(boundaries[key].features);
});

var fc = turf.featurecollection(features);
fs.writeFileSync(parsed.boundaries+"/out.json",JSON.stringify(fc,null,4));



