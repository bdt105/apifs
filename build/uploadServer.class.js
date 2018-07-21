"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
class UploadServer {
    constructor(app, upload, connexion, configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
        this.upload = upload;
    }
    excelToJson(callbackFailure, config, excelFileName, jsonFileName) {
        let excelToJson = require('convert-excel-to-json');
        let result = excelToJson({
            sourceFile: excelFileName,
            sheets: [
                {
                    name: config.sheetName,
                    header: {
                        rows: config.headerRowNumber
                    }
                }
            ],
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        var fs = require('fs');
        fs.writeFile(jsonFileName, JSON.stringify(result), (err) => {
            if (callbackFailure) {
                callbackFailure(err);
            }
        });
    }
    writeConfiguration(fs, fileName, originalFileName, configurationFileName, data) {
        var stats = fs.statSync(fileName);
        var mtime = stats.mtime;
        var listColumns = data.listColumns ? data.listColumns.split(";") : null;
        let conf = JSON.stringify({
            "fileName": originalFileName,
            "lastModificationDate": mtime,
            "name": data.name,
            "sheetName": data.sheetName,
            "idColumn": data.idColumn,
            "listColumns": listColumns,
            "headerRowNumber": data.headerRowNumber
        });
        fs.writeFile(configurationFileName, conf, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log(configurationFileName + ' created!');
        });
    }
    assign() {
        this.app.post('/upload', this.upload.single('file'), (req, res) => {
            console.log(req.file);
            var fs = require('fs');
            let uploadDirectory = './' + this.myToolbox.getConfiguration().common.uploadDirectory + '/';
            let userDirectory = this.myToolbox.prepareStrinForSearch(req.body.email, false, false);
            let destinationFileName = './' + userDirectory + '/original/' + req.file.originalname;
            let fileNameWithoutExt = this.myToolbox.getFileNameWithoutExtension(req.file.originalname);
            fs.rename(uploadDirectory + req.file.filename, destinationFileName, (err) => {
                if (err)
                    throw err;
                let callbackFailure = (err) => {
                    if (err)
                        throw err;
                    this.writeConfiguration(fs, destinationFileName, req.file.originalname, userDirectory + '/' + fileNameWithoutExt + '.configuration.json', req.body);
                    res.send("file saved on server and turned into json");
                };
                if (req.file.originalname.endsWith(".xls") || req.file.originalname.endsWith(".xlsx")) {
                    this.excelToJson((err) => callbackFailure(err), req.body, destinationFileName, userDirectory + "/" + fileNameWithoutExt + '.json');
                }
            });
        });
    }
}
exports.UploadServer = UploadServer;
//# sourceMappingURL=uploadServer.class.js.map