"use strict";

// IMPORTS
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const { passwordStrength } = require("check-password-strength");
const xssFilters = require("xss-filters");
const sessions = require("client-sessions");

// create an instance of the express app
const app = express();

//
app.use(bodyParser.urlencoded({ extended: true }));

// instruct express to set the view engine to ejs
app.set("view engine", "ejs");

// middleware for cookie named session
app.use(
  sessions({
    cookieName: "session",
    secret: "random_string_goes_here",
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  })
);

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

// Replaces all elements of the string
// @param src - the string on which to perform the replacement
// @param search - what to look for
// @param replacement - what to replace with
function replaceAll(src, search, replacement) {
  return src.replace(new RegExp(search, "g"), replacement);
}

// Generates and sends the notes
// @param response - the response object to use for replying
function generateAndSendNotes(res) {
  // Read the comments file
  // @error - if there an error
  // @data - the data read
  fs.readFile("notes.txt", function (error, data) {
    // If the read fails
    if (error) throw error;

    // The comments data
    let notesData = "" + data;

    // Replace the newlines with HTML <br>
    notesData = replaceAll(notesData, "\n", "<br>");

    let pageStr = "";
    pageStr += notesData;

    // Send the page
    res.render("pages/app", { pageStr: pageStr });
  });
}

// *************** STATIC ENDPOINTS ***************

// send the static style sheet (called in .../partials/head.ejs)
app.get("/static/style.css", (req, res) => {
  res.sendFile(
    __dirname + xssFilters.uriInDoubleQuotedAttr("/static/style.css")
  );
});

// *************** HOME ENDPOINT ***************

// index page (method: GET)
// The handler for the home page
// @param req - the request
// @param res - the response
app.get("/", function (req, res) {
  if (req.session.username) {
    res.redirect("/app");
  } else {
    res.render("pages/index");
  }
});

// *************** APP ENDPOINTS ***************
// internal guestbook example from xss_codes/

// the app page
// @param req - the request
// @param res - the response
app.get("/app", (req, res) => {
  // if user is logged in show main app
  if (req.session.username) {
    // Generate the page
    generateAndSendNotes(res);
  } else {
    res.redirect("/");
  }
});

// create a new note in main app
app.post("/app", (req, res) => {
  // Save the data to to the comments file
  fs.appendFile(
    "notes.txt",
    xssFilters.inHTMLData(req.body.note) + "\n",
    function (error) {
      // Error checks
      if (error) throw error;

      generateAndSendNotes(res);
    }
  );
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
  res.render("pages/login");
});

// login page (method: POST)
// The handler for the request of the login page
// @param req - the request
// @param res - the response
app.post("/login", (req, res) => {
  // save the user's login form input for login and password fields
  let loginUsername = xssFilters.inDoubleQuotedAttr(req.body.username);
  let loginPassword = xssFilters.inDoubleQuotedAttr(req.body.password);

  // Read the "database" file
  fs.readFile("database.txt", "utf8", (error, data) => {
    // throw error if readFile fails to read the file
    if (error) throw error;

    // Split the database.txt by line
    let tokenizedDatabase = data.split("\n");

    // Match the credentials
    let credMatch = false;

    // loop through usernames and passwords to try to find match to login info
    for (let i = 0; i < tokenizedDatabase.length; i++) {
      // save the database username and password at the current index i
      // example: user;password
      let databaseUsername = tokenizedDatabase[i].split(";")[0];
      let databasePassword = tokenizedDatabase[i].split(";")[1];

      // Check the username and password against user's login request
      if (
        loginUsername == databaseUsername &&
        loginPassword == databasePassword
      ) {
        // We have a match!
        credMatch = true;
      }
    }

    if (credMatch === true) {
      // login successful

      // set cookie
      req.session.username = req.body.username;

      // redirect to main app page
      res.redirect("/app");
    } else {
      // Credentials did not match? Do not display the main app page.
      res.send("LOGIN UNSUCCESSFUL. TRY AGAIN.");
    }
  });
});

// The logout endpoint
// @param req - the request
// @param res - the response
app.get("/logout", (req, res) => {
  // kill the session cookie
  req.session.reset();

  // redirect to home page
  res.redirect("/");
});

let localHost = xssFilters.uriInDoubleQuotedAttr("http://localhost:");
const port = 3000;

app.listen(port, () => console.log(`App listening at ${localHost}${port}/`));
