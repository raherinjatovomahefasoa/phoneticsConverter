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
exports.StockImage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const jsdom_1 = require("jsdom");
class StockImage {
}
exports.StockImage = StockImage;
class iStockEngine {
    constructor() {
        this.linkBase = 'https://www.istockphoto.com/search/2/image?phrase=';
        this.logError = false;
        this.userDataDir = './puppeteer-data/image-engine';
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
            yield this.page.setViewport({ width: 1280, height: 10000 });
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
            yield this.initialize();
            const htmlContent = yield this.getHtmlByLink(query);
            this.close();
            // const htmlContent = await fs.readFile('test.html', 'utf8');
            return this.scrape(htmlContent);
        });
    }
    scrape(html) {
        const dom = this.parseHTML(html);
        const images = this.getImages(dom);
        return images;
    }
    getImages(dom) {
        let result = [];
        try {
            const parent = dom.querySelector('.DE6jTiCmOG8IPNVbM7pJ');
            const imagesRaw = Array.from(parent.querySelectorAll('picture source'));
            const images = imagesRaw.map((imageElement) => {
                const image = {};
                image.src = this.safeRun(() => imageElement.getAttribute('srcset'));
                return image;
            });
            result = images;
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
            yield this.page.goto(`${this.linkBase}${link}`);
            // Get the HTML content of the page
            const pageHTML = yield this.page.content();
            this.currentUrl = this.page.url();
            // Return the HTML content as a string
            return pageHTML;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser) {
                yield this.browser.close();
            }
        });
    }
}
function iStockImages() {
    return new iStockEngine();
}
exports.default = iStockImages;
