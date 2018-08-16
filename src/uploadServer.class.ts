import { MyToolbox } from "./myToolbox";
import { Connexion, Token } from 'bdt105connexion/dist';
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

    protected errorMessage(text: string) {
        return { "status": "ERR", "message": text };
    }

    protected respond(response: any, statusCode: number, data: any = null) {
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
        transporter.sendMail(mailOptions, function (error: any, info: any) {
            if (error)
                console.log(error)
            else
                console.log(info);
        });
    }

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
                        "INTO TABLE `" + fileName + "` " +
                        "FIELDS TERMINATED BY '" + this.separator + "' " +
                        "ENCLOSED BY '" + this.enclosed + "' " +
                        "LINES TERMINATED BY '" + this.lineSeparator + "';"
                    this.connexion.querySql(
                        (error: any, data: any) => {
                            if (!error) {
                                this.myToolbox.log("Import terminated with success");
                                let html =  "Hello, a new file (" + this.uploadInfo.file.originalname + " - " + this.uploadInfo.body.title + ") is now available for you with: " + data.affectedRows + 
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

    private testExcel(fileName: string, tableName: string, sheetName: string, rowStartCount: number) {
        var fs = require('fs');
        var XLSX = require('xlsx');
        this.myToolbox.log("Start Excel parsing");

        let uploadDirectory = this.configuration.common.uploadDirectory + '/';
        let mysqlDirectory = this.configuration.mySql.fileDirectory + '/';

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
                    } else {
                        l += this.separator + this.enclosed + 'value' + this.enclosed;
                    }
                    l += this.separator + this.enclosed + this.myToolbox.escapeString(mySheet[key].w, true) + this.enclosed;
                    fs.appendFileSync(mysqlDirectory + fileName + '.csv', l + this.lineSeparator);
                    id += 1;
                }
            }
            this.myToolbox.log("Excel to csv process done!");
            this.importCsvToTable(fileName);
        }
    }

    public assign() {
        this.app.get('/', (request: any, response: any) => {
            response.send('API Serveur Upload is running');
        });

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
                this.myToolbox.log("Upload directory created");
            }

            this.myToolbox.log("Creating the configuration data");
            let sql = "insert into configuration (fileName, tableName, importantColumns, headerRowNumber, title, owner, isCurrent, keyColumn) values (" +
                "'" + req.file.originalname + "', '" + req.file.filename + "', '" + req.body.importantColumns + "', " +
                req.body.headerRowNumber + ", '" + req.body.title + "', '" + req.body.owner + "', 0,'" + req.body.keyColumn + "')";
            this.connexion.connectSql();

            this.connexion.querySqlWithoutConnexion(
                (error: any, data: any) => {
                    if (!error) {
                        this.connexion.releaseSql();
                        this.myToolbox.log("Configuration data created");
                        this.testExcel(req.file.filename, req.file.originalname, req.body.sheetName, req.body.headerRowNumber);
                    } else {
                        this.response.status(500);
                        this.response.send(error);
                    }
                }, sql);
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
            this.respond(res, 200, { "status": "ok", "imageUrl": imageUrlDirectory + req.file.filename, "imageFileName": req.file.filename });
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

    }

}