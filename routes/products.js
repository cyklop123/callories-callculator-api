import express from 'express'
import mongoose from 'mongoose'

import {isAdmin} from './users'
import Product from '../models/product'

const products = express.Router()

products.get('/', async(req, res) => {
    const name = req.query.name ? req.query.name : ""
    if(name.length < 3)
        return res.sendStatus(404)
    
    try{
        const products = await Product.find({name: {$regex: `.*${name}.*`, $options: 'i'}}, {name: 1, kcal: 1, carbs: 1, prots: 1, fats: 1}).exec()
        
        res.json(products)
    }  
    catch(e) {
        res.sendStatus(500)
    }
})

products.get('/:id', async(req, res) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.sendStatus(404)

        const product = await Product.findById(req.params.id, {name:1, kcal:1, carbs:1, prots:1, fats:1}).exec()

        if(!product)
            return res.sendStatus(404)
        res.json(product)
    }  
    catch(e) {
        console.log(e)
        res.sendStatus(500)
    }
})

products.post('/', isAdmin, (req, res) => {
    const name = req.body.name ? req.body.name : ""
    const kcal = typeof(req.body.kcal) !== 'undefined' ? req.body.kcal : -1
    const carbs = typeof(req.body.carbs) !== 'undefined' ? req.body.carbs : -1
    const prots = typeof(req.body.prots) !== 'undefined' ? req.body.prots : -1
    const fats = typeof(req.body.fats) !== 'undefined' ? req.body.fats : -1

    if(name.length < 3 || kcal < 0 || carbs < 0 || prots < 0 || fats < 0)
        return res.sendStatus(404)
    
    try{
        let newProduct = new Product()
        newProduct.name = name
        newProduct.kcal = kcal
        newProduct.carbs = carbs
        newProduct.prots = prots
        newProduct.fats = fats

        newProduct.save(err => {
            if(err) throw err
            res.json(newProduct)
        })
    }  
    catch(e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

products.delete('/:id', isAdmin, async(req, res) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.sendStatus(404)

        const product = await Product.findByIdAndRemove(req.params.id, {__v:0}).exec()
        if(!product)
            return res.sendStatus(404)
        res.json(product)
    }
    catch(e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

export default products