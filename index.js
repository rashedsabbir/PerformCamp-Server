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


//live link = https://intense-citadel-07221.herokuapp.com

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0e6jqyu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});


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
    const paymentsCollection = database.collection('payments'); ''
    const taskCollection = database.collection('tasks');
    const pendingReviewCollection = database.collection('pendingReview');
    const employeeCollection = database.collection('employee');
    const employeeReviewCollection = database.collection('userReview');
    const feedbackCollection = database.collection('feedbacks');
    const leaderBoardCollection = database.collection('leaderboard');

    const verifyManager = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'Manager') {
        next();
      }
      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
    }

    //get manager
    app.get('/manager/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isManager = user.role === 'Manager';
      res.send({ manager: isManager });
    })

    //get all reviews from database
    app.get("/customerReviews", async (req, res) => {
      const result = await customerReviews.find({}).toArray()
      res.json(result)
    })

    //get task
    app.get("/task", async (req, res) => {
      const q = req.query;
      const cursor = taskCollection.find(q);
      const result = await cursor.toArray();
      res.send(result);
    });

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

    //post reviews
    app.post("/customerReviews", async (req, res) => {
      const item = req.body
      const result = await customerReviews.insertOne(item)
      res.json(result)
    })

    //  //get employee
    //  app.get('/employee', async (req, res) => {
    //   // const query = { role: user.role !== 'Manager' };

    //   //   const options = {
    //   // // sort returned documents in ascending order by title (A->Z)
    //   // sort: { title: 1 },
    //   // // Include only the `title` and `imdb` fields in each returned document
    //   // projection: { _id: 0, title: 1, imdb: 1 },
    // // };
    // const query = {role: 'Man'}
    //       const cursor = userCollection.find(query);
    //       const result = await cursor.toArray();
    //       return res.send(result);



    // const isManager = user.role === 'Manager';
    // res.send({ manager: isManager });
    // })

    //get all Users
    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    //Users
    app.put('/user/:email', async (req, res) => {
      const user = req.body;
      const email = req.params.email;
      const filter = {
        email: email
      };
      const options = {
        upsert: true
      };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      })
      res.send({
        result,
        token
      });

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


    //Set role
    app.put('/user_admin/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'Manager' },
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
    //Get task by assign email
    app.get('/task/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = taskCollection.find(query);
        const tasks = await cursor.toArray();
        return res.send(tasks);
      }

      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
    })

    //get order
    app.get('/order', verifyJWT, async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    })

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

    //delete task by id
    app.delete('/task/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await taskCollection.deleteOne(filter);
      res.send(result);

    })

    //get bookings by id
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

    //get pending review task;
    app.get('/pendingReview/:email', verifyJWT, async (req, res) => {
      const appointee = req.params.email;
      // console.log("appointee");
      const decodedEmail = req.decoded.email;
      // console.log('decoded', decodedEmail)
      if (appointee === decodedEmail) {
        const query = { appointee: appointee };
        const cursor = pendingReviewCollection.find(query);
        const tasks = await cursor.toArray();
        return res.send(tasks);
      }

      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
    })

    //post pending review task
    app.post('/pendingReview', async (req, res) => {
      const task = req.body;
      const result = await pendingReviewCollection.insertOne(task);
      res.send(result);
    })

    //delete pending review by id
    app.delete('/pendingReview/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await pendingReviewCollection.deleteOne(filter);
      res.send(result);

    })

    //get employee review given by manager
    app.get('/employeeReviews/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      // console.log(req.decoded);
      const decodedEmail = req.decoded.email;
      // console.log('decoded', decodedEmail)
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = employeeReviewCollection.find(query);
        const reviews = await cursor.toArray();
        return res.send(reviews);
      }
    })

    app.post('/employeeReviews', async (req, res) => {
      const review = req.body;
      const result = await employeeReviewCollection.insertOne(review);
      res.send(result);
    })
    //Add Employee
    app.post('/employee', async (req, res) => {
      const employee = req.body;
      const result = await employeeCollection.insertOne(employee);
      res.send(result);
    })

    //get employee review
    app.get('/employeeReviews', async (req, res) => {
      const reviews = await employeeReviewCollection.find().toArray();
      res.send(reviews);
    })

    //post task
    app.post('/employeeReviews', async (req, res) => {
      const review = req.body;
      const result = await employeeReviewCollection.insertOne(review);
      res.send(result);
    })

    //delete pending review by id
    app.delete('/pendingReview/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await pendingReviewCollection.deleteOne(filter);
      res.send(result);

    })

    //get feedback
    app.get('/feedback/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = feedbackCollection.find(query);
        const feedbacks = await cursor.toArray();
        return res.send(feedbacks);
      }

      else {
        return res.status(403).send({ message: 'Forbidden Access' });
      }
    })

    //User feedback task
    app.post('/feedback', async (req, res) => {
      const feedback = req.body;
      const result = await feedbackCollection.insertOne(feedback);
      res.send(result);
    })

    //delete feedback task
    app.delete('/feedback/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await feedbackCollection.deleteOne(filter);
      res.send(result);

    })
     //get leaderboard
     app.get('/leaderboard', async (req, res) => {
      const leaderboard = await leaderBoardCollection.find().toArray();
      res.send(leaderboard);
    })


    //Update leaderboard
    app.put('/leaderboard/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedLeaderboard = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: updatedLeaderboard,
      };
      const result = await leaderBoardCollection.updateOne(filter, updateDoc, options);
      res.send(result);

    })
  }
  finally { }

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
