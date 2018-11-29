import { Toolbox } from "bdt105toolbox/dist"
import { SmartUpload } from "./smart.upload";
import { Connexion } from "bdt105connexion/dist";

let toolbox: Toolbox = new Toolbox();

var configuration = toolbox.loadFromJsonFile("configuration.json");
const csvFileName = "listArticles.csv";
const confFileName = "listArticles.conf.json";
const zipFileName = "listArticles.zip";

var fs = require('fs');
fs.copyFileSync(configuration.common.ftpDirectory + zipFileName, zipFileName);

toolbox.writeFileUnZip(
    (data: any, error: any) => {
        var fs = require('fs');
        var dat = fs.readFileSync(confFileName);
        var fs = require('fs');
        let json = JSON.parse(dat);
        let fileName = json.configuration.fileName;
        let fields = json.fields;

        var c = new Connexion(configuration.mySql, null);

        let su = new SmartUpload(c, configuration, json.owner);
        fs.copyFileSync(csvFileName, configuration.mySql.fileDirectory + csvFileName);

        su.importCsvFile(
            (data: any, error: any) => {
                console.log("Ok");
            }, fileName, fields, csvFileName, 0, true);
    }, zipFileName, false
);