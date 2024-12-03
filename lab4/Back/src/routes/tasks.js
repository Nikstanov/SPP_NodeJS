const path = require('path')
const express = require('express')
const rootDir = require('../util/dirpath')
const Task = require('../models/task')
const fs = require("fs");
const multer = require('multer')
const {body, validationResult } = require('express-validator');
const dirpath = require('../util/dirpath');

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

module.exports = function(io,socket){
    socket.on("/", (callback) => {
        const user = socket.user
        Task.find({owners: 
            {
                $elemMatch: {
                    user: user._id
                }
            }
        })
        .populate('owners.user','nickname')
        .then((tasks) => {
            callback({
                status: 200,
                data: tasks
            })
        })
    })
    socket.on("/create", ( data, callback) => {
        const task = new Task({title: data.title, description: data.description, created_at: data.created_at, status:'to-do',file: null, owners:[]});
        task.owners.push({
            user: socket.user._id,
            role: 'owner',
        })
        task.save()
        .then((newTask) => {
            io.to(socket.user._id.toString()).emit("update", newTask);
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500,
                error: "Internal server error"
            })
        })
    })
    socket.on("/put", (data, callback) => {
        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
                    role: ['owner','editor']
                }
            }
        })
        .populate('owners','nickname')
        .then((oldTask) => {
            if(!oldTask){
                callback({
                    status: 400, 
                    error: "Task not exists or you are not a owner"
                })
                return
            }
            if(data.title){
                oldTask.title = data.title;
            }
            if(data.description){
                oldTask.description = data.description;
            }
            if(data.created_at){
                oldTask.created_at = data.created_at;
            }
            return oldTask.save()
        }).then((newTask) => {
            for(let i = 0; i < newTask.owners.length; i++){
                const user = newTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("update", newTask);
                }
                else{
                    io.to(user.toString()).emit("update", newTask);
                }
            }
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
    })
    socket.on("/update_status", (data, callback) => {
        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
                    role: ['owner','editor']
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                callback({
                    status: 400, 
                    error: "Task not exists or you are not a owner"
                })
                return
            }
            oldTask.status = data.status;
            return oldTask.save()
        }).then((newTask) => {
            for(let i = 0; i < newTask.owners.length; i++){
                const user = newTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("update", newTask);
                }
                else{
                    io.to(user.toString()).emit("update", newTask);
                }
            }
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
    })
    socket.on("/delete", (data, callback) => {
        let deletedTask;
        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
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
            deletedTask  = task;
            return task.deleteOne()
        })
        .then(() => {
            for(let i = 0; i < deletedTask.owners.length; i++){
                const user = deletedTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("delete", data.task_id);
                }
                else{
                    io.to(user.toString()).emit("delete", data.task_id);
                }
            }
            callback({
                status: 200
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
    })
    socket.on("/add_user", (data, callback) => {
        const user_id = data.user_id;

        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
                    role: 'owner'
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                callback({
                    status: 400, 
                    error: "Task not exists or you are not a owner"
                })
                return
            }
            return oldTask.addToOwners(user_id)
            
        }).then((newTask) => {
            for(let i = 0; i < newTask.owners.length; i++){
                const user = newTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("update", newTask);
                }
                else{
                    io.to(user.toString()).emit("update", newTask);
                }
            }
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
    })
    socket.on("/update_user", (data, callback) => {
        const user_id = data.user_id;
        const newRole = data.role;

        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
                    role: 'owner'
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                callback({
                    status: 400, 
                    error: "Task not exists or you are not a owner"
                })
                return
            }
            return oldTask.updateOwnersRole(user_id, newRole)
            
        }).then((newTask) => {
            for(let i = 0; i < newTask.owners.length; i++){
                const user = newTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("update", newTask);
                }
                else{
                    io.to(user.toString()).emit("update", newTask);
                }
            }
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
    })
    socket.on("/delete_user", (data, callback) => {
        const user_id = data.user_id;

        Task.findOne({_id:data.task_id, 
            owners: {
                $elemMatch: {
                    user: socket.user._id,
                    role: 'owner'
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                callback({
                    status: 400, 
                    error: "Task not exists or you are not a owner"
                })
                return
            }
            return oldTask.removeOwners(user_id)
            
        }).then((newTask) => {
            for(let i = 0; i < newTask.owners.length; i++){
                const user = newTask.owners[i].user;
                if(user._id){
                    io.to(user._id.toString()).emit("update", newTask);
                }
                else{
                    io.to(user.toString()).emit("update", newTask);
                }
            }
            callback({
                status: 200,
                data: newTask
            })
        }, (err) => {
            console.log(err)
            callback({
                status: 500, 
                error: "Internal server error"
            })
        })
        
    })
    socket.on('/upload_file', ({task_id, filename, buffer}, callback) => {
        const filePath = path.join(dirpath, '..', 'public' , 'uploads', task_id + "_" + filename);
        
        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.error('Ошибка при записи файла:', err);
                callback({
                    status: 500, 
                    error: "Internal server error"
                })
            } else {
                Task.findOne({_id:task_id})
                .then((task) => {
                    if(!task){
                        fs.rm(path.join(dirpath, '..','public' , 'uploads', task_id + "_" + filename))
                        callback({
                            status: 400, 
                            error: "Task not exists or you are not a owner"
                        })
                        return
                    }
                    if(task.file !== null){ 
                        fs.rm(path.join(dirpath,'..', 'public' , 'uploads', task.file))
                    }
                    task.file = task_id + "_" + filename
                    task.save().then((newTask) => {
                        for(let i = 0; i < newTask.owners.length; i++){
                            const user = newTask.owners[i].user;
                            if(user._id){
                                io.to(user._id.toString()).emit("update", newTask);
                            }
                            else{
                                io.to(user.toString()).emit("update", newTask);
                            }
                        }
                        callback({
                            status: 200,
                            data: newTask
                        })
                        return
                    })
                })
            }
        });
    })
    socket.on('/download_file', ({task_id}, callback) => {
        Task.findOne({_id:task_id})
            .then((task) => {
                if(!task){
                    callback({
                        status: 400, 
                        error: "Task not exists or you are not a owner"
                    })
                    return
                }
                if(task.file !== null){ 
                    const filePath = path.join(dirpath,'..', 'public' , 'uploads', task.file);
                    charInd = task.file.indexOf("_");
                    filename = task.file.substring(charInd + 1)
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            console.error('Ошибка при записи файла:', err);
                            callback({
                                status: 500, 
                                error: "Internal server error"
                            })
                        } else {
                          callback({
                            status: 200,
                            buffer: data,
                            filename: filename
                          })
                        }
                      });   
                }   
                else{
                    callback({
                        status: 400, 
                        error: "File not exists"
                    })
                }
            })
    })
    // socket.on("/upload_file", (file, data, callback) => {
    //     const task_id = data.task_id;
    //     const filename = data.task_id + "_" + data.filename;
    //     fs.writeFile(path.join(__dirname, 'public' , 'uploads', filename), file, (err) => {
    //         callback({ message: err ? "failure" : "success" });
    //     });
        
    //     Task.findOne({_id:task_id})
    //     .then((task) => {
    //         if(!task){
    //             fs.rm(path.join(__dirname, 'public' , 'uploads', filename))
    //             callback({
    //                 status: 400, 
    //                 error: "Task not exists or you are not a owner"
    //             })
    //             return
    //         }
    //         if(task.file !== null){ 
    //             fs.rm(path.join(__dirname, 'public' , 'uploads', task.file))
    //         }
    //         task.file = filename
    //         task.save().then((newTask) => {
    //             for(let i = 0; i < newTask.owners.length; i++){
    //                 const user = newTask.owners[i].user;
    //                 if(user._id){
    //                     io.to(user._id.toString()).emit("update", newTask);
    //                 }
    //                 else{
    //                     io.to(user.toString()).emit("update", newTask);
    //                 }
    //             }
    //             callback({
    //                 status: 200,
    //             })
    //         })
    //     })
    // })
}