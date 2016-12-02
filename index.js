var express = require('express');
var hb  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var csurf = require('csurf');
var pg = require('pg');
var redis = require("redis");

var bcrypt = require('./checkPass');
var hashPassword = checkPass.hashPassword;
var checkPassword = checkPass.checkPassword;

app.use(cookieSession({
    secret: 'a really hard to guess secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));


app.use(cookieParser());
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.get('/register', function(req, res) {
    res.render('register');
});

app.post('/register', function(req, res) {
    if (req.body.firstname && req.body.lastname && req.body.email && req.body.password) {
        bcrypt.hashPassword(req.body.password).then(function(hash){
            return db.query("INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
          [req.body.firstname, req.body.lastname, req.body.email, hash]).then(function(result){
              req.session.user = {
                  email :req.body.email,
                  firstname : req.body.firstname,
                  id : result.rows[0].id
              };
              if (req.session.user) {
                  res.redirect('/petition');
              }
          });
        }).catch(function(err){
            console.log(err);
            res.render('register', {
                layout : layout
                tryagain : "Please fill in all informations required"
            });
        });
    }
});

app.get('/petition', function(req, res) {
    res.render('index');
});

app.post('/petition', function(req, res) {
    if (req.body.firstname && req.body.lastname && req.body.signature) {
        db.query("INSERT INTO petitioners(first_name, last_name, signature, user_id) VALUES ($1, $2, $3, $4) RETURNING id",
        [req.body.firstname, req.body.lastname, req.body.signature, req.session.user.id]).then(function(result){
            req.session.signatureId = result.rows[0].id;
            console.log(result);
            res.redirect('/petition/profile');
        }).catch(function(err){
            console.log(err);
            res.render('error', {
                layout : layout,
                error: true
            });
        });

    } else {
        res.render('error', {
            layout : layout,
            error: true
        });
    }
});

app.get('/petition/profile', function(req, res) {
    if (!req.session.signatureId){
        res.redirect('/petition');
        return;
    }
    db.query("SELECT * FROM petitioners").then(function(result){
        return db.query('SELECT * FROM petitioners WHERE id = $1', [req.session.signatureId]).then(function(results2) {
            // console.log(result.rows);
            // console.log(results2.rows);
            res.render('profile', {
                layout : layout,
                signature: result.rows.length,
                sigImg: results2.rows[0].signature
            });
        });
    }).catch(function(err) {
        console.log(err);
        res.render('error', {
            err: true
        });
    });
});

app.get('/petition/profile/signatures', function(req, res) {
    db.query("SELECT * FROM petitioners").then(function(result){
        res.render('signature', {
            layout : layout,
            signatures: result.rows
        });
    });
});

app.get('/petition/error', function(req, res) {
    res.render('error', {
        layout : layout,
        error: true
    });
});

app.listen(8080, function(req, res) {
    console.log('!!!!');
});
