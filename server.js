/* load needed packages/ */
var express = require("express");
var mongodb = require("mongodb");
var app = express();

var MongoClient = mongodb.MongoClient;
/* The url to connect to the database is saved in environment variables. */
var mongoUrl = process.env.VOTE;
console.log(mongoUrl);

app.get("/", function(req, res) {
	app.use("/stylesheets", express.static(__dirname + "/stylesheets"));
	res.sendFile(__dirname + "/index.html");
})

app.get("/test", function(req, res) {
	MongoClient.connect(mongoUrl, function(err, db) {
		if (err) {
			res.send("Error connecting to database: " + err);
			res.end();
		} else {
			console.log("connection established");
			var polls = db.collection("polls");
			polls.find({}).toArray(function(err, result) {
					res.send(result);
					res.end();
			})
		}
	});	
})

// port 3000 used for localhost during development.
var port = Number(process.env.PORT || 3000)
app.listen(port);
