"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bdt105toolbox/dist");
const dist_2 = require("bdt105connexion/dist");
class MyToolbox extends dist_1.Toolbox {
    constructor() {
        super();
    }
    loadConfiguration() {
        let fileConfiguration = this.loadFromJsonFile("./fileConfiguration.json");
        this.configuration = this.loadFromJsonFile("./configuration.json");
        this.configuration.originalFileInformation = fileConfiguration;
    }
    logg(text) {
        if (this.configuration) {
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }
    getConfiguration() {
        if (!this.configuration) {
            this.loadConfiguration();
        }
        return this.configuration;
    }
    checkJwt(token, secret) {
        var jwt = require('jsonwebtoken');
        try {
            var decoded = jwt.verify(token, secret);
            if (decoded.iduser) {
                this.log("User Id: " + decoded.iduser + ", login: " + decoded.login);
            }
            return new dist_2.Token(token, dist_2.Connexion.jwtStatusOk, decoded);
        }
        catch (err) {
            return new dist_2.Token(token, dist_2.Connexion.jwtStatusERR, null);
        }
    }
    getFileOriginalInformation(fileName, directory) {
        let ret = {};
        if (this.getConfiguration().originalFileInformation) {
            for (var i = 0; i < this.getConfiguration().originalFileInformation.length; i++) {
                if (this.getConfiguration().originalFileInformation[i].directory == directory &&
                    this.getConfiguration().originalFileInformation[i].fileName == fileName) {
                    ret = this.getConfiguration().originalFileInformation[i];
                }
            }
        }
        return ret;
    }
    isUserAllowed(email) {
        let allowedUsers = this.configuration.allowedUsers;
        let temp = this.filterArrayOfObjects(allowedUsers, "email", email, false, false, true, false);
        return temp.length > 0;
    }
    errorMessage(text) {
        return { "status": "ERR", "message": text };
    }
    message(text) {
        return { "status": "OK", "message": text };
    }
    checkToken(connexion, token, response) {
        if (connexion.jwtConfiguration && !connexion.isTokenValid(token)) {
            response.status(403);
            response.send(JSON.stringify(this.errorMessage("Invalid token or user not allowed")));
            return false;
        }
        else {
            let tok = connexion.checkJwt(token);
            if (tok.decoded) {
                if (!this.isUserAllowed(tok.decoded.email)) {
                    response.status(403);
                    response.send(JSON.stringify(this.errorMessage("Invalid token or user not allowed")));
                    return false;
                }
            }
        }
        return true;
    }
}
exports.MyToolbox = MyToolbox;
//# sourceMappingURL=myToolbox.js.map