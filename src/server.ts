import express = require('express');
import { ServeurFileSystem } from './serveurFileSystem.class';
import { MyToolbox } from "./myToolbox";

let app = express();
let myToolbox = new MyToolbox();
let configuration = myToolbox.loadFromJsonFile("./configuration.json");
let port = configuration.common.port;

// For POST-Support
let bodyParser = require('body-parser');
let multer = require('multer');
let upload = multer();

app.use(bodyParser());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow    
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Set to true if you need the website to include cookies in the requests sent, to the API (e.g. in case you use sessions)
    // Pass to next layer of middleware
    next();
});

let vm = new ServeurFileSystem(app);
vm.assign();

app.listen(port);