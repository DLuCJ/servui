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

// Init function
// Fetches list of current applications in Wowza for display.
// Returns JSON array
function FindApplications() {
    logger.info("Fetching applications at " + wowza_hostname + ":" + wowza_port);

    function FetchApps() {
	return new Promise(function (fulfill, reject) {
            var request = http.get({
                hostname: wowza_hostname,
                port: wowza_port,
                path: "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications",
                headers: {
                    'Accept': 'application/json'
                }
            }, function (res) {
                var str = '';
                res.on('data', function (chunk) {
                    str += chunk;
                });
                res.on('end', function () {
                    var applications = _.filter(JSON.parse(str).applications, function (app) {
                        return app.appType === "Live";
                    });
                    fulfill(applications);
                });
            }).on('error', function (e) {
                reject(e);
            }).on('timeout', function () {
                reject("timeout");
            });
            request.setTimeout(1000);
        });
    }

    return RetryPromise(FetchApps,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.FindApplications = FindApplications;

// TODO: offer more update options?
// Takes string, float
function UpdateAdvApplication (application_id, attempted_base_latency_secs) {
    logger.info("Updating Application: " + application_id + " at " + wowza_hostname + ":" + wowza_port);
    
    var chunk_duration = Math.floor(attempted_base_latency_secs / 3) * 1000;
    function UpdateApp () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
	    var app_data = JSON.stringify ({
		"restURI": urlbase + urlpath + application_id + "/adv",
		 "modules": [
		     {
			 "order": 0,
			 "name": "base",
			 "description": "Base",
			 "class": "com.wowza.wms.module.ModuleCore"
		     },
		     {
			 "order": 1,
			 "name": "logging",
			 "description": "Client Logging",
			 "class": "com.wowza.wms.module.ModuleClientLogging"
		     },
		     {
			 "order": 2,
			 "name": "flvplayback",
			 "description": "FLVPlayback",
			 "class": "com.wowza.wms.module.ModuleFLVPlayback"
		     },
		     {
			 "order": 3,
			 "name": "ModuleCoreSecurity",
			 "description": "Core Security Module for Applications",
			 "class": "com.wowza.wms.security.ModuleCoreSecurity"
		     }
		 ],
		 "advancedSettings": [
		     {
			 "enabled": true,
			 "canRemove": false,
			 "name": "mpegdashChunkDurationTarget",
			 "value": String(chunk_duration),
			 "defaultValue": "10000",
			 "type": "Integer",
			 "sectionName": "mpegdashstreamingpacketizer",
			 "section": "/Root/Application/LiveStreamPacketizer",
			 "documented": true
		     },
		     {
			 "enabled": true,
			 "canRemove": false,
			 "name": "securityPublishRequirePassword",
			 "value": true,
			 "defaultValue": true,
			 "type": "Boolean",
			 "sectionName": "Application",
			 "section": "/Root/Application",
			 "documented": true
		     },
		     {
			 "enabled": true,
			 "canRemove": false,
			 "name": "pushPublishMapPath",
			 "value": "${com.wowza.wms.context.VHostConfigHome}/conf/${com.wowza.wms.context.Application}/PushPublishMap.txt",
			 "defaultValue": null,
			 "type": "String",
			 "sectionName": "Application",
			 "section": "/Root/Application",
			 "documented": true
		     }
		 ]
	    });

            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/adv",
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

    return RetryPromise(UpdateApp,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}
exports.UpdateAdvApplication = UpdateAdvApplication;


// Takes string
function RestartApplication (application_id) {
    logger.info("Restarting Application: " + application_id + " at " + wowza_hostname + ":" + wowza_port);
    
    function RestartApp () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id + "/actions/restart",
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

    return RetryPromise(RestartApp,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.RestartApplication = RestartApplication;

// Takes string
function DeleteApplication (application_id) {
    logger.info("Deleting Application: " + application_id + " at " + wowza_hostname + ":" + wowza_port);
    
    function DelApp () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id,
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

    return RetryPromise(DelApp,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.DeleteApplication = DeleteApplication;

// TODO: Offer more configuration options, particularly for modify case
// TODO: what might people want to configure at the car level?  Do we even want to expose that? 
// TODO: test this
// Takes strings, truthy / falsey
function CreateOrModifyApplication (application_id, modify) {
    logger.info("Creating Application: " + application_id + " at " + wowza_hostname + ":" + wowza_port);

    // janky, but we're assuming this is being passed true in modify
    var exists = modify || false;
    var method = 'POST';
    if (exists) {
	method = 'PUT';
    }
    
    function AddApp () {
	return new Promise(function (fulfill, reject) {

	    var urlbase = "http://" + wowza_hostname + ":" + wowza_port;
	    var urlpath = "/v2/servers/_defaultServer_/vhosts/_defaultVHost_/applications/";
	    
	    var app_data = JSON.stringify ({
		"restURI": urlbase + urlpath + application_id,
		"name": application_id,
		"appType": "Live",
		"clientStreamReadAccess": "*",
		"clientStreamWriteAccess": "*",
		"description" : "A-UGV endpoint",
		"httpCORSHeadersEnabled" : true,
		"applicationTimeout": 60000,
		"pingTimeout": 12000,
		"maxRTCPWaitTime": 12000,
		"vodTimedTextProviders": [],
		"streamConfig" : {
		    "restURI": urlbase + urlpath + application_id + "/streamconfiguration",
		    "streamType": "live",
		    "liveStreamPacketizer": [
			"cupertinostreamingpacketizer",
			"smoothstreamingpacketizer",
			"sanjosestreamingpacketizer",
			"mpegdashstreamingpacketizer"
		    ]
		}
	    });

            var request = http.request({
		hostname: wowza_hostname,
		port: wowza_port,
		path: urlpath + application_id ,
		method: method,
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

    return RetryPromise(AddApp,
			wowza_hostname + ":" + wowza_port,
			5,
			500)
	.catch(function () {
            logger.warn("Unable to contact " + wowza_hostname + ":" + wowza_port + "; skipping");
            return [];
        });
}

exports.CreateOrModifyApplication = CreateOrModifyApplication;
