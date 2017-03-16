// *********************************************************
// NOTE: Ignore all this code duplication for the time being
// *********************************************************

// *********************************************************
// NOTE: Functions currently take either of JSON objs or
//       strings as params.  We should settle on one or
//       the other.
// *********************************************************

var nopt = require('nopt'),
    express = require('express'),
    http = require('http'),
    https = require('https'),
    Promise = require('promise'),
    _ = require('underscore-node'),
    jsSHA = require('jssha'),
    logger = require('./lib/logger').logger;

// Parse arguments from command line 'node ./app.js args...'
var opts = nopt({
    'host': [String],
    'port': [Number],
    'wowzahost': [String],
    'wowzaport': [Number],
});

// Set default values for omitted arguments

var hostname = opts.host || 'localhost';
var port = opts.port || 10240;
var wowza_hostname = opts.wowzahost || 'localhost';
var wowza_port = opts.wowzaport || 8087;
var staticDir = 'static';

// ***********************************************************************************

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

// NOTE: 149 characters is the maximum streamfile name length. Hash + _ is 41.
function GetID(application_id) {
    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(application_id);
    var hash = shaObj.getHash("HEX");
    return hash;
}

function GetTag(streamfile_name) {
    return streamfile_name.split("_")[0];
}

function RemoveTag(streamfile_name) {
    return streamfile_name.split("_").slice(1).join("_");
}

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
		    },
		    {
			"enabled": true,
			"canRemove": true,
			"name": "streamTimeout",
			"value": "0",
			"defaultValue": "12000",
			"type": "Integer",
			"sectionName": "Common",
			"section": null,
			"documented": true
		    },
		    {
			"enabled": true,
			"canRemove": true,
			"name": "reconnectWaitTime",
			"value": "0",
			"defaultValue": "3000",
			"type": "Integer",
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
		"streamConfig" : {
		    "restURI": urlbase + urlpath + application_id + "/streamconfiguration",
		    "streamType": "live"
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

FindApplications()
    .then(function(applications) {	

	// ***********************************************************************
//	logger.info("testing promise....");
//	applications.map(function(app) {
//	    logger.info(JSON.stringify(app));
//	    FindStreamFiles(app)
//		.then(function(streamfiles) {
//		    streamfiles.map(function(streamfile) {
//			logger.info(JSON.stringify(streamfile));
//		    });
//		});
//	});
//
//	logger.info("testing application create");
//
//	CreateOrModifyApplication("fromjs")
//	    .then(function(response) {
//		logger.info(JSON.stringify(response));
//		logger.info("testing application update");
//		UpdateAdvApplication("fromjs", 6)
//		    .then(function(response) {	
//			logger.info(JSON.stringify(response));
//			logger.info("testing streamfile initialization");
//			InitializeStreamFile("fromjs", "fromjsstream")
//			    .then(function(response) {
//				logger.info(JSON.stringify(response));
//				logger.info("testing streamfile update");
//				UpdateStreamFile("fromjs", "fromjsstream", "rtsp://192.168.1.50:8555/unicast")
//				    .then(function(response) {
//					logger.info(JSON.stringify(response));
//					logger.info("testing streamfile delete / connect / disconnect");
//					ConnectStreamFile("test1", "rtsp60")
//					    .then(function(response) {
//						logger.info(JSON.stringify(response));
//						DisconnectStreamFile("test1", "rtsp60")
//						    .then(function(response) {
//							logger.info(JSON.stringify(response));
//							DeleteStreamFile("fromjs", "fromjsstream")
//							    .then(function(response) {
//								logger.info(JSON.stringify(response));
//							    });
//						    });
//					    });
//				    });
//			    });
//		    });
//	    });
//	
//	logger.info("testing application delete");
//	
//	DeleteApplication("ffff")
//	    .then(function(response) {
//		logger.info(JSON.stringify(response));
//	    });
//
//	logger.info("testing application restart");
//	
//	RestartApplication("test1")
//	    .then(function(response) {
//		logger.info(JSON.stringify(response));
//	    });
//		
//	// ***********************************************************************

	var application_list;

	function UpdateApplications(new_applications) {
	    if (JSON.stringify(application_list) === JSON.stringify(new_applications)) {
                return;
            }
	    application_list = new_applications;

	    //Feed this update to handlers as needed
	}
	
	UpdateApplications(applications);
	
        var application_update_interval = 360;
        if (application_update_interval) {
            logger.info("Updating application list every " + application_update_interval + " secs");
            setInterval(function () {
                FindApplications().then(UpdateApplications);
            }, application_update_interval * 1000);
	}
	
	var web_server = express(),
	    favicon = require('serve-favicon'),
	    bodyParser = require('body-parser'),
	    morgan = require('morgan');
	
	
	logger.info("**************************************");
	logger.info("Listening on http://" + (hostname || 'localhost') + ":" + port + "/");
	logger.info("  serving static files from '" + staticDir + "'");
	
	web_server
	    .use(morgan('combined', { "stream": logger.stream} ))
	    .use(favicon(staticDir + '/favicon.ico'))
	    .use(express.static(staticDir, {maxAge: Infinity}));
	
	web_server
	    .use(bodyParser.json())
	    .get('/apps', function (req, res) {
		var app_res = JSON.stringify({
		    "applications": application_list
		});
		res.json(app_res);
	    })
	    .post('/sf', function (req, res) {
		logger.info("Received in sf:");

		var application = req.body;
		
		FindApplications()
		    .then(function(applications) {
			var good_app_arr = _.filter(applications, function(app) {
			    return app.id === application.id;
			});

			if (good_app_arr.length === 0) {
			    var sf_res = JSON.stringify({
			    });

			    res.json(sf_res);
			} else {
			    
			    FindStreamFiles(good_app_arr[0])
				.then(function(streamfiles) {
				    var sf_res = JSON.stringify({
					sf : streamfiles
				    });

				    logger.info(sf_res);
				    res.json(sf_res);
				});
			}
		    });
	    })
	    .post('/makeapp', function (req, res) {
		logger.info("Received in makeapp:");

		var application = req.body;
		var application_name = application.appname;
		CreateOrModifyApplication( application_name )
		    .then(function(response) {
			UpdateAdvApplication( application_name , 6 )
			    .then(function(response) {
				RestartApplication(application_name)
				    .then(function(response) {
					FindApplications().then(UpdateApplications);
					res.json(JSON.stringify(response));
				    });
			    });
		    });
	    })
	    .post('/delapp', function (req, res) {
		logger.info("Received in delapp:");
		
		var application = req.body;
		var application_name = application.appname;
		DeleteApplication(application_name)
		    .then(function(response) {
			logger.info(JSON.stringify(response));
			res.json(JSON.stringify(response));
			FindApplications().then(UpdateApplications);
		    });
	    })
	    .post('/restartapp', function (req, res) {
		logger.info("Received in restartapp:");
		var application = req.body;
		var application_name = application.appname;
		
		RestartApplication(application_name)
		    .then(function(response) {
			res.json(JSON.stringify(response));
		    });
	    })				
	    .post('/delsf', function (req, res) {
		logger.info("Received in delsf:");
		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;

		//					ConnectStreamFile("test1", "rtsp60")
//					    .then(function(response) {
//						logger.info(JSON.stringify(response));
//						DisconnectStreamFile("test1", "rtsp60")
//						    .then(function(response) {
//							logger.info(JSON.stringify(response));
//							DeleteStreamFile("fromjs", "fromjsstream")
//							    .then(function(response) {
//								logger.info(JSON.stringify(response));
//							    });
//						    });
//					    });


	    })
	    .post('/connectsf', function (req, res) {
		logger.info("Received in connectsf:");
		
		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;

		ConnectStreamFile(application_name, streamfile_name)
		    .then(function(response) {
			res.json(JSON.stringify(response));
		    });
	    })
	    .post('/dcsf', function (req, res) {
		logger.info("Received in dcsf:");
		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;

		DisconnectStreamFile(application_name, streamfile_name)
		    .then(function(response) {
			res.json(JSON.stringify(response));
		    });
	    })
	    .post('/updatesf', function (req, res) {
		logger.info("Received in updatesf:");
		logger.info(JSON.stringify(req.body));

	    })
	    .post('/makesf', function (req, res) {
		logger.info("Received in makesf:");
		logger.info(JSON.stringify(req.body));
	    });
	
	logger.info("**************************************");

	web_server.on('error', function (err) {
	    logger.error('Error: ', err, "from web server");
	});

	web_server.listen(port, hostname);
    }).catch(function (err) {
        logger.error("Promise error:", err, "(shutting down)");
        process.exit(1);
    });


