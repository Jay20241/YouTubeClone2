import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN, //only this origin(domain) can access my server
        //and many more options
        //credentials: true
    }
));
 
//some configurations
app.use(express.json({limit: "16kb"})); //limit the data, so that no one can send large data
app.use(express.urlencoded({extended: true, limit: "16kb"})); //to encode the url like %20 for space or '+' for space
app.use(express.static("public")); //used to store files like images, favicon publically

//cookie parser
app.use(cookieParser()); //CRUD operations on cookies

export { app }
 