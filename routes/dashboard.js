import express from 'express'
import {isAdmin} from './users'
import UserProduct from '../models/userproduct'
import productSchema from '../models/product'
import mongoose from 'mongoose'

const dashboard = express.Router()

dashboard.get('/', isAdmin, async (req, res) => {
    const user_id = req.user.id

    try {
        const userProducts = await UserProduct.find({ user_id }) 
        
        const products = await mapUserProducts(userProducts)
        const summary = mapUserSummary(products)

        res.json({ userProducts: products, summary: summary })
    } catch (e) {
        res.sendStatus(500)
    }
})

dashboard.get('/:date', async (req, res) => {
    const date = req.params.date
    
    try {
        const userProducts = await UserProduct.find({ date }) 
        
        const products = await mapUserProducts(userProducts)

        res.json({ userProducts: products })
    } catch (e) {
        res.sendStatus(500)
    }})

dashboard.post('/', isAdmin, (req, res) => {
    const userId = typeof(req.user.id) !== 'undefined' ? req.user.id : -1
    const productId = typeof(req.body.productId) !== 'undefined' ? req.body.productId : -1
    const quantity = typeof(req.body.quantity) !== 'undefined' ? req.body.quantity : -1
    const date = typeof(req.body.date) !== 'undefined' ? req.body.date : new Date()

    if (userId < 0 || productId < 0 || quantity < 0 )
        return res.sendStatus(400)

    try{
        let newProduct = new UserProduct()
        newProduct.product_id = productId
        newProduct.user_id = userId
        newProduct.quantity = quantity
        newProduct.date = date

        newProduct.save(async err => {
            if(err) throw err
            res.json((await mapUserProducts([newProduct]))[0])
        })
    }  
    catch(e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

dashboard.delete('/:id', isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.sendStatus(404)

        const userProduct = await UserProduct.findByIdAndRemove({ _id: req.params.id }, {__v:0}).exec()
        
        if(!userProduct)
            return res.sendStatus(404)

        res.json((await mapUserProducts([userProduct]))[0])
    }
    catch(e) {
        console.log(e)
        return res.sendStatus(500)
    }
})

dashboard.patch('/:id', isAdmin, async (req, res) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id))
            return res.sendStatus(404)

        let updateObj = {}

        if(typeof(req.body.quantity) !== 'undefined') updateObj['quantity'] = req.body.quantity
        if(typeof(req.body.date) !== 'undefined') updateObj['date'] = req.body.date
        
        const product = await UserProduct.findOneAndUpdate({_id: req.params.id}, updateObj)
        
        if (!product)
            return res.sendStatus(404)

        product['date'] = req.body.date
        product['quantity'] = req.body.quantity
        
        res.json((await mapUserProducts([product]))[0])
    }
    catch(e)
    {
        console.log(e)
        res.sendStatus(500)
    }
})

async function mapUserProducts(userProducts) {
    return Promise.all(userProducts.map(async userProduct => {
        
        const product = (await productSchema.find({ _id: userProduct.product_id }))[0]

        return {
            userProductId: userProduct._id,
            date: userProduct.date,
            quantity: userProduct.quantity,
            productId: product._id,
            name: product.name,
            kcal: product.kcal,
            prots: product.prots,
            carbs: product.carbs,
            fats: product.fats,
        }
    }))
}

function mapUserSummary(products) {
    const values = [0, 0, 0, 0]

    for (let i; i < products.length; i++) {
        values[0] += product.prots * product.quantity / 100
        values[1] += product.carbs * product.quantity / 100
        values[2] += product.fats * product.quantity / 100
        values[3] += product.kcal * product.quantity / 100
    }

    return {
        kcal: values[0],
        carbs: values[1],
        fats: values[2],
        prots: values[3],
    }
}

export default dashboard