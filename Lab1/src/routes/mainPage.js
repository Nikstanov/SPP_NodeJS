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
        cb(null, file.originalname.replace(' ','_'));
    }
});

const upload = multer({
    storage : storageConfig,
    limits: { fileSize: 5*1024*1024 }
})

const router = express.Router()

router.get('/', async (req, res) => {
    let status = req.query.status
    if(status !== undefined && status !== "4"){
        status = parseInt(req.query.status)
        res.cookie('status', status)
    }
    else{
        status = undefined
    }
    let date = req.query.date
    if(date !== undefined && date !== ''){
        res.cookie('date', date)
    }
    else{
        date = undefined
    }

    const tasks = await Task.fetchAll(status, date)

    res.render('main', {
        pageTitle: 'TO-DO list',
        prods: tasks,
        curStatus: (status !== undefined ? status : 4),
        curDate: ((date !== undefined) ? date : (new Date(Date.now())).toLocaleDateString("en-US"))
    })
    
})

router.post('/save',async (req, res) => {
    const task = new Task(req.body.title, req.body.description, req.body.time);
    await Task.save(task);
    res.redirect('/to-do')
})

router.post('/:task_name/upload_file', upload.single('file'), async (req, res) => {
    if(req.file){
        const filename = req.file.filename;
        const task_name = req.params.task_name;
        let task = await Task.getWithTitle(task_name)
        if(task.file !== null){
            fs.unlink(path.join(rootDir,'..', 'public' , 'uploads', task.file), (err) => {
                if(err){
                    console.log(err)
                }
                else{
                    console.log("file was deleted")
                }
            })
        }
        task.file = filename
        Task.save(task)
    }
    res.redirect('/to-do')
})

router.post('/:task_name', async (req, res) => {
    let task = await Task.getWithTitle(req.params.task_name)
    task.status = parseInt(req.body.status)
    Task.save(task)
    res.redirect('/to-do')
})

router.use('/:task_name', async (req, res) => {
    let task = await Task.getWithTitle(req.params.task_name)
    if(task !== null & task.file !== null){
        fs.unlink(path.join(rootDir,'..', 'public' , 'uploads', task.file), (err) => {
            if(err){
                console.log(err)
            }
            else{
                console.log("file was deleted")
            }
        })
    }
    Task.delete(task.title)
    res.redirect('/to-do')
})

module.exports = router;