var express = require('express');
var hb  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var session = require('express-session');
var bcrypt = require('bcrypt');
var RedisStore = require('connect-redis')(session);
var csurf = require('csurf');
var pg = require('pg');
var redis = require("redis");

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

app.get('/petition', function(req, res) {
    res.render('index');
});

app.post('/petition', function(req, res) {
    if (req.body.firstname && req.body.lastname && req.body.signature) {
        db.query("INSERT INTO petitioners(firs_name, last_name, signatures) VALUES ($1, $2, $3) RETURNING id",
        [req.body.firstname, req.body.lastname, req.body.signature]).then(function(result){
            console.log(result);
            res.redirect('/petition/profile');
        }).catch(function(err){
            console.log(err);
            res.render('error', {
                error: true
            });
        });

    } else {
        res.render('error', {
            error: true
        });
    }
});

app.get('/petition/profile', function(req, res) {
    db.query("SELECT * FROM petitioners").then(function(result){
        return db.query('SELECT * FROM signatures WHERE id = $1', [req.session.signatureId]).anthen(function(results2) {
            res.render('profile', {
                signature: result.rows.length
                sigImg: results2.rows[0].signature
            })
        })
    });
    console.log(result);
}).catch(function(err) {
        console.log(err);
        res.render('error', {
            error: true
        });
    });
});

app.get('/petition/profile/signatures', function(req, res) {
    db.query("SELECT * FROM petitioners").then(function(result){
        res.render('signature', {
            signatures: result.rows
        });
    });
});

app.get('/petition/error', function(req, res) {
    res.render('error', {
        error: true
    });
});

app.listen(8080, function(req, res) {
    console.log('!!!!');
});
