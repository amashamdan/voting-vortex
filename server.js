/* load needed packages/ */
var express = require("express");
var mongodb = require("mongodb");
var ejs = require("ejs");
var ObjectId = require("mongodb").ObjectID;
var bodyParser = require("body-parser");
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var parser = bodyParser.urlencoded({extended: false});
var app = express();
var MongoClient = mongodb.MongoClient;
/* The url to connect to the database is saved in environment variables. */
var mongoUrl = process.env.VOTE;

app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));


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
    callbackURL: 'http://localhost:8085/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));


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

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());



MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.send("Error connecting to database: " + err);
		res.end();
	} else {
		var polls = db.collection("polls");

		app.get("/", function(req, res) {
			res.render("index.ejs", {user: req.user});
		})

		app.get("/home", function(req, res) {
			polls.find({}).toArray(function(err, result) {
				var polls = [];
				for (var entry in result) {
					var poll = {};
					poll.name = result[entry].name;
					poll.votes = countVotes(result[entry].options);
					poll.id = result[entry]["_id"];
					polls.push(poll);
				}
				res.send(polls);
				res.end();
			});
		});

		app.get("/polls/:poll", function(req, res) {
			console.log(req.connection.remoteAddress);
			var ipaddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
			renderPoll(res, polls, req.params.poll, ipaddress, req.user);
		});

		app.post("/polls/:poll", parser, function(req, res) {
			var ipaddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
			var selectedOption = req.body.option;
			/* TO USE A VARIABLE AS A KEY TO UPDATE A NESTED DOCUMENT. The path in database to update the selected country is saved as string. In the update function this variable is used between square brackets and without the quotation marks. "qaz" or qaz or oprion.selectedOption all generate errors or create a new property. */
			var optionPath = "options." + selectedOption;
			/* Notice the callback function only calls the renderPoll function (making the call synchronous). If renderPoll itself was used as callback (without placing it in a function), a bug occurs where the shown results are always 1 vote behind (last vote won't show). */
			polls.update(
				{"_id": ObjectId(req.params.poll)},
				{"$inc": {[optionPath]: 1}, "$push": {"voters": ipaddress}},
				function() {
					renderPoll(res, polls, req.params.poll, ipaddress, req.user);
				}
			);
		});

		app.get('/login/facebook',
			passport.authenticate('facebook'));
		};

		app.get('/login/facebook/return', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    			/* redirects the user to the last page where the request originated from. */
    			res.redirect(req.header('Referer'));
  		});

  		app.get('/logout', function(req, res){
		    req.logout();
		    /* redirects the user to the last page where the request originated from. */
		    if (req.header('Referer') == "http://localhost:8085/mypolls") {
			    res.redirect("/");
		    } else {
		    	res.redirect(req.header('Referer'));
		    }
		});

		app.post("/", function(req, res) {
			var newPollName = req.body.name;
			var newPollOptions = req.body.option;
			var options = {};
			for (var option in newPollOptions) {
				options[newPollOptions[option]] = 0;
			}
			polls.insert(
				{
					"name": newPollName,
					"options": options,
					"creator": req.user.displayName,
					"voters": []
				}, function() {
					// To render after the update
					res.render("index.ejs", {user: req.user});
				}
			);
		});

		app.get("/mypolls", function(req, res) {
			polls.find({"creator": req.user.displayName}).toArray(function(err, result) {
				var votes = [];
				for (var poll in result) {
					votes.push(countVotes(result[poll].options));
				}
				res.render("mypolls.ejs", {user: req.user, polls: result, votes: votes});
			});
		});

		app.delete("/delete/:name", function(req, res) {
			polls.remove({"name": req.params.name});
			res.sendStatus(200);
		});
});

function renderPoll(res, polls, poll, ipaddress, user) {
	polls.find({"_id": ObjectId(poll)}).toArray(function(err, result) {
		var name = result[0].name;
		var list = result[0].options;
		var creator = result[0].creator;
		/* If voters array is non-existent (nobody voted yet), voters array will be undefined which will result in error in ejs. So it is set to empty array if it's undefined. */
		if (result[0].voters) {
			var voters = result[0].voters;
		} else {
			voters = [];
		}
		var votes = countVotes(list);
		res.locals = {name: name, poll: poll, votes: votes, list: list, ipaddress: ipaddress, voters: voters, user: user, creator: creator};
		res.render('poll.ejs');
	})
}

function countVotes(list) {
	var votes = 0;
	for (var key in list) {
		votes += list[key];
	}
	return votes;
}

// port 3000 used for localhost during development.
var port = Number(process.env.PORT || 8085)
app.listen(port);

/* THINGs to do:
- fix heeader and footer (style)
- prevent multiple voting from same user.
- add another athentication method.
- delete option button in new poll form
- optimize for phones. 
- fix new form overflow */