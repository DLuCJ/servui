// *********************************************************
// NOTE: Ignore all this code duplication for the time being
// *********************************************************

// *********************************************************
// NOTE: Functions currently take either of JSON objs or
//       strings as params.  We should settle on one or
//       the other.
// *********************************************************
var nopt = require('nopt'),
    utils = require('./lib/utils');

var GetID = utils.GetID;
var GetTag = utils.GetTag;
var RemoveTag = utils.RemoveTag;
var RetryPromise = utils.RetryPromise;

var opts = nopt({
    'host': [String],
    'port': [Number],
    'wowzahost': [String],
    'wowzaport': [Number],
});

utils.hostname = opts.host || 'localhost';
utils.port = opts.port || 10240;
utils.wowza_hostname = opts.wowzahost || 'localhost';
utils.wowza_port = opts.wowzaport || 8087;
utils.staticDir = 'static';   

var hostname = utils.hostname;
var port = utils.port;
var wowza_hostname = utils.wowza_hostname;
var wowza_port = utils.wowza_port;
var staticDir = utils.staticDir;

var express = require('express'),
    http = require('http'),
    https = require('https'),
    Promise = require('promise'),
    _ = require('underscore-node'),
    appHandler = require('./lib/appHandler'),
    sfHandler = require('./lib/sfHandler'),
    logger = require('./lib/logger').logger;

// Import lib functions

var FindApplications = appHandler.FindApplications;
var CreateOrModifyApplication = appHandler.CreateOrModifyApplication;
var UpdateAdvApplication = appHandler.UpdateAdvApplication;
var RestartApplication = appHandler.RestartApplication;
var DeleteApplication = appHandler.DeleteApplication;

var DisconnectStreamFile = sfHandler.DisconnectStreamFile;
var ConnectStreamFile = sfHandler.ConnectStreamFile;
var DeleteStreamFile = sfHandler.DeleteStreamFile;
var UpdateStreamFile = sfHandler.UpdateStreamFile;
var InitializeStreamFile = sfHandler.InitializeStreamFile;
var FindStreamFiles = sfHandler.FindStreamFiles;
var FindStreamFilesAdv = sfHandler.FindStreamFilesAdv;

// ***********************************************************************************

FindApplications()
    .then(function(applications) {		
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

		DeleteStreamFile(application_name, streamfile_name)
		    .then(function(response) {
			res.json(JSON.stringify(response));
		    });
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

		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;
		var uri = data.uri;
		
		UpdateStreamFile(application_name, streamfile_name, uri)
		    .then(function(response) {
			res.json(JSON.stringify(response));
		    });
	    })
	    .post('/urisf', function (req, res) {
		logger.info("Received in urisf:");
		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;

		FindStreamFilesAdv(application_name, streamfile_name)
		    .then(function(response) {
			logger.info(JSON.stringify(response.advancedSettings[0].value));
			var uri_res = JSON.stringify({
			    "uri": response.advancedSettings[0].value
			});

			res.json(uri_res);
		    });
	    })
	    .post('/makesf', function (req, res) {
		logger.info("Received in makesf:");
		var data = req.body;
		var application_name = data.appname;
		var streamfile_name = data.sfname;
		var uri = data.uri;
		
		InitializeStreamFile(application_name, streamfile_name)
		    .then(function(response) {
			UpdateStreamFile(application_name, streamfile_name, uri)
			    .then(function(response) {
				res.json(JSON.stringify(response));
			    });
		    });
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


