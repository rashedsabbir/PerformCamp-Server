const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors());
app.use(express.json())


//live link = https://perform-camp-server.vercel.app

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
    const bookingsCollection = database.collection("bookings");
    const paymentsCollection = database.collection('payments');
    const taskCollection = database.collection('tasks');


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

    //get all Users
    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
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

    // Services
    app.post('/bookings', (req, res) => {
      console.log(req.body)
      const bookings = req.body;
      const result = bookingsCollection.insertOne(bookings)
      res.send(result);
    })

    app.get("/bookings", async (req, res) => {
      const bookings = await bookingsCollection.find().toArray();
      res.send(bookings);
    })
      //Get Admin
      app.get('/admin/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === 'Admin';
        res.send({ admin: isAdmin });
      })
      //Set role
      app.put('/user_admin/:email', async (req, res) => {
        const email = req.params.email;
        const role = req.body;
        const filter = { email: email };
        const updateDoc = {
          $set: role,
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);

      })
      //get tasks
      app.get("/task", async (req, res) => {
        const q = req.query;
        const cursor = taskCollection.find(q);
        const result = await cursor.toArray();
        res.send(result);
      });

      //post task
      app.post('/task', async (req, res) => {
        const task = req.body;
        const result = await taskCollection.insertOne(task);
        res.send(result);
      })

      //Update task
      app.put('/task/:id', async (req, res) => {
        const id = req.params.id;
        const updatedTask = req.body;
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
          $set: updatedTask,
        };
        const result = await taskCollection.updateOne(filter, updateDoc);
        res.send(result);

      })

      app.get('/bookings/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const booking = await bookingsCollection.findOne(query);
        res.send(booking)
      })

      app.delete('/bookings/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const filter = { _id: ObjectId(id) };
        const result = await bookingsCollection.deleteOne(filter);
        res.send(result);
      })

      //Payment
      app.post("/create-payment-intent", async (req, res) => {
        const service = req.body;
        const price = service.price;
        const amount = price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        })
        res.send({ clientSecret: paymentIntent.client_secret })
      })


      app.patch('/bookings/:id', async (req, res) => {
        const id = req.params.id;
        const payment = req.body;
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
          $set: {
            paid: true,
            transaction: payment.transaction
          }
        }
        const result = await paymentsCollection.insertOne(payment);
        const updateOrder = await bookingsCollection.updateOne(filter, updateDoc);
        res.send(updateDoc);
      })

    }
    finally {}

  }

run().catch(console.dir);


  app.get('/', (req, res) => {
    res.send('Welcome to PerformCamp Server!')
  })
  app.get('/check', (req, res) => {
    res.send('Test route checking')
  })

  app.listen(port, () => {
    console.log(`PerformCamp Server listening on port ${port}`)
  })