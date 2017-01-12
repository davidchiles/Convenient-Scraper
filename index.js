var wawa = require("./stores/wawa.js")
var seven = require("./stores/seveneleven.js")
var sheetz = require("./stores/sheetz.js")
var fs = require('fs');
var log = require('loglevel');

log.setLevel('info')


// sheetz.findAll(function(fc){
//   console.log("%j",fc)
// })


var nopt = require("nopt")
  , path = require("path")
  , knownOpts = {
                "brand" : [ "wawa", "sheetz", "7eleven" ],
                "out" : path
                }
  , shortHands = { "brand" : ["--b"],
                   "out" : ["--o"]
                 }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)

var fetcher;
if (parsed.brand === 'wawa') {
  fetcher = wawa;
} else if (parsed.brand === 'sheetz') {
  fetcher = sheetz
} else if (parsed.brand === '7eleven') {
  fetcher = seven
}

fetcher.findAll(function(fc){
  if (parsed.out) {
    fs.writeFileSync(parsed.out,JSON.stringify(fc))
  } else {
    console.log(fc)
  }
});
