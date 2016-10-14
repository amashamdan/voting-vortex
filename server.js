/* load needed packages/ */
var express = require("express");
var mongodb = require("mongodb");
var app = express();

//var MongoClient = mongodb.MongoClient;
/* The url to connect to the database is saved in environment variables. */
//var mongoUrl = process.env.SEARCH_HISTORY;

app.get("/", function(req, res) {
	app.use("/stylesheets", express.static(__dirname + "/stylesheets"));
	res.sendFile(__dirname + "/index.html");
})

// port 3000 used for localhost during development.
var port = Number(process.env.PORT || 3000)
app.listen(port);


/*
function connectToMongo(status, res, itemSearched, date) {
	MongoClient.connect(mongoUrl, function(err, db) {
		if (err) {
			console.log("Error connecting to database: " + err);
		} else {
			console.log("connection established");
			var searchedItems = db.collection("searched_items");
			if (status == "save") {
					searchedItems.insert({
					"item searched": itemSearched,
					"time searched": date
				});
			} else if (status == "load") {
				searchedItems.find({}, {"_id": false}).sort({"_id": -1}).limit(10).toArray(function(err, result) {
					res.send(result);
					res.end();
				})
			}
		}
	});
}
*/

