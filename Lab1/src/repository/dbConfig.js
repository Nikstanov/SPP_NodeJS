const MongoClient = require("mongodb").MongoClient;
 
const client = new MongoClient("mongodb://localhost:5051/");
 
client.connect().then(mongoClient=>{
    console.log("Подключение установлено");
    console.log(mongoClient.options.dbName); // получаем имя базы данных
}); 

module.exports = client 