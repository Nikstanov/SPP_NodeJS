const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mainPageRoute = require('./routes/mainPage.js')
const path = require('path')
const cookieParser = require('cookie-parser')

app.set('view engine', 'ejs')
app.set('views', 'src/frontend')
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/to-do', mainPageRoute)


app.use((req, res, next) => {
    res.status(404).render('notFound')
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const server = http.createServer(app)
server.listen(3000);

