var express = require('express');
var hb  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var checkPass = require('./checkPass');
var hashPassword = checkPass.hashPassword;
var checkPassword = checkPass.checkPassword;
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

app.use(cookieSession({
    secret: 'a really hard to guess secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(cookieParser());
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false}));
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(csrfProtection);

app.use(function(req, res, next) {
    if (req.url != '/register' && req.url != '/login') {
        if (!req.session.user) {
            res.redirect('/register');
        } else {
            next();
        }
    } else {
        next();
    }
});


String.prototype.capitalize = function() {
    return this.split(" ").map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(" ");
};


function requireNotLoggedIn(req, res, next) {
    if (req.session.user) {
        res.redirect('/petition');
    } else {
        next();
    }
}

app.use(function(err, req, res, next){
    console.log(err);
    console.log(req.body);
});

app.get('/register', requireNotLoggedIn, function(req, res) {
    res.render('register',{
        layout: 'layout',
        csrfToken: req.csrfToken()
    });
});

app.post('/register', requireNotLoggedIn, function(req, res) {
    req.body.firstname = req.body.firstname.capitalize();
    req.body.lastname = req.body.lastname.capitalize();
    if (req.body.firstname && req.body.lastname && req.body.email && req.body.password) {
        hashPassword(req.body.password).then(function(hash){
            return db.query("INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
            [req.body.firstname, req.body.lastname, req.body.email, hash])
            .then(function(result){
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
                csrfToken: req.csrfToken(),
                error : 'User with this email already exists!'
            });
        });
    }
});

app.get('/login', requireNotLoggedIn, function(req, res) {
    res.render('login', {
        layout : 'layout',
        csrfToken: req.csrfToken()
    });
});

app.post('/login', requireNotLoggedIn, function(req, res) {
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
                        error : 'The email address or password is invalid.',
                        csrfToken: req.csrfToken()
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

app.get('/register/info', function(req, res) {
    res.render('optional-info',{
        layout: 'layout',
        csrfToken: req.csrfToken()
    });
});

app.post('/register/info', function(req, res) {
    db.query("INSERT INTO user_profiles(user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING id",
    [req.session.user.id, req.body.age || null, req.body.city, req.body.url]).then(function(result){
        res.redirect('/petition');
    }).catch(function(err){
        console.log(err);
        res.render('optional-info');
    });
});

app.get('/petition', function(req, res) {
    if (!req.session.user){
        res.redirect('/login');
        return;
    } else if (req.session.user.signId) {
        res.redirect('/petition/signed');
        return;
    } else {
        res.render('index', {
            name : req.session.user.name,
            layout : 'layout',
            csrfToken: req.csrfToken()
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
        [req.body.signature, req.session.user.id])
        .then(function(result){
            req.session.user.signId = result.rows[0].id;
            console.log(result);
            res.redirect('/petition/signed');
        }).catch(function(err){
            console.log(err);
            res.render('error', {
                layout : 'layout',
                csrfToken: req.csrfToken(),
                error: true
            });
        });

    } else {
        res.render('error', {
            layout : 'layout',
            csrfToken: req.csrfToken(),
            error: true
        });
    }
});

app.get('/petition/signed', function(req, res) {
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
        return db.query('SELECT * FROM petitioners WHERE id = $1', [req.session.user.signId])
        .then(function(results2) {
            // console.log(result.rows);
            // console.log(results2.rows);
            res.render('profile', {
                layout : 'layout',
                csrfToken: req.csrfToken(),
                signature: result.rows.length,
                sigImg: results2.rows[0].signature,
                name: req.session.user.name
            });
        });
    }).catch(function(err) {
        console.log(err);
        res.render('error', {
            layout : 'layout',
            csrfToken: req.csrfToken(),
            err: true
        });
    });
});

app.get('/petition/signed/signatures', function(req, res) {
    db.query("SELECT * FROM petitioners LEFT JOIN user_profiles ON user_profiles.user_id = petitioners.user_id LEFT JOIN users ON users.id = petitioners.user_id")
    .then(function(result){
        console.log(result.rows);
        res.render('signature', {
            layout : 'layout',
            csrfToken: req.csrfToken(),
            signatures: result.rows
        });
    });
});

app.get('/petition/signed/signatures/:city', function(req, res) {
    var city = req.params.city.capitalize();
    db.query("SELECT * FROM petitioners LEFT JOIN user_profiles ON user_profiles.user_id = petitioners.user_id LEFT JOIN users ON users.id = petitioners.user_id WHERE city =$1 ",
    [city]).then(function(result){
        res.render('signature', {
            layout : 'layout',
            csrfToken: req.csrfToken(),
            signatures: result.rows,
            city : req.body.city
        });
    });
});

app.get('/petition/error', function(req, res) {
    res.render('error', {
        layout : 'layout',
        csrfToken: req.csrfToken(),
        error: true
    });
});

app.post('/petition/delete', function(req, res){
    console.log("hey");
    db.query("DELETE FROM petitioners WHERE id = $1",[req.session.user.signId]).then(function(){
        req.session.user.signId = null;
        res.redirect('/petition');
    }).catch(function(err){
        console.log(err);
        res.render('/petition/signed');
    });
});

app.get('/profile/edit', function(req, res) {
    db.query("SELECT * FROM users LEFT JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id = $1",
    [req.session.user.id]).then(function(result){
        console.log(result);
        res.render('edit', {
            layout : 'layout',
            csrfToken: req.csrfToken(),
            firstname: result.rows[0].first_name,
            lastname: result.rows[0].last_name,
            email: result.rows[0].email,
            password: result.rows[0].password,
            city: result.rows[0].city,
            age: result.rows[0].age,
            url: result.rows[0].url
        });
    }).catch(function(err){
        // console.log(req.session.user.id);
        console.log(err);
        res.render('edit');
    });
});

app.post('/profile/edit',function(req, res) {
    var usersTablePromis;
    var profileTablesPromise;

    if (req.body.password) {
        usersTablePromis = hashPassword(req.body.password).then(function(hash){
            return db.query("UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5",
            [req.body.firstname || null, req.body.lastname || null, req.body.email || null, hash, req.session.user.id]);
        });
    } else {
        usersTablePromis = db.query("UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4",
        [req.body.firstname || null, req.body.lastname || null, req.body.email || null, req.session.user.id]);
    }

    profileTablesPromise = db.query("INSERT INTO user_profiles (user_id, age, city, url)  VALUES ($1, $2, $3, $4)",
    [req.session.user.id, req.body.age || null, req.body.city, req.body.url]).catch(function(err){
        return db.query("UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4",
        [req.body.age || null , req.body.city, req.body.url, req.session.user.id]);
    }).catch(function(err){
        console.log(err);
        res.render('edit');
    });
    Promise.all([usersTablePromis, profileTablesPromise]).then(function(result){
        req.session.user.name = req.body.firstname + ' ' + req.body.lastname;
        req.session.user.email = req.body.email;
        req.session.user.age = req.body.age;
        req.session.user.city = req.body.city;
        req.session.user.url = req.body.url;
        res.redirect('/petition');
    }).catch(function(err){
            console.log(err);
            res.render('edit', {
                layout : 'layout',
                csrfToken: req.csrfToken(),
                error : 'Please complete all the required fields!',
                firstname:req.body.first_name,
                lastname: req.body.last_name,
                email: req.body.email,
                password: req.body.password,
                city: req.body.city,
                age: req.body.age,
                url: req.body.url
        });

    });
});

app.listen(8080, function() {
    console.log('!!!!');
});
