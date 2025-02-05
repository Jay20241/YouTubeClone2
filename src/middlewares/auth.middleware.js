//This is our own middleware. it verifies if the user is there or not.
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

//This middleware can be used in many places like savePost, LikePost, etc. //without auth, you can't LikePost, SavePost, etc.
export const verifyJWT = asyncHandler(async (req, _, next) => { //_ is used when we don't need the second parameter - res
    try {
        //JWT: Header - Authorization: Bearer <token> // <token> is the access token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");  //or is used in the scenario like mobile app development.

        if (!token) {
            throw new ApiError(401, "Unauthorized. Please login first")
        }

        const decodToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodToken?._id).select("-password -refreshToken")

        if (!user) {
            //TODO: discuss about frontend
            throw new ApiError(401, "Invalid Access Token")   
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})