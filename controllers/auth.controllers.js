import mongoose from "mongoose";
import User from "../modals/users.models.js";
import Subscription from "../modals/subscription.models.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV} from "../config/env.js";

const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
});

const accessTokenCookieMaxAge = 15 * 60 * 1000;

const formatUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
});

const createAccessToken = (userId) => jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
});

const setAuthCookie = (res, accessToken) => {
    res.cookie("token", accessToken, getCookieOptions(accessTokenCookieMaxAge));
};

export const signUp = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { fullName, email, password } = req.body;

        const existingUser = await User.findOne({ email }).session(session);

        if (existingUser) {
            await session.abortTransaction();
            return res
                .status(400)
                .json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [newUser] = await User.create(
            [
                {
                    fullName,
                    email,
                    password: hashedPassword,
                },
            ],
            { session },
        );

        const token = createAccessToken(newUser._id);
        await session.commitTransaction();
        setAuthCookie(res, token);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                token,
                user: formatUser(newUser),
            },
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
}

export const login = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await  User.findOne({email}).select("+password");
        if (!user) {
            return res.status(404).json({success: false, message: "User does not exist"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({success: false, message: "Invalid password"});
        }

        const token = createAccessToken(user._id);

        setAuthCookie(res, token);

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: {
                token,
                user: formatUser(user),
            },
        });

    }catch(err) {
       return  res.status(500).json({success: false, message: `An error occurred: ${err}`});
    }
}

export const me = async (req, res) => {
    const subscription = await Subscription.findOne({
        user: req.user._id,
        status: "active",
        currentPeriodEnd: {$gt: new Date()},
    }).populate("plan");

    return res.status(200).json({
        success: true,
        data: {
            user: formatUser(req.user),
            subscription,
        },
    });
}
