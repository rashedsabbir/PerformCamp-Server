const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json())

async function run() {
    try {


        

    }
    finally {
  
    }
  }
  
  run().catch(console.dir)
  
  
  app.get('/', (req, res) => {
    res.send('Welcome to PerformCamp Server!')
  })
  app.get('/check', (req, res) => {
    res.send('Test route checking')
  })
  
  app.listen(port, () => {
    console.log(`PerformCamp Server listening on port ${port}`)
  })