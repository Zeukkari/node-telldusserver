// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app = express();
var port = process.env.PORT || 8075;

// Telldus
var telldus = require('telldus');


// Passport.js
var passport = require('passport');
var util = require('util');
var GitHubStrategy = require('passport-github').Strategy;

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var http = require('http');

// Config
var config = require('./config');


// Express dependencies
var cookie = require('cookie');
var methodOverride = require('method-override')

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Use the GitHubStrategy within Passport.
// Strategies in Passport require a `verify` function, which accept
// credentials (in this case, an accessToken, refreshToken, and GitHub
// profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
	clientID: config.auth.github.appId,
	clientSecret: config.auth.github.appSecret,
	callbackURL: config.auth.github.callbackURL
},
function(accessToken, refreshToken, profile, done) {
	console.info("accessToken: ", accessToken);
	console.info("refreshToken: ", refreshToken);
	console.info("profile: ", profile);

	var githubuser = config.auth.github.username;


	// Skip github user checkup if the config key is missing
	if(githubuser && profile.username != githubuser) {
		throw "Error: invalid username!";
		return;
	} else {
		// asynchronous verification, for effect...
		process.nextTick(function () {
			// To keep the example simple, the user's GitHub profile is returned to
			// represent the logged-in user. In a typical application, you would want
			// to associate the GitHub account with a user record in your database,
			// and return that user instead.
			return done(null, profile);
		});		
	}
}));

var server = http.Server(app);

var io = require('socket.io')(server);

// Telldus bridge
telldus.addDeviceEventListener(function(deviceId, data) {
	console.log('deviceId: ', deviceId);
  console.log('Device event: ', data);

  // ON or OFF
  var cmd = data.name;
  console.info("cmd: ", cmd);

  // Map external transmitter devices to reciever devices
  var deviceBridge = config.bridge;

  if(!deviceBridge[deviceId]) {
	  console.log("No device bridge for: " + deviceId);
	  return;
  }

  // Evoke script
  if(deviceBridge[deviceId].script) {
		var util = require('util');
		var exec = require('child_process').exec;

		console.info("bridge to script: ", deviceBridge[deviceId].script);

	  if(cmd == "OFF") {
	  	exec(deviceBridge[deviceId].script + " off" + " " + deviceId, function(error){
	  		if(error) console.err(error);
	  	})
	  } else if(cmd == "ON") {
	  	exec(deviceBridge[deviceId].script + " on" + " " + deviceId, function(error){
	  		if(error) console.err(error);
	  	})
	  }
  }

  // Direct links
  if(deviceBridge[deviceId].bridgeTo) {
	  var recieverDeviceId = deviceBridge[deviceId].bridgeTo;

	  if(cmd == "OFF") {
	  	telldus.turnOff(recieverDeviceId,function(err) {
	    	console.log('Device' + recieverDeviceId + ' is now OFF');
	    });
	  } else if(cmd == "ON") {
	  	telldus.turnOn(recieverDeviceId,function(err) {
	    	console.log('Device' + recieverDeviceId + ' is now ON');
	  	});
	  }
  }

  // Emit state change
	telldus.getDevices(function(err,devices) {
	  if ( err ) {
	    console.log('Error: ' + err);
	  } else {
	    // The list of devices is returned
	    console.info("Emit state change from bridge!", devices);
	    io.emit('state change', devices);
	  }
	});

});


var router = express.Router();              // get an instance of the express Router

// Configure
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(session( { secret : 'nihilus', key : "express.sid"} ));
app.use(passport.initialize());
app.use(passport.session());
app.use(router);

// Redirect the user to the OAuth 2.0 provider for authentication.  When
// complete, the provider will redirect the user back to the application at
//     /auth/provider/callback
app.get('/auth/github', passport.authenticate('github', {
	failureRedirect : '/login'
}));

// The OAuth 2.0 provider has redirected the user back to the application.
// Finish the authentication process by attempting to obtain an access
// token.  If authorization was granted, the user will be logged in.
// Otherwise, authentication has failed.
app.get('/auth/github/callback',
	passport.authenticate('github', {
    failureRedirect: '/login'
  }), function(req, res) {
		res.redirect('/');
	}
);

// Access control
app.all('/', function(req, res, next){
	if (isAuthenticated(req)) {
		return next(); 
	}
	res.redirect('/login');
});

// Jade View Model
var viewModel = {
	devices : [
		{
			name : "Living room light",
			deviceid : 4,
			type : "dimmer",
			labelid : "device4",
			label : "Living room light"
		},{
			name : "Desk light",
			deviceid : 2,
			type : "switch",
			labelid : "device2",
			label : "Desk light"
		},{
			name : "Monitor LED",	
			deviceid : 3,
			type : "switch",
			labelid : "device3",
			label : "Monitor LED"
		},{
			name : "Fan",
			deviceid : 1,
			type : "switch",
			labelid : "device1",
			label : "Fan"
		},{
			name : "Door sensor",
			deviceid : 9,
			type : "magnet switch",
			labelid : "device5",
			label : "Door sensor"			
		}
	]
}

app.get('/', function(req, res){
	//res.redirect('/login.html');
	res.render('index.jade', viewModel);
});

app.get('/login', function(req, res){
	res.redirect('/login.html');
	//res.render('login.jade');
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.use(express.static(__dirname + '/www'));

var path = require('path');
app.set('views', path.join("www", 'views'));
app.set('view engine', 'jade');

// Access control here!
router.use('/api', function(req, res, next) {
	// Access control
		if (!isAuthenticated(req)) { 
		res.status(401).json({ error: 'Respect my authoritah!' });
	}
	next();
});

router.route('/api/:device_id')
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

			// Turn dim level up or down

			var dimLevel = req.body.dimLevel;
			console.log("dimLevel", dimLevel);

			var op = dimLevel[0];
			console.log("op", op);


			var dimLevel = parseInt(dimLevel);
			dimLevel = Math.abs(dimLevel);
			

			var getCurrentDimLevel = function() {
				var brightness;
				var devices = telldus.getDevicesSync();
				devices.forEach(function(device) {
		    	if(device.id == deviceId) {
		    		if(device.status.name == "DIM") {
		    			brightness = device.status.level;
		    		} else if(device.status.name == "ON") {
		    			brightness = 255;
		    		} else if (device.status.name == "OFF") {
		    			brightness = 0;
		    		}
		    	}				
				});
				console.log("brightness", brightness);
				return brightness;
			}

			if(op == "+") {
				var brightness = getCurrentDimLevel();
				dimLevel = brightness + dimLevel;
			} else if (op == "-") {
				var brightness = getCurrentDimLevel();
				dimLevel = brightness - dimLevel;
			}


			if(dimLevel > 255) {
				dimLevel = 255;
			}
			if(dimLevel < 0 ) {
				dimLevel = 0;
			}

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
		    io.emit('state change', devices);
		  }
		});
		
		res.end();
	});

router.get('/api/devices', function(req, res) {
	telldus.getDevices(function(err,devices) {
	  if ( err ) {
	    res.json({ message: 'Error' + err });
	  } else {
	    // The list of devices is returned 
	    res.json(devices);
	  }
	});		
     
});

server.listen(port);

// // Socket.io
io.set('authorization', function(handshakeData, accept){

	//console.info(handshakeData);

  if (handshakeData.headers.cookie) {

    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

    console.log("Cookie: ", handshakeData.cookie);

    console.log(handshakeData.cookie['express.sid']);

    if(!handshakeData.cookie['express.sid']) {
    	return accept('No session cookie.', false);
    }

    handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie['express.sid'], 'nihilus');

    if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
      return accept('Cookie is invalid.', false);
    }

  } else {
    return accept('No cookie transmitted.', false);
  } 

	accept(null, true);
});

io.on('connection', function(socket){
  console.log('a user connected');
});

console.log('Server listening on port ' + port);

function matchLocalSubnets(requestIP) {
	// LAN authentication

	var inSubnet = require('insubnet');

	var matchOk = false;
	config.auth.local.subnets.forEach(function(subnet) {
		if(inSubnet.Auto(requestIP, subnet)) {
			matchOk = true;
			console.info("Local IP ok: ", requestIP, subnet);
		}
	});

	return matchOk;

}

// IP based authentication & Passport.js authentication
function isAuthenticated(req) {
	console.log("Authentication request.. ip: ", req.ip);

	// Passport.js
	if(req.isAuthenticated()) {
		return true;
	}

	// Validate LAN connections
	if(matchLocalSubnets(req.ip)) {
		return true;
	}

	return false;
}