var express = require('express');
var hb  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
// var session = require('express-session');
// var RedisStore = require('connect-redis')(session);
// var pg = require('pg');
// var redis = require("redis");
var checkPass = require('./checkPass');
var hashPassword = checkPass.hashPassword;
var checkPassword = checkPass.checkPassword;
// var csurf = require('csurf');
// var csrfProtection = csrf({ cookie: true })

app.use(cookieSession({
    secret: 'a really hard to guess secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));
app.use(cookieParser());
// app.use(csrfProtection);
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false}));
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.get('/register', function(req, res) {
    res.render('register',{
        layout: 'layout',
        // csrfToken: req.csrfToken(),
        register : 'register'
    });
});

app.post('/register', function(req, res) {
    if (req.body.firstname && req.body.lastname && req.body.email && req.body.password) {
        hashPassword(req.body.password).then(function(hash){
            return db.query("INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
          [req.body.firstname, req.body.lastname, req.body.email, hash]).then(function(result){
              req.session.user = {
                  email :req.body.email,
                  name : req.body.firstname + ' ' + req.body.lastname,
                  id : result.rows[0].id
              };

              if (req.session.user) {
                  res.redirect('/register/info');
              }
          });
        }).catch(function(err){
            console.log(err);
            res.render('register', {
                layout : 'layout',
                error : 'User with this email already exists!'
            });
        });
    }
});

app.get('/register/info', function(req, res) {
    res.render('optional-info',{
        layout: 'layout',
    });
});

app.post('/register/info', function(req, res) {
    db.query("INSERT INTO user_profiles(user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING id",
    [req.session.user.id, req.body.age, req.body.city, req.body.url]).then(function(result){
        res.redirect('/petition');
    }).catch(function(err){
        console.log(err);
    });
});

app.get('/login', function(req, res) {
    res.render('login', {
        layout : 'layout'
    });
});

app.post('/login', function(req, res) {
    if (req.body.email && req.body.password){
        db.query("SELECT users.first_name, users.last_name, users.id, petitioners.id as sign_id, password FROM users LEFT JOIN petitioners ON petitioners.user_id = users.id WHERE email = $1",
        [req.body.email]).then(function(result){
            checkPassword(req.body.password, result.rows[0].password).then(function(doesMatch){
                if(doesMatch){
                    console.log('match!');
                    req.session.user = {
                        name : result.rows[0].first_name + ' ' + result.rows[0].last_name,
                        email : req.body.email,
                        password : result.rows[0].password,
                        id : result.rows[0].id,
                        signId : result.rows[0].sign_id
                    };
                    console.log(req.session.user);
                    res.redirect('/petition');
                } else {
                    console.log('No match');
                    res.render('login', {
                        layout : 'layout',
                    });
                }
            });

        });
    }
});


app.get('/logout', function(req, res) {
    req.session = null;
    res.redirect('/login');
});


app.get('/petition', function(req, res) {
    console.log(req.session);
    if (!req.session.user){
        res.redirect('/login');
        return;
    } else if (req.session.user.signId) {
        res.redirect('/petition/profile');
        return;
    } else {
        res.render('index', {
            name : req.session.user.name,
            layout : 'layout'
        });
    }
});

app.post('/petition', function(req, res) {
    if (!req.session.user){
        res.redirect('/petition');
        return;
    }

    if (req.body.signature) {
        db.query("INSERT INTO petitioners(signature, user_id) VALUES ($1, $2) RETURNING id",
        [req.body.signature, req.session.user.id]).then(function(result){
            req.session.user.signId = result.rows[0].id;
            console.log(result);
            res.redirect('/petition/profile');
        }).catch(function(err){
            console.log(err);
            res.render('error', {
                layout : 'layout',
                error: true
            });
        });

    } else {
        res.render('error', {
            layout : 'layout',
            error: true
        });
    }
});

app.get('/petition/profile', function(req, res) {
    console.log(req.session.user);
    if(!req.session.user) {
        res.redirect('/login');
        return;
    }

    if (!req.session.user.signId){
        res.redirect('/petition');
        return;
    }
    db.query("SELECT * FROM petitioners").then(function(result){
        return db.query('SELECT * FROM petitioners WHERE id = $1', [req.session.user.signId]).then(function(results2) {
            // console.log(result.rows);
            // console.log(results2.rows);
            res.render('profile', {
                layout : 'layout',
                signature: result.rows.length,
                sigImg: results2.rows[0].signature,
                name: req.session.user.name
            });
        });
    }).catch(function(err) {
        console.log(err);
        res.render('error', {
            layout : 'layout',
            err: true
        });
    });
});

app.get('/petition/profile/signatures', function(req, res) {
    db.query("SELECT * FROM petitioners LEFT JOIN user_profiles ON user_profiles.user_id = petitioners.user_id LEFT JOIN users ON users.id = petitioners.user_id").then(function(result){
        console.log(result.rows);
        res.render('signature', {
            layout : 'layout',
            signatures: result.rows
        });
    });
});

app.get('/petition/profile/signatures/:city', function(req, res) {
    var city = req.params.city;
    db.query("SELECT * FROM petitioners LEFT JOIN user_profiles ON user_profiles.user_id = petitioners.user_id LEFT JOIN users ON users.id = petitioners.user_id WHERE city =$1 ", [city])
    .then(function(result){
        res.render('signature', {
            layout : 'layout',
            signatures: result.rows,
            city : req.body.city
        });
    });
});

app.get('/petition/error', function(req, res) {
    res.render('error', {
        layout : 'layout',
        error: true
    });
});

app.get('/petition/profile/edit', function(req, res) {
    db.query("SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = $1",
    [req.session.user.id]).then(function(result){
        console.log(result);
        res.render('edit', {
            layout : 'layout',
            firstname: result.rows[0].first_name,
            lastname: result.rows[0].last_name,
            email: result.rows[0].email,
            password: result.rows[0].password,
            city: result.rows[0].city,
            age: result.rows[0].age,
            url: result.rows[0].url
        });
    }).catch(function(err){
        console.log(req.session.user.id);
        console.log(err);
    });
});

app.post('/petition/profile/edit', function(req, res) {
    if (req.body.firstname || req.body.lastname || req.body.email || req.body.password || req.body.age || req.body.city || req.body.url ) {
        hashPassword(req.body.password).then(function(hash){
            return db.query("UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5",
            [req.body.firstname || null, req.body.lastname || null, req.body.email || null, hash, req.session.user.id]).then(function(result){
                db.query("INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURN id",
                [req.session.user.id, req.body.age, req.body.city, req.body.url]).then(function(data){
                    req.session.user = {
                        firstname: result.rows[0].first_name,
                        lastname: result.rows[0].last_name,
                        email: result.rows[0].email,
                        city: data.rows[0].city,
                        age: data.rows[0].age,
                        url: data.rows[0].url
                    };
                });
            });
        }).catch(function(err) {
            console.log(err);
            db.query("UPDATE * FROM SET user_profiles (age, city, url) VALUES ($1, $2, $3)", [req.body.age, req.body.city, req.body.url]).then(function(data){
                req.session.user = {
                    city: data.rows[0].city,
                    age: data.rows[0].age,
                    url: data.rows[0].url
                };
            });
        });
        res.redirect('/petition/profile');
    }

});


app.listen(8080, function(req, res) {
    console.log('!!!!');
});
