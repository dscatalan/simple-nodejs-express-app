// import the express framework
const express = require("express");

// create an instance of the express app
const app = express();
const port = 3000;

// instruct express to set the view engine to ejs
app.set("view engine", "ejs");

// *************** HOME ENDPOINTS ***************

// index page (method: GET)
app.get("/", (req, resp) => {
  // Read the database text file
  //fs.readFile("database.txt", "utf8", (error, data) => {
    //let tokenizedData = data.split("\n");

    //console.log(tokenizedData);

    resp.render("pages/index");
  //});
});


// *************** SIGNUP ENDPOINTS ***************

// signup page (method: GET)
app.get("/signup", (req, res) => {
  res.render("pages/signup");
});

// signup page (method: POST)
app.post("/signup", (req, res) => {
  console.log(req.body);

  // append the entry to the text database
  fs.appendFile(
    "database.txt",
    req.body.username + ";" + req.body.password + "\n",
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
app.post("/login", (req, res) => {
  // TO DO
});


app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}/`)
);
