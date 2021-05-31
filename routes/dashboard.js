import express from 'express'
import {isAdmin} from './users'
import UserProduct from '../models/userproduct'
import mongoose from 'mongoose'
import moment from 'moment'
import Product from '../models/product'

const dashboard = express.Router()

dashboard.get('/:date', async(req, res) => {
    let date = new Date(req.params.date)
    
    if(isNaN(date.getTime()))
        return res.sendStatus(400)
    
    date = moment(date)
    date.set({hour: 0, minute: 0, second: 0, millisecond: 0})
    
    const today = date.toDate()
    const tomorrow = date.add(1, 'd').toDate()

    try{
        const userProducts = await UserProduct.aggregate([
            {
                $match: {
                    user_id: mongoose.Types.ObjectId(req.user.id),
                    date: {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: 'product_id',
                    foreignField: '_id',
                    as: "product"
                }
            },
            {
                $unwind: '$product'
            },
            {
                $project: {
                    date: 1,
                    quantity:1,
                    'product.name': 1,
                    'product.kcal': { $divide:[ { $multiply: ['$product.kcal', '$quantity'] } , 100] },
                    'product.carbs': { $divide:[ { $multiply: ['$product.carbs', '$quantity'] } , 100] },
                    'product.prots': { $divide:[ { $multiply: ['$product.prots', '$quantity'] } , 100] },
                    'product.fats': { $divide:[ { $multiply: ['$product.fats', '$quantity'] } , 100] }
                }
            }
        ])
        
        let summary = {kcal:0, carbs:0, prots:0, fats:0}
        
        userProducts.forEach((prod) => {
            summary.kcal += prod.product.kcal
            summary.carbs += prod.product.carbs
            summary.prots += prod.product.prots
            summary.fats += prod.product.fats
        })
        
        res.json({userProducts: userProducts, summary })
    }
    catch(e){
        console.log(e)
        res.sendStatus(500)
    }
})

dashboard.post('/', isAdmin, async (req, res) => {
    const productId = typeof(req.body.productId) !== 'undefined' ? req.body.productId : -1
    const quantity = typeof(req.body.quantity) !== 'undefined' ? req.body.quantity : -1
    const date = typeof(req.body.date) !== 'undefined' ? req.body.date : new Date()

    if ( quantity <= 0 )
        return res.sendStatus(400)

    try{

        const product = await Product.findById(productId)

        if (!product)
            return res.sendStatus(404)
    
        let newProduct = new UserProduct()
        newProduct.product_id = productId
        newProduct.user_id = req.user.id
        newProduct.quantity = quantity
        newProduct.date = date

        newProduct.save(async err => {
            if(err) throw err
            
            res.json({
                _id: newProduct.id,
                date: newProduct.date,
                quantity: newProduct.quantity,
                product: {
                    name: product.name,
                    kcal: product.kcal * newProduct.quantity /100,
                    carbs: product.carbs * newProduct.quantity /100,
                    prots: product.prots * newProduct.quantity /100,
                    fats: product.fats
                }
            })
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

        res.sendStatus(204)
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

        if(typeof(req.body.quantity) === 'undefined') 
            return res.sendStatus(400)

        let updateObj = {
            "quantity": req.body.quantity
        }
        
        const userProduct = await UserProduct.findOneAndUpdate({_id: req.params.id}, updateObj)
        
        if (!userProduct)
            return res.sendStatus(404)

        const product = await Product.findById(userProduct.product_id)
        

        res.json({
            _id: userProduct.id,
            date: userProduct.date,
            quantity: req.body.quantity,
            product: {
                name: product.name,
                kcal: product.kcal * req.body.quantity /100,
                carbs: product.carbs * req.body.quantity /100,
                prots: product.prots * req.body.quantity /100,
                fats: product.fats
            }
        })
    }
    catch(e)
    {
        console.log(e)
        res.sendStatus(500)
    }
})

export default dashboard