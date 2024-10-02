const taskDB = require('../repository/taskRepository.js');

class Task{
    constructor(title, description, time){
        this.title = title
        this.description = description;
        this.status = 0
        this.time = time;
        this.file = null
    }

    static async save(task){
        await taskDB.save(task)
    }

    static async fetchAll(status, date){
        return await taskDB.getAll(status, date)
    }

    static async getWithTitle(title){
        return await taskDB.find(title)
    }

    static delete(title){
        taskDB.remove(title)
    }
}

module.exports = Task 