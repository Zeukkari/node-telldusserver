// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server)

var bodyParser = require('body-parser');
var telldus = require('telldus');

var port = process.env.PORT || 8075;        // set our port
server.listen(port);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Processing a request..');
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/:device_id')
	.post(function(req, res) {
		var deviceId = parseInt(req.params.device_id); // parseInt seems to be necessary here. Why?
		console.log("Device ID:'" + deviceId + "'");

		var cmd = req.body.cmd; // turnOn, turnOff, dim

		if(cmd == "turnOn") {
			// Do stuff
			console.log("Turn device on!");
			telldus.turnOn(deviceId, function(err) {
				console.log(err);
			});
		} else if(cmd == "turnOff") {
			console.log("Turn device off!");
			telldus.turnOff(deviceId, function(err) {
				console.log(err);
			});
		} else if(cmd == "dim") {
			var dimLevel = parseInt(req.body.dimLevel);
			console.log("Dim to :" + dimLevel);
			telldus.dim(deviceId, dimLevel, function(err) {
				console.log(err);
			});
		}

		telldus.getDevices(function(err,devices) {
		  if ( err ) {
		    console.log('Error: ' + err);
		  } else {
		    // The list of devices is returned 
		    console.log(devices);
		    io.emit('state change', devices);
		  }
		});
		
		res.end();
	});

router.get('/', function(req, res) {
	telldus.getDevices(function(err,devices) {
	  if ( err ) {
	    console.log('Error: ' + err);
	    res.json({ message: 'Error' + err });
	  } else {
	    // The list of devices is returned 
	    console.log(devices);
	    res.json(devices);
	  }
	});		
     
});

app.use('/telldus', router);

// TODO - add routes and handling for pdu

// File server
app.use(express.static(__dirname + '/www'));


// Socket.io

io.on('connection', function(socket){
  console.log('a user connected');
});

console.log('Server listening on port ' + port);