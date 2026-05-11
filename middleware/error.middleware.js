const errorMiddleware = (err, req, res, next) => {
    try {
        let error = {...err}
        error.message = err.message;
        console.error(err)

        if (err.name === 'CastError') {
            const message = 'Resource Not Found';
            error = new Error(message)
            error.statusCode = 404
        }

        if (err.code === 11000) {
            const message = 'Duplicate field value entered';
            error = new Error(message)
            error.statusCode = 400
        }

        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val=> val.message);
            error = new Error(message.join(" "));
            error.statusCode =  400
        }

        res.status(error.statusCode || 500 ).json({success: false, message: error.message || "Server error"});
        console.error('Sent error response:', error.statusCode || 500, error.message);
    }catch (error) {
        next(error)
    }
}

export default  errorMiddleware;