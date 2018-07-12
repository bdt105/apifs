import express = require('express');
import { ServeurFileSystem } from './serveurFileSystem.class';
import { MyToolbox } from "./myToolbox";
import { Connexion, JwtConfiguration } from 'bdt105connexion/dist';

let app = express();
let myToolbox = new MyToolbox();
let configuration = myToolbox.loadFromJsonFile("./configuration.json");
let port = configuration.common.port;

// For POST-Support
let bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow    
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Set to true if you need the website to include cookies in the requests sent, to the API (e.g. in case you use sessions)
    // Pass to next layer of middleware
    next();
});


// Only secret is needed bacause no token will be created here, only token check. Secret here must be the same as sender.
let jwtConfiguration = new JwtConfiguration(configuration.authentification.secret, "", "", ""); 

// No access to database only check if token is ok
var c = new Connexion(null, jwtConfiguration);

let vm = new ServeurFileSystem(app, c);
vm.assign();

app.listen(port);

myToolbox.logg("Listening port " + port.toString());