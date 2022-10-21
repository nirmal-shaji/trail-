var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var dotenv = require('dotenv');
dotenv.config({ path: './config.env' })

var dbconnection=require('./config/connection');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var session = require('express-session')

const { extname } = require('path');
// var usersModel=require('./model/userschema')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/', helpers: {
    inc1: function (context) {
      return context+1
    },
    total: function (amount, discount, quantity) {
      return (amount - discount) * quantity;
    },
    singleTotal: function (amount, discount) {
      return (amount - discount);
    },
    dateSlicer: function (date) {
     return date.toISOString().substring(0, 10);

    }
    
} }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const day=24*60*60*1000
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: day }
}));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use('/', userRouter);
app.use('/admin', adminRouter);
// console.log(process.env)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;







