/* load needed packages/ */
var express = require("express");
var mongodb = require("mongodb");
var ejs = require("ejs");
var ObjectId = require("mongodb").ObjectID;
var bodyParser = require("body-parser");
var parser = bodyParser.urlencoded({extended: false});
var app = express();

var MongoClient = mongodb.MongoClient;
/* The url to connect to the database is saved in environment variables. */
var mongoUrl = process.env.VOTE;

app.use("/stylesheets", express.static(__dirname + "/views/stylesheets"));

MongoClient.connect(mongoUrl, function(err, db) {
	if (err) {
		res.send("Error connecting to database: " + err);
		res.end();
	} else {
		var polls = db.collection("polls");

		app.get("/", function(req, res) {
			res.sendFile(__dirname + "/views/index.html");
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
			renderPoll(res, polls, req.params.poll);
		});

		app.post("/polls/:poll", parser, function(req, res) {
			var selectedOption = req.body.option;
			/* TO USE A VARIABLE AS A KEY TO UPDATE A NESTED DOCUMENT. The path in database to update the selected country is saved as string. In the update function this variable is used between square brackets and without the quotation marks. "qaz" or qaz or oprion.selectedOption all generate errors or create a new property. */
			var optionPath = "options." + selectedOption;
			polls.update(
				{"_id": ObjectId(req.params.poll)},
				{"$inc": {[optionPath]: 1}}
			);
			renderPoll(res, polls, req.params.poll);
		});
	}
});

function renderPoll(res, polls, poll) {
	polls.find({"_id": ObjectId(poll)}).toArray(function(err, result) {
		var name = result[0].name;
		var list = result[0].options;
		var votes = countVotes(list);
		res.locals = {name: name, poll: poll, votes: votes, list: list};
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
