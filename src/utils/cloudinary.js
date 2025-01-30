import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; 
//fs means file system
//delete means unlinking - os term


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


   const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        //file has been uploaded successfully
        //well, don't print the url, it's a security issue in production
        console.log("File uploaded successfully on cloudinary", response.url); 

        //return response.url;
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //delete the file from local storage
        //write sync means it will wait for the file to be deleted, not do anything until the file is deleted
        return null;
    }
} 

export { uploadOnCloudinary }