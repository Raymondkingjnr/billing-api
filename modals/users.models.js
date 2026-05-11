import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        minLength:2,
        maxLength: 50,
    },
    email:{
        type: String,
        required:true,
        unique:true,
        trim: true,
    },
    password:{
        type: String,
        required: [true, "Please enter a valid password"],
        select: false,
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    stripeCustomerId: {
        type: String,
        default: null,
    },
})

const User = mongoose.model('User', userSchema);
export default User;
