const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const cookieParser = require('cookie-parser');
var { createHandler } = require("graphql-http/lib/use/express")
var { ruruHTML } = require("ruru/server")

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

const authSchema = require('./graphql/authSchema.js')
const tasksSchema = require('./graphql/tasksSchema.js')
app.all(
    "/graphql/auth",
    createHandler({
      schema: authSchema.schema,
      rootValue: authSchema.root,
      context: (req) => ({
        req: req,

      }),
    })
)

app.use('/graphql/tasks',jwtMiddleware)
app.all(
    "/graphql/tasks",
    createHandler({
      schema: tasksSchema.schema,
      rootValue: tasksSchema.root,
      context: (req) => ({
        req: req,
        user: req.raw.user
      }),
    })
)

app.get("/dev/graphql/auth", (_req, res) => {
    res.type("html")
    res.end(ruruHTML({ endpoint: "/graphql/auth" }))
})

app.get("/dev/graphql/tasks", (_req, res) => {
    res.type("html")
    res.end(ruruHTML({ endpoint: "/graphql/tasks" }))
})

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
    