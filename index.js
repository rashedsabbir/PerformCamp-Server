const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

//middleware
app.use(cors());
app.use(express.json())


//live link = https://intense-citadel-07221.herokuapp.com

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0e6jqyu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
        next();
    });

}

async function run() {
  try {
    await client.connect()
    console.log('database connected')
    const database = client.db("PerformCamp");

    const customerReviews = database.collection("customerReviews");
    const userCollection = database.collection('users');


    //get all reviews from database
    app.get("/customerReviews", async (req, res) => {
      const result = await customerReviews.find({}).toArray()
      res.json(result)
    })

    //post reviews
    app.post("/customerReviews", async (req, res) => {
      const item = req.body
      const result = await customerReviews.insertOne(item)
      res.json(result)
    })

    //Users
    app.put('/user/:email', async (req, res) => {
      const user = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
          $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1h'
      })
      res.send({ result, token });

  })

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