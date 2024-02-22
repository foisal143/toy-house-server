const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('toys data is running');
});

// jwt verify
// const verifyJWT = (req, res, next) => {
//   const authorization = req.headers.authorization;
//   if (!authorization) {
//     return res
//       .status(404)
//       .send({ error: true, message: 'unauthorized access' });
//   }
//   const token = authorization.split(' ')[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
//     if (err) {
//       return res
//         .status(404)
//         .send({ error: true, message: 'unauthorized access' });
//     }
//     req.decode = decode;
//     next();
//   });
// };

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mrvtr8q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const toysColection = client.db('toysDB').collection('toys');
    const indexkey = { name: 1 };
    const indexOption = { name: 'name' };
    const rsult = await toysColection.createIndex(indexkey, indexOption);

    // // jwt route
    // app.post('/jwt', (req, res) => {
    //   const email = req.body;
    //   const token = jwt.sign(email, process.env.ACCESS_TOKEN, {
    //     expiresIn: '1h',
    //   });
    //   res.send({ token });
    // });

    // toys section
    app.post('/toys', async (req, res) => {
      const toy = req.body;
      const result = await toysColection.insertOne(toy);
      res.send(result);
    });

    app.get('/toys', async (req, res) => {
      const category = req.query.category;
      const search = req.query.search;
      const email = req.query.email;
      const limit = parseInt(req.query.limit);

      if (email) {
        let query = {};
        if (query) {
          query = { sellerEmail: email };
        }
        const result = await toysColection.find(query).toArray();
        res.send(result);
        return;
      }

      if (
        category === 'regular' ||
        category === 'sports car' ||
        category === 'truck'
      ) {
        const query = { subCategory: category };
        const toys = await toysColection.find(query).toArray();
        res.send(toys);
        return;
      }

      if (search) {
        const toys = await toysColection
          .find({
            name: { $regex: search, $options: 'i' },
          })

          .toArray();
        res.json(toys);
        return;
      }

      if (limit) {
        const toys = toysColection.find().limit(limit);
        const result = await toys.toArray();
        res.send(result);
        return;
      } else {
        const toys = toysColection.find();
        const result = await toys.toArray();
        res.send(result);
      }
    });

    app.get('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysColection.findOne(query);
      res.send(result);
    });

    app.put('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const toy = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateToy = {
        $set: {
          name: toy.name,
          quantity: toy.quantity,
          price: toy.price,
          description: toy.description,
        },
      };
      const result = await toysColection.updateOne(filter, updateToy, option);
      res.send(result);
    });

    app.delete('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysColection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('server is running on port', port);
});
