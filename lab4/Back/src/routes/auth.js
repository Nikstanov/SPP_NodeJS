const express = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {body, validationResult } = require('express-validator')
const {v4} = require('uuid')

const config = require('config');
const RefreshSession = require('../models/refreshSession')
const jwtKey = config.get('auth.jwt_key');

const router = express.Router()

const userSignUpValidator = [
    body('email').notEmpty().isEmail().withMessage("Incorrect email"),
    body('password').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter password with at least 5 characters"),
    body('nickname').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter correct nickname"),
    body('fingerprint').notEmpty().withMessage("Fingerprint is empty"),
]

const userSignInValidator = [
    body('email').notEmpty().isEmail().withMessage("Incorrect email"),
    body('password').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter password with at least 5 characters"),
    body('fingerprint').notEmpty().withMessage("Fingerprint is not provided"),
]

const refreshTokenValidator = [
    body('fingerprint').notEmpty().withMessage("Fingerprint is not provided"),
]

function handleInputErrors (errors){
    const res = []
    for(let i = 0; i < errors.length; i++){
        res.push({
            field: errors[i].path,
            msg: errors[i].msg
        })
    }
    return res
}

function newRefreshSession(user_id, fingerprint, expiresIn){
    const refreshToken = v4();
    RefreshSession.find({userId: user_id}, null, { limit: 5 })
    .then(result => {
        if(result.length === 5){
            return RefreshSession.deleteMany({userId: user_id})
        }
    })
    .then(() => {
        new RefreshSession({
            userId: user_id,
            refreshToken: refreshToken,
            fingerprint: fingerprint,
            expiresIn: expiresIn,
            createdAt: Date.now()
        }).save()
    })
    return refreshToken;
}

// exports = function authRoutes(socket){
//     socket.on("/sign_in", (data, callback) => {
//         const email = data.email;
//         const password = data.password;
//         const fingerprint = data.fingerprint;
//         User.findOne({email: email}).then((user) => {
//             if(user){
//                 let match = bcrypt.compare(password, user.password).then((res) => {
//                     return res;
//                 })
//                 if(match){
//                     const token = jwt.sign({id: user._id}, jwtKey, {
//                         expiresIn: '1h',
//                     })
//                     const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
//                     const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
//                     const refreshToken = newRefreshSession(user._id, fingerprint, refreshExpiresIn);
//                     callback({
//                         status: 200,
//                         data:{
//                             userId: user._id,
//                             nickname: user.nickname,
//                             token: token,
//                             expiresIn: accessExpiresIn,
//                             refreshToken: refreshToken,
//                             refreshTokenExpiresIn: refreshExpiresIn,
//                         }
//                     })
//                 }
//                 else{
//                     callback({
//                         status: 400,
//                         error: "Incorrect password"
//                     })
//                 }
//             }
//             else{
//                 callback({
//                     status: 400,
//                     error: "Unknown user"
//                 })
//             }
            
//         })
//     })   
//     socket.on("/sign_up", (data, callback) => {
//         const email = data.email;
//         const password = data.password;
//         const nickname = data.nickname;
//         const fingerprint = data.fingerprint;
//         User.findOne({email: email}).then((result) => {
//             if(result){
//                 throw new Error('User already exists');
//             }
//             return bcrypt.hash(password, 12).then(hashedPassword => {
//                 const user = new User({
//                     email: email,
//                     password: hashedPassword,
//                     nickname: nickname,
//                 })
//                 return user.save()
//             })
            
//         })
//         .then((user) => {
//             const token = jwt.sign({id: user._id}, jwtKey, {
//                 expiresIn: '1h',
//             })
//             const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
//             const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
//             const refreshToken = newRefreshSession(user._id, fingerprint, refreshExpiresIn);
//             callback({
//                 status: 200,
//                 data:{
//                     userId: user._id,
//                     nickname: user.nickname,
//                     token: token,
//                     expiresIn: accessExpiresIn,
//                     refreshToken: refreshToken,
//                     refreshTokenExpiresIn: refreshExpiresIn,
//                 }
//             })
//         })
//         .catch(err => {
//             console.log(err)
//             callback({
//                 status: 400,
//                 error: "User already exists"
//             })
//         })
//     })
//     socket.on("/refresh", (data, callback) => {
//         const refreshToken = req.cookies.refreshToken;
//         const fingerprint = req.body.fingerprint;
    
//         RefreshSession.findOneAndDelete({refreshToken: refreshToken})
//         .populate('userId', 'nickname')
//         .then(session => {
//             if(!session){
//                 res.status(400).json({error: 'Undefined session'})
//                 return
//             }
//             if(session.expiresIn < Date.now()){
//                 res.status(400).json({error: 'Session has been expired'})
//                 return
//             }
//             if(session.fingerprint != fingerprint){
//                 res.status(400).json({error: 'Fingerprint is not the same'})
//                 return
//             }
    
//             const token = jwt.sign({id: session.userId}, jwtKey, {
//                 expiresIn: '1h',
//             })
//             const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
//             const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
//             const refreshToken = newRefreshSession(session.userId._id, fingerprint, refreshExpiresIn);
//             res
//             .header('Authorization', `Bearer ${token}`)
//             .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
//             .status(200).json({
//                 userId: session.userId,
//                 nickname: session.userId.nickname,
//                 token: token,
//                 expiresIn: accessExpiresIn,
//                 refreshToken: refreshToken,
//                 refreshTokenExpiresIn: refreshExpiresIn,
//             })
//         })
//     })
// }

router.post('/sign_in', userSignInValidator, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const email = req.body.email;
    const password = req.body.password;
    const fingerprint = req.body.fingerprint;
    User.findOne({email: email}).then((user) => {
        if(user){
            let match = bcrypt.compare(password, user.password).then((res) => {
                return res;
            })
            if(match){
                const token = jwt.sign({id: user._id}, jwtKey, {
                    expiresIn: '1h',
                })
                const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
                const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
                const refreshToken = newRefreshSession(user._id, fingerprint, refreshExpiresIn);
                res
                .header('Authorization', `Bearer ${token}`)
                .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
                .status(200).json({
                    userId: user._id,
                    nickname: user.nickname,
                    token: token,
                    expiresIn: accessExpiresIn,
                    refreshToken: refreshToken,
                    refreshTokenExpiresIn: refreshExpiresIn,
                })
            }
            else{
                res.status(400).send("Incorrect password")
            }
        }
        else{
            res.status(400).send("Unknown user")
        }
        
    })
})

router.post('/sign_up', userSignUpValidator, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }
    
    const email = req.body.email;
    const password = req.body.password;
    const nickname = req.body.nickname;
    const fingerprint = req.body.fingerprint;
    User.findOne({email: email}).then((result) => {
        if(result){
            throw new Error('User already exists');
        }
        return bcrypt.hash(password, 12).then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                nickname: nickname,
            })
            return user.save()
        })
        
    })
    .then((user) => {
        const token = jwt.sign({id: user._id}, jwtKey, {
            expiresIn: '1h',
        })
        const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
        const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
        const refreshToken = newRefreshSession(user._id, fingerprint, refreshExpiresIn);
        res
        .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
        .status(200).json({
            userId: user._id,
            nickname: user.nickname,
            token: token,
            expiresIn: accessExpiresIn,
            refreshToken: refreshToken,
            refreshTokenExpiresIn: refreshExpiresIn,
        })
    })
    .catch(err => {
        res.status(400).json({
            error: 'User already exists'
        })
    })
})

router.post('/refresh', refreshTokenValidator, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const refreshToken = req.cookies.refreshToken;
    const fingerprint = req.body.fingerprint;

    RefreshSession.findOneAndDelete({refreshToken: refreshToken})
    .populate('userId', 'nickname')
    .then(session => {
        if(!session){
            res.status(400).json({error: 'Undefined session'})
            return
        }
        if(session.expiresIn < Date.now()){
            res.status(400).json({error: 'Session has been expired'})
            return
        }
        if(session.fingerprint != fingerprint){
            res.status(400).json({error: 'Fingerprint is not the same'})
            return
        }

        const token = jwt.sign({id: session.userId}, jwtKey, {
            expiresIn: '1h',
        })
        const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
        const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
        const refreshToken = newRefreshSession(session.userId._id, fingerprint, refreshExpiresIn);
        res
        .header('Authorization', `Bearer ${token}`)
        .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
        .status(200).json({
            userId: session.userId,
            nickname: session.userId.nickname,
            token: token,
            expiresIn: accessExpiresIn,
            refreshToken: refreshToken,
            refreshTokenExpiresIn: refreshExpiresIn,
        })
    })
});

router.post('/sign_out', (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const refreshToken = req.cookies.refreshToken;
    RefreshSession.deleteOne({refreshToken: refreshToken})
    .then(session => {
        if(session.deletedCount === 0){
            res.status(400).send("Session is not exists")
        }
        res.status(200).send()
    })
});


module.exports = router;