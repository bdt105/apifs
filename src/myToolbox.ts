import { Toolbox } from "bdt105toolbox/dist";
import { Connexion, Token } from 'bdt105connexion/dist';

export class MyToolbox extends Toolbox {
    private configuration: any;

    constructor() {
        super();
    }

    private loadConfiguration(){
        let fileConfiguration = this.loadFromJsonFile("./fileConfiguration.json");
        this.configuration = this.loadFromJsonFile("./configuration.json");
        this.configuration.originalFileInformation = fileConfiguration;
    }

    logg(text: string) {
        if (this.configuration) {
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }

    getConfiguration(){
        if (!this.configuration){
            this.loadConfiguration();
        }
        return this.configuration;
    }

    checkJwt(token: string, secret: string): Token {
        var jwt = require('jsonwebtoken');
        try {
            var decoded = jwt.verify(token, secret);
            if (decoded.iduser) {
                this.log("User Id: " + decoded.iduser + ", login: " + decoded.login);
            }
            return new Token(token, Connexion.jwtStatusOk, decoded);
        } catch (err) {
            return new Token(token, Connexion.jwtStatusERR, null);
        }
    }

    getFileOriginalInformation(fileName: string, directory: string) {
        let ret: any = {};
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
    
    isUserAllowed(email: string) {
        let allowedUsers = this.configuration.allowedUsers
        let temp = this.filterArrayOfObjects(allowedUsers, "email", email, false, false, true, false);
        return temp.length > 0;
    }

    errorMessage(text: string) {
        return { "status": "ERR", "message": text };
    }

    message(text: string) {
        return { "status": "OK", "message": text };
    }


    checkToken(connexion: Connexion, token: any, response: any) {
        if (connexion.jwtConfiguration && !connexion.isTokenValid(token)) {
            response.status(403);
            response.send(JSON.stringify(this.errorMessage("Invalid token or user not allowed")));
            return false;
        } else {
            let tok: Token = connexion.checkJwt(token);
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