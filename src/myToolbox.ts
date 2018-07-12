import { Toolbox } from "bdt105toolbox/dist";

export class Token {
    public token: string;
    public status: string;
    public decoded: string;

    public static readonly OK = "OK";
    public static readonly ERR = "ERR";

    constructor(token: string, status: string, decoded: string) {
        this.token = token;
        this.status = status;
        this.decoded = decoded;
    }
}

export class MyToolbox extends Toolbox {
    private configuration: any;
    private toolbox: Toolbox;

    constructor() {
        super();
    }

    logg(text: string) {
        if (this.configuration) {
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }

    checkJwt(token: string, secret: string): Token {
        var jwt = require('jsonwebtoken');
        try {
            var decoded = jwt.verify(token, secret);
            if (decoded.iduser) {
                this.log("User Id: " + decoded.iduser + ", login: " + decoded.login);
            }
            return new Token(token, Token.OK, decoded);
        } catch (err) {
            return new Token(token, Token.ERR, null);
        }
    }
}