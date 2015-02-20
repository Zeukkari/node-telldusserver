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
	clientID: config.github.appId,
	clientSecret: config.github.appSecret,
	callbackURL: config.github.callbackURL
},
function(accessToken, refreshToken, profile, done) {
	// asynchronous verification, for effect...
	process.nextTick(function () {
		// To keep the example simple, the user's GitHub profile is returned to
		// represent the logged-in user. In a typical application, you would want
		// to associate the GitHub account with a user record in your database,
		// and return that user instead.
		return done(null, profile);
	});
}));

var server = http.Server(app);

var io = require('socket.io')(server);


var router = express.Router();              // get an instance of the express Router

// Configure
app.set('view engine', 'jade');
app.set('views', 'views');
//app.set('view cache', false);
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(session( { secret : 'nihilus', key : "express.sid"} ));
app.use(passport.initialize());
app.use(passport.session());
app.use(router);
app.use(express.static(__dirname + '/www'));

// // middleware to use for all requests
// router.use(function(req, res, next) {
//   // do logging
//   console.log('Processing a request..');
//   next(); // make sure we go to the next routes and don't stop here
// });

// Redirect the user to the OAuth 2.0 provider for authentication.  When
// complete, the provider will redirect the user back to the application at
//     /auth/provider/callback
app.get('/auth/github', passport.authenticate('github', {failureRedirect : '/login'}),
	function(req, res) {
		res.redirect('/');
	});

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

app.get('/login', function(req, res){
	res.render('login.jade');
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

// Access control here!
router.use('/telldus', ensureAuthenticated);

router.route('/telldus/:device_id')
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

router.get('/telldus', function(req, res) {
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

server.listen(port);

// // Socket.io
io.set('authorization', function(handshakeData, accept){
	//console.info("Socket.io authorization: ", handshakeData);

  if (handshakeData.headers.cookie) {

    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

    handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie['express.sid'], 'nihilus');

    //console.info("handshakeData: ", handshakeData);

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

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { 
		return next(); 
	}
	res.redirect('/login');
}