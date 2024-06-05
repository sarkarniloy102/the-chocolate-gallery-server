const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
console.log(process.env.db_USER);
const uri = `mongodb+srv://${process.env.db_USER}:${process.env.db_PASS}@cluster0.mypgnvz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const categoryCollection = client.db("TCG").collection("Category_collection");
        const reviewCollection = client.db("TCG").collection("reviews_collection");
        const popularCollection = client.db("TCG").collection("popular_category");
        const cartCollection = client.db("TCG").collection("carts")

        // to get all category
        app.get('/allcategory', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result);
        })
        // to get popular category
        app.get('/popular', async (req, res) => {
            const result = await popularCollection.find().toArray();
            res.send(result);
        })
        // to get all reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })
        // carts collection
        app.post('/carts', async (req, res) => {
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem);
            res.send(result);

        })
        app.get('/carts', async (req, res) => {
            const email = req.query?.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// Get method route
app.get('/', (req, res) => {
    res.send('TCG is running');
})

app.listen(port, () => {
    console.log(`TCG is running on port: ${port}`)
})