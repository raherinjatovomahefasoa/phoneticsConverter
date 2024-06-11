"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.PhrasalVerb = exports.Reference = exports.ReferenceGroup = exports.NearbyWord = exports.WordEntry = exports.Phonetics = exports.SentenceExample = exports.SenseExample = exports.SenseEntry = exports.SenseTop = exports.Idiom = exports.PhrasalVerbEntry = exports.Sense = exports.Inflection = exports.VerbForm = exports.Variant = exports.Pronunciation = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const jsdom_1 = require("jsdom");
const phonetics_engine_1 = __importDefault(require("../phonetics-engine/phonetics-engine"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
const querystring = __importStar(require("querystring"));
class Pronunciation {
}
exports.Pronunciation = Pronunciation;
class Variant {
}
exports.Variant = Variant;
class VerbForm {
}
exports.VerbForm = VerbForm;
class Inflection {
}
exports.Inflection = Inflection;
class Sense {
}
exports.Sense = Sense;
class PhrasalVerbEntry {
}
exports.PhrasalVerbEntry = PhrasalVerbEntry;
class Idiom {
}
exports.Idiom = Idiom;
class SenseTop {
}
exports.SenseTop = SenseTop;
class SenseEntry {
}
exports.SenseEntry = SenseEntry;
class SenseExample {
}
exports.SenseExample = SenseExample;
class SentenceExample {
}
exports.SentenceExample = SentenceExample;
class Phonetics {
}
exports.Phonetics = Phonetics;
class WordEntry {
}
exports.WordEntry = WordEntry;
class NearbyWord {
}
exports.NearbyWord = NearbyWord;
class ReferenceGroup {
}
exports.ReferenceGroup = ReferenceGroup;
class Reference {
}
exports.Reference = Reference;
class PhrasalVerb {
}
exports.PhrasalVerb = PhrasalVerb;
class OALEnglishDictionary {
    constructor() {
        this.linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
        this.searchLink = 'https://www.oxfordlearnersdictionaries.com/search/english/?q=';
        this.logError = false;
        this.userDataDir = './puppeteer-data/oadl-engine';
        this.sanitizeFileName = (fileName) => {
            // Replace characters not allowed in file names with underscores
            return fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
        };
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
            try {
                yield this.createUserDataDirectory();
                this.browser = yield puppeteer_1.default.launch({
                    headless: 'new',
                    userDataDir: this.userDataDir,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    devtools: false, // Disable DevTools
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
            }
            catch (e) {
                this.log(e);
            }
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
    saveSounds(dir, dataDir, obj, spelling) {
        return __awaiter(this, void 0, void 0, function* () {
            // Base case: if obj is not an object, return it as is
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }
            // Initialize a new object to store the modified values
            const modifiedObj = Array.isArray(obj) ? [] : {};
            const title = obj.spelling || spelling || 'word';
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // Recursively call modifySoundKey for nested objects
                    modifiedObj[key] = yield this.saveSounds(dir, dataDir, obj[key], title);
                    // Check if the key is 'sound', and if so, run the callback function
                    if (key === 'sound') {
                        if (obj[key]) {
                            yield this.safeRun(() => __awaiter(this, void 0, void 0, function* () {
                                modifiedObj[key] = yield this.downloadAndSaveMp3(dir, dataDir, obj[key], title);
                            }));
                        }
                    }
                }
            }
            return modifiedObj;
        });
    }
    downloadAndSaveMp3(dir, dataDir, url, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use Axios to download the MP3 file
                const response = yield axios_1.default.get(url, {
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
                });
                // Generate a unique filename
                const uniqueString = (0, uuid_1.v4)();
                const fileExtension = '.mp3'; // Assuming it's an MP3 file
                let title = name.toLocaleLowerCase().trim().replace(/\s/g, '-'); // Default title if 'title' is not provided
                // Sanitize the title before constructing the new file name
                title = this.sanitizeFileName(title);
                const newFileName = `${title}_${uniqueString}${fileExtension}`;
                // Save the downloaded file to the 'uploads' directory
                try {
                    // Use fs.access to check if the directory exists
                    yield promises_1.default.access(dataDir);
                }
                catch (error) {
                    // If it doesn't exist, create it
                    yield promises_1.default.mkdir(dataDir, { recursive: true });
                }
                const filePath = path.join(dir, dataDir, newFileName);
                yield promises_1.default.writeFile(filePath, response.data);
                return newFileName;
            }
            catch (e) {
                this.log(e);
                console.error(e);
                return url;
            }
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
        wordEntry.labels = this.getLabels(dom);
        wordEntry.disclaimer = this.getDisclaimer(dom);
        wordEntry.usage = this.getUsage(dom);
        wordEntry.partOfSpeech = this.getPartOfSpeech(dom);
        wordEntry.level = this.getLevel(dom);
        wordEntry.grammar = this.getGrammar(dom);
        wordEntry.variants = this.getVariants(dom);
        wordEntry.phonetics = this.getMainPhonetics(dom);
        wordEntry.referenceGroup = this.getReferenceGroup(dom);
        wordEntry.inflections = this.getInflections(dom);
        wordEntry.verbForms = this.getVerbForms(dom);
        wordEntry.phrasalVerbEntries = this.getPhrasalVerbEntries(dom);
        wordEntry.senses = this.getSensesAll(dom);
        wordEntry.idioms = this.getIdioms(dom);
        wordEntry.phrasalVerbs = this.getPhrasalVerbs(dom);
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
                    const container = dom.querySelector('.inflections');
                    // get PHonetics
                    for (const child of elementGroup) {
                        try {
                            if (child.classList.contains('phonetics')) {
                                inflection.phonetics = {
                                    british: this.getRPPronunciation(dom, child),
                                    northAmerican: this.getGAPronunciation(dom, child),
                                };
                            }
                            ;
                        }
                        catch (e) { }
                    }
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
    getPhrasalVerbs(dom) {
        let result = [];
        try {
            const container = this.safeRun(() => dom.querySelector('.phrasal_verb_links .pvrefs'));
            if (container) {
                const phrasalVerbsRaw = Array.from(container.querySelectorAll('.li'));
                const phrasalVerbs = phrasalVerbsRaw.map((phrasalVerbElment) => {
                    const refElement = this.safeRun(() => phrasalVerbElment.querySelector('.Ref'));
                    const phrasalVerb = {};
                    if (refElement) {
                        phrasalVerb.reference = this.getReference(refElement, true);
                    }
                    return phrasalVerb;
                });
                result = phrasalVerbs;
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
                    idiom.idiom = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.top-container .webtop .idm')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    // idiom.definition = this.safeRun<string>(() => idiomElement.querySelector('.def')?.textContent?.trim());
                    // idiom.disclaimer = this.safeRun<string>(() => idiomElement.querySelector('.dis-g')?.textContent?.trim());
                    idiom.usage = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.top-container .webtop .use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    idiom.labels = this.safeRun(() => {
                        return this.getLabels(idiomElement.querySelector('.top-container .webtop'), true);
                    });
                    idiom.disclaimer = this.safeRun(() => { var _a, _b; return (_b = (_a = idiomElement.querySelector('.top-container .webtop .dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    // idiom.examples = this.getSenseExamples(idiomElement);
                    idiom.variants = this.getVariants(idiomElement, true);
                    idiom.senses = this.safeRun(() => {
                        const container = idiomElement.querySelector('ol');
                        return this.getSenses(container, true);
                    });
                    // idiom.referenceGroup = this.getReferenceGroup(idiomElement, true);
                    // idiom.grammar = this.getGrammar(idiomElement, true);
                    // idiom.partOfSpeech = this.getPartOfSpeech(idiomElement, true);
                    // idiom.cf = this.safeRun<string>(() => idiomElement.querySelector('.cf')?.textContent?.trim());
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
    getSenseTop(sense) {
        let senseTop = {};
        try {
            const container = this.safeRun(() => {
                return Array.from(sense.children).find((child) => {
                    return child.classList.contains('sensetop');
                });
            });
            if (container) {
                // idiom.definition = this.safeRun<string>(() => idiomElement.querySelector('.def')?.textContent?.trim());
                // idiom.disclaimer = this.safeRun<string>(() => idiomElement.querySelector('.dis-g')?.textContent?.trim());
                senseTop.usage = this.safeRun(() => { var _a, _b; return (_b = (_a = container.querySelector('.use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                senseTop.labels = this.safeRun(() => this.getLabels(container, true));
                senseTop.disclaimer = this.safeRun(() => { var _a, _b; return (_b = (_a = container.querySelector('.dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                // idiom.examples = this.getSenseExamples(idiomElement);
                senseTop.variants = this.safeRun(() => this.getVariants(container, true));
            }
        }
        catch (e) {
            this.log(e);
        }
        return senseTop;
    }
    getPhrasalVerbEntries(dom) {
        let result = [];
        try {
            const container = this.safeRun(() => dom.querySelector('.entry'));
            if (container) {
                const phrasalVerbEntriesRaw = Array.from(container.children).filter((child) => child.classList.contains('pv-g'));
                const phrasalVerbEntries = phrasalVerbEntriesRaw.map((phrasalVerbEntryElement) => {
                    const phrasalVerbEntry = {};
                    phrasalVerbEntry.spelling = this.safeRun(() => { var _a, _b; return (_b = (_a = phrasalVerbEntryElement.querySelector('.webtop .pv')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    phrasalVerbEntry.usage = this.safeRun(() => { var _a, _b; return (_b = (_a = phrasalVerbEntryElement.querySelector('.top-container .webtop .use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    phrasalVerbEntry.labels = this.safeRun(() => {
                        return this.getLabels(phrasalVerbEntryElement.querySelector('.top-container .webtop'), true);
                    });
                    phrasalVerbEntry.disclaimer = this.safeRun(() => { var _a, _b; return (_b = (_a = phrasalVerbEntryElement.querySelector('.top-container .webtop .dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    // phrasalVerbEntry.examples = this.getSenseExamples(phrasalVerbEntryElement);
                    phrasalVerbEntry.variants = this.getVariants(phrasalVerbEntryElement, true);
                    phrasalVerbEntry.senses = this.safeRun(() => {
                        const container = phrasalVerbEntryElement.querySelector('ol');
                        const senses = this.getSenses(container, true);
                        return senses;
                    });
                    return phrasalVerbEntry;
                });
                result = phrasalVerbEntries;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getSentenceExample(senteceElement) {
        let sentenceExample = {};
        try {
            const container = senteceElement;
            if (container) {
                sentenceExample.sentence = this.safeRun(() => { var _a, _b; return (_b = (_a = container.querySelector('.x')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sentenceExample.gloss = this.safeRun(() => { var _a, _b; return (_b = (_a = container.querySelector('.x .gloss')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sentenceExample.highlight = this.safeRun(() => { var _a, _b; return (_b = (_a = container.querySelector('.x .cl')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
        }
        catch (e) {
            this.log(e);
        }
        return sentenceExample;
    }
    getSenseExamples(senseElement) {
        let result = [];
        try {
            const container = this.safeRun(() => senseElement.querySelector('.examples'));
            if (container) {
                const examplesRaw = Array.from(container.children);
                const examples = examplesRaw.map((exampleElement) => {
                    const example = {};
                    example.labels = this.safeRun(() => { var _a, _b; return (_b = (_a = exampleElement.querySelector('.labels')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    example.cf = this.safeRun(() => { var _a, _b; return (_b = (_a = exampleElement.querySelector('.cf')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    example.sentence = this.getSentenceExample(exampleElement);
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
        let result = this.getSenses(dom);
        if (result.length > 0) {
            return result;
        }
        else {
            result = this.getSenseEntries(dom);
            return result;
        }
    }
    getSenseEntries(dom) {
        let result = [];
        try {
            const bigParent = this.safeRun(() => dom.querySelector('.entry'));
            if (bigParent) {
                const parent = Array.from(bigParent.children).find((child) => child.classList.contains('senses_multiple'));
                const senseEntriesRaw = Array.from(parent.children).filter((child) => child.tagName === 'SPAN');
                const senseEntries = senseEntriesRaw.map((senseEntryElement) => {
                    const senseEntry = {};
                    senseEntry.meaning = this.safeRun(() => { var _a, _b; return (_b = (_a = senseEntryElement.querySelector('.shcut')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                    senseEntry.senses = this.getSenses(senseEntryElement, true);
                    return senseEntry;
                });
                result = senseEntries;
            }
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
                const bigParent = this.safeRun(() => dom.querySelector('.entry'));
                parent = Array.from(bigParent.children).find((child) => child.classList.contains('senses_multiple') || child.classList.contains('sense_single'));
            }
            else {
                parent = dom;
            }
            const sensesRaw = Array.from(parent.children).filter((child) => child.tagName === 'LI');
            const senses = sensesRaw.map((senseElement) => {
                const sense = {};
                sense.level = this.getLevel(senseElement, true);
                sense.senseTop = this.getSenseTop(senseElement);
                sense.variants = this.getVariants(senseElement, true);
                sense.partOfSpeech = this.getPartOfSpeech(senseElement, true);
                sense.disclaimer = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.definition = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.referenceGroup = this.getReferenceGroup(senseElement, true);
                sense.usage = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.labels = this.getLabels(senseElement, true);
                sense.grammar = this.safeRun(() => { var _a, _b; return (_b = (_a = senseElement.querySelector('.grammar')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
                sense.cf = this.safeRun(() => {
                    var _a, _b;
                    return (_b = (_a = Array.from(senseElement.children).find((child) => {
                        return child.classList.contains('cf');
                    })) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim();
                });
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
        var _a, _b;
        let definition;
        try {
            let parent;
            if (!parentElement) {
                const testParent = this.safeRun(() => dom.querySelector('.entry'));
                if (testParent) {
                    parent = testParent;
                    definition = this.safeRun(() => {
                        var _a, _b;
                        const senseSingleElement = Array.from(parent.children).find((child) => child.classList.contains('sense_single'));
                        if (senseSingleElement) {
                            return (_b = (_a = senseSingleElement.querySelector('.def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim();
                        }
                    });
                }
            }
            else {
                parent = dom;
                definition = (_b = (_a = parent.querySelector('.def')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim();
            }
        }
        catch (e) {
            this.log(e);
        }
        return definition;
    }
    getReferenceGroup(dom, parentElement = false) {
        let refGroup = {};
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.entry > .sense_single > .sense .xrefs');
            }
            else {
                parent = Array.from(dom.children).find((child) => child.classList.contains('xrefs'));
            }
            refGroup = {
                hint: this.safeRun(() => { var _a, _b; return (_b = (_a = parent === null || parent === void 0 ? void 0 : parent.querySelector('.prefix')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); }),
                references: this.safeRun(() => {
                    return Array.from(parent.querySelectorAll('.Ref')).map((refElement) => {
                        const reference = this.getReference(refElement, true);
                        return reference;
                    });
                }) || [],
            };
        }
        catch (e) {
            this.log(e);
        }
        return refGroup;
    }
    getReference(dom, parentElement = false) {
        let reference = {};
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.Ref');
            }
            else {
                parent = dom;
            }
            let link = this.safeRun(() => { var _a; return (_a = parent.getAttribute('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop(); });
            link = this.safeRun(() => link === null || link === void 0 ? void 0 : link.split('#').shift()) || link;
            link = this.safeRun(() => link === null || link === void 0 ? void 0 : link.split('=').pop()) || link;
            reference.link = link;
            reference.spelling = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.xr-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
        }
        catch (e) {
            this.log(e);
        }
        return reference;
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
    getLabels(dom, parentElement = false) {
        var _a, _b, _c, _d;
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.entry .webtop');
                result = ((_b = (_a = this.safeRun(() => {
                    return Array.from(parent.children).find((child) => {
                        return child.classList.contains('labels');
                    });
                })) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || undefined;
            }
            else {
                parent = dom;
                result = ((_d = (_c = this.safeRun(() => {
                    return Array.from(parent.children).find((child) => {
                        return child.classList.contains('labels');
                    });
                })) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || undefined;
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getDisclaimer(dom, parentElement = false) {
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
            else {
                parent = dom;
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.dis-g')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
        }
        catch (e) {
            this.log(e);
        }
        return result;
    }
    getUsage(dom, parentElement = false) {
        let result = undefined;
        try {
            let parent;
            if (!parentElement) {
                parent = dom.querySelector('.webtop');
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
            else {
                parent = dom;
                result = this.safeRun(() => { var _a, _b; return (_b = (_a = parent.querySelector('.use')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(); });
            }
        }
        catch (e) {
            this.log(e);
            return '';
        }
        return result;
    }
    getHtmlByLink(link) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.page.goto(`${this.linkBase}${link}`, { waitUntil: 'domcontentloaded' });
                // Get the HTML content of the page
                const searchResultsSelector = '.responsive_row';
                yield this.page.waitForSelector(searchResultsSelector, { visible: true });
                const pageHTML = yield this.page.content();
                this.currentUrl = this.page.url();
                // Return the HTML content as a string
                return pageHTML;
            }
            catch (e) {
                this.log(e);
                this.close();
                return '';
            }
        });
    }
    getHtml(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // await this.page.goto(this.linkBase, { waitUntil: 'domcontentloaded' });
                // const searchInputSelector = '#q';
                // const searchButtonSelector = '#search-btn input[type="submit"]';
                // // Wait for the search input field to appear
                // await this.page.waitForSelector(searchInputSelector, { visible: true });
                // // Type the query into the search input field
                // await this.page.type(searchInputSelector, query);
                // // Click the search button
                // await this.page.click(searchButtonSelector);
                // // Wait for the search results to load (you may need to adjust the selector and wait time)
                // const searchResultsSelector = '.responsive_row';
                // // Wait for the search results selector to be visible
                // await this.page.waitForSelector(searchResultsSelector, { visible: true });
                // // Get the HTML content of the page
                // const pageHTML = await this.page.content();
                // this.currentUrl = this.page.url();
                yield this.page.goto(`${this.searchLink}${this.stringToLinkType(query)}`, { waitUntil: 'domcontentloaded' });
                // Get the HTML content of the page(
                const searchResultsSelector = '.responsive_row';
                yield this.page.waitForSelector(searchResultsSelector, { visible: true });
                const pageHTML = yield this.page.content();
                this.currentUrl = this.page.url();
                // Return the HTML content as a string
                return pageHTML;
            }
            catch (e) {
                this.log(e);
                this.close();
                return '';
            }
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
    stringToLinkType(inputString) {
        return this.safeRun(() => {
            const encodedString = querystring.escape(inputString);
            return encodedString;
        }) || inputString;
    }
}
function OALDic() {
    return new OALEnglishDictionary();
}
exports.default = OALDic;
