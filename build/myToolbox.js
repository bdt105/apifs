"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bdt105toolbox/dist");
class Token {
    constructor(token, status, decoded) {
        this.token = token;
        this.status = status;
        this.decoded = decoded;
    }
}
Token.OK = "OK";
Token.ERR = "ERR";
exports.Token = Token;
class MyToolbox extends dist_1.Toolbox {
    constructor() {
        super();
    }
    logg(text) {
        if (this.configuration) {
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }
    checkJwt(token, secret) {
        var jwt = require('jsonwebtoken');
        try {
            var decoded = jwt.verify(token, secret);
            if (decoded.iduser) {
                this.log("User Id: " + decoded.iduser + ", login: " + decoded.login);
            }
            return new Token(token, Token.OK, decoded);
        }
        catch (err) {
            return new Token(token, Token.ERR, null);
        }
    }
}
exports.MyToolbox = MyToolbox;
//# sourceMappingURL=myToolbox.js.map