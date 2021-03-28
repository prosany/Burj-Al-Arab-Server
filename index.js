const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const port = 4000;
const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab-c5535-firebase-adminsdk-50mlx-d58b6c1b2f.json");
require('dotenv').config();
console.log(process.env.DB_USER, process.env.DB_PASS, process.env.DB_NAME)

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

// Mongodb
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hgubw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  console.log('Database connection established')

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    console.log(newBooking);
  });

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, docs) => {
                res.send(docs);
              })
          } else {
            res.status(401).send('Unauthorized access')
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized access')
        });
    } else {
      res.status(401).send('Unauthorized access')
    }
  })

});



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
})