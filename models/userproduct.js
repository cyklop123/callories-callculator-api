import mongoose from 'mongoose'

const userproductSchema = new mongoose.Schema({
    user_id: {
        type:mongoose.Schema.Types.ObjectId,
        required: true
    },
    product_id: {
        type:mongoose.Schema.Types.ObjectId,
        required: true
    },
    quantity: {
        type:Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model('UserProduct', userproductSchema)