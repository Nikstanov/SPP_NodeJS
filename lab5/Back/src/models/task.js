const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const nestedSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'User', required: true}, 
        role: {type: String, required: true},
    },
    { _id: false }
);

const taskSchema = new Schema({
    title: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    created_at: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: false
    },
    owners: [nestedSchema]
}, { versionKey: false })


taskSchema.methods.addToOwners = function(owner_id){
    const ownerIndex = this.owners.findIndex(val => {
        return val.user.toString() === owner_id
    })

    if(ownerIndex < 0){
        this.owners.push({
            user: owner_id,
            role: 'participant'
        })
    }

    return this.save()
}

taskSchema.methods.updateOwnersRole = function(owner_id, newRole){
    const ownerIndex = this.owners.findIndex(val => {
        return val.user.toString() === owner_id
    })
    if(ownerIndex >= 0 && this.owners[ownerIndex].role !== 'owner'){
        this.owners[ownerIndex].role = newRole
    }

    return this.save()
}

taskSchema.methods.removeOwners = function(owner_id){
    const ownerIndex = this.owners.findIndex(val => {
        return val.user.toString() === owner_id
    })
    if(ownerIndex >= 0 && this.owners[ownerIndex].role !== 'owner'){
        this.owners.splice(ownerIndex, 1);
    }

    return this.save()
}


module.exports = mongoose.model('Task', taskSchema);   