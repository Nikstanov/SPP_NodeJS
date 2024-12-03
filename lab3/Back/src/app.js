const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const cookieParser = require('cookie-parser');

const config = require('config');
const port = config.get('server.port');

const db_host = config.get('database.host');
const db_port = config.get('database.port');

var corsOptions = {
    origin: 'http://localhost:5173',
    methods:'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true 
};
app.use(cors(corsOptions))

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(cookieParser())
app.use(bodyParser.json())

const tasksRoute = require('./routes/tasks.js')
const authRoute = require('./routes/auth.js')
const filesRoute = require('./routes/files.js')
const jwtMiddleware = require('./middlewares/jwtMiddleware.js');

app.use('/tasks',jwtMiddleware, tasksRoute)
app.use('/auth', authRoute)
app.use('/files', filesRoute)

app.use((req, res, next) => {
    res.status(404).send();
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

mongoose.connect(`mongodb://${db_host}:${db_port}/app`)
.then(() => {
    app.listen(port, () => {
        console.log('Server was started')
    })
})
.catch((err) => console.log(err))
    