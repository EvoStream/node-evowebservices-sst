var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var evostream = require('./routes/evostream');

var app = express();

//Set winston
var winston = require('winston');

var jsonComment = require('comment-json');
var fs = require('fs');

var path = require('path');
var fileLogging = path.join(__dirname, '/config/logging.json');

var configLog = jsonComment.parse(fs.readFileSync(fileLogging), null, true);

winston.addColors({
  silly: 'blue',
  debug: 'gray',
  verbose: 'magenta',
  info: 'green',
  warn: 'yellow',
  error: 'red'
});

winston.remove(winston.transports.Console);

var logFileName = path.join(__dirname, '/logs/evowebservices-sst.') + process.pid + "." + new Date().getTime() + "-" + ".log";

// set winston log
winston.add(winston.transports.File, {
  level: configLog.options.level,
  // filename: "./logs/evowebservices." + process.pid + "." + new Date().getTime() + "-" + ".log",
  filename: logFileName,
  handleExceptions: configLog.options.handleExceptions,
  json: configLog.options.json,
  maxsize: configLog.options.maxsize,
  timestamp: function () {

    var timestamp = new Date().getTime() + ":" + process.pid;

    return timestamp;
  }
});

winston.add(winston.transports.Console, {
  level: configLog.options.level,
  handleExceptions: configLog.options.handleExceptions,
  colorize: true
});


process.on('uncaughtException', function (err) {
  console.log("[evowebservices-sst] UNCAUGHT EXCEPTION ");
  console.log("[evowebservices-sst] [Inside 'uncaughtException' event] " + err.stack || err.message);
  winston.log("error", "[evowebservices-sst] UNCAUGHT EXCEPTION ");
  winston.log("error", "[evowebservices-sst] [Inside 'uncaughtException' event] " + err.stack || err.message);
});

//set to a different port
app.set('port', process.env.PORT || 4000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/evostream', evostream);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

app.use(function(request, response, next){
  //concat the stream of response from ems
  request.pipe(concat(function(data){
    request.body = data;
    next();
  }));
});

module.exports = app;
