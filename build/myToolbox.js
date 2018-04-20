"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bdt105toolbox/dist");
class MyToolbox extends dist_1.Toolbox {
    constructor() {
        super();
    }
    logg(text) {
        if (this.configuration) {
            this.log(text, this.configuration.common.logFile, this.configuration.common.logToConsole);
        }
    }
}
exports.MyToolbox = MyToolbox;
//# sourceMappingURL=myToolbox.js.map