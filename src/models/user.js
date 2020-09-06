const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const task = require('./task');
const Task = require('./task');

// Create the user schema. We do this to take advanatge of the middleware
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot have the value password')    
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age needs to be a positive number')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

// virtual attribute - reference between user and his tasks
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'user'
})

// instance method to generate token
userSchema.methods.generateAuthToken = async function() {
    const user = this
    // generate token
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
    // save this token for the user
    user.tokens = user.tokens.concat({token})
    await user.save()
    // return the token
    return token
}

// setup toJSON method to send only public information about an user
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Class method to validate the user login
userSchema.statics.findByCredentials = async (email, password) => {
    //find user by email
    const user = await User.findOne({email})

    // if there is no user with the email
    if (!user) {
        throw new Error('Unable to login')
    }

    // match password with the hashed password in the user object 
    const isMatch = await bcrypt.compare(password, user.password)

    // if the passwords do not match throw an error
    // Provide a general error message rather than a specific error message (best practice)
    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// middleware to hash a password before saving to database
userSchema.pre('save', async function(next) {
    const user = this  // this gives access to the new user about to be saved
    // check whether password has been changed
    if (user.isModified('password')) {
        // hash the password
        user.password = await bcrypt.hash(user.password, 8)
    }

    // the asynchronous process is complete
    next()
})

// middleware to cascade delete all tasks if an associated user is deleted
userSchema.pre('remove', async function(next) {
    const user = this
    // delete all tasks associated with the user
    await Task.deleteMany({ user: user._id })
    next()
})

// Create user
const User = mongoose.model('User', userSchema);

module.exports = User;