import express from 'express'
import {isAdmin} from './users'

const dashboard = express.Router()

dashboard.get('/', isAdmin, (req, res) => {
    res.send("its working")
})

dashboard.get('/:date', (req, res) => {
    res.send("its working")
})

dashboard.post('/', isAdmin, (req, res) => {
    res.send("its posting")
})

dashboard.delete('/:id', isAdmin, (req, res) => {
    res.send("its working")
})

dashboard.patch('/:id', isAdmin, (req, res) => {

    res.send("its working")
})

export default dashboard