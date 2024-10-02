const path = require('path')
const express = require('express')
const rootDir = require('../util/path')
const Task = require('../models/task')
const fs = require("fs");
const multer = require('multer')
const {body, validationResult } = require('express-validator')

const taskPostValidator = [
    body('title').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter title with at least 5 characters").escape(),
    body('description').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter description with at least 5 characters").escape(),
    body('created_at').notEmpty().isISO8601('yyyy-mm-dd').withMessage("Enter correct date of creation"),
]

const taskPutValidator = [
    body('title').optional().isLength({min: 5, max: 50}).withMessage("Enter title with at least 5 characters").escape(),
    body('description').optional().isLength({min: 5, max: 50}).withMessage("Enter description with at least 5 characters").escape(),
    body('created_at').optional().isISO8601('yyyy-mm-dd').withMessage("Enter correct date of creation"),
]

const taskPatchValidator = [
    body('status', "Incorrect status").notEmpty().matches(/\b(?:to-do|in process|done|approved)\b/)
]

const taskUserPostValidator = [
    body('user_id').notEmpty().withMessage('user_id is not provided')
]

const taskUserPatchValidator = [
    body('user_id').notEmpty().withMessage('user_id is not provided'),
    body('role', "Incorrect role").notEmpty().matches(/\b(?:editor|participant)\b/)
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

const router = express.Router()

router.get('/', async (req, res) => {
    const user = req.user
    Task.find({owners: 
        {
            $elemMatch: {
                user: user._id
            }
        }
    })
    .populate('owners.user','nickname')
    .then((tasks) => {
        res.status(200).json(tasks);
    })
    
})

router.post('/',taskPostValidator, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const task = new Task({title: req.body.title, description: req.body.description, created_at: req.body.created_at, status:'to-do',file: null, owners:[]});
    task.owners.push({
        user: req.user._id,
        role: 'owner',
    })
    task.save()
    .then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).send("Internal server error");
    })
})



router.put('/:task_id', taskPutValidator, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: ['owner','editor']
            }
        }
    })
    .populate('owners','nickname')
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists or you are not a owner"})
            return
        }
        if(req.body.title){
            oldTask.title = req.body.title;
        }
        if(req.body.description){
            oldTask.description = req.body.description;
        }
        if(req.body.created_at){
            oldTask.created_at = req.body.created_at;
        }
        return oldTask.save()
    }).then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.patch('/:task_id', taskPatchValidator, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: ['owner','editor']
            }
        }
    })
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists or you are not a owner"})
            return
        }
        oldTask.status = req.body.status;
        return oldTask.save()
    }).then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.post('/:task_id/users',taskUserPostValidator, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const user_id = req.body.user_id;

    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: 'owner'
            }
        }
    })
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists or you are not a owner"})
            return
        }
        return oldTask.addToOwners(user_id)
        
    }).then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.patch('/:task_id/users', taskUserPatchValidator, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const user_id = req.body.user_id;
    const newRole = req.body.role;

    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: 'owner'
            }
        }
    })
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists or you are not a owner"})
            return
        }
        return oldTask.updateOwnersRole(user_id, newRole)
        
    }).then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.delete('/:task_id/users/:user_id', async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            error: handleInputErrors(result.array())
        })
    }

    const user_id = req.params.user_id;

    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: 'owner'
            }
        }
    })
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists or you are not a owner"})
            return
        }
        return oldTask.removeOwners(user_id)
        
    }).then((newTask) => {
        res.status(200).json(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.delete('/:task_id', async (req, res) => {
    Task.findOne({_id:req.params.task_id, 
        owners: {
            $elemMatch: {
                user: req.user._id,
                role: 'owner'
            }
        }
    })
    .then((task) => {
        if(task && task.file){
            console.log(path.join(rootDir, '..', 'public' , 'uploads', task.file));
            fs.unlink(path.join(rootDir,'..', 'public' , 'uploads', task.file), (err) => {
                if(err){
                    console.log(err)
                }
                else{
                    console.log("file was deleted")
                }
            })
        }
        return task.deleteOne()
    })
    .then(() => {
        res.status(200).send();
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

module.exports = router;