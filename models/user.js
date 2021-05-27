import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true
    },
    email: {
        type:String,
        required: true
    },
    password: {
        type:String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default:  'user'
    }
})

userSchema.methods.generateHash = function(password)
{
    return bcrypt.hashSync(password, 10)
}

userSchema.methods.validatePassword = function(password)
{
    return bcrypt.compareSync(password, this.password)
}

export default mongoose.model('User', userSchema)