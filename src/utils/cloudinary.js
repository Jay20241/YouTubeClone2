import dotenv from "dotenv";
dotenv.config();
import {v2 as cloudinary} from "cloudinary";
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
            console.log("Local path passed to uploadOnCloudinary is null");
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        //file has been uploaded successfully
        //well, don't print the url, it's a security issue in production
        console.log("File uploaded successfully on cloudinary", response.url); 
        fs.unlinkSync(localFilePath);
        //return response.url;
        return response;
    } catch (error) {
        console.log("Local path passed to uploadOnCloudinary is null in catch block", error);
        fs.unlinkSync(localFilePath); //delete the file from local storage
        //write sync means it will wait for the file to be deleted, not do anything until the file is deleted
        return null;
    }
}

  const deleteFromCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("Local path passed is null");
            return null;
        }

        const response = await cloudinary.uploader.destroy(localFilePath,{
            resource_type: "auto",
        })

        
    } catch (error) {
        console.log("Err: ", error);
        return null;
    }
  }

export { uploadOnCloudinary, deleteFromCloudinary }