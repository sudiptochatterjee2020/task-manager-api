const jwt = require('jsonwebtoken');
const User = require('../models/user');

// authentication -- express middleware function
const auth = async (req, res, next) => {
    try {
        // get the token passed as header
        const token = req.header('Authorization').replace('Bearer ', '')
        // verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // return the user which has this token
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        // throw error if user not found
        if (!user) {
            throw new Error()
        }

        // store the user as a request object attribute
        req.token = token
        req.user = user
        next()
    } catch(e) {
        res.status(401).send({error: 'Authentication error. '})
    }
};

module.exports = auth;