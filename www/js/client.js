// Socket.io client
var socket = io();

var serverURL = "";

var deviceMap = {
	1 : "device1",
	2 : "device2",
	3 : "device3",
	4 : "device4" // also dimmer
}

function getDevices() {

	var responseText = $.ajax( {
		url : serverURL + "/api/devices",
		success :  function( data ) {
			console.info("Devices: ", data);
			return data;
		},
		async : false
	}).responseText;

	var response = $.parseJSON(responseText);

	console.info("response: ", response);

	return response;

}

function syncView(devices) {
	if(!devices || !devices.length) {
		throw "Sync error!!!";
		return;
	}

	//var devices = getDevices();

	devices.forEach(function(device) {

		var status = device.status;

		// Dimmer
		if(device.name == "Kattolamppu") {
			if(status.name == "DIM") {
				var dimLevel = status.level;
				$( "#dimmer" ).val(dimLevel).slider("refresh");
			} else if(status.name == "ON"){
				$( "#dimmer" ).val(255).slider("refresh");
			} else {
				$( "#dimmer" ).val(0).slider("refresh");
			}
		}

		var flipswitch = $( "#" + deviceMap[device.id] );

		// on/off switches
		if(status.name == "OFF") {
			flipswitch.val("off").slider("refresh");
		} else {
			// Also flips dimmed switched on
			flipswitch.val("on").slider("refresh"); // ON/DIM
		}

	});

}

function init() {

	syncView(getDevices());

	//$( "#dimmer" ).slider();
	$( "#dimmer" ).on('slidestop', function(){
		var dimLevel = 	$( "#dimmer" ).val();

		if(dimLevel > 0) {
			$.post( serverURL + "/api/4", { cmd : "dim", dimLevel : dimLevel } )
		} else {
			$.post( serverURL + "/api/4", { cmd : "turnOff" } )
		}

	});

	$( "#device1" ).on('change', function( data ) { 
		var flipState = $( "#device1" ).val();

		if( flipState == "on" ) {
			$.post( serverURL + "/api/1", { cmd : "turnOn" } );
		} else {
			$.post( serverURL + "/api/1", { cmd : "turnOff" } );
		}
	});

	$( "#device2" ).on('change', function( data ) { 
		var flipState = $( "#device2" ).val();

		if( flipState == "on" ) {
			$.post( serverURL + "/api/2", { cmd : "turnOn" } );
		} else {
			$.post( serverURL + "/api/2", { cmd : "turnOff" } );
		}
	});

	$( "#device3" ).on('change', function( data ) { 
		var flipState = $( "#device3" ).val();

		if( flipState == "on" ) {
			$.post( serverURL + "/api/3", { cmd : "turnOn" } );
		} else {
			$.post( serverURL + "/api/3", { cmd : "turnOff" } );
		}
	});

	// $( "#syncButton" ).on('click', function() {
	// 	syncView();
	// });

	socket.on('state change', function(devices){
		syncView(devices);
	});

	socket.on('error', function(reason){
		alert("Unable to connect to Socket.IO");
		console.error("Unable to cnonect to Socket.IO", reason);
	});

	socket.on('connect', function(){
		console.info("Succesfully established a working and authorized connection");
	});
}

$(document).ready(function() {
	init();
});

