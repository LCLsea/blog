var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var multer = require('multer');

var routes = require('./routes/index');
var config = require('./config');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
config.session.store = new mongoStore(config.mongo);
app.use(session(config.session));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({dest:'./uploads/'}).single('singleInputFileName'));
app.use(multer({dest:'./uploads/'}).array('multiInputFileName'));

routes(app);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


module.exports = app;
