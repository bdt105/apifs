"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const serveurFileSystem_class_1 = require("./serveurFileSystem.class");
const myToolbox_1 = require("./myToolbox");
const dist_1 = require("bdt105connexion/dist");
let app = express();
let myToolbox = new myToolbox_1.MyToolbox();
let fileConfiguration = myToolbox.loadFromJsonFile("./fileConfiguration.json");
let configuration = myToolbox.loadFromJsonFile("./configuration.json");
configuration.originalFileInformation = fileConfiguration;
let port = configuration.common.port;
// For POST-Support
let bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow    
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Set to true if you need the website to include cookies in the requests sent, to the API (e.g. in case you use sessions)
    // Pass to next layer of middleware
    next();
});
// Only secret is needed bacause no token will be created here, only token check. Secret here must be the same as sender.
let jwtConfiguration = null;
if (configuration.authentification && configuration.authentification.active) {
    jwtConfiguration = new dist_1.JwtConfiguration(configuration.authentification.secret, "", "", "");
}
// No access to database only check if token is ok
var c = new dist_1.Connexion(null, jwtConfiguration);
let vm = new serveurFileSystem_class_1.ServeurFileSystem(app, c, configuration);
vm.assign();
app.listen(port);
myToolbox.logg("Listening port " + port.toString());
//# sourceMappingURL=server.js.map