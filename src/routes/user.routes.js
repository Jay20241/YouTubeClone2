import { Router } from 'express';
import { registerUser } from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';

const router = Router();

router.route("/register").post( //upload.fields([]) is a middleware
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);
//similarly,
//router.route("/login").post(login);

export default router;

//manchahe naam se import karne ke liye export "default" hona chahiye