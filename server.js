var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize the database before starting the application server.
var db;
mongodb.MongoClient.connect(process.env.MONGOLAB_URI, function (err, database) {
  if (err) throw err;

  // Save database object for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// Generic error handler used by all endpoints.
function handleError(code, e, res, message) {
  res.status(500).json({"error": message, "reason": e.message || "unknown"});
}

// ****************************** CONTACTS CRUD ROUTES ******************************************

/*  "/contacts"
 *    GET: grabs all contacts
 *    POST: creates a new contact
 */

app.get("/contacts", function(req, res) {
  db.collection("contacts").find({}).toArray(function(err, docs) {
    if (err) {
      handleError(err, res, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);  
    }
  });
});

app.post("/contacts", function(req, res) {
  var newDoc = req.body;
  newDoc.createDate = new Date();

  if (req.body.firstName === undefined || req.body.lastName === undefined) {
    handleError(null, res, "Must provide a contact name.");
  }

  db.collection("contacts").insertOne(newDoc, function(err, doc) {
    if (err) {
      handleError(err, res, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/contacts/:id"
 *    GET: gets contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
  db.collection("contacts").findOne({ _id: new ObjectId(req.params.id) }, function(err, doc) {
    if (err) {
      console.log(err);
      handleError(err, res, "Failed to get contact: " + req.params.id + ".");
    } else {
      res.status(200).json(doc);  
    }
  });
});

app.put("/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc["_id"];
  console.log(updateDoc);
  db.collection("contacts").updateOne({_id: new ObjectId(req.params.id)}, updateDoc, 
    function(err, doc) {
      if (err) {
        handleError(err, res, "Failed to update contact" + req.params.id + ".");
      } else {
        res.status(204).end();
      }
  });
});

app.delete("/contacts/:id", function(req, res) {
  db.collection("contacts").deleteOne({_id: new ObjectId(req.params.id)}, function(err, result) {
    if (err) {
      handleError(err, res, "Failed to delete contact" + req.params.id + ".");
    } else {
      res.status(204).end();
    }
  });
});