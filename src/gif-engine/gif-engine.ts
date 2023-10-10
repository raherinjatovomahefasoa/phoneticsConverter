import fs from 'fs/promises';
import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
// import scrollToBottom from 'scroll-to-bottomjs';
export interface GifImage {
    src?: string;
}

class GifEngine {
    private linkBase = 'https://giphy.com/search/';
    private browser!: Browser;
    private currentUrl!: string;
    private page!: Page;
    logError = false;
    private userDataDir = './puppeteer-data/gif-engine';

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

        // Enable request interception
        await this.page.setRequestInterception(true);
        await this.page.setViewport({ width: 1280, height: 10000 });
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

    private scrape(html: string): GifImage[] {
        const dom = this.parseHTML(html);
        const images = this.getGifImages(dom);
        // console.log(images);
        return images;
    }

    private getGifImages(dom: Document): GifImage[] {
        let result: GifImage[] = [];
        try {
            const parent = dom.querySelector('.giphy-grid div') as Element;
            const imagesRaw = Array.from(parent.querySelectorAll('picture source'));
            const images = imagesRaw.map((imageElement) => {
                const image: GifImage = {}
                const linkRaw = this.safeRun<string>(() => imageElement.getAttribute('srcset'));
                const link = this.safeRun<string>(() => linkRaw?.split('?')[0].replace(/media\d+/g, 'i'));
                image.src = link;
                return image;
            })
            result = images.slice(0, 30);
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
        // Scroll down the page to load more images
        // await this.page.evaluate(scrollToBottom);
        await this.page.waitForTimeout(1000);
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

export default function GifImages() {
    return new GifEngine();
}