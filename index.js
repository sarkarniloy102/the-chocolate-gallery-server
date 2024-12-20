const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
        const userCollection = client.db("TCG").collection("Users");
        const categoryCollection = client.db("TCG").collection("Category_collection");
        const reviewCollection = client.db("TCG").collection("reviews_collection");
        const popularCollection = client.db("TCG").collection("popular_category");
        const cartCollection = client.db("TCG").collection("carts");

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })

        // post user information
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser)
                return res.send({ message: 'user already exist', insertId: null });
            const result = await userCollection.insertOne(user);

            res.send(result);
        })
        // middleware
        const verifytoken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];

            // verify token
            jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401)
                        .send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }

        //use verify admin after verify token
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        // users related api
        app.get('/users', verifytoken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();

            res.send(result);
        })

        // 
        app.get('/users/admin/:email', verifytoken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        // delete users
        app.delete('/users/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // update role 
        app.patch('/users/admin/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // to get all category
        app.get('/allcategory', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result);
        })
        // post category data added by admin
        app.post('/allcategory', verifytoken, verifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await categoryCollection.insertOne(item);
            res.send(result);
        })
        // delete category
        app.delete('/allcategory/:id', verifytoken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            console.log('id is', id);
            const query = { _id: new ObjectId(id) }
            const result = await categoryCollection.deleteOne(query);
            res.send(result)
        });

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
        // delete cart from mycart in user dashboard
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