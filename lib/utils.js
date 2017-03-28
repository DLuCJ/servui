var jsSHA = require('jssha'),
    logger = require('./logger').logger;

// Set default values for omitted arguments


// Set default values for omitted arguments

var hostname;
var port;
var wowza_hostname;
var wowza_port;
var staticDir;

exports.hostname = hostname;
exports.port = port;
exports.wowza_hostname = wowza_hostname;
exports.wowza_port = wowza_port;
exports.staticDir = staticDir;

// NOTE: 149 characters is the maximum streamfile name length. Hash + _ is 41.
function GetID(application_id) {
    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(application_id);
    var hash = shaObj.getHash("HEX");
    return hash;
}

exports.GetID = GetID;

function GetTag(streamfile_name) {
    return streamfile_name.split("_")[0];
}

exports.GetTag = GetTag;

function RemoveTag(streamfile_name) {
    return streamfile_name.split("_").slice(1).join("_");
}

exports.RemoveTag = RemoveTag;

function RetryPromise(promiseFunc, name, maxFails, retryMs) {
    return new Promise(function (fulfill, reject) {
        var fails = 0;

        function doit() {
            var promise = promiseFunc();
            promise.then(function (arg) {
                fulfill(arg);
            }, function (e) {
                fails++;
                if (fails < maxFails) {
                    logger.warn("Failed " + name + " : " + e + ", retrying");
                    setTimeout(doit, retryMs);
                } else {
                    logger.error("Too many retries for " + name + " : " + e);
                    reject(e);
                }
            });
        }

        doit();
    });
}

exports.RetryPromise = RetryPromise;
