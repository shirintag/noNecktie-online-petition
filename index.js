var express = require('express');
var hb  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db');
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
        db.query("INSERT INTO signatures(first_name, last_name, signature) VALUES ($1, $2, $3)",
        [req.body.firstname, req.body.lastname, req.body.signature]).then(function(result){
            console.log(result);
        }).catch(function(e) {
            console.log(e); // This is never called
        });
    }
});

app.listen(8080, function(req, res) {
    console.log('!!!!');
});
