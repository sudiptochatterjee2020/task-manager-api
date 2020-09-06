const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth'); 
const {sendWelcomeEmail, sendCancellationEmail} = require('../email/account'); 

// user creation endpoint
router.post('/users',  async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        // generate an authentication token for the created user
        const token = await user.generateAuthToken()
        // send welcome email to the registered user
        sendWelcomeEmail(user.email, user.name)
        // send back response
        res.status(201).send({user, token})
    } catch(e) {
        res.status(400).send(e)
    } 
});

// user login endpoint
router.post('/users/login',  async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        // generate an authentication token for the specific user
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(e) {
        res.status(400).send(e)
    } 
});

// logout from current session
router.post('/users/logout', auth, async (req, res) => {
    try {
        // we want to filter out the token that has been used to authenticate the login
        // and remove it using a filter function
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })

        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    } 
});

// logout from all active sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // delete all tokens associated with the user
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    } 
});

// get the profile of the authenticated user
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
});

// update an authenticated user
router.patch('/users/me', auth, async (req, res) => {
    // an array of fields which can be updated
    const allowedUpdates = ['name', 'email', 'password', 'age']
    // get the fields which the request is trying to update
    const attemptedUpdates = Object.keys(req.body)
    // we will loop thru every fields in attemptedUpdates and check whether it is included in allowedUpdates
    const isValidOperation = attemptedUpdates.every((update) => allowedUpdates.includes(update))
    // if the update is not allowed we will stop processing
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid update!'})
    }

    try {
        // The authenticated user is available in req.user. We set up the update.
        attemptedUpdates.forEach((update) => req.user[update] = req.body[update])
        // run the middleware by explicitly calling the save method on user object
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(400).send({error : e})
    }
});

// delete an authenticated user
router.delete('/users/me', auth, async (req, res) => {
    const _id = req.params.id
    try {
        await req.user.remove()
        // send cancellation email to the registered user
        sendCancellationEmail(req.user.email, req.user.name)
        // send back response
        res.status(200).send(req.user)    
    } catch(e) {
        res.status(500).send(e)
    }
});

// upload user's profile image
// Allows images with jpg, jpeg and png extensions only
// uses the sharp module to convert avatars to .png format
// Size limit is 1 Mb
const upload = multer({
    // dest: 'avatars',  <-- commented since we want to save the image file as binary data in the user collection in mongo
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Upload file with jpg, jpeg or png extension!'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 256, height: 256 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()

    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// delete the avatar of an autheticated user
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined 
    await req.user.save()

    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


// get the avatar of an user by her id
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        // if user is not found or avatar not found throw error
        if (!user || !user.avatar) throw new Error();

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router;