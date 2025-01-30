import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
    const existedUser = User.findOne({
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
        throw new ApiError(400, "Avatar file is required")
    }

    //=============================================================================================================================================================================================

    //upload the image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath); //use await when you don't want to proceed until the promise is resolved
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
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

export { registerUser, }