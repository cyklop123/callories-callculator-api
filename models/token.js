import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
    refresh: {
        type:String,
        required: true
    }
})

export default mongoose.model('Token', tokenSchema)