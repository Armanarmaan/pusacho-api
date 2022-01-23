const express = require('express')
const bodyParser = require("body-parser");

const app = express()
// const port = 8000
const cors = require('cors')
require('dotenv/config');

// DataBase 
// const mysql = require("mysql");
// const con = mysql.createConnection({
//   host: "localhost",
//   user: "pusacho",
//   password: "password",
//   database: "pusacho"
// });
// con.connect(function(err){
//   if(err){
//     console.log('Error connecting to Db');
//     console.log(err);
//     return;
//   }
//   console.log('Connection established');
// });

// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({
//   limit: '50mb',
//   extended: true
// }));

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Allow Image to be accessed
app.use(express.static('images')); 
app.use('/images', express.static('images'));


// Routes Defining
const manajemen = require("./routes/manajemen");
const auth = require("./routes/auth");
const lapangan =require("./routes/lapangan");

// Routes
app.use("/manajemen", manajemen);
app.use("/auth", auth);
app.use("/lapangan" , lapangan)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const port = 3007
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})