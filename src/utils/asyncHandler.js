const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err));
    }
}

/* const asyncHandler = (funct) => {
    (req, res, next) => {
        Promise.resolve(funct(req, res, next))
        .catch((err) => next(err));
    }
} */

export { asyncHandler }


//higher order function
//This is a wrapper function that takes a function as an argument and returns a new function.
//It is largely used in projects.

//we can do this via try-catch or promises.

//const asyncHandler = (funct) => { () => {} }
/* const asyncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false, //this is to inform the frontend engineer
            message: error.message
        })
    }
} */