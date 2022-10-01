const express = require('express');
const app = express();
const dotenv = require('dotenv');

const port = 3000;
const AWS = require('aws-sdk');
const multer = require('multer');
dotenv.config();
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})
AWS.config = config;

const client = new AWS.DynamoDB.DocumentClient();
const tableName = 'product';
const upload = multer();


app.use(express.static('./templates'))
app.use(express.json());
app.set('view engine', 'ejs')
app.set('views', './templates')

app.get("/", (req, res) => {
    const params = {
        TableName: tableName
    }
    client.scan(params, (err, data) => {
        if (err) {
            console.log(err);
            return res.send('Internal server error');
        } else {
            return res.render('index', { data: data.Items })
        }
    })
})

app.post("/", upload.fields([]), (req, res) => {
    const { productId, name, quantity, price } = req.body;
    const params = {
        TableName: tableName,
        Item: {
            productId: parseInt(productId),
            name,
            quantity,
            price
        }
    }
    client.put(params, (err, data) => {
        if (err) {
            console.log(err);
            console.log(req.body)
            return res.send('Error');
        } else {
            return res.redirect('/');
        }
    })
})

app.post("/delete/:id", (req, res) => {
    const params = {
        TableName: tableName,
        Key: {
            productId: parseInt(req.params.id)
        }
    }
    client.delete(params, (err, data) => {
        if (err) {
            console.log(err);
            return res.send('delete error');
        } else {
            return res.redirect('/');
        }
    })
})



app.listen(port, () => {
    console.log(`listening on port ${port}`);
})