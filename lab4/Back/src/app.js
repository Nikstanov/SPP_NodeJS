const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');


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

const registerTasksRoutes = require('./routes/tasks.js')
const authRoute = require('./routes/auth.js')
const filesRoute = require('./routes/files.js')
const jwtMiddleware = require('./middlewares/jwtMiddleware.js');
const { createServer } = require('http');

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
    const server = createServer(app)
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
            allowedHeaders: ["Authorization", "Cookie"],
            credentials: true
        }
    });
    io.use((socket, next) => {
        jwtMiddleware(socket, next)
    })
    io.on('connection', (socket) => {
        console.log('a user connected');
        registerTasksRoutes(io, socket)
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    server.listen(3000, () => {
        console.log('server running at http://localhost:3000');
    });
})
.catch((err) => console.log(err))
    