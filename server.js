/* load needed packages/ */
var express = require("express");
var mongodb = require("mongodb");
var ejs = require("ejs");
/* To lookup docs in mongo by id */
var ObjectId = require("mongodb").ObjectID;
/* To read request body */
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});
/* For facebook login */
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
/* Creating express instance */
var app = express();
var MongoClient = mongodb.MongoClient;
/* The url to connect to the database is saved in environment variables. */
var mongoUrl = process.env.VOTE;
/* Next two lines serve static files, first line for stylesheets while the second one is for scripts. */
app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));
app.use("/scripts", express.static(__dirname + "/views/scripts"));
/* Comments below from Passport example code. */
// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    /* Do not redirect to root. return root uses another function needed for authentication, that function cannot work with root. */
    callbackURL: 'https://voting-vortex.herokuapp.com/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
  	/* Comments below from Passport example code. */
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));
/* Comments below from Passport example code. */
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
/* Comments below from Passport example code. */
// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
/* Comments below from Passport example code. */
// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());
/* Connect to MongoDB, connection remains on when server is fired up instead of making connection on every operation to speed loading pages. */
MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.send("Error connecting to database: " + err);
		res.end();
	} else {
		/* polls colleciton created. */
		var polls = db.collection("polls");
		/* get request on root. */
		app.get("/", function(req, res) {
			if (location.protocol != 'https:'){
			 location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
			}
			/* renders index.ejs and send user information. req.user is added by passport. If not logged in, user becomes undefined. */
			res.render("index.ejs", {user: req.user});
		});
		/* This request is placed when the home page is loaded. It loads all the saved polls. */
		app.get("/home", function(req, res) {
			/* Looks up all polls */
			polls.find({}).toArray(function(err, result) {
				/* This array will hold the information we need about each poll. It will contain objects, each object represents a poll. */
				var polls = [];
				/* Loop thrugh the results, each entry represents a poll. */
				for (var entry in result) {
					/* Each poll's info are saved in an object. */
					var poll = {};
					/* Poll's name, number of votes, and its id in the database are stored. */
					poll.name = result[entry].name;
					/* The votes are counted using countVotes function, which accepts the voting options object as parameter. */
					poll.votes = countVotes(result[entry].options);
					poll.id = result[entry]["_id"];
					/* The poll is pushed to the polls array. */
					polls.push(poll);
				}
				/* polls is sent as response. */
				res.send(polls);
				res.end();
			});
		});
		/* This request is initiated when a poll's page is requested. the req.params.poll is the poll's id. */
		app.get("/polls/:poll", function(req, res) {
			/* The client's ip address is saved. */
			var ipaddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
			/* renderPoll function is called to load needed data and render the page. */
			renderPoll(res, polls, req.params.poll, ipaddress, req.user);
		});
		/* This post request is initiated when the user votes in a poll. */
		app.post("/polls/:poll", parser, function(req, res) {
			/* ip address of the client is saved. */
			var ipaddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
			/* The option voted for is saved. */
			var selectedOption = req.body.option;
			/* TO USE A VARIABLE AS A KEY TO UPDATE A NESTED DOCUMENT. The path in database to update the selected country is saved as string. In the update function this variable is used between square brackets and without the quotation marks. "qaz" or qaz or oprion.selectedOption all generate errors or create a new property. */
			var optionPath = "options." + selectedOption;
			/* Notice the callback function only calls the renderPoll function (making the call synchronous). If renderPoll itself was used as callback (without placing it in a function), a bug occurs where the shown results are always 1 vote behind (last vote won't show). */
			/* The database is updated and the selecte option's count is increased by 1. Voter's ip address is saved. */
			polls.update(
				{"_id": ObjectId(req.params.poll)},
				{"$inc": {[optionPath]: 1}, "$push": {"voters": ipaddress}},
				function() {
					renderPoll(res, polls, req.params.poll, ipaddress, req.user);
				}
			);
		});
		/* In '/login/facebook/return' route, the user was redirected to req.header('Referer').
		If the user was logged in on the computer with facebook, the user will be redirected to the last page on vortex without issues.
		If the user wasn't logged in on the computer with FB, the code will redirect the user to facebook instead because it became the referer.
		To fix it, a function callback (savePage) acting as middleware is added to the get request of '/login/facebook' before passport.authenticate('facebook') is called.
		In this function, the referer is stored. Which means the vortex page will be saved even if the user is redirected to facebook login page, because referer is saved before that." */
		var lastPage = "/";
		function savePage(req, res, next) {
			lastPage = req.header('Referer');
			next();
		}
		/* Facebook login request. */
		app.get('/login/facebook', savePage, passport.authenticate('facebook'));
		/* Return after facebook login. */
		app.get('/login/facebook/return', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    			/* redirects the user to the last page where the request originated from. */
    			res.redirect(lastPage);
  		});
		/* Facebook logout request. */
  		app.get('/logout', function(req, res){
		    req.logout();
		    if (req.header('Referer') == "https://voting-vortex.herokuapp.com/mypolls") {
			    /* If the user was on mypolls page, they are directed to the home page. */
			    res.redirect("/");
		    } else {
		    	/* redirects the user to the last page where the request originated from. */
		    	res.redirect(req.header('Referer'));
		    }
		});
  		/* Initiated when the user submit the form to add a new poll. */
		app.post("/", function(req, res) {
			/* The poll's name and options are saved. */
			var newPollName = req.body.name;
			var newPollOptions = req.body.option;
			/* The options are saved in an object like the database. */
			var options = {};
			/* Each option is added to the options object and given a number of votes of 0. */
			for (var option in newPollOptions) {
				options[newPollOptions[option]] = 0;
			}
			/* The new poll is added to the database. */
			polls.insert(
				{
					"name": newPollName,
					"options": options,
					"creator": req.user.displayName,
					"voters": []
				}, function() {
					//res.render("index.ejs", {user: req.user});
					/* The above line works but generates an error when the user tries to refresh the page. Upon refresh the poll added will keep dubplicating because the form will keep resubmitting itself. redirecting the page instead goes to a completely different page and refreshing the page doesn't resubmit the form but only reloads the home page. */
					res.redirect("/");
				}
			);
		});
		/* When the user request mypolls page. */
		app.get("/mypolls", function(req, res) {
			/* The user's displayName is used to lookup all polls created by them. */
			polls.find({"creator": req.user.displayName}).toArray(function(err, result) {
				/* This array stored the number of votes for each poll found. */
				var votes = [];
				/* The number of votes for each poll is found using countVotes function and saved in votes. */
				for (var poll in result) {
					votes.push(countVotes(result[poll].options));
				}
				/* My polls page is rendered. */
				res.render("mypolls.ejs", {user: req.user, polls: result, votes: votes});
			});
		});
		/* Initiated when the user wants to delete a poll */
		app.delete("/delete/:name", function(req, res) {
			/* The poll is looked up and removed. */
			polls.remove({"name": req.params.name});
			/* The status is important to send back, it tells the browser that the request was completed. */
			res.sendStatus(200);
		});
	}
});
/* renderPoll function. */
function renderPoll(res, polls, poll, ipaddress, user) {
	/* Looks up the requested poll by its id. */
	polls.find({"_id": ObjectId(poll)}).toArray(function(err, result) {
		/* Information are extracted from the results. */
		var name = result[0].name;
		var list = result[0].options;
		var creator = result[0].creator;
		/* If voters array is non-existent (nobody voted yet), voters array will be undefined which will result in error in ejs. So it is set to empty array if it's undefined. */
		if (result[0].voters) {
			var voters = result[0].voters;
		} else {
			voters = [];
		}
		/* The number of votes are counted by countVotes function. */
		var votes = countVotes(list);
		/* Information to be sent to the client. */
		res.locals = {name: name, poll: poll, votes: votes, list: list, ipaddress: ipaddress, voters: voters, user: user, creator: creator};
		/* poll.ejs is rendered. */
		res.render('poll.ejs');
	})
}
/* countVotes function counts the total number of votes for a poll. */
function countVotes(list) {
	/* Initializes total to zero. */
	var votes = 0;
	/* The list is an object, key is the option and the value is the number of votes for that option. */
	for (var key in list) {
		/* The number of votes for each option is added to the total number of votes. */
		votes += list[key];
	}
	/* Total number of votes is returned. */
	return votes;
}
// port 8085 used for localhost during development.
var port = Number(process.env.PORT || 8085)
app.listen(port);