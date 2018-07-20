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

    public assign() {
        this.app.post('/upload', this.upload.single('file'), (req: any, res: any) => {
            console.log(req.file);
            var fs = require('fs');
            let uploadDirectory = './' + this.myToolbox.getConfiguration().common.uploadDirectory + '/';
            let userDirectory = this.myToolbox.prepareStrinForSearch(req.body.email, false, false);
            let destinationFileName = './' + userDirectory + '/original/' + req.file.originalname;
            fs.rename(uploadDirectory + req.file.filename, destinationFileName, (err: any) => {
                if (err) throw err;
                let callbackFailure = (err: any) => {
                    if (err) throw err;
                    res.send("file saved on server and turned into json");
                }
                if (req.file.originalname.endsWith(".xls") || req.file.originalname.endsWith(".xlsx")) {
                    this.excelToJson((err: any) => callbackFailure(err), req.body, destinationFileName, req.body.fileName + '.json')
                }
            });
        });
    }

}