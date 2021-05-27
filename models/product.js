import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    kcal: {
        type:Number,
        required: true
    },
    carbs: {
        type:Number,
        required: true
    },
    prots: {
        type:Number,
        required: true
    },
    fats: {
        type:Number,
        required: true
    }
})

export default mongoose.model('Product', productSchema)