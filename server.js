const express = require('express');
const app = express();
const dotenv = require('dotenv');

const port = 3000;
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuid } = require("uuid");
const { S3 } = require('aws-sdk');
const path = require('node:path');
dotenv.config();
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})
AWS.config = config;

const client = new AWS.DynamoDB.DocumentClient();
const tableName = 'product';
const CLOUD_FRONT_URL = "https://di9j1hgvzf66g.cloudfront.net";
const s3 = new AWS.S3();


app.use(express.static('./templates'))
app.use(express.json());
app.set('view engine', 'ejs')
app.set('views', './templates')

const storage = multer.memoryStorage({
    destination(req, file, callback) {
        callback(null, '');
    }
})

function checkFile(file, cb) {
    const fileTypes = /jpg|png|jpg|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const minetype = fileTypes.test(file.mimetype);
    if (extname && minetype) {
        return cb(null, true);
    }
}

const upload = multer({
    storage,
    limits: {
        fileSize: 200000,
    },
    fileFilter: (req, file, cb) => {
        checkFile(file, cb);
    }
})

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

// app.post("/", upload.fields([]), (req, res) => {
//     const { productId, name, quantity, price } = req.body;
//     const params = {
//         TableName: tableName,
//         Item: {
//             productId: parseInt(productId),
//             name,
//             quantity,
//             price
//         }
//     }
//     client.put(params, (err, data) => {
//         if (err) {
//             console.log(err);
//             console.log(req.body)
//             return res.send('Error');
//         } else {
//             return res.redirect('/');
//         }
//     })
// })

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

app.post("/", upload.single('image'), (req, res) => {
    const { productId, name, quantity, price } = req.body;
    const image = req.file.originalname.split(".");
    const fileType = image[image.length - 1];

    const filePath = `${uuid() + Date.now().toString()}.${fileType}`;
    const params = {
        Bucket: 'bucket-viet',
        Key: filePath,
        Body: req.file.buffer
    }

    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err)
            return res.send("error upload file");
        } else {
            const newItem = {
                TableName: tableName,
                Item: {
                    productId: parseInt(productId),
                    name: name,
                    quantity: quantity,
                    price: price,
                    image: `${CLOUD_FRONT_URL}/${filePath}`,
                }
            }
            client.put(newItem, (err, data) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("error updload file");
                } else {
                    return res.redirect("/");
                }
            })
        }
    })
})



app.listen(port, () => {
    console.log(`listening on port ${port}`);
})