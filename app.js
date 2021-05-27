import dotenv from 'dotenv'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import mongoose from 'mongoose'

import { authenticate, users } from './routes/users'

dotenv.config()

mongoose.connect(process.env.DB_CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', async () => {
    console.log('Connected to database')
})

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(cors())

app.use('/users', users)
app.get('/', authenticate, (req, res) => res.send("OK"))

app.listen(process.env.PORT, () => console.log("server is running on port " + process.env.PORT))