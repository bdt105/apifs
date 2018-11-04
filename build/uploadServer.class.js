"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
const util_1 = require("util");
class UploadServer {
    constructor(app, upload, connexion, configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.enclosed = "|";
        this.separator = ";";
        this.lineSeparator = "##";
        this.uploadInfo = {};
        this.app = app;
        this.connexion = connexion;
        this.upload = upload;
        this.configuration = configuration;
    }
    logMessage(message) {
        if (this.configuration.common.logToConsole) {
            if (util_1.isObject(message)) {
                console.log(JSON.stringify(message));
            }
            else {
                console.log(message);
            }
        }
    }
    logError(error) {
        if (this.configuration.common.logToConsole) {
            if (util_1.isObject(error)) {
                console.error(JSON.stringify(error));
            }
            else {
                console.error(error);
            }
        }
    }
    errorMessage(text) {
        let ret = { "status": "ERR", "message": text };
        this.logError(ret);
        return ret;
    }
    respond(response, statusCode, data = null) {
        if (statusCode != 200) {
            this.logError(data);
        }
        else {
            this.logMessage(data);
        }
        response.status(statusCode);
        if (util_1.isObject(data)) {
            response.setHeader('content-type', 'application/json');
        }
        else {
            response.setHeader('content-type', 'test/plain');
        }
        response.send(JSON.stringify(data));
    }
    sendEmail(sendTo, subject, html) {
        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configuration.common.email,
                pass: this.configuration.common.password
            }
        });
        const mailOptions = {
            from: this.configuration.common.email,
            to: sendTo,
            subject: subject,
            html: html // plain text body
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                this.logError(error);
            }
            else {
                this.logMessage(info);
            }
        });
    }
    /*
        private importCsvToTable(fileName: string) {
            this.myToolbox.log("Creation of table " + fileName);
    
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
                                    this.myToolbox.log("Import terminated with success");
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
    createAndImportTable(lines) {
        let headers = lines[this.uploadInfo.params.headerRowNumber];
        let head = Object.keys(headers);
        let create = "CREATE TABLE `" + this.uploadInfo.file.filename + "` (`row` int(11), `type` varchar(10), `favorite` varchar(1)";
        for (var i = 0; i < head.length; i++) {
            create += ", `" + head[i] + "` varchar(300)";
        }
        create += ", PRIMARY KEY (`row`)) ENGINE=InnoDB DEFAULT CHARSET=utf8; ";
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
        this.connexion.querySql((error, data) => {
            if (!error) {
                let sql = "LOAD DATA INFILE '" + mysqlDirectory + this.uploadInfo.file.filename + ".csv' " +
                    "INTO TABLE `" + this.uploadInfo.file.filename + "` CHARACTER SET utf8 " +
                    "FIELDS TERMINATED BY '" + this.separator + "' " +
                    "ENCLOSED BY '" + this.enclosed + "' " +
                    "LINES TERMINATED BY '" + this.lineSeparator + "';";
                this.connexion.querySql((error, data) => {
                    if (!error) {
                        this.uploadInfo.params.affectedRows = data.affectedRows;
                        this.createConfigurationFile((data) => {
                            this.uploadInfo.file.idfile = data.insertId;
                            this.myToolbox.log("Import terminated with success");
                            let html = "Hello, a new file (" + this.uploadInfo.file.originalname + " - " +
                                this.uploadInfo.params.title + ") is now available for you with: " + this.uploadInfo.params.affectedRows +
                                " row(s), take a look at " + this.configuration.common.siteUrl + "<br>Congrats.";
                            this.sendEmail(this.uploadInfo.params.owner, "Import teminated", html);
                            if (fs.existsSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv')) {
                                fs.unlinkSync(mysqlDirectory + this.uploadInfo.file.filename + '.csv');
                            }
                            this.respond(this.response, 200, this.uploadInfo);
                        }, (error) => {
                            this.respond(this.response, 500, error);
                        });
                    }
                    else {
                        this.respond(this.response, 500, error);
                    }
                }, sql);
            }
            else {
                this.respond(this.response, 500, error);
            }
        }, create);
        return create;
    }
    parseExcel() {
        var fs = require('fs');
        var XLSX = require('xlsx');
        this.myToolbox.log("Start Excel parsing");
        let uploadDirectory = this.configuration.common.uploadDirectory + '/';
        var buf = fs.readFileSync(uploadDirectory + this.uploadInfo.file.filename);
        var wb = null;
        try {
            wb = XLSX.read(buf, { type: 'buffer' });
        }
        catch (error) {
        }
        this.myToolbox.log("Excel parsing done");
        this.myToolbox.log("Start Excel to csv process");
        if (wb) {
            let mySheet = wb.Sheets[this.uploadInfo.params.sheetName];
            if (mySheet) {
                let id = 0;
                let ret = {};
                for (var key in mySheet) {
                    let column = key.replace(/[0-9]/g, '');
                    let row = Number.parseInt(key.replace(/[^0-9]/g, ''));
                    if (!Number.isNaN(row) && row >= this.uploadInfo.params.headerRowNumber) {
                        let l = this.enclosed + id.toString() + this.enclosed;
                        l += this.separator + this.enclosed + column + this.enclosed;
                        l += this.separator + this.enclosed + row + this.enclosed;
                        if (row == this.uploadInfo.params.headerRowNumber) {
                            l += this.separator + this.enclosed + 'header' + this.enclosed;
                        }
                        else {
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
                this.createAndImportTable(ret);
            }
            else {
                this.respond(this.response, 415, { "message": "Sheet not found" });
                this.myToolbox.log("Sheet not found");
            }
        }
        else {
            this.respond(this.response, 415, { "message": "Error parsing Excel file" });
            this.myToolbox.log("Error parsing Excel file");
        }
        this.myToolbox.log("End Excel to csv process");
    }
    /*
        private parseExcel(fileName: string, fileId: number, sheetName: string, rowStartCount: number) {
            var fs = require('fs');
            var XLSX = require('xlsx');
            this.myToolbox.log("Start Excel parsing");
    
            let uploadDirectory = this.configuration.common.uploadDirectory + '/';
    
            var buf = fs.readFileSync(uploadDirectory + fileName);
            var wb = null;
            try {
                wb = XLSX.read(buf, { type: 'buffer' });
            } catch (error) {
    
            }
            this.myToolbox.log("Excel parsing done");
    
            this.myToolbox.log("Start Excel to csv process");
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
                    this.myToolbox.log("Sheet not found");
                }
            } else {
                this.respond(this.response, 415, { "message": "Error parsing Excel file" });
                this.myToolbox.log("Error parsing Excel file");
            }
            this.myToolbox.log("End Excel to csv process");
    
        }
    */
    deleteFiles(tableName) {
        let mysqlDirectory = this.configuration.mySql.fileDirectory;
        var fs = require('fs');
        if (fs.existsSync(mysqlDirectory + tableName + '.csv')) {
            fs.unlinkSync(mysqlDirectory + tableName + '.csv');
            this.logMessage("File deleted: " + mysqlDirectory + tableName + '.csv');
        }
    }
    createConfigurationFile(callbackSuccess, callbackFailure) {
        let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent, keyColumn) values (" +
            "'" + this.uploadInfo.file.originalname + "', '" + this.uploadInfo.file.filename + "', '" + this.uploadInfo.params.importantColumns + "', " +
            this.uploadInfo.params.headerRowNumber + ", '" + this.uploadInfo.params.title + "', '" + this.uploadInfo.params.owner + "', 0,'" +
            this.uploadInfo.params.keyColumn + "')";
        this.myToolbox.log("Adding the configuration data");
        this.connexion.connectSql();
        this.connexion.querySqlWithoutConnexion((error, data) => {
            if (data) {
                this.connexion.releaseSql();
                this.logMessage("Configuration data created");
                callbackSuccess(data);
            }
            else {
                callbackFailure(error);
            }
        }, sql);
    }
    assign() {
        this.app.get('/', (request, response) => {
            response.send('API Serveur Upload is running');
        });
        this.app.post('/upload', this.upload.single('file'), (req, res) => {
            console.log("upload");
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
            // let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent, keyColumn) values (" +
            //     "'" + req.file.originalname + "', '" + req.file.filename + "', '" + req.body.importantColumns + "', " +
            //     req.body.headerRowNumber + ", '" + req.body.title + "', '" + req.body.owner + "', 0,'" + req.body.keyColumn + "')";
            // this.connexion.connectSql();
            // this.connexion.querySqlWithoutConnexion(
            //     (error: any, data: any) => {
            //         if (!error) {
            //             this.connexion.releaseSql();
            //             this.logMessage("Configuration data created");
            //             this.parseExcel(req.file.filename, data.insertId, req.body.sheetName, req.body.headerRowNumber);
            //         } else {
            //             this.respond(this.response, 500, error);
            //         }
            //     }, sql);
        });
        /*
                Backup ---- !!! ----
                this.app.post('/upload', this.upload.single('file'), (req: any, res: any) => {
                    console.log("upload");
                    let token = req.body.token;
                    this.uploadInfo = req;
                    if (this.configuration.requiresToken) {
                        let authent = this.connexion.checkJwt(token);
                        if (!authent.decoded) {
                            this.respond(res, 403, 'Token is absent or invalid');
                            return;
                        }
                    }
                    this.response = res;
                    var fs = require('fs');
                    let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory;
                    if (!fs.existsSync(uploadDirectory)) {
                        fs.mkdirSync(uploadDirectory);
                        this.logMessage("Upload directory created");
                    }
        
                    this.myToolbox.log("Adding the configuration data");
                    let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent, keyColumn) values (" +
                        "'" + req.file.originalname + "', '" + req.file.filename + "', '" + req.body.importantColumns + "', " +
                        req.body.headerRowNumber + ", '" + req.body.title + "', '" + req.body.owner + "', 0,'" + req.body.keyColumn + "')";
                    this.connexion.connectSql();
        
                    this.connexion.querySqlWithoutConnexion(
                        (error: any, data: any) => {
                            if (!error) {
                                this.connexion.releaseSql();
                                this.logMessage("Configuration data created");
                                this.parseExcel(req.file.filename, data.insertId, req.body.sheetName, req.body.headerRowNumber);
                            } else {
                                this.respond(this.response, 500, error);
                            }
                        }, sql);
                });
        */
        this.app.post('/uploadImage', this.upload.single('file'), (req, res) => {
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
        this.app.delete('/deleteImage', this.upload.array(), (request, response) => {
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
        this.app.delete('/delete', this.upload.array(), (request, response) => {
            let token = request.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(response, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.myToolbox.log("Deleting the configuration data");
            let sql = "delete from table configuration where tableName = '" + request.body.tableName + "';";
            if (request.deleteItemPlus) {
                sql += "delete from table itemplus where tableName = '" + request.body.tableName + "';";
            }
            sql += "DROP TABLE IF EXISTS `" + request.body.tableName + "`;";
            this.connexion.connectSql();
            this.connexion.querySqlWithoutConnexion((error, data) => {
                if (!error) {
                    this.connexion.releaseSql();
                    this.logMessage("Configuration data deleted: " + request.body.tableName);
                    this.deleteFiles(request.body.tableName);
                }
                else {
                    this.response.status(500);
                    this.response.send(error);
                }
            }, sql);
        });
    }
}
exports.UploadServer = UploadServer;
//# sourceMappingURL=uploadServer.class.js.map