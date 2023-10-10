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
const promises_1 = __importDefault(require("fs/promises"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const jsdom_1 = require("jsdom");
const phonetics_engine_1 = __importDefault(require("../phonetics-engine/phonetics-engine"));
class OALEnglishDictionary {
    constructor() {
        this.linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
        this.logError = false;
        this.userDataDir = './puppeteer-data/oadl-engine';
    }
    createUserDataDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use fs.access to check if the directory exists
                yield promises_1.default.access(this.userDataDir);
            }
            catch (error) {
                // If it doesn't exist, create it
                yield promises_1.default.mkdir(this.userDataDir, { recursive: true });
            }
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createUserDataDirectory();
            this.browser = yield puppeteer_1.default.launch({
                headless: 'new',
                userDataDir: this.userDataDir,
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
    searchWordLink(link) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            const htmlContent = yield this.getHtmlByLink(link);
            this.close();
            // const htmlContent = await fs.readFile('test.html', 'utf8');
            return this.scrape(htmlContent);
        });
    }
    searchWord(query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            const htmlContent = yield this.getHtml(query);
            this.close();
            // const htmlContent = await fs.readFile('test.html', 'utf8');
            return this.scrape(htmlContent);
        });
    }
    getLink(url) {
        let link = undefined;
        try {
            const linkRaw = this.safeRun(() => { var _a; return (_a = url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]; });
            if (linkRaw) {
                link = linkRaw;
            }
        }
        catch (e) {
            this.log(e);
        }
        return link;
    }
    scrape(html) {
        const dom = this.parseHTML(html);
        const word = this.getWordEntry(dom);
        return word;
    }
    getResultItems(dom) {
        let result = [];
        try {
            const parent = this.safeRun(() => dom.querySelector('.result-list'));
            if (parent) {
                const resultItemsRaw = Array.from(parent.children);
                const resultItems = resultItemsRaw.map((resultItemElement) => {
                    return this.safeRun(() => { var _a, _b; return (_b = (_a = resultItemElement.querySelector('a')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                });
                result = resultItems;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getNearbyWords(dom) {
        let result = [];
        try {
            const parent = this.safeRun(() => dom.querySelector('.responsive_row.nearby'));
            if (parent) {
                const subParent = parent.querySelector('.list-col');
                const nearbyWordsRaw = Array.from(subParent.children);
                const nearbyWords = nearbyWordsRaw.map((nearbyWordElement) => {
                    const nearbyWord = {};
                    nearbyWord.link = this.safeRun(() => { var _a, _b; return (_b = (_a = nearbyWordElement.querySelector('a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop(); });
                    const container = nearbyWordElement.querySelector('.hwd');
                    const spellingAndPartRaw = Array.from(container === null || container === void 0 ? void 0 : container.childNodes);
                    nearbyWord.spelling = this.safeRun(() => { var _a; return (_a = spellingAndPartRaw[0].textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
                    nearbyWord.partOfSpeech = this.safeRun(() => { var _a; return (_a = spellingAndPartRaw[1].textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
                    ;
                    return nearbyWord;
                });
                result = nearbyWords;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getWordEntry(dom) {
        const wordEntry = {};
        wordEntry.link = this.getLink(this.currentUrl);
        wordEntry.spelling = this.getWord(dom);
        wordEntry.partOfSpeech = this.getPartOfSpeech(dom);
        wordEntry.level = this.getLevel(dom);
        wordEntry.grammar = this.getGrammar(dom);
        wordEntry.variants = this.getVariants(dom);
        wordEntry.phonetics = this.getMainPhonetics(dom);
        wordEntry.definition = this.getDefinition(dom);
        wordEntry.inflections = this.getInflections(dom);
        wordEntry.verbForms = this.getVerbForms(dom);
        wordEntry.senses = this.getSensesAll(dom);
        wordEntry.idioms = this.getIdioms(dom);
        wordEntry.nearbyWords = this.getNearbyWords(dom);
        wordEntry.resultList = this.getResultItems(dom);
        return wordEntry;
    }
    getMainPhonetics(dom) {
        const phonetics = {};
        phonetics.british = this.getRPPronunciation(dom);
        phonetics.northAmerican = this.getGAPronunciation(dom);
        return phonetics;
    }
    getInflections(dom) {
        let result = [];
        try {
            const parent = this.safeRun(() => dom.querySelector('.inflections'));
            if (parent) {
                const inflectionsAllRaw = Array.from(parent.childNodes);
                let inflectionRawGroup = [];
                let currentGroup = [];
                // Iterate through the array and create groups
                inflectionsAllRaw.forEach((Element) => {
                    if (Element.nodeType === 3) {
                        // Start a new group
                        if (currentGroup.length > 0) {
                            inflectionRawGroup.push(currentGroup);
                        }
                        currentGroup = [];
                    }
                    currentGroup.push(Element);
                });
                const inflections = inflectionRawGroup.map((elementGroup) => {
                    const inflection = {};
                    inflection.type = this.safeRun(() => { var _a; return (_a = elementGroup[0].textContent) === null || _a === void 0 ? void 0 : _a.replace(/[+(),]/g, '').trim(); });
                    inflection.spelling = this.safeRun(() => { var _a; return (_a = elementGroup[1].textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
                    inflection.phonetics = {
                        british: this.getRPPronunciation(dom, elementGroup[2]),
                        northAmerican: this.getGAPronunciation(dom, elementGroup[2]),
                    };
                    return inflection;
                });
                result = inflections;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getIdioms(dom) {
        let result = [];
        try {
            const container = this.safeRun(() => dom.querySelector('.idioms'));
            if (container) {
                const idiomsRaw = Array.from(container.querySelectorAll('.idm-g'));
                const idioms = idiomsRaw.map((idiomElement) => {
                    const idiom = {};
                    idiom.idiom = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.top-container')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    idiom.definiton = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    idiom.usage = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    idiom.labels = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.labels')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    idiom.examples = this.getSenseExamples(idiomElement);
                    return idiom;
                });
                result = idioms;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getSenseExamples(senseElement) {
        let result = [];
        try {
            const container = this.safeRun(() => senseElement.querySelector('.examples'));
            if (container) {
                const examplesRaw = Array.from(container.children);
                const examples = examplesRaw.map((exampleElement) => {
                    const example = {};
                    example.cf = this.safeRun(() => { var _a, _b; return (_b = (_a = exampleElement.querySelector('.cf')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    example.example = this.safeRun(() => { var _a, _b; return (_b = (_a = exampleElement.querySelector('.x')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    example.highlight = this.safeRun(() => { var _a, _b; return (_b = (_a = exampleElement.querySelector('.cl')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    return example;
                });
                result = examples;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getSensesAll(dom) {
        let result = this.getSenseEntries(dom);
        if (result.length > 0) {
            return result;
        }
        else {
            result = this.getSenses(dom);
            return result;
        }
    }
    getSenseEntries(dom) {
        let result = [];
        try {
            const parent = dom.querySelector('.senses_multiple');
            const senseEntriesRaw = Array.from(parent.children).filter((child) => child.tagName === 'SPAN');
            const senseEntries = senseEntriesRaw.map((senseEntryElement) => {
                const senseEntry = {};
                senseEntry.meaning = this.safeRun(() => { var _a, _b; return (_b = (_a = senseEntryElement.querySelector('.shcut')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                senseEntry.senses = this.getSenses(senseEntryElement, true);
                return senseEntry;
            });
            result = senseEntries;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getSenses(dom, parentElement = false) {
        let result = [];
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.senses_multiple');
            }
            else {
                parent = dom;
            }
            const sensesRaw = Array.from(parent.children).filter((child) => child.tagName === 'LI');
            const senses = sensesRaw.map((senseElement) => {
                const sense = {};
                sense.level = this.getLevel(senseElement, true);
                sense.variants = this.getVariants(senseElement, true);
                sense.partOfSpeech = this.getPartOfSpeech(senseElement, true);
                sense.definition = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.grammar = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.grammar')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.cf = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.cf')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                // get example
                sense.examples = this.getSenseExamples(senseElement);
                return sense;
            });
            result = senses;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getVerbForms(dom) {
        let result = [];
        try {
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
                verbForm.phonetics = {
                    british: this.getRPPronunciation(dom, verbFormElement),
                    northAmerican: this.getGAPronunciation(dom, verbFormElement),
                };
                return verbForm;
            });
            let currentGroup = [];
            // Iterate through the array and create groups
            verbForms.forEach((form) => {
                if (mainForms.includes(form.type)) {
                    // Start a new group
                    if (currentGroup.length > 0) {
                        verbFormGroups.push(currentGroup);
                    }
                    currentGroup = [];
                }
                currentGroup.push(form);
            });
            // Add the last group (if any) to the formGroups array
            if (currentGroup.length > 0) {
                verbFormGroups.push(currentGroup);
            }
            result = verbFormGroups;
        }
        catch (e) {
            this.log(e);
        }
        return result;
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
                const testSubParent = this.safeRun(() => parent.querySelector('.phonetics'));
                if (testSubParent) {
                    subParent = testSubParent;
                }
                else {
                    subParent = parent;
                }
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
    getRPPronunciation(dom, parentElement) {
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
                const testSubParent = this.safeRun(() => parent.querySelector('.phonetics'));
                if (testSubParent) {
                    subParent = testSubParent;
                }
                else {
                    subParent = parent;
                }
            }
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
    getVariants(dom, senseElement = false) {
        let result = [];
        try {
            let parent;
            if (!senseElement) {
                parent = dom.querySelector('.webtop');
            }
            else {
                parent = dom;
            }
            const variantsRaw = Array.from(parent.querySelectorAll('.variants'));
            const variants = variantsRaw.map((variantElement) => {
                const variant = {};
                variant.variant = this.safeRun(() => { var _a; return (_a = variantElement === null || variantElement === void 0 ? void 0 : variantElement.textContent) === null || _a === void 0 ? void 0 : _a.trim(); });
                variant.highlight = this.safeRun(() => {
                    return Array.from(variantElement === null || variantElement === void 0 ? void 0 : variantElement.querySelectorAll('.v-g .v')).map((highlightElement) => {
                        var _a;
                        return (_a = highlightElement.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                    });
                });
                return variant;
            });
            result = variants;
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getDefinition(dom, parentElement = false) {
        let definition = {};
        try {
            let parent;
            if (!parentElement) {
                const testParent = this.safeRun(() => dom.querySelector('.entry'));
                if (testParent) {
                    parent = testParent;
                }
            }
            else {
                parent = dom;
            }
            definition.definition = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.sense_single .def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            // get reference
            const subParent = this.safeRun(() => parent.querySelector('.sense_single .xrefs'));
            definition.reference = {
                definition: this.safeRun(() => { var _a, _b; return (_b = (_a = subParent === null || subParent === void 0 ? void 0 : subParent.querySelector('.prefix')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); }),
                link: this.safeRun(() => { var _a, _b; return (_b = (_a = subParent === null || subParent === void 0 ? void 0 : subParent.querySelector('.Ref')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.split('/').pop(); }),
                spelling: this.safeRun(() => { var _a, _b; return (_b = (_a = subParent === null || subParent === void 0 ? void 0 : subParent.querySelector('.Ref .xr-g .xh')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); }),
            };
        }
        catch (e) {
            this.log(e);
        }
        return definition;
    }
    getLevel(dom, parentElement = false) {
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.symbols a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.split('=').pop(); });
            }
            else {
                parent = dom;
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.sensetop .symbols a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.split('=').pop(); });
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getPartOfSpeech(dom, parentElement = false) {
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
            }
            else {
                parent = dom;
            }
            result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.pos')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getWord(dom) {
        let result = undefined;
        try {
            const parent = dom.querySelector('.webtop');
            result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.headword')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getGrammar(dom, parentElement = false) {
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.grammar')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
            else {
                parent = dom;
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.grammar')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getHtmlByLink(link) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.page.goto(`${this.linkBase}${link}`);
            // Get the HTML content of the page
            const pageHTML = yield this.page.content();
            this.currentUrl = this.page.url();
            // Return the HTML content as a string
            return pageHTML;
        });
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
            this.currentUrl = this.page.url();
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
