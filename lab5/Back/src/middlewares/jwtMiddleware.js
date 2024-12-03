const jwt = require('jsonwebtoken');
const User = require('../models/user')

const config = require('config');
const jwtKey = config.get('auth.jwt_key');

function verifyToken(req, res, next) {
    let token = undefined
    if(req.headers.authorization){
        token = req.headers.authorization.split(' ')[1]
    }
    else{
        if(req.cookies && req.cookies.token){
            token = req.cookies.token
        }
    }
    if (!token) return res.status(401).json({ error: 'Access denied' });
    jwt.verify(
        token,
        jwtKey,
        (err, payload) => {
            if (err) return res.status(401).json({ error: 'Invalid token'  });
            else if (payload) {

                User.findOne({_id : payload.id})
                .then((res) => {
                    if(res !== null){
                        req.user = res
                        return next()
                    }
                    return res.status(401).json({ error: 'Unknown user'  });
                })
            }
            else{
                return res.status(401).json({ error: 'Empty token' });
            }
        }
    );
};

module.exports = verifyToken;