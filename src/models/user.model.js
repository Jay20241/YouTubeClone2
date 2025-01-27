//whenever mongoDB saves the user, it auto generate the unique id.
//so not write id in this model file.

import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken'; //it is bearer token <- interview question
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
        index: true //It will make this field optimized searchable //without this, it will take more time to search 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowerCase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: { 
        type: String, //do encryption via bcrypt library
        required: [true, 'Password is required']
    },
    refreshToken: { //jwt (json web token)
        type: String
    }
}, {timestamps: true}
)

//middleware have many types of hooks
//pre hook

//Note: We can't use arrow function in mongoose middleware
//becoz arrow function does not have context(this keyword)
userSchema.pre("save", async function(next){
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10); //10 is the salt round
    next();
})

//Our own custom method syntax
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password); //it will return true or false 
}

//generate tokens
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//refresh token have less information
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema) //this is the model name and schema name.