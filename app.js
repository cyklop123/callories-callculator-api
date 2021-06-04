import dotenv from 'dotenv'
import express from 'express'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'

import { authenticate, users } from './routes/users'
import dashboard from './routes/dashboard'
import products from './routes/products'

const env = process.env.NODE_ENV || 'dev'

dotenv.config()

mongoose.connect(env !== 'test' ? process.env.DB_CONNECTION_STRING : process.env.DB_TEST_CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', async () => {
    console.log('Connected to database')
})

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cookie");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});

app.use('/users', users)
app.use('/products', authenticate, products)
app.use('/', authenticate, dashboard)

app.listen(process.env.PORT, () => console.log("server is running on port " + process.env.PORT))

export default app