import fs from 'fs/promises';
import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';

export class StockImage {
    src?: string;
}

class iStockEngine {
    private linkBase = 'https://www.istockphoto.com/search/2/image?phrase=';
    private browser!: Browser;
    private currentUrl!: string;
    private page!: Page;
    logError = false;
    private userDataDir = './puppeteer-data/image-engine';

    private async createUserDataDirectory() {
        try {
            // Use fs.access to check if the directory exists
            await fs.access(this.userDataDir);
        } catch (error) {
            // If it doesn't exist, create it
            await fs.mkdir(this.userDataDir, { recursive: true });
        }
    }
    private async initialize() {
        await this.createUserDataDirectory();
        this.browser = await puppeteer.launch({
            headless: 'new', // Opt in to the new headless mode
            userDataDir: this.userDataDir,
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1280, height: 10000 });
        // Enable request interception
        await this.page.setRequestInterception(true);

            // Intercept and block certain types of requests
            this.page.on('request', (request: any) => {
            if (
                request.resourceType() === 'image' || // Block image requests
                request.resourceType() === 'stylesheet' || // Block CSS requests
                request.resourceType() === 'media' || // Media resources include audio and video
                request.resourceType() === 'font'
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }

    async search(query: string) {
        await this.initialize();
        const htmlContent = await this.getHtmlByLink(query);
        this.close();
        // const htmlContent = await fs.readFile('test.html', 'utf8');
        return this.scrape(htmlContent);
    }

    private scrape(html: string) {
        const dom = this.parseHTML(html);
        const images = this.getImages(dom);
        return images;
    }

    private getImages(dom: Document): StockImage[] {
        let result: StockImage[] = [];
        try {
            const parent = dom.querySelector('.DE6jTiCmOG8IPNVbM7pJ') as Element;
            const imagesRaw = Array.from(parent.querySelectorAll('picture source'));
            const images = imagesRaw.map((imageElement) => {
                const image: StockImage = {}
                image.src = this.safeRun<string>(() => imageElement.getAttribute('srcset'));
                return image;
            })
            result = images;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private safeRun<T>(toRun: (...args: any[]) => any, ...args: any[]): T | undefined{
        try {
            return toRun(...args);
        } catch (e) {
            return undefined;
        }
    }    

    private log(error: unknown) {
        if (this.logError) {
            console.error(error);
        }
    }
    private parseHTML(html: string): Document {
        const { window } = new JSDOM(html);
        return window.document;
    }

    private async getHtmlByLink(link: string): Promise<string> {
        await this.page.goto(`${this.linkBase}${link}`);
        // Get the HTML content of the page
        const pageHTML = await this.page.content();
        this.currentUrl = this.page.url();
        // Return the HTML content as a string
        return pageHTML;
    }
    private async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export default function iStockImages() {
    return new iStockEngine();
}