const express = require('express')
const app = express()
const port = 3000

// Routes Defining
const manajemen = require("./routes/manajemen");

// Routes
app.use("/manajemen", manajemen);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})