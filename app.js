// Import the express framework
const express = require('express');

// Create an instance of the express app
const app = express();

// On Get requesting with "/" the website homepage
// the following callback will be invoked
//req: the request
// resp: the response
app.get('/', (req, resp) => 
{
    // __dirname refers to the current directory path
    // send back HTTP response containing "Hello World"
    resp.sendFile(__dirname + "/index.html");

});

console.log("Open http://localhost:3000/")
app.listen(3000);