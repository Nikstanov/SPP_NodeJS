var { buildSchema } = require("graphql")

const express = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {body, validationResult } = require('express-validator')
const {v4} = require('uuid')

const config = require('config');
const RefreshSession = require('../models/refreshSession')
const jwtKey = config.get('auth.jwt_key');

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

var schema = buildSchema(`
    type AuthPayload {
        userId: ID!
        nickname: String!
        token: String!
        expiresIn: Float!
        refreshToken: String!
        refreshTokenExpiresIn: Float!
    }

    type Error {
        field: String!
        msg: String!
    }

    input SignUpInput {
        email: String!
        password: String!
        nickname: String!
        fingerprint: String!
    }

    input SignInInput {
        email: String!
        password: String!
        fingerprint: String!
    }

    input RefreshTokenInput {
        fingerprint: String!
    }

    type Mutation {
        signUp(input: SignUpInput!): AuthPayload
        signIn(input: SignInInput!): AuthPayload
        refresh(input: RefreshTokenInput!): AuthPayload
        signOut: Boolean
    }
    
    type Query {
        user: String

    }
`)

var root = {
    async signIn({input}, context){
        const email = input.email;
        const password = input.password;
        const fingerprint = input.fingerprint;
        return User.findOne({email: email}).then((user) => {
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
                    context.req.context.res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
                    return {
                        userId: user._id,
                        nickname: user.nickname,
                        token: token,
                        expiresIn: accessExpiresIn,
                        refreshToken: refreshToken,
                        refreshTokenExpiresIn: refreshExpiresIn,
                    }
                }
                else{
                    throw Error("Incorrect password")
                }
            }
            else{
                throw Error("Unknown user")
            }  
        })
    },
    async signUp({input}, context){
        const email = input.email;
        const password = input.password;
        const nickname = input.nickname;
        const fingerprint = input.fingerprint;
        return User.findOne({email: email}).then((result) => {
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
            context.req.context.res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
            return({
                userId: user._id,
                nickname: user.nickname,
                token: token,
                expiresIn: accessExpiresIn,
                refreshToken: refreshToken,
                refreshTokenExpiresIn: refreshExpiresIn,
            })
        })
        .catch(err => {
            throw new Error('User already exists')
        })
    },
    async refresh({input}, context){
        const refreshToken = context.req.raw.cookies.refreshToken;
        const fingerprint = input.fingerprint;

        return RefreshSession.findOneAndDelete({refreshToken: refreshToken})
        .populate('userId', 'nickname')
        .then(session => {
            if(!session){
                throw new Error('Undefined session')
            }
            if(session.expiresIn < Date.now()){
                throw new Error('Session has been expired')
            }
            if(session.fingerprint != fingerprint){
                throw new Error('Fingerprint is not the same')
            }

            const token = jwt.sign({id: session.userId}, jwtKey, {
                expiresIn: '1h',
            })
            const accessExpiresIn = (new Date(Date.now() + 1000 * 3600)).getTime()
            const refreshExpiresIn = (new Date(Date.now() + 1000 * 3600 * 24 * 7)).getTime()
            const refreshToken = newRefreshSession(session.userId._id, fingerprint, refreshExpiresIn);
            context.req.context.res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
            return({
                userId: session.userId._id,
                nickname: session.userId.nickname,
                token: token,
                expiresIn: accessExpiresIn,
                refreshToken: refreshToken,
                refreshTokenExpiresIn: refreshExpiresIn,
            })
        })
    },
    async signOut({}, context){
        const refreshToken = context.req.cookies.refreshToken;
        return RefreshSession.deleteOne({refreshToken: refreshToken})
        .then(session => {
            if(session.deletedCount === 0){
                throw new Error("Session is not exists")
            }
            return true
        })
    }
}

module.exports = {
    schema,
    root
};