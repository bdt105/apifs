import { MyToolbox } from "./myToolbox";
import { Connexion } from 'bdt105connexion/dist';
import { isObject } from 'util';

export class UploadServer {
    private app: any;
    private connexion: Connexion;
    private myToolbox = new MyToolbox();
    private upload: any;

    private response: any;
    private enclosed = "|";
    private separator = ";";
    private lineSeparator = "##";
    private configuration: any;

    private uploadInfo: any = {};

    constructor(app: any, upload: any, connexion: Connexion, configuration: any) {
        this.app = app;
        this.connexion = connexion;
        this.upload = upload;
        this.configuration = configuration
    }

    protected logMessage(message: any) {
        if (this.configuration.common.logToConsole) {
            let owner = this.uploadInfo && this.uploadInfo.params && this.uploadInfo.params.owner ? this.uploadInfo.params.owner : "";
            if (isObject(message)) {
                console.log(JSON.stringify(message) + " --- " + owner);
            } else {
                console.log(message + " --- " + owner);
            }
        }
    }

    protected logError(error: any) {
        if (this.configuration.common.logToConsole) {
            let owner = this.uploadInfo && this.uploadInfo.params && this.uploadInfo.params.owner ? this.uploadInfo.params.owner : "";

            if (isObject(error)) {
                console.error(JSON.stringify(error) + " --- " + owner);
            } else {
                console.error(error + " --- " + owner);
            }
        }
    }

    protected errorMessage(text: string) {
        let ret = { "status": "ERR", "message": text };
        this.logError(ret);
        return ret;
    }

    protected respond(response: any, statusCode: number, data: any = null) {
        if (statusCode != 200) {
            this.logError(data);
        } else {
            this.logMessage(data);
        }
        response.status(statusCode);
        if (isObject(data)) {
            response.setHeader('content-type', 'application/json');
        } else {
            response.setHeader('content-type', 'test/plain');
        }
        response.send(JSON.stringify(data));
    }

    protected sendEmail(sendTo: string, subject: string, html: string) {
        var nodemailer = require('nodemailer')
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configuration.common.email,
                pass: this.configuration.common.password
            }
        });
        const mailOptions = {
            from: this.configuration.common.email, // sender address
            to: sendTo, // list of receivers
            subject: subject, // Subject line
            html: html // plain text body
        };
        transporter.sendMail(mailOptions, (error: any, info: any) => {
            if (error) {
                this.logError(error)
            } else {
                this.logMessage(info);
            }
        });
    }
    /*
        private importCsvToTable(fileName: string) {
            this.logMessage("Creation of table " + fileName);
    
            let sql = "CREATE TABLE `" + fileName + "`" +
                " (`iditem` int(11) NOT NULL, " +
                "`col` varchar(5) NOT NULL, " +
                "`row` int(11) NOT NULL, " +
                "`type` varchar(45) NOT NULL, " +
                "`value` varchar(500) DEFAULT NULL, " +
                "PRIMARY KEY (`iditem`), " +
                "KEY `value` (`value`), " +
                "KEY `type` (`type`), " +
                "KEY `col` (`col`), " +
                "KEY `row` (`row`) " +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8; ";
    
            let mysqlDirectory = this.configuration.mySql.fileDirectory;
    
            this.connexion.querySql(
                (error: any, data: any) => {
                    if (!error) {
                        let sql = "LOAD DATA INFILE '" + mysqlDirectory + fileName + ".csv' " +
                            "INTO TABLE `" + fileName + "` CHARACTER SET utf8 " +
                            "FIELDS TERMINATED BY '" + this.separator + "' " +
                            "ENCLOSED BY '" + this.enclosed + "' " +
                            "LINES TERMINATED BY '" + this.lineSeparator + "';"
                        this.connexion.querySql(
                            (error: any, data: any) => {
                                if (!error) {
                                    this.logMessage("Import terminated with success");
                                    let html = "Hello, a new file (" + this.uploadInfo.file.originalname + " - " + this.uploadInfo.body.title + ") is now available for you with: " + data.affectedRows +
                                        " row(s), take a look at " + this.configuration.common.siteUrl + "<br>Congrats.";
                                    this.sendEmail(this.uploadInfo.body.owner, "Import teminated", html);
                                    this.response.status(200);
                                    this.response.send(data);
                                } else {
                                    this.response.status(500);
                                    this.response.send(error);
                                }
                            }, sql)
                    } else {
                        this.response.status(500);
                        this.response.send(error);
                    }
                }, sql);
        }
    */

    private createAndImportTable(lines: any) {
        let headers = lines[this.uploadInfo.params.headerRowNumber];
        let head = Object.keys(headers);
        let dropTable = "DROP TABLE IF EXISTS `" + this.uploadInfo.file.tableName + "`";
        let createTable = "CREATE TABLE `" + this.uploadInfo.file.tableName + "` (`row` int(11), `type` varchar(10), `favorite` varchar(1)";
        for (var i = 0; i < head.length; i++) {
            createTable += ", `" + head[i] + "` varchar(300)"
        }
        createTable += ", PRIMARY KEY (`row`)) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";

        let rows = Object.keys(lines);
        var fs = require('fs');

        let mysqlDirectory = this.configuration.mySql.fileDirectory;

        if (fs.existsSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv')) {
            fs.unlinkSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv');
        }

        for (var r = 0; r < rows.length; r++) {
            var l = this.enclosed + rows[r] + this.enclosed + this.separator + // Row
                this.enclosed + (rows[r] == this.uploadInfo.params.headerRowNumber + "" ? "header" : "row") + this.enclosed + this.separator + // Favorite
                this.enclosed + "0" + this.enclosed; // favorite
            for (var c = 0; c < head.length; c++) {
                let value = lines[rows[r]][head[c]];
                l += this.separator + this.enclosed + (value ? value : "") + this.enclosed;
            }
                fs.appendFileSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv', l + this.lineSeparator);
        }

        this.connexion.querySql(
            (errorDrop: any, dataDrop: any) => {
                if (!errorDrop) {
                    this.connexion.querySql(
                        (error: any, data: any) => {
                            if (!error) {
                                let sql = "LOAD DATA INFILE '" + mysqlDirectory + this.uploadInfo.file.filename + ".csv' " +
                                    "INTO TABLE `" + this.uploadInfo.file.tableName + "` CHARACTER SET utf8 " +
                                    "FIELDS TERMINATED BY '" + this.separator + "' " +
                                    "ENCLOSED BY '" + this.enclosed + "' " +
                                    "LINES TERMINATED BY '" + this.lineSeparator + "';"
                                this.connexion.querySql(
                                    (error: any, data: any) => {
                                        if (!error) {
                                            this.uploadInfo.params.affectedRows = data.affectedRows;
                                            this.createConfigurationFile(
                                                (data: any) => {
                                                    if (data.insertId) {
                                                        this.uploadInfo.file.idfile = data.insertId;
                                                    } else {
                                                        this.uploadInfo.file.idfile = this.uploadInfo.file.idconfiguration;

                                                    }
                                                    this.logMessage("Import terminated with success");
                                                    let html = "Hello, a new file (" + this.uploadInfo.file.originalname + " - " +
                                                        this.uploadInfo.params.title + ") is now available for you with: " + this.uploadInfo.params.affectedRows +
                                                        " row(s), take a look at " + this.configuration.common.siteUrl + "<br>Congrats.";
                                                    this.sendEmail(this.uploadInfo.params.owner, "Import teminated", html);

                                                    if (fs.existsSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv')) {
                                                        fs.unlinkSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv');
                                                    }
                                                    this.respond(this.response, 200, this.uploadInfo);
                                                },
                                                (error: any) => {
                                                    this.respond(this.response, 500, error);
                                                },
                                            )
                                        } else {
                                            this.respond(this.response, 500, error);
                                        }
                                    }, sql)
                            } else {
                                this.respond(this.response, 500, error);
                            }
                        }, createTable)
                }
            }, dropTable);

        return createTable;
    }

    private parseExcel() {
        var fs = require('fs');
        var XLSX = require('xlsx');

        this.logMessage("Start Excel parsing" + this.uploadInfo.params.owner);
        let uploadDirectory = this.configuration.common.uploadDirectory + '/';

        var buf = fs.readFileSync(uploadDirectory + this.uploadInfo.file.filename);
        var wb = null;
        try {
            wb = XLSX.read(buf, { type: 'buffer' });
        } catch (error) {

        }
        this.logMessage("Excel parsing done");

        this.logMessage("Start Excel to csv process");
        if (wb) {
            let mySheet = wb.Sheets[this.uploadInfo.params.sheetName];
            if (!mySheet) {
                let first = Object.keys(wb.Sheets)[0];
                mySheet = wb.Sheets[first];
            }
            if (mySheet) {
                let id = 0;
                let ret: any = {};
                for (var key in mySheet) {
                    let column = key.replace(/[0-9]/g, '');
                    let row = Number.parseInt(key.replace(/[^0-9]/g, ''));
                    if (!Number.isNaN(row) && row >= this.uploadInfo.params.headerRowNumber) {
                        let l = this.enclosed + id.toString() + this.enclosed;
                        l += this.separator + this.enclosed + column + this.enclosed;
                        l += this.separator + this.enclosed + row + this.enclosed;
                        if (row == this.uploadInfo.params.headerRowNumber) {
                            l += this.separator + this.enclosed + 'header' + this.enclosed;
                        } else {
                            l += this.separator + this.enclosed + 'value' + this.enclosed;
                        }
                        l += this.separator + this.enclosed + this.myToolbox.escapeString(mySheet[key].w, true) + this.enclosed;
                        id += 1;
                        if (!ret[row]) {
                            ret[row] = [];
                        }
                        ret[row][column] = this.myToolbox.escapeString(mySheet[key].w, true);
                    }
                }
                if (this.uploadInfo.params.overwriteData == "true") {
                    this.connexion.querySql(
                        (error: any, data: any) => {
                            if (!error) {
                                if (data && data.length > 0) {
                                    this.uploadInfo.file.tableName = data[0].tableName;
                                    this.uploadInfo.file.idconfiguration = data[0].idconfiguration;
                                } else {
                                    this.uploadInfo.file.tableName = this.uploadInfo.file.filename;
                                }
                                this.createAndImportTable(ret);
                            } else {
                                console.error(error);
                            }
                        }, "select idconfiguration, tableName from configuration where owner='" + this.uploadInfo.params.owner + "' and fileName='" + this.uploadInfo.file.originalname + "'")
                } else {
                    this.uploadInfo.file.tableName = this.uploadInfo.file.filename;
                    this.createAndImportTable(ret);
                }
            } else {
                this.respond(this.response, 415, { "message": "Sheet not found" });
                this.logMessage("Sheet not found");
            }
        } else {
            this.respond(this.response, 415, { "message": "Error parsing Excel file" });
            this.logMessage("Error parsing Excel file");
        }
        this.logMessage("End Excel to csv process");

    }

    /*    
        private parseExcel(fileName: string, fileId: number, sheetName: string, rowStartCount: number) {
            var fs = require('fs');
            var XLSX = require('xlsx');
            this.logMessage("Start Excel parsing");
    
            let uploadDirectory = this.configuration.common.uploadDirectory + '/';
    
            var buf = fs.readFileSync(uploadDirectory + fileName);
            var wb = null;
            try {
                wb = XLSX.read(buf, { type: 'buffer' });
            } catch (error) {
    
            }
            this.logMessage("Excel parsing done");
    
            this.logMessage("Start Excel to csv process");
            if (wb) {
                let mySheet = wb.Sheets[sheetName];
                if (mySheet) {
                    let id = 0;
                    let ret: any = {};
                    for (var key in mySheet) {
                        let column = key.replace(/[0-9]/g, '');
                        let row = Number.parseInt(key.replace(/[^0-9]/g, ''));
                        if (!Number.isNaN(row) && row >= rowStartCount) {
                            let l = this.enclosed + id.toString() + this.enclosed;
                            l += this.separator + this.enclosed + column + this.enclosed;
                            l += this.separator + this.enclosed + row + this.enclosed;
                            if (row == rowStartCount) {
                                l += this.separator + this.enclosed + 'header' + this.enclosed;
                            } else {
                                l += this.separator + this.enclosed + 'value' + this.enclosed;
                            }
                            l += this.separator + this.enclosed + this.myToolbox.escapeString(mySheet[key].w, true) + this.enclosed;
                            id += 1;
                            if (!ret[row]) {
                                ret[row] = [];
                            }
                            ret[row][column] = this.myToolbox.escapeString(mySheet[key].w, true);
                        }
                    }
                    this.createAndImportTable(ret, rowStartCount, fileName, fileId);
                } else {
                    this.respond(this.response, 415, { "message": "Sheet not found" });
                    this.logMessage("Sheet not found");
                }
            } else {
                this.respond(this.response, 415, { "message": "Error parsing Excel file" });
                this.logMessage("Error parsing Excel file");
            }
            this.logMessage("End Excel to csv process");
    
        }
    */
    private deleteFiles(tableName: string) {
        let mysqlDirectory = this.configuration.mySql.fileDirectory;

        var fs = require('fs');

        if (fs.existsSync(mysqlDirectory + tableName + '.csv')) {
            fs.unlinkSync(mysqlDirectory + tableName + '.csv');
            this.logMessage("File deleted: " + mysqlDirectory + tableName + '.csv')
        }
    }

    /*
    private clearUndefined(data: string){
        return data == undefined ? "" : data;
    }
    */

    private createConfigurationFile(callbackSuccess: Function, callbackFailure: Function) {
        let sql = "insert into configuration (fileName, tableName, headerRowNumber, owner) values (" +
            "'" + this.uploadInfo.file.originalname + "', '" + this.uploadInfo.file.filename + "', " +
            this.uploadInfo.params.headerRowNumber + ", '" + this.uploadInfo.params.owner + "')";
        if (this.uploadInfo.params.overwriteData && this.uploadInfo.file.idconfiguration) {
            // To update de modificationDate
            sql = "update configuration set idconfiguration=" + this.uploadInfo.file.idconfiguration + " where idconfiguration=" + this.uploadInfo.file.idconfiguration;
        }
/* Backup
        let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent, keyColumn) values (" +
            "'" + this.uploadInfo.file.originalname + "', '" + this.uploadInfo.file.filename + "', '" + this.clearUndefined(this.uploadInfo.params.importantColumns) + "', " +
            this.uploadInfo.params.headerRowNumber + ", '" + this.clearUndefined(this.uploadInfo.params.title) + "', '" + this.uploadInfo.params.owner + "', 0,'" +
            this.clearUndefined(this.uploadInfo.params.keyColumn) + "')";
        if (this.uploadInfo.params.overwriteData && this.uploadInfo.file.idconfiguration) {
            sql = "update configuration set importantColumns='" + this.clearUndefined(this.uploadInfo.params.importantColumns) + "'" +
                ", headerRowNumber=" + this.uploadInfo.params.headerRowNumber + 
                ", keyColumn='" + this.clearUndefined(this.uploadInfo.params.keyColumn) + "'"
                ", title='" + this.clearUndefined(this.uploadInfo.params.title) + "' " +
                "where idconfiguration=" + this.uploadInfo.file.idconfiguration;
        }
*/
        this.logMessage("Adding the configuration data");

        this.connexion.connectSql();

        this.connexion.querySqlWithoutConnexion(
            (error: any, data: any) => {
                if (data) {
                    this.connexion.releaseSql();
                    this.logMessage("Configuration data created");
                    callbackSuccess(data);
                } else {
                    callbackFailure(error);
                }
            }, sql);
    }

    public assign() {
        this.app.get('/', (request: any, response: any) => {
            response.send('API Serveur Upload is running');
        });

        this.app.post('/uploadFile', this.upload.single('file'), (req: any, res: any) => {
            console.log("uploadFile");
            let token = req.body.token;
            this.uploadInfo = req;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.uploadInfo = {};
            this.uploadInfo.params = req.body;
            this.uploadInfo.file = req.file;
            this.response = res;
            var fs = require('fs');
            let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory;
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory);
                this.logMessage("Upload directory created");
            }
            this.parseExcel();
        });

        this.app.post('/uploadData', this.upload.array(), (req: any, res: any) => {
            console.log("uploadData");
            let token = req.body.token;
            let data = req.body.data;

            this.uploadInfo = req;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }

            this.uploadInfo = {};
            this.uploadInfo.params = req.body;
            this.uploadInfo.file = req.file;
            this.response = res;
            var fs = require('fs');
            let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory;
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory);
                this.logMessage("Upload directory created");
            }
            this.parseExcel();
        });

        this.app.post('/uploadImage', this.upload.single('file'), (req: any, res: any) => {
            console.log("uploadImage");
            let token = req.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.response = res;
            var fs = require('fs');
            let imageDirectory = this.configuration.common.imageDirectory;
            let imageUrlDirectory = this.configuration.common.imageUrlDirectory;

            fs.renameSync(req.file.destination + req.file.filename, imageDirectory + req.file.filename);
            let mes = { "status": "ok", "imageUrl": imageUrlDirectory + req.file.filename, "imageFileName": req.file.filename };
            this.respond(res, 200, mes);
        });

        this.app.delete('/deleteImage', this.upload.array(), (request: any, response: any) => {
            let token = request.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(response, 403, 'Token is absent or invalid');
                    return;
                }
            }
            let imageFileName = request.body.imageFileName;
            var fs = require('fs');
            let imageDirectory = this.configuration.common.imageDirectory;

            if (fs.existsSync(imageDirectory + imageFileName)) {
                let r = fs.unlinkSync(imageDirectory + imageFileName);
            }
            this.respond(response, 200, { "status": "ok" });
        });

        this.app.delete('/delete', this.upload.array(), (request: any, response: any) => {
            let token = request.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(response, 403, 'Token is absent or invalid');
                    return;
                }
            }

            this.logMessage("Deleting the configuration data");
            let sql = "delete from table configuration where tableName = '" + request.body.tableName + "';";
            if (request.deleteItemPlus) {
                sql += "delete from table itemplus where tableName = '" + request.body.tableName + "';";
            }
            sql += "DROP TABLE IF EXISTS `" + request.body.tableName + "`;"

            this.connexion.connectSql();

            this.connexion.querySqlWithoutConnexion(
                (error: any, data: any) => {
                    if (!error) {
                        this.connexion.releaseSql();
                        this.logMessage("Configuration data deleted: " + request.body.tableName);
                        this.deleteFiles(request.body.tableName);
                    } else {
                        this.response.status(500);
                        this.response.send(error);
                    }
                }, sql);
        });
    }
}