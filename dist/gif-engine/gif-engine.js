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
exports.GifImage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const jsdom_1 = require("jsdom");
const querystring = __importStar(require("querystring"));
class GifImage {
}
exports.GifImage = GifImage;
class GifEngine {
    constructor() {
        this.linkBase = 'https://giphy.com/search/';
        this.logError = false;
        this.userDataDir = './puppeteer-data/gif-engine';
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
                yield this.page.setViewport({ width: 1280, height: 10000 });
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
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            const htmlContent = yield this.getHtmlByLink(query);
            this.close();
            // const htmlContent = await fs.readFile('test.html', 'utf8');
            return this.scrape(htmlContent);
        });
    }
    scrape(html) {
        const dom = this.parseHTML(html);
        const images = this.getGifImages(dom);
        // console.log(images);
        return images;
    }
    getGifImages(dom) {
        let result = [];
        try {
            const parent = dom.querySelector('.giphy-grid div');
            const imagesRaw = Array.from(parent.querySelectorAll('picture source'));
            const images = imagesRaw.map((imageElement) => {
                const image = {};
                const linkRaw = this.safeRun(() => imageElement.getAttribute('srcset'));
                const link = this.safeRun(() => linkRaw === null || linkRaw === void 0 ? void 0 : linkRaw.split('?')[0].replace(/media\d+/g, 'i'));
                image.src = link;
                return image;
            });
            result = images.slice(0, 30);
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
    log(error) {
        if (this.logError) {
            console.error(error);
        }
    }
    parseHTML(html) {
        const { window } = new jsdom_1.JSDOM(html);
        return window.document;
    }
    getHtmlByLink(link) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.page.goto(`${this.linkBase}${this.stringToLinkType(link)}`, { waitUntil: 'domcontentloaded' });
                // Get the HTML content of the page
                // Scroll down the page to load more images
                // await this.page.evaluate(scrollToBottom);
                const searchResultsSelector = '.giphy-grid';
                yield this.page.waitForSelector(searchResultsSelector);
                yield this.page.waitForTimeout(1400);
                const pageHTML = yield this.page.content();
                this.currentUrl = this.page.url();
                // Return the HTML content as a string
                return pageHTML;
            }
            catch (e) {
                this.log(e);
                return '';
            }
        });
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
function GifImages() {
    return new GifEngine();
}
exports.default = GifImages;
