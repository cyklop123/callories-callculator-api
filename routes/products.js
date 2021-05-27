import express from 'express'
import {isAdmin} from './users'

const products = express.Router()

products.get('/', (req, res) => {
    res.send("its working")
})

products.get('/:id', (req, res) => {
    res.send("its working")
})

products.post('/', isAdmin, (req, res) => {
    res.send("its working")
})

products.delete('/:id', isAdmin, (req, res) => {
    res.send("its working")
})

export default products