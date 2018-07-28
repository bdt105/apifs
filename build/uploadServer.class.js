"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
class UploadServer {
    constructor(app, upload, connexion, configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.enclosed = "|";
        this.separator = ";";
        this.lineSeparator = "##";
        this.app = app;
        this.connexion = connexion;
        this.upload = upload;
    }
    escapeString(text) {
        if (text) {
            try {
                return text.replace(/[\\$'"]/g, "\\$&");
            }
            catch (error) {
                return text;
            }
        }
        return text;
    }
    importCsvToTable(fileName) {
        this.myToolbox.log("Creation of table " + fileName);
        let sql = "CREATE TABLE " + fileName +
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
        let mysqlDirectory = this.myToolbox.getConfiguration().mySql.fileDirectory;
        this.connexion.querySql((error, data) => {
            if (!error) {
                let sql = "LOAD DATA INFILE '" + mysqlDirectory + fileName + ".csv' " +
                    "INTO TABLE `" + fileName + "` " +
                    "FIELDS TERMINATED BY '" + this.separator + "' " +
                    "ENCLOSED BY '" + this.enclosed + "' " +
                    "LINES TERMINATED BY '" + this.lineSeparator + "';";
                this.connexion.querySql((error, data) => {
                    if (!error) {
                        this.myToolbox.log("Import terminated with success");
                        this.response.status(200);
                        this.response.send(data);
                    }
                    else {
                        this.response.status(500);
                        this.response.send(error);
                    }
                }, sql);
            }
            else {
                this.response.status(500);
                this.response.send(error);
            }
        }, sql);
    }
    testExcel(fileName, tableName, sheetName, rowStartCount) {
        var fs = require('fs');
        var XLSX = require('xlsx');
        this.myToolbox.log("Start Excel parsing");
        let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory + '/';
        let mysqlDirectory = this.myToolbox.getConfiguration().mySql.fileDirectory + '/';
        var buf = fs.readFileSync(uploadDirectory + fileName);
        var wb = XLSX.read(buf, { type: 'buffer' });
        this.myToolbox.log("Excel parsing done");
        if (fs.existsSync(mysqlDirectory + fileName + '.csv')) {
            fs.unlinkSync(mysqlDirectory + fileName + '.csv');
        }
        this.myToolbox.log("Start Excel to csv process");
        if (wb) {
            let mySheet = wb.Sheets[sheetName];
            let id = 0;
            for (var key in mySheet) {
                let column = key.replace(/[0-9]/g, '');
                let row = Number.parseInt(key.replace(/[^0-9]/g, ''));
                if (!Number.isNaN(row) && row >= rowStartCount) {
                    let l = this.enclosed + id.toString() + this.enclosed;
                    l += this.separator + this.enclosed + column + this.enclosed;
                    l += this.separator + this.enclosed + row + this.enclosed;
                    if (row == rowStartCount) {
                        l += this.separator + this.enclosed + 'header' + this.enclosed;
                    }
                    else {
                        l += this.separator + this.enclosed + 'value' + this.enclosed;
                    }
                    l += this.separator + this.enclosed + this.escapeString(mySheet[key].w) + this.enclosed;
                    fs.appendFileSync(mysqlDirectory + fileName + '.csv', l + this.lineSeparator);
                    id += 1;
                }
            }
            this.myToolbox.log("Excel to csv process done!");
            this.importCsvToTable(fileName);
        }
    }
    assign() {
        this.app.get('/', (request, response) => {
            response.send('API Serveur Upload is running');
        });
        this.app.post('/upload', this.upload.single('file'), (req, res) => {
            this.response = res;
            var fs = require('fs');
            let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory;
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory);
                this.myToolbox.log("Upload directory created");
            }
            this.myToolbox.log("Creating the configuration data");
            let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent) values (" +
                "'" + req.file.originalname + "', '" + req.file.filename + "', '" + req.body.importantColumns + "', " +
                req.body.headerRowNumber + ", '" + req.body.title + "', '" + req.body.owner + "', 0)";
            this.connexion.connectSql();
            this.connexion.querySqlWithoutConnexion((error, data) => {
                if (!error) {
                    this.connexion.releaseSql();
                    this.myToolbox.log("Configuration data created");
                    this.testExcel(req.file.filename, req.file.originalname, req.body.sheetName, req.body.headerRowNumber);
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