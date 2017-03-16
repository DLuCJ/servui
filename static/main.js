require.config({
    paths: {
        bootstrap: 'ext/bootstrap/dist/js/bootstrap',
	goldenlayout: 'ext/golden-layout/dist/goldenlayout',
        jquery: 'ext/jquery/dist/jquery',
        underscore: 'ext/underscore/underscore',
    },
    shim: {
        underscore: {exports: '_'},
        bootstrap: ['jquery'],
    }
});

define(function (require) {
    require('bootstrap');
    var _ = require('underscore');
    var $ = require('jquery');
    var GoldenLayout = require('goldenlayout');

    function RemoveTag(streamfile_name) {
	return streamfile_name.split("_").slice(1).join("_");
    }
    
    var application_list;

//    $.ajaxSetup({async: false});
    
    function start() {

	var config = {
	    content: [{
		type: 'column',
		isClosable: false
	    }]
	};

	var config2 = {
	    content: [{
		type: 'stack',
		isClosable: false
	    }]
	};
	
	var myLayout = new window.GoldenLayout( config, $('#layoutContainer') );
	var myLayout2 = new window.GoldenLayout( config2, $('#layoutContainer2') );

	myLayout2.registerComponent( 'sf', function( container, state ){
	    container.getElement().html( '<h2>' + state.text + '</h2>');
	    container.getElement().append('<li></li>');
	    
	    var final_appname = state.appname;
	    var final_sfname = state.text;
	    var final_uri = null;

	    var uri_label = $( '<label>Enter URI</label>');
	    var uri_input = $( '<input type="text" />' );
	    
	    uri_input.val( state.current_uri );
	    uri_input.appendTo(uri_label);
	    
	    uri_input.on( 'change', function(){
		final_uri = uri_input.val();
	    });

	    var update_sf_btn = $( '<button>Update Stream Endpoint</button>' ).click( function () {
		if (!final_uri) {
		    alert("Enter URI");
		} else {
		    var request = {
			appname: final_appname,
			sfname: final_sfname,
			uri: final_uri
		    };
		    
		    $.ajax({
			type: 'POST',
			url: 'updatesf',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(request),
			success: (function (result) {alert(JSON.stringify(result));}),
			error: (function (xhr, e_status, error) {alert("Error: " + error);}),
			cache: false
		    });
		}
	    });

	    var delete_sf_btn = $( '<button>Delete Stream Endpoint</button>' ).click( function () {
		var request = {
		    appname: final_appname,
		    sfname: final_sfname
		};
		
		$.ajax({
		    type: 'POST',
		    url: 'delsf',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			var status = JSON.parse(result);
			
			if (status.success === true) {
			    alert("Successfully deleted");
			} else {
			    alert("Failed to delete");
			}
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
	    });

	    var connect_sf_btn = $( '<button>Start Streaming</button>' ).click( function () {
		var request = {
		    appname: final_appname,
		    sfname: final_sfname
		};
		    
		$.ajax({
		    type: 'POST',
		    url: 'connectsf',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			var status = JSON.parse(result);
			
			if (status.success === true) {
			    alert("Successfully connected");
			} else {
			    alert("Failed to connect");
			}
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
	    });

	    var disconnect_sf_btn = $( '<button>Stop Streaming</button>' ).click( function () {
		var request = {
		    appname: final_appname,
		    sfname: final_sfname
		};
		
		$.ajax({
		    type: 'POST',
		    url: 'dcsf',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			var status = JSON.parse(result);
			
			if (status.success === true) {
			    alert("Successfully disconnected");
			} else {
			    alert("Failed to disconnect");
			}
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
	    });

	    container.getElement().append( uri_label );
	    container.getElement().append( uri_input );
	    container.getElement().append( update_sf_btn );
	    container.getElement().append('<br></br>');
	    container.getElement().append('<br></br>');
	    container.getElement().append( delete_sf_btn );
	    container.getElement().append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
	    container.getElement().append( connect_sf_btn );
	    container.getElement().append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
	    container.getElement().append( disconnect_sf_btn );
	});

	myLayout.registerComponent( 'confcar', function( container, state ){
	    container.getElement().html( '<h2>' + state.text + '</h2>');
	    container.getElement().append('<li></li>');

	    var final_appname = state.text;
	    
	    var del_car_btn = $( '<button>Delete Car</button>' ).click( function () {
		var request = {
		    appname: final_appname
		};
		
		$.ajax({
		    type: 'POST',
		    url: 'delapp',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			var status = JSON.parse(result);
			alert(JSON.stringify(status));
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
	    });

	    var restart_car_btn = $( '<button>Restart Car (disconnects all streams)</button>' ).click( function () {
		var request = {
		    appname: final_appname
		};
		
		$.ajax({
		    type: 'POST',
		    url: 'restartapp',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			var status = JSON.parse(result);

			if (status.success === true) {
			    alert("Successfully restarted");
			} else {
			    alert("Failed to restart");
			}
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
	    });

	    container.getElement().append( '<br></br>');
	    container.getElement().append( '<br></br>');
	    container.getElement().append( restart_car_btn );
	    container.getElement().append( '<br></br>');
	    container.getElement().append( '<br></br>');
	    container.getElement().append( del_car_btn );
	    
	});
	
	myLayout.registerComponent( 'addcar', function( container, state ){
	    var final_input = null;

	    var label = $( '<label>Enter car name</label>');
	    var input = $( '<input type="text" />' );
	    
	    input.val( "" );
	    input.appendTo(label);
	    
	    input.on( 'change', function(){
		final_input = input.val();
	    });

	    var toggleButton = $( '<button>Create Car</button>' ).click( function () {
		if (!final_input || final_input === "Enter car name") {
		    alert("Enter a car name");
		} else {
		    var request = {
			appname: final_input
		    };
		    
		    $.ajax({
			type: 'POST',
			url: 'makeapp',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(request),
			success: (function (result) {
			    var status = JSON.parse(result);
			    
			    if (status.success === true) {
				alert("Successfully added car: " + final_input );
				addMenuItem( final_input, final_input );
			    } else {
				alert("Failed to add car: " + JSON.stringify(status));
			    }
			}),
			error: (function (xhr, e_status, error) {alert("Error: " + error);}),
			cache: false
		    });
		}
	    });
	    container.getElement().append( label );
	    container.getElement().append( input );
	    container.getElement().append( toggleButton );
	});

 	myLayout.registerComponent( 'addsf', function( container, state ){
	    var final_appname = state.text;
	    var final_sfname = null;
	    var final_uri = null;

	    var sfname_label = $( '<label>Enter stream name</label>');
	    var sfname_input = $( '<input type="text" />' );

	    var uri_label = $( '<label>Enter URI</label>');
	    var uri_input = $( '<input type="text" />' );
	    
	    sfname_input.val( "" );
	    uri_input.val( "" );

	    sfname_input.appendTo(sfname_label);
	    uri_input.appendTo(uri_label);
	    
	    sfname_input.on( 'change', function(){
		final_sfname = sfname_input.val();
	    });

	    uri_input.on( 'change', function(){
		final_uri = uri_input.val();
	    });

	    var create_sf_btn = $( '<button>Create Stream File</button>' ).click( function () {
		if (!final_sfname) {
		    alert("Enter stream name");
		} else if (!final_uri) {
		    alert("Enter URI");
		} else {
		    var request = {
			appname: final_appname,
			sfname: final_sfname,
			uri: final_uri
		    };
		    
		    $.ajax({
			type: 'POST',
			url: 'makesf',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(request),
			success: (function (result) {
			    var status = JSON.parse(result);
			    
			    if (status.success === true) {
				alert("Successfully add streamfile: " + final_sfname);
				
				var thissf = {
				    title: title + " : " + streamfile_name,
				    type: 'component',
				    componentName: 'sf',
				    componentState: { appname: final_appname, text: final_sfname }
				};

				myLayout2.root.contentItems[ 0 ].addChild( thissf );
				
			    } else {
				alert("Failed to disconnect");
			    }
			}),
			error: (function (xhr, e_status, error) {alert("Error: " + error);}),
			cache: false
		    });
		}
	    });
	    container.getElement().append( sfname_label );
	    container.getElement().append( sfname_input );
	    container.getElement().append( uri_label );
	    container.getElement().append( uri_input );
	    container.getElement().append( create_sf_btn );
	});

	// ***************************************************************************************
	// ***************************************************************************************
	// ***************************************************************************************
	// ***************************************************************************************
	
	myLayout.init();
	myLayout2.init();
	
	var addMenuItem = function( title, text ) {
	    var element = $( '<li>' + text + '</li>' );
	    $( '#menuContainer' ).append( element );
	    
	    var sfconfig = {
		title: title,
		type: 'component',
		componentName: 'addsf',
		componentState: { text: text }
	    };

	    var carconfig = {
		title: title,
		type: 'component',
		componentName: 'confcar',
		componentState: { text: text }
	    };
	    
	    function AddStreamFileWindows(streamfiles) {
		
		_.each(streamfiles, function (streamfile) {
		    
		    var streamfile_name = RemoveTag(streamfile.id);

		    var request = {
			appname: title,
			sfname: streamfile.id
		    };
		    
		    $.ajax({
			type: 'POST',
			url: 'urisf',
			dataType: 'json',
			contentType: 'application/json',
			data: JSON.stringify(request),
			success: (function (result) {
			    var data = JSON.parse(result);
			    
			    var sf = {
				title: title + " : " + streamfile_name,
				type: 'component',
				componentName: 'sf',
				componentState: { current_uri: data.uri, appname: title, text: streamfile_name }
			    };
				
			    myLayout2.root.contentItems[ 0 ].addChild( sf );
			}),
			error: (function (xhr, e_status, error) {alert("Error: " + error);}),
			cache: false
		    });
		    
		});
	    }
	    
	    element.click(function(){

		var request = {
		    id: text
		};
		
		$.ajax({
		    type: 'POST',
		    url: 'sf',
		    dataType: 'json',
		    contentType: 'application/json',
		    data: JSON.stringify(request),
		    success: (function (result) {
			AddStreamFileWindows(JSON.parse(result).sf);
		    }),
		    error: (function (xhr, e_status, error) {alert("Error: " + error);}),
		    cache: false
		});
		
		myLayout.root.contentItems[ 0 ].addChild( sfconfig );
		myLayout.root.contentItems[ 0 ].addChild( carconfig );
	    });
	};
	
	var addAppAddItem = function( title, text ) {
	    var element = $( '<li>' + text + '</li>' );
	    $( '#menuContainerOuter' ).append( element );

	    var newItemConfig = {
		title: title,
		type: 'component',
		componentName: 'addcar',
		componentState: { text: text }
	    };
	    
	    element.click(function(){
		myLayout.root.contentItems[ 0 ].addChild( newItemConfig );
	    });
	};

	addAppAddItem("Add Car", "Add Car");
	
	_.each(application_list.applications, function (app) {
	    	addMenuItem( app.id, app.id ); 
	});
    }

    $.get('apps', (function(response, status) {
	application_list = JSON.parse(response);
	$(start);
    }));
});

