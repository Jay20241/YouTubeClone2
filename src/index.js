//require("dotenv").config({path: "./.env"});
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";

//it returns a promise
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    });
    app.on("error", (error)=>{
        console.error("ERROR: ", error)
        throw error
    });
})
.catch((error)=>{
    console.error("DB connection failed ERROR: ", error)
    process.exit(1) //read about exit codes
})
















//IIFE
/*
;(async() => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.error("ERROR: ", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
        //exit code
    }
})()
*/