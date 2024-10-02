const client = require('./dbConfig.js')
const Task = require('../models/task.js')


async function getAll(status, date){
    const session = client.startSession();
    let res = []
    try{
        session.startTransaction();
        const db = client.db("to-do");
        const collection = db.collection("tasks");
        if(status !== undefined || date !== undefined){
            if(status !== undefined && date !== undefined){
                res = await collection.find({status:status, time:date}).sort({status: -1, title: 1}).toArray();
            }
            else {
                if(date !== undefined){
                    res = await collection.find({time:date}).sort({status: -1, title: 1}).toArray();
                }
                else{
                    res = await collection.find({status:status}).sort({status: -1, title: 1}).toArray();
                }
            }
        }
        else{
            res = await collection.find().sort({status: -1, title: 1}).toArray();
        }        
        await session.commitTransaction()
    } catch (err){
        session.abortTransaction()
    } finally{
        session.endSession()
    }
    return res;
}

async function find(title){
    const session = client.startSession();
    let res = null
    try{
        session.startTransaction();
        const db = client.db("to-do");
        const collection = db.collection("tasks");
        res =  await collection.findOne({title: title})
        await session.commitTransaction()
    } catch (err){
        session.abortTransaction()
    } finally{
        session.endSession()
    }
    return res;
}

async function save(task){
    const session = client.startSession();
    try{
        session.startTransaction();
        const db = client.db("to-do");
        const collection = db.collection("tasks");
        const existsTask = await collection.findOne({title: task.title});
        if(existsTask === null){
            await collection.insertOne(task)
        }
        else{
            await collection.updateOne({title: task.title}, {$set: task})
        }
        
        await session.commitTransaction()
    } catch (err){
        session.abortTransaction()
    } finally{
        session.endSession()
    }
    
}

async function remove(title){
    const session = client.startSession();
    try{
        session.startTransaction();
        const db = client.db("to-do");
        const collection = db.collection("tasks");
        await collection.deleteMany({title: title})
        await session.commitTransaction()
    } catch (err){
        session.abortTransaction()
    } finally{
        session.endSession()
    }
}

module.exports = {
    getAll: getAll,
    find: find,
    save: save,
    remove: remove
}