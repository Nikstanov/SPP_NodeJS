var { buildSchema } = require("graphql")
const path = require('path')
const rootDir = require('../util/path')
const Task = require('../models/task')
const fs = require("fs");
const multer = require('multer')
const {body, validationResult } = require('express-validator')
const { atob } = require('buffer');

var schema = buildSchema(`
    type Task {
        _id: ID!
        title: String!
        description: String!
        created_at: String!
        status: String!
        file: String
        owners: [TaskOwner!]!
    }

    type TaskOwner {
        user: User!
        role: String!
    }

    type User {
        _id: ID!
        nickname: String!
    }

    type File {
        filename: String!
        buffer: String!
    }

    type Error {
        field: String!
        msg: String!
    }

    input TaskInput {
        title: String!
        description: String!
        created_at: String!
    }

    input TaskUpdateInput {
        title: String
        description: String
        created_at: String
    }

    input FileInput {
        task_id: ID!
        filename: String!
        buffer: String!
    }

    input TaskStatusInput {
        status: String!
    }

    input TaskUserInput {
        user_id: ID!
    }

    input TaskUserUpdateInput {
        user_id: ID!
        role: String!
    }

    type Mutation {
        createTask(input: TaskInput!): Task
        updateTask(task_id: ID!, input: TaskUpdateInput!): Task
        updateTaskStatus(task_id: ID!, input: TaskStatusInput!): Task
        addTaskUser(task_id: ID!, input: TaskUserInput!): Task
        updateTaskUser(task_id: ID!, input: TaskUserUpdateInput!): Task
        removeTaskUser(task_id: ID!, user_id: ID!): Task
        deleteTask(task_id: ID!): Boolean
        uploadFile(input: FileInput!): Task
    }

    type Query {
        tasks: [Task!]!
        task(task_id: ID!): Task
        downloadFile(task_id: ID!): File
    }    
`)

var root = {
    async createTask({input}, context){
        const task = new Task({title: input.title, description: input.description, created_at: input.created_at, status:'to-do',file: null, owners:[]});
        task.owners.push({
            user: context.user._id,
            role: 'owner',
        })
        return task.save()
        .then((newTask) => {
            return(newTask);
        }, (err) => {
            console.log(err)
            throw new Error("Internal server error");
        })
    },
    async updateTask({task_id, input}, context){
        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user: context.user._id,
                    role: ['owner','editor']
                }
            }
        })
        .populate('owners','nickname')
        .then((oldTask) => {
            if(!oldTask){
                throw new Error("Task not exists or you are not a owner")
            }
            if(input.title){
                oldTask.title = input.title;
            }
            if(input.description){
                oldTask.description = input.description;
            }
            if(input.created_at){
                oldTask.created_at = input.created_at;
            }
            return oldTask.save()
        }).then((newTask) => {
            return (newTask);
        })
    },
    async updateTaskStatus({task_id, input}, context){
        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user: context.user._id,
                    role: ['owner','editor']
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                throw new Error("Task not exists or you are not a owner")
            }
            oldTask.status = input.status;
            return oldTask.save()
        }).then((newTask) => {
            return(newTask);
        })
    },
    async addTaskUser({task_id, input}, context){
        const user_id = input.user_id;

        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user: context.user._id,
                    role: 'owner'
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                throw new Error("Task not exists or you are not a owner")
            }
            return oldTask.addToOwners(user_id)
            
        }).then((newTask) => {
            return (newTask);
        })
    },    
    async updateTaskUser({task_id, input}, context){
        const user_id = input.user_id;
        const newRole = input.role;

        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user: context.user._id,
                    role: 'owner'
                } 
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                throw new Error("Task not exists or you are not a owner")
            }
            return oldTask.updateOwnersRole(user_id, newRole)
            
        }).then((newTask) => {
            return (newTask);
        })
    },
    async removeTaskUser({task_id, user_id}, context){
        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user: context.user._id,
                    role: 'owner'
                }
            }
        })
        .then((oldTask) => {
            if(!oldTask){
                throw new Error("Task not exists or you are not a owner")
            }
            return oldTask.removeOwners(user_id)
            
        }).then((newTask) => {
            return(newTask);
        })
    },
    async deleteTask({task_id}, context){
        return Task.findOne({_id:task_id, 
            owners: {
                $elemMatch: {
                    user:context.user._id,
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
            return true
        })
    },
    async tasks({}, context){
        const user = context.user
        return Task.find({owners: 
            {
                $elemMatch: {
                    user: user._id
                }
            }
        })
        .populate('owners.user','nickname')
        .then((tasks) => {
            return(tasks);
        })
    },
    async task({task_id}, context){
        const user = context.user
        return Task.find({
            _id: task_id,
            owners: 
            {
                $elemMatch: {
                    user: user._id
                }
            }
        })
        .populate('owners.user','nickname')
        .then((tasks) => {
            return(tasks);
        })
    },

    async uploadFile({input}, context){
        const task_id = input.task_id
        const filename = input.filename
        const buffer = input.buffer
        const filePath = path.join(rootDir, '..', 'public' , 'uploads', task_id + "_" + filename);
        
        const binaryString = atob(buffer)
        const length = binaryString.length
        const uint8Array = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i)
        }

        const res = await new Promise((resolve, reject) => {
            fs.writeFile(filePath, uint8Array, (err) => {
                if (err) {
                    console.error('Ошибка при записи файла:', err);
                    reject("err")
                } else {
                    Task.findOne({_id:task_id})
                    .then((task) => {
                        if(!task){
                            fs.rm(path.join(rootDir, '..','public' , 'uploads', task_id + "_" + filename))
                            reject("error")
                        }
                        if(task.file !== null){ 
                            fs.rm(path.join(rootDir,'..', 'public' , 'uploads', task.file))
                        }
                        task.file = task_id + "_" + filename
                        task.save().then((newTask) => {
                            resolve(newTask)
                        })
                    })
                }
            });
        }).then(res => {
            return res
        })
        return(res)
        
    },
    async downloadFile({task_id}, context){
        return await Task.findOne({_id:task_id})
            .then((task) => {
                if(!task){
                    throw new Error("Task not exists or you are not a owner")
                }
                if(task.file !== null){ 
                    const filePath = path.join(rootDir,'..', 'public' , 'uploads', task.file);
                    charInd = task.file.indexOf("_");
                    filename = task.file.substring(charInd + 1)
                    
                    return(new Promise((resolve, reject) => {
                        fs.readFile(filePath, {encoding: 'base64'}, (err, data) => {
                            if(err){
                                reject(err)
                            }
                            resolve(data)
                        })
                    })
                    .then(res => {
                        return({
                            buffer: res,
                            filename: filename
                          })
                    }))
                }
                else{
                    throw new Error("Internal server error")
                }
            })
    }

}

module.exports = {
    schema,
    root
};