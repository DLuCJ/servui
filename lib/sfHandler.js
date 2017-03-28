var http = require('http'),
    https = require('https'),
    Promise = require('promise'),
    _ = require('underscore-node'),
    utils = require('./utils'),
    logger = require('./logger').logger;

var GetID = utils.GetID;
var GetTag = utils.GetTag;
var RemoveTag = utils.RemoveTag;
var RetryPromise = utils.RetryPromise;

var wowza_hostname = utils.wowza_hostname;
var wowza_port = utils.wowza_port;

// Takes string
function DisconnectStreamFile(application_id, streamfile_id) {
    logger.info("Disconnecting Stream File: " + streamfile_id + " at " + wowza_hostname + ":" + wowza_port);

    var streamfile_name = GetID(application_id) + "_" + streamfile_id;
    
    function DCStreamFile () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/instances/_definst_/incomingstreams/" + streamfile_name + ".stream/actions/disconnectStream",
		method: 'PUT',
		headers: {
                    'Accept': 'application/json',
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	    request.end();
	});
    }

    return RetryPromise(DCStreamFile,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.DisconnectStreamFile = DisconnectStreamFile;


// Takes string
function ConnectStreamFile(application_id, streamfile_id) {
    logger.info("Connecting Stream File: " + streamfile_id + " at " + wowza_hostname + ":" + wowza_port);

    var streamfile_name = GetID(application_id) + "_" + streamfile_id;
    
    function ConnStreamFile () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/streamfiles/";
	    
            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + streamfile_name + "/actions/connect?connectAppName=" + application_id + "&appInstance=_definst_&mediaCasterType=rtp",
		method: 'PUT',
		headers: {
                    'Accept': 'application/json',
		    'Content-type' : 'application/json'
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	    request.end();
	});
    }

    return RetryPromise(ConnStreamFile,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.ConnectStreamFile = ConnectStreamFile;


// Takes string
function DeleteStreamFile(application_id, streamfile_id) {
    logger.info("Deleting Stream File: " + streamfile_id + " at " + wowza_hostname + ":" + wowza_port);

    var streamfile_name = GetID(application_id) + "_" + streamfile_id;
    
    function DelStreamFile () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/streamfiles/" + streamfile_name,
		method: 'DELETE',
		headers: {
                    'Accept': 'application/json',
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	    request.end();
	});
    }

    return RetryPromise(DelStreamFile,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.DeleteStreamFile = DeleteStreamFile;


// TODO: offer more update options?
// Takes strings
function UpdateStreamFile(application_id, streamfile_id, rtsp_uri) {
    logger.info("Updating stream file for " + application_id + " at " + wowza_hostname + ":" + wowza_port);

    var streamfile_name = GetID(application_id) + "_" + streamfile_id;
    
    function UpStreamFile () {
	return new Promise(function (fulfill, reject) {
	    
	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
	    var app_data = JSON.stringify ({
		"restURI": urlbase + urlpath + application_id + "/streamfiles/" + streamfile_name + "/adv",
		"advancedSettings": [
		    {
			"enabled": true,
			"canRemove": true,
			"name": "uri",
			"value": rtsp_uri,
			"defaultValue": null,
			"type": "String",
			"sectionName": "Common",
			"section": null,
			"documented": true
		    }
		]
	    });

            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/streamfiles/" + streamfile_name + "/adv",
		method: 'PUT',
		headers: {
                    'Accept': 'application/json',
		    'Content-type' : 'application/json'
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	    request.write(app_data);
	    request.end();
	});
    }
    
    return RetryPromise(UpStreamFile,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.UpdateStreamFile = UpdateStreamFile;


// Takes strings
function InitializeStreamFile(application_id, streamfile_id) {
    logger.info("Initializing stream file for " + application_id + " at " + wowza_hostname + ":" + wowza_port);

    var streamfile_name = GetID(application_id) + "_" + streamfile_id;
    
    function InitStreamFile () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
	    var app_data = JSON.stringify ({
		"restURI": urlbase + urlpath + application_id + "/streamfiles",
		"streamFiles" : [
		    {
			"id": streamfile_name,
			"href": urlbase + urlpath + application_id + "/streamfiles/" + streamfile_name
		    }
		]
	    });

            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/streamfiles/" + streamfile_name,
		method: 'POST',
		headers: {
                    'Accept': 'application/json',
		    'Content-type' : 'application/json'
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	    request.write(app_data);
	    request.end();
	});
    }
    
    return RetryPromise(InitStreamFile,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.InitializeStreamFile = InitializeStreamFile;


// Takes JSON (assumes output of FindApplications(), which is unfortunate. TODO: change this)
function FindStreamFiles(application) {
    logger.info("Fetching stream files for " + application.id + " at " + wowza_hostname + ":" + wowza_port);
    function FetchStreamFiles () {
	return new Promise(function (fulfill, reject) {
            var request = http.get({
		hostname: wowza_hostname,
		port: wowza_port,
		path: application.href + "/streamfiles" ,
		headers: {
                    'Accept': 'application/json'
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var id = GetID(application.id);
		    var streamfiles = _.filter(JSON.parse(str).streamFiles, function (streamfile) {
			var tag = GetTag(streamfile.id);
			return tag === id;
		    });
                    fulfill(streamfiles);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	});
    }

    return RetryPromise(FetchStreamFiles,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.FindStreamFiles = FindStreamFiles;


function FindStreamFilesAdv(application_name, streamfile_name) {
    logger.info("Fetching rtsp uri for " + streamfile_name + " at " + wowza_hostname + ":" + wowza_port);

    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";

    function FetchStreamFilesAdv () {
	return new Promise(function (fulfill, reject) {

            var request = http.get({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_name + "/streamfiles/" + streamfile_name + "/adv",
		headers: {
                    'Accept': 'application/json'
		}
            }, function (res) {
		var str = '';
		res.on('data', function (chunk) {
                    str += chunk;
		});
		res.on('end', function () {
		    var response = JSON.parse(str);
                    fulfill(response);
		});
            }).on('error', function (e) {
		reject(e);
            }).on('timeout', function () {
		reject("timeout");
            });
            request.setTimeout(1000);
	});
    }

    return RetryPromise(FetchStreamFilesAdv,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.FindStreamFilesAdv = FindStreamFilesAdv;
