// Socket.io client
var socket = io();

var serverURL = "";

var deviceMap = {
	1 : {
		domId : "device1",
		type : "switch"
	},
	2 : {
		domId : "device2",
		type : "switch"
	},
	3 : {
		domId : "device3",
		type : "switch"
	},
	4 : {
		domId : "device4",
		type : "dimmer"
	},
	9 : {
		domId : "device5",
		type : "magnet switch"
	}
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

		var deviceId = device.id;

		var status = device.status;

		// Skip unmapped devices
		if(!deviceMap[deviceId]) {
			return;
		}

		// Dimmers
		if(deviceMap[deviceId].type == "dimmer") {
			var dimmer = $( "#" + deviceMap[deviceId].domId )
			if(status.name == "DIM") {
				var dimLevel = status.level;
				dimmer.val(dimLevel).slider("refresh");
			} else if(status.name == "ON"){
				dimmer.val(255).slider("refresh");
			} else {
				dimmer.val(0).slider("refresh");
			}
		} else if(deviceMap[deviceId].type == "switch") {
			var flipswitch = $( "#" + deviceMap[deviceId].domId );

			// on/off switches
			if(status.name == "OFF") {
				flipswitch.val("off").slider("refresh");
			} else {
				// Also flips dimmed switched on
				flipswitch.val("on").slider("refresh"); // ON/DIM
			}
		} else if(deviceMap[deviceId].type == "magnet switch") {
			var flipswitch = $( "#" + deviceMap[deviceId].domId );

			// on/off switches
			if(status.name == "OFF") {
				flipswitch.val("off").slider("refresh");
			} else {
				// Also flips dimmed switched on
				flipswitch.val("on").slider("refresh"); // ON/DIM
			}
		}

	});

}

function initListener(deviceId) {
	var device = deviceMap[deviceId];

	var domId = device.domId;
	var deviceType = device.type;
	var deviceElement = $("#" + domId);

	if(deviceType == "dimmer") {
		deviceElement.on('slidestop', function(){
			var dimLevel = 	deviceElement.val();
			if(dimLevel > 0) {
				$.post( serverURL + "/api/" + deviceId, { cmd : "dim", dimLevel : dimLevel } )
			} else {
				$.post( serverURL + "/api/" + deviceId, { cmd : "turnOff" } )
			}
		});
	} else if(device.type == "switch") {
		deviceElement.on('change', function( data ) {
			var flipState = deviceElement.val();
			if( flipState == "on" ) {
				$.post( serverURL + "/api/" + deviceId, { cmd : "turnOn" } );
			} else {
				$.post( serverURL + "/api/" + deviceId, { cmd : "turnOff" } );
			}
		});
	}

}

function init() {

	socket.on('state change', function(devices){
		console.info("state change!", devices);
		syncView(devices);
	});

	socket.on('error', function(reason){
		alert("Unable to connect to Socket.IO");
		console.error("Unable to cnonect to Socket.IO", reason);
	});

	socket.on('connect', function(){
		console.info("Succesfully established a working and authorized connection");
	});


	Object.keys(deviceMap).forEach(function(deviceId){
		initListener(deviceId);
	});

	syncView(getDevices());
}

$(document).ready(function() {
	init();
});

