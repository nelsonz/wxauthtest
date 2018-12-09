var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');

var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var logger = require('morgan');
var weixinpay = require('weixinpay');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var clone = require('clone');

var passport = require('passport');
var WeixinStrategy = require('passport-weixin');
var providers = require('./providers.json');

var app = express();

passport.serializeUser(function(user, done) {
  console.log("SERIALIZING USER");
  console.log(user._json);
  console.log(user._json.openid);
  userdb.push(user);
  done(null, user._json.openid);
});

passport.deserializeUser(function(id, done) {
  console.log("DESERIALIZING ID");
  console.log(id);
  console.log("Current user db:");
  console.log(userdb);
  done(null, user);
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var userdb = [];

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Connect to MongoDB
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.connect("mongodb://tencloud:imakestuff@68.183.225.172:27017/test");
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit();
});

app.set('host', '68.183.225.172');
app.set('port', '3030');
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: "imakestuff",
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  store: new MongoStore({
    url: "mongodb://tencloud:imakestuff@68.183.225.172:27017/test",
    autoReconnect: true,
  })
}));
app.use(passport.initialize());
app.use(passport.session());







passport.use('weapp', new WeixinStrategy({
	provider: "weixin",
	clientID: 'wx042a813fd18f7f47',
	clientSecret: '387aa86ab9e96afd52600d9d52160450',
	requireState: false,
	authorizationURL: "https://api.weixin.qq.com/sns/jscode2session",
	session: false,
	scope: "weapp_login",
	successRedirect: "/auth/account",
	//passReqToCallback: true,
	failureFlash: true
}, function(accessToken, refreshToken, profile, done) { 
	console.log(accessToken);
	console.log(refreshToken);
	done(null, profile);
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/auth/weapp', function(req, res, next) {
	passport.authenticate('weapp', function(err, user) {
		req.login(user, function (err) {
			if (err) {
				return next(err);
			}
				return res.redirect('/auth/account');
		});
	})(req, res, next);	
});

app.get('/auth/account', passport.authenticate('weapp', {failureRedirect: '/'}), function(req, res) {
  console.log(req.user);
  console.log(req.session);
  res.json(Object.assign({result_status:'ok'}, req.params, req.query));
});

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


// Start express server
app.listen(app.get('port'), () => {
  console.log(' App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
