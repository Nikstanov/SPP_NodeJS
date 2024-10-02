const jwt = require('jsonwebtoken');
const User = require('../models/user')

const config = require('config');
const jwtKey = config.get('auth.jwt_key');

function verifyToken(socket, next) {
    const token = socket.handshake.auth.token;
    if(!token) return next(new Error("Token is not provided"));
    jwt.verify(
        token,
        jwtKey,
        (err, payload) => {
            if (err) return next(new Error("Incorrect token"));
            else if (payload) {

                User.findOne({_id : payload.id})
                .then((res) => {
                    if(res !== null){
                        socket.user = res
                        console.log(res._id.toString())
                        socket.join(res._id.toString())
                        return next()
                    }
                    return next(new Error("Unknown user"));
                })
            }
            else{
                return next(new Error("Empty token"));
            }
        }
    );
};

module.exports = verifyToken;