const express = require('express')
const app = express()
const port = 8000
const cors = require('cors')
require('dotenv/config');

// DataBase 
const mysql = require("mysql");
const con = mysql.createConnection({
  host: "192.168.64.3",
  user: "username",
  password: "password",
  database: "pusacho"
});
con.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    console.log(err);
    return;
  }
  console.log('Connection established');
});

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true
}));

// Middlewares
app.use(cors());

// Routes Defining
const manajemen = require("./routes/manajemen");
const auth = require("./routes/auth");

// Routes
app.use("/manajemen", manajemen);
app.use("/auth", auth);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})