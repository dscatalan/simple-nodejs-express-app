"use strict";

// import the express framework
const express = require("express");

const fs = require("fs");

const bodyParser = require("body-parser");

const { passwordStrength } = require("check-password-strength");

const xssFilters = require("xss-filters");

// create an instance of the express app
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

// instruct express to set the view engine to ejs
app.set("view engine", "ejs");

// *************** HELPER FUNCTIONS ***************

// Parses a database of usernames and passwords
// @param dbFile - the database file
// @return - the list of user name and passwords
function parseDB(dbFile) {
  // Read the file
  fs.readFile(dbFile, "utf8", function (error, data) {
    console.log(data);
    data.split(";");
  });
}

// *************** STATIC ENDPOINTS ***************
app.get("/static/style.css", (req, res) => {
  res.sendFile(__dirname + "/static/style.css");
});

// *************** HOME ENDPOINT ***************

// index page (method: GET)
// The handler for the home page
// @param req - the request
// @param res - the response
app.get("/", function (req, res) {
  res.render("pages/index");
});

// *************** SIGNUP ENDPOINTS ***************

// signup page (method: GET)
app.get("/signup", (req, res) => {
  res.render("pages/signup");
});

// middleware: check-password-strength
app.use("/signup", (req, res, next) => {
  console.log("middleware: checking password strength...");
  console.log("Password:", passwordStrength(req.body.password).value);

  if (passwordStrength(req.body.password).value === "Strong") {
    next();
  } else {
    res.send("Password Not Strong Enough!");
  }
});

// signup page (method: POST)
app.post("/signup", (req, res) => {
  console.log(req.body);

  // append the entry to the text database
  fs.appendFile(
    "database.txt",
    xssFilters.inHTMLData(req.body.username) +
      ";" +
      xssFilters.inHTMLData(req.body.password) +
      "\n",
    function (err) {
      res.send("Thank you for registering!");
    }
  );
  parseDB("database.txt");
});

// *************** LOGIN ENDPOINTS ***************

// login page (method: GET)
app.get("/login", (req, res) => {
  res.render("pages/login", { loggedIn: true, username: req.body.username });
});

// login page (method: POST)
// The handler for the request of the login page
// @param req - the request
// @param res - the response
app.post("/login", function (req, res) {
  // Read the file
  fs.readFile("database.txt", "utf8", function (error, data) {
    // Split the data
    let tokenizedData = data.split("\n");

    // Match the credentials
    let credMath = false;

    // Add the HTML; match the password while you are at it
    for (let i = 0; i < tokenizedData.length; i++) {
      // Get the user name and password
      let userName = tokenizedData[i].split(";")[0];
      let password = tokenizedData[i].split(";")[1];

      // Check the user name and password
      if (xssFilters.inDoubleQuotedAttr(req.body.username) == userName && xssFilters.inDoubleQuotedAttr(req.body.password) == password) {
        // We have a match!
        credMath = true;
      }
    }

    // Credentials did not match? Do not display the page
    if (credMath == false) {
      res.send("bad login info");
    } else {
      res.redirect("/app");
    }
  });
});

// *************** APP ENDPOINTS ***************
// internal guestbook example from xss_codes/

// app page (method: GET)
// Replaces all elements of the string
// @param src - the string on which to perform the replacement
// @param search - what to look for
// @param replacement - what to replace with
function replaceAll(src, search, replacement) {
  return src.replace(new RegExp(search, "g"), replacement);
}

// Generates and sends the HTML page
// @param response - the response object to use for replying
function generateAndSendPage(response) {
  // Read the comments file
  // @error - if there an error
  // @data - the data read
  fs.readFile("notes.txt", function (error, data) {
    // If the read fails
    if (error) throw error;

    // The comments data
    let commentsData = "" + data;

    // Replace the newlines with HTML <br>
    commentsData = replaceAll(commentsData, "\n", "<br>");

    let pageStr = "	<!DOCTYPE html>";
    pageStr += "	<html>";
    pageStr += "	<head>";
    pageStr += "		<title>App </title>";
    pageStr += "	</head>";
    pageStr += "	<body bgcolor=white>";
    pageStr += "	   <h1>App</h1><br>";
    pageStr += commentsData;
    pageStr += "	    <form action='/app' method='post'>";
    pageStr += "        	    <label for='comment'>Note:</label>";
    pageStr +=
      "	            <textarea id='comment' name='comment' placeholder='Whats on your mind?'></textarea><br><br>";
    pageStr += "        	    <input type='submit' value='Save Note' />";
    pageStr += "	    </form>";
    pageStr += "	</body>";
    pageStr += "</html>	";

    // Send the page
    response.send(pageStr);
  });
}

// Handles the sending of the index
app.get("/app", (req, res) => {
  // Generate the page
  generateAndSendPage(res);
});

// Handles the form
app.post("/app", (req, res) => {
  // Save the data to to the comments file
  fs.appendFile("notes.txt", xssFilters.inHTMLData(req.body.comment) + "\n", function (error) {
    // Error checks
    if (error) throw error;

    generateAndSendPage(res);
  });
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}/`)
);
