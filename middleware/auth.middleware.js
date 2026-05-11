import jwt from 'jsonwebtoken';
import {JWT_SECRET} from "../config/env.js";
import User from "../modals/users.models.js"


const  authorise = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.token) {
            token = req.cookies.token;
        }

        if(!token) return res.status(401).json({success: false, message: "Unauthorized"})

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) return res.status(401).json({success: false, message: "Unauthorized"});

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({success: false, message: "Unauthorized", error: error.message});
    }
}

export default authorise;
