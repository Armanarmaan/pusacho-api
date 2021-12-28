const express = require('express')
const bodyParser = require("body-parser");

const app = express()

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));


// Routes Defining
const manajemen = require("./routes/manajemen");

// Routes
app.use("/manajemen", manajemen);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const port = 3000
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})