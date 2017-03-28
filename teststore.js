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

