import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js'; //This User will always call the mongoDB.
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken //add the refresh token to the database
        await user.save({ validateBeforeSave: false }) //validateBeforeSave is false becoz we are not updating the user, we are just updating the refreshToken field. If we don't do this, it will ask for the password and we don't want that.
        
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // res.status(200).json({ message: "ok" }); //send response

    //register the user business logic

    //1. get user details from frontend
    //2. validate the user details - not empty
    //3. check if the user already exists: username or email
    //4. check for imahes, check for avatar
    //5. upload the image to cloudinary, avatar
    //6. create user object - create entry in database
    //7. remove sensitive data like password and refresh token field from the response
    //8. check for user creation
    //9. return the response

    const {fullname, email, username, password} = req.body //destructuring
    console.log("email", email);
    
    // if (fullname === "") {
    //     throw new ApiError(400, "Fullname is required")
    // }


    //==========================================================================================================================
    
    
    
    //Thoda sa advanced syntax for if() condition:
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    if (email.includes("@") === false) {
        throw new ApiError(400, "Invalid email")
    } 
    //this is how you can add as many validations, checks as you want

    //=============================================================================================================================================================================================
    
    
    
    //is user already exists?
    const existedUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    });
    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }


    
    //==========================================================================================================================
    
    
    //check for images
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required in Local Path")
    }

    //=============================================================================================================================================================================================

    //upload the image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath); //use await when you don't want to proceed until the promise is resolved
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required in Cloudinary")
    }

    //=============================================================================================================================================================================================
    //entry in the database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken") //remove password and refresh token from the response // here, desh "-" is minus sign

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user") 
    }

    return res.status(201).json(new ApiResponse(201, createdUser,"User registered successfully"))

})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> fetch data
    //username or email
    //find the user
    //password check
    //access token and refresh token
    //send secure cookie

    const {email, username, password} = req.body;

    // if (!username || !email) {
    //     throw new ApiError(400, "Username or email is required")
    // }
    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or:[ //$or is a mongoDB operator
            {email},
            {username}
        ]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //see if the new query is expensive or not - if expensive, then just update user. If not, then make a new query
    const loogedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookies:
    const options = {
        httpOnly: true,
        secure: true //By-default the cookie is modifiable by the client(frontend) side. So, we need to make it secure.
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user: loogedInUser,accessToken,refreshToken //This is used in mobile-app development, so that user can save the cookies in the local storage ->not recommended but can be done if required
    }, "User logged in successfully"))
})

const logoutUser = asyncHandler(async (req, res)=> {
    //clear the cookies
    //reset the refresh token
    //make our own middleware
    //cookie is two way --> req.cookies, res.cookie

    await User.findByIdAndUpdate(req.user._id, 
        {
            $unset: 
            { 
                refreshToken: 1 //this removes the field from document.
            }
        },
       { new: true }
    )

    //clear the cookies
    const options = {
        httpOnly: true,
        secure: true //By-default the cookie is modifiable by the client(frontend) side. So, we need to make it secure.
    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
    
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken; //req.body.refreshToken is used for mobile app development
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Invalid refresh token, Unauthorized request")
    }

    //user ke pass encrypted token pohanchta he. We need raw token which is stored in databse
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
        
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !==  user?.refreshToken) { //user?.refreshToken - this is from user.model.js modelling vala
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        //Make a new token
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, NEWrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", NEWrefreshToken, options)
        .json(
            new ApiResponse(200, 
                {accessToken, refreshToken: NEWrefreshToken},
                "Access Token Refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }    
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body //or {oldPassword, newPassword, confirmPassword}

    const user = await User.findById(req.user?._id); //req.user?.id -> this-is by -auth middleware.
    
    const isPasswordCorr = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorr) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    
    //learn mongodb operators
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname, //this is right syntax
                email: email //this is also right syntax
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    
    // If many files -use- req.files?.path
    // If one file -use- req.file?.path

    const avatarLocalPath =  req.file?.path //multer

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // --------------------------------------TODO: DELETE THE OLD AVATAR-------------------Do this !!!!!!!! ---------------------------------------------------

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while upload")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    
    // If many files -use- req.files?.path
    // If one file -use- req.file?.path

    const coverLocalPath =  req.file?.path //multer

    if (!coverLocalPath) {
        throw new ApiError(400, "coverLocalPath file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while upload")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"CoverImg updated successfully"))
})

//$first: "$author_details" or $arrayElemAt: ["$author_details", 0]  -  0th element
//aggregation pipeline
// join two schemas

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    //channel page is provided by the URL- So we use req.params

    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    //User.find({username})

    //User.aggregate([]) it returns array objects.
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "mySubscribers"
            }
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },

        {
            $addFields: {
                subscribersCount: {
                    $size: "$mySubscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$mySubscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },

        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }

    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully."))

})

//Nested pipelines:
const getWatchHistory = asyncHandler(async (req,res)=>{
    //req.user._id //it returns the string.

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "WatchHistory fetched successfully."))
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}