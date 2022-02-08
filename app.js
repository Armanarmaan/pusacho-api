const express = require('express')
const bodyParser = require("body-parser");

const app = express()
const cors = require('cors')
require('dotenv/config');

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