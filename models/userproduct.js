import mongoose from 'mongoose'

const types = ['breakfast', 'brunch', 'dinner', 'tea', 'supper']

const userProductSchema = new mongoose.Schema({
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
    },
    type: {
        type: String,
        enum: types,
    }
})

userProductSchema.methods.validateType = function(type) {
    return types.includes(type)
}

export default mongoose.model('UserProduct', userProductSchema)