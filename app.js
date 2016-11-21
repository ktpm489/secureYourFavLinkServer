var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwtHandler = require('jsonwebtoken');
var mongoose = require('mongoose');
var cors = require('cors');
var configMongo = require('./config-mongo');
var User = require('./models/user');
var Link = require('./models/link');
var index = require('./routes/index');

var app = express();

mongoose.connect(configMongo.database);
app.set('secretKey', configMongo.secret);
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
// app.post('/createTestUser', function(req, res) {
//     var testUser = new User({
//         name: 'admin',
//         password: 'admin',
//         admin: true
//     });
//     testUser.save(function(err) {
//         if (err) throw err;
//         res.json({ success: true });
//     });
// });

var apiRoutes = express.Router();
apiRoutes.post('/auth', function(req, res) {
    User.findOne({
        name: req.body.username
    }, function(err, user) {
        if (err) throw err;
        if (!user) {
            return res.status(403).send({
                success: false,
                message: 'Username or password is wrong.'
            });
        } else if (user) {
            if (user.password != req.body.password) {
                return res.status(403).send({
                    success: false,
                    message: 'Username or password is wrong.'
                });
            } else {
                var token = jwtHandler.sign(user, app.get('secretKey'), {
                    expiresIn: 60
                });
                res.json({
                    success: true,
                    message: 'Success Logged in!',
                    token: token
                });
            }
        }
    });
});
apiRoutes.use(function(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
        jwtHandler.verify(token, app.get('secretKey'), function(err, decoded) {
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'No Validate token'
                });
            } else {
                req.userInfo = decoded._doc;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No Validate token'
        });
    }
});
apiRoutes.get('/users', function(req, res) {
    console.log(req.decoded);
    res.json(req.decoded._doc);
    User.find({}, function(err, users) {
        res.json(users);
    });
});
apiRoutes.post('/link/save', function(req, res) {
    var newLink = new Link({
        url: req.body.url.link,
        title: req.body.url.title,
        username: req.userInfo.name
    });
    newLink.save(function(err) {
        if (err) throw err;
        res.json({ success: true });
    });
});
apiRoutes.post('/link/get', function(req, res) {
    Link.find({
        username: req.userInfo.name
    }, function(err, links) {
        res.json(links);
    });
});
app.use('/api', apiRoutes);

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
module.exports = app;