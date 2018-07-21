import { MyToolbox } from "./myToolbox";
import { Connexion, Token } from 'bdt105connexion/dist';

export class UploadServer {
    private app: any;
    private connexion: Connexion;
    private configuration: any;
    private myToolbox = new MyToolbox();
    private upload: any;

    constructor(app: any, upload: any, connexion: Connexion, configuration: any) {
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
        this.upload = upload;
    }

    private excelToJson(callbackFailure: Function, config: any, excelFileName: string, jsonFileName: string) {
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
        fs.writeFile(jsonFileName, JSON.stringify(result), (err: any) => {
            if (callbackFailure) {
                callbackFailure(err);
            }
        });
    }

    private writeConfiguration(fs: any, fileName: string, originalFileName: string, configurationFileName: string, data: any){
        var stats = fs.statSync(fileName);
        var mtime = stats.mtime;
        var listColumns = data.listColumns ? data.listColumns.split(";") : null;

        let conf = JSON.stringify(
            {
                "fileName": originalFileName,
                "lastModificationDate": mtime,
                "name": data.name,
                "sheetName": data.sheetName,
                "idColumn": data.idColumn,
                "listColumns": listColumns,
                "headerRowNumber": data.headerRowNumber
            }
        );

        fs.writeFile(configurationFileName, conf, (err: any) => {
            if (err) {
                return console.log(err);
            }
            console.log(configurationFileName + ' created!');
        });

    }

    public assign() {
        this.app.post('/upload', this.upload.single('file'), (req: any, res: any) => {
            console.log(req.file);
            var fs = require('fs');
            let uploadDirectory = './' + this.myToolbox.getConfiguration().common.uploadDirectory + '/';
            let userDirectory = this.myToolbox.prepareStrinForSearch(req.body.email, false, false);
            let destinationFileName = './' + userDirectory + '/original/' + req.file.originalname;
            let fileNameWithoutExt = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.'));
            fs.rename(uploadDirectory + req.file.filename, destinationFileName, (err: any) => {
                if (err) throw err;
                let callbackFailure = (err: any) => {
                    if (err) throw err;
                    this.writeConfiguration(fs, destinationFileName, req.file.originalname, userDirectory + '/' + fileNameWithoutExt + '.configuration.json', req.body);
                    res.send("file saved on server and turned into json");
                }
                if (req.file.originalname.endsWith(".xls") || req.file.originalname.endsWith(".xlsx")) {
                    this.excelToJson((err: any) => callbackFailure(err), req.body, destinationFileName, userDirectory + "/" + fileNameWithoutExt + '.json')
                }
            });

        });
    }

}