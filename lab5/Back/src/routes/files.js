const path = require('path')
const express = require('express')
const rootDir = require('../util/path')
const Task = require('../models/task')
const fs = require("fs");
const multer = require('multer')

const storageConfig = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname.replace(' ','_') + '_' + req.params.task_id);
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

router.post('/:task_id/upload_file', upload.single('file'), async (req, res) => {
    if(req.file){
        const filename = req.file.filename;
        const task_id = req.params.task_id;
        Task.findOne({_id:task_id})
        .then((task) => {
            if(!task){
                fs.rm(path.join(__dirname, 'public' , 'uploads', filename))
                res.status(400).json({error: "Task not exists or you are not a owner"})
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

module.exports = router;