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
    body('description').notEmpty().isLength({min: 5, max: 50}).withMessage("Enter description with at least 5 characters").escape(),
    body('created_at').notEmpty().isISO8601('yyyy-mm-dd').withMessage("Enter correct date of creation"),
    body('status').notEmpty().matches(/\b(?:to-do|in process|done|approved)\b/)
]

const storageConfig = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) =>{
        cb(null, req.params.task_name + '_' + file.originalname.replace(' ','_'));
    }
});

const upload = multer({
    storage : storageConfig,
    limits: { fileSize: 5*1024*1024 },
    onError : function(err, next) {
        console.log('error', err);
        next(err);
    }
})

const router = express.Router()

router.get('/', async (req, res) => {
    const user = req.user
    Task.find().then((tasks) => {
        res.status(200).json(tasks);
    })
    
})

router.post('/',taskPostValidator, (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result)
    }

    const task = new Task({title: req.body.title, description: req.body.description, created_at: req.body.created_at, status:'to-do',file: null});
    Task.findOne({title: task.title})
    .then((res) => {
        if(res !== null){
            res.description = task.description;
            res.created_at = task.created_at;
            res.save()
        }
        else{
            return task.save()
        }   
    })
    .then((newTask) => {
        res.status(200).send(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).send("Internal server error");
    })
})

router.post('/:task_name/upload_file', upload.single('file'), async (req, res) => {
    if(req.file){
        const filename = req.file.filename;
        const task_name = req.params.task_name;
        Task.findOne({title:task_name
        }).then((task) => {
            if(!task){
                fs.rm(path.join(__dirname, 'public' , 'uploads', filename))
                res.status(400).json({error: "Task not exists"})
                return
            }
            if(task.file !== null){ 
                fs.rm(path.join(__dirname, 'public' , 'uploads', task.file))
            }
            task.file = filename
            task.save().then(() => {
                res.status(200).send();
            })
        })
    }
})

router.put('/:task_name', taskPutValidator, async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result)
    }

    Task.findOne({title:req.params.task_name})
    .then((oldTask) => {
        if(!oldTask){
            res.status(400).json({error: "Task not exists"})
            return
        }
        oldTask.description = req.body.description;
        oldTask.created_at = req.body.created_at;
        oldTask.status = req.body.status;
        return oldTask.save()
    }).then((newTask) => {
        res.status(200).send(newTask);
    }, (err) => {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    })
})

router.get('/:task_name', async (req, res) => {
    Task.findOne({title: req.params.task_name}).then((task) => {
        res.status(200).json(task);
    })
})

router.delete('/:task_name', async (req, res) => {
    Task.findOne({title:req.params.task_name})
    .then((task) => {
        if(task !== null & task.file !== null){
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