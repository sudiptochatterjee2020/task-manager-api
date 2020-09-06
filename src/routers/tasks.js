const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

// task creation endpoint
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        user: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
});

// list all tasks associated with an authenticated user
// pagination enabled using query strings limit and skip
// can be sorted by a key and in ascending or descending order
router.get('/tasks', auth, async (req, res) => {
    // path can contain query string to fetch tasks by their completion status
    // example:  /tasks?completed=true for all completed tasks
    // example: /tasks?completed=false for all incomplete tasks
    // example: /tasks for all tasks
    // example: /tasks?limit=10&skip=0 shows the 1st page of 10 tasks
    // example: /tasks?limit=10&skip=10 shows the 2nd page of 10 tasks
    // example: /tasks?sortBy=createdAt:desc  will sort the tasks by the creation date in descending order
    try {
        // direct approach
        // get the sort key and order if query string provided
        const sortField = {}
        if (req.query.sortBy) {
            // split by key and order
            const parts = req.query.sortBy.split(':')
            sortField[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }
        let query = Task.find({ user: req.user._id}).limit(parseInt(req.query.limit))
                                                    .skip(parseInt(req.query.skip))
                                                    .sort(sortField)
        if (req.query.completed) {
            const completed = req.query.completed === 'true'
            query.where('completed', completed)
        }
        const tasks = await query.exec()
        res.status(200).send(tasks)
        // alternate approach: the authenticated user is already available in req.user
        // const match = {}
        // if (req.query.completed) {
        //     match.completed = req.query.completed === 'true'
        // }
        // await req.user.populate({
        //     path: 'tasks',
        //     match,
        //     options: {
        //         limit: parseInt(req.query.limit),
        //         skip: parseInt(req.query.skip),
        //         sort: sortField
        //     }
        // }).execPopulate()
        // res.status(200).send(req.user.tasks)
    } catch(e) {
        res.status(500).send(e)    
    }
});

// list a task by its object id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, user: req.user._id })
        if (!task) {
            return res.status(404).send('Task not found!')
        }
        res.status(200).send(task)    
    } catch(e) {
        res.status(500).send(e)
    }
});

// update a task by id for an authenticated user
router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    // an array of fields which can be updated
    const allowedUpdates = ['description', 'completed']
    // get the fields which the request is trying to update
    const attemptedUpdates = Object.keys(req.body)
    // we will loop thru every fields in attemptedUpdates and check whether it is included in allowedUpdates
    const isValidOperation = attemptedUpdates.every((update) => allowedUpdates.includes(update))
    // if the update is not allowed we will stop processing
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid update!'})
    }

    try {
        const task = await Task.findOne({ _id, user: req.user._id })       
        if (!task) {
            return res.status(404).send({error: 'Task not found!'})    
        }
        attemptedUpdates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
});

// delete a task by id for an authenticated user
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOneAndDelete({_id, user: req.user._id})
        if (!task) {
            return res.status(404).send('Task not found!')
        }
        res.status(200).send(task)    
    } catch(e) {
        res.status(500).send(e)
    }
});

module.exports = router;