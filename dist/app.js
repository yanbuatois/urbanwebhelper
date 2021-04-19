"use strict";

const createError = require('http-errors');

const express = require('express');

const path = require('path');

const cookieParser = require('cookie-parser');

const logger = require('morgan');

const session = require('express-session');

const compression = require('compression');

const UROAuth = require('./classes/oauthurban');

const config = require('./config');

const indexRouter = require('./routes/index');

const usersRouter = require('./routes/users');

const loginRouter = require('./routes/login');

const collectionRouter = require('./routes/collection');

const missionsRouter = require('./routes/missions');

const app = express(); // view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.use(logger('dev'));

if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  secret: "J'apprécie les fruits au sirop !",
  resave: true,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 60 * 60 * 24 * 7
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (req.session.access_token && req.path !== '/logout') {
    req.default = {};
    /**
     * Ur API
     * @type {module.UrbanOAuth}
     */

    req.urApi = new UROAuth(config.key, config.secret);
    req.urApi.token = req.session.access_token;
    req.urApi.query("general.getPlayer").then(result => {
      req.default.player = result.context.player;
    }).catch(() => {
      req.session.access_token = undefined;
    }).finally(() => {
      next();
    });
  } else next();
}).use((req, res, next) => {
  if (req.path !== '/login' && req.path !== '/authorized' && !req.session.access_token && req.path !== '/logout' && req.path !== '/cleartoken') {
    req.session.originalPath = req.originalUrl;
    res.redirect('/login');
  } else {
    next();
  }
}).get('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) res.render('errors/apierror', {
      error: err
    });else res.render('logout');
  });
});
app.use(loginRouter);
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use(missionsRouter);
app.use('/collection', collectionRouter); // catch 404 and forward to error handler

app.use(function (req, res, next) {
  next(createError(404));
}); // error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; // render the error page

  res.status(err.status || 500);
  res.render('errors/error');
});
module.exports = app;
//# sourceMappingURL=app.js.map