const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json())

//DB_USER=PerformCamp
//DB_PASS=7u9KgFy8hLSAoG9E

const uri = "mongodb+srv://PerformCamp:7u9KgFy8hLSAoG9E@cluster0.0e6jqyu.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        console.log('database connected')
        

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