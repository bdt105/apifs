import { Toolbox } from "bdt105toolbox/dist";

export class MyToolbox extends Toolbox{
    private configuration: any;
    private toolbox: Toolbox;

    constructor(){
        super();
    }

    logg(text: string){
        if (this.configuration){
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }

}