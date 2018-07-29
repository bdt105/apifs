import { MyToolbox } from "./myToolbox";
import { Connexion, Token } from 'bdt105connexion/dist';

export class UploadServer {
    private app: any;
    private connexion: Connexion;
    private myToolbox = new MyToolbox();
    private upload: any;

    private response: any;
    private enclosed = "|";
    private separator = ";";
    private lineSeparator = "##";

    constructor(app: any, upload: any, connexion: Connexion, configuration: any) {
        this.app = app;
        this.connexion = connexion;
        this.upload = upload;
    }

    private escapeString(text: string) {
        if (text) {
            try {
                let ret = text.replace(/[\\$'"]/g, "\\$&").replace(/[\n\r]+/g, ' ').replace(/[\n]+/g, ' ');
                return ret;
            } catch (error) {
                return text;
            }
        }
        return text;
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

        let mysqlDirectory =this.myToolbox.getConfiguration().mySql.fileDirectory;

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
                    l += this.separator + this.enclosed + column +this. enclosed;
                    l += this.separator + this.enclosed + row + this.enclosed;
                    if (row == rowStartCount) {
                        l += this.separator + this.enclosed + 'header' + this.enclosed;
                    } else {
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

    public assign() {
        this.app.get('/', (request: any, response: any) => {
            response.send('API Serveur Upload is running');
        });
        this.app.post('/upload', this.upload.single('file'), (req: any, res: any) => {
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
                req.body.headerRowNumber + ", '" + req.body.title +  "', '" + req.body.owner + "', 0)";
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
    }

}