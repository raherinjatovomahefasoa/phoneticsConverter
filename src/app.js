"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const jsdom_1 = require("jsdom");
const promises_1 = __importDefault(require("fs/promises"));
const phonetics_engine_1 = __importDefault(require("./phonetics-engine/phonetics-engine"));
class OALEnglishDictionary {
    constructor() {
        this.linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
        this.logError = true;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.default.launch({
                headless: 'new',
                userDataDir: './puppeteer-data',
            });
            this.page = yield this.browser.newPage();
            // Enable request interception
            yield this.page.setRequestInterception(true);
            // Intercept and block certain types of requests
            this.page.on('request', (request) => {
                if (request.resourceType() === 'image' || // Block image requests
                    request.resourceType() === 'stylesheet' || // Block CSS requests
                    request.resourceType() === 'media' || // Media resources include audio and video
                    request.resourceType() === 'font') {
                    request.abort();
                }
                else {
                    request.continue();
                }
            });
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.initialize();
            // const htmlContent = await this.getHtml(query);
            const htmlContent = yield promises_1.default.readFile('test.html', 'utf8');
            // this.close();
            this.scrape(htmlContent);
        });
    }
    scrape(html) {
        const dom = this.parseHTML(html);
        // console.log(this.getGAPronunciation(dom));
        // get word
        // const word = this.getGAPronunciation(dom);
        this.getVerbForms(dom);
    }
    getVerbForms(dom) {
        const parent = dom.querySelector('.verb_forms_table tbody');
        const verbFormsRaw = Array.from(parent.children);
        const mainForms = ['root', 'thirdps', 'past', 'pastpart', 'prespart'];
        const verbFormGroups = [];
        const verbForms = verbFormsRaw.map((verbFormElement) => {
            var _a;
            const verbForm = {};
            verbForm.type = this.safeRun(() => verbFormElement.getAttribute('form'));
            verbForm.prefix = this.safeRun(() => { var _a; return (_a = verbFormElement.querySelector('.vf_prefix')) === null || _a === void 0 ? void 0 : _a.textContent; });
            if (!verbForm.prefix) {
                verbForm.spelling = this.safeRun(() => { var _a; return (_a = verbFormElement.querySelector('.verb_form')) === null || _a === void 0 ? void 0 : _a.textContent; });
            }
            else {
                const verbFormContainer = this.safeRun(() => { var _a; return (_a = verbFormElement.querySelector('.verb_form')) === null || _a === void 0 ? void 0 : _a.innerHTML; });
                verbForm.spelling = (_a = verbFormContainer === null || verbFormContainer === void 0 ? void 0 : verbFormContainer.split('</span>').pop()) === null || _a === void 0 ? void 0 : _a.trim();
            }
            const test = this.getGAPronunciation(dom, verbFormElement);
            return verbForm;
        });
    }
    safeRun(toRun, ...args) {
        try {
            return toRun(...args);
        }
        catch (e) {
            return undefined;
        }
    }
    getGAPronunciation(dom, parentElement) {
        let result = [];
        try {
            let parent;
            let subParent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
                subParent = parent.querySelector('.phonetics');
            }
            else {
                parent = parentElement;
                subParent = parent.querySelector('.phonetics');
                console.log(subParent);
            }
            const container = subParent.querySelector('.phons_n_am');
            const phoneticsRaw = Array.from(container.querySelectorAll('.phon'));
            const phonetics = phoneticsRaw.map((phoneticsElement) => {
                var _a;
                return (_a = phoneticsElement.textContent) === null || _a === void 0 ? void 0 : _a.replace(/\//g, '');
            });
            const soundsRaw = Array.from(container.querySelectorAll('.sound.audio_play_button.pron-us'));
            const sounds = soundsRaw.map((audioElement) => {
                return audioElement.getAttribute('data-src-mp3');
            });
            for (let i = 0; i < phonetics.length; i++) {
                const pronunciation = {
                    phonetics: (0, phonetics_engine_1.default)(phonetics[i]).toGA(),
                    sound: sounds[i],
                };
                result.push(pronunciation);
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getRPPronunciation(dom) {
        let result = [];
        try {
            const parent = dom.querySelector('.webtop');
            const subParent = parent.querySelector('.phonetics');
            const container = subParent.querySelector('.phons_br');
            const phoneticsRaw = Array.from(container.querySelectorAll('.phon'));
            const phonetics = phoneticsRaw.map((phoneticsElement) => {
                var _a;
                return (_a = phoneticsElement.textContent) === null || _a === void 0 ? void 0 : _a.replace(/\//g, '');
            });
            const soundsRaw = Array.from(container.querySelectorAll('.sound.audio_play_button.pron-uk'));
            const sounds = soundsRaw.map((audioElement) => {
                return audioElement.getAttribute('data-src-mp3');
            });
            for (let i = 0; i < phonetics.length; i++) {
                const pronunciation = {
                    phonetics: phonetics[i],
                    sound: sounds[i],
                };
                result.push(pronunciation);
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getLevel(dom) {
        var _a;
        let result = null;
        try {
            const parent = dom.querySelector('.webtop');
            const container = parent.querySelector('.symbols a');
            result = ((_a = container.getAttribute('href')) === null || _a === void 0 ? void 0 : _a.split('=').pop()) || null;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getPartOfSpeech(dom) {
        let result = null;
        try {
            const parent = dom.querySelector('.webtop');
            const container = parent.querySelector('.pos');
            result = container.textContent;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getWord(dom) {
        let result = null;
        try {
            const parent = dom.querySelector('.webtop');
            const container = parent.querySelector('.headword');
            result = container.textContent;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getHtml(query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.page.goto(this.linkBase);
            const searchInputSelector = '#q';
            const searchButtonSelector = '#search-btn input[type="submit"]'; // Modify selector for the button
            yield this.page.waitForSelector(searchButtonSelector);
            // Type the query into the search input field
            yield this.page.type(searchInputSelector, query);
            // Click the search button
            yield this.page.click(searchButtonSelector);
            // Wait for the search results to load (you may need to adjust the selector and wait time)
            const searchResultsSelector = '.responsive_row';
            yield this.page.waitForSelector(searchResultsSelector);
            // Get the HTML content of the page
            const pageHTML = yield this.page.content();
            // Return the HTML content as a string
            return pageHTML;
        });
    }
    parseHTML(html) {
        const { window } = new jsdom_1.JSDOM(html);
        return window.document;
    }
    log(error) {
        if (this.logError) {
            console.error(error);
        }
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser) {
                yield this.browser.close();
            }
        });
    }
}
function OALDic() {
    return new OALEnglishDictionary();
}
exports.default = OALDic;
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield OALDic().search('awe');
}))();
