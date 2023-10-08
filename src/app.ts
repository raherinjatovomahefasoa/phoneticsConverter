import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import PhonEngine from './phonetics-engine/phonetics-engine';

interface Pronunciation {
    phonetics: string;
    sound: string;
}

class OALEnglishDictionary {
    constructor() {}

    private linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
    private browser!: Browser;
    private page!: Page;
    private logError = true;

    private async initialize() {
        this.browser = await puppeteer.launch({
            headless: false, // Opt in to the new headless mode
            userDataDir: './puppeteer-data',
          });
        this.page = await this.browser.newPage();

        // Enable request interception
        // await this.page.setRequestInterception(true);

        //     // Intercept and block certain types of requests
        //     this.page.on('request', (request: any) => {
        //     if (
        //         request.resourceType() === 'image' || // Block image requests
        //         request.resourceType() === 'stylesheet' || // Block CSS requests
        //         request.resourceType() === 'font' ||// Block font requests
        //         request.resourceType() === 'media' || // Media resources include audio and video
        //         request.resourceType() === 'font'
        //     ) {
        //         request.abort();
        //     } else {
        //         request.continue();
        //     }
        // });
    }

    async search(query: string) {
        await this.initialize();
        const htmlContent = await this.getHtml(query);
        // const htmlContent = await fs.readFile('test.html', 'utf8');
        // this.close();
        this.scrape(htmlContent);
    }

    private scrape(html: string) {
        const dom = this.parseHTML(html);
        // get word
        // const word = this.getGAPronunciation(dom);
        const phonetics = {
            british: this.getRPPronunciation(dom),
            no_american: this.getGAPronunciation(dom)
        }
        console.log(phonetics);
    }

    private getGAPronunciation(dom: Document): Pronunciation[] | null{
        let result: Pronunciation[] = [];
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            const subParent = parent.querySelector('.phonetics') as HTMLHeadingElement;
            const container = subParent.querySelector('.phons_n_am') as HTMLHeadingElement;

            const phoneticsRaw = Array.from(container.querySelectorAll('.phon'));
            const phonetics = phoneticsRaw.map((phoneticsElement) => {
                return phoneticsElement.textContent?.replace(/\//g, '');
            }) as string[];
            const soundsRaw = Array.from(container.querySelectorAll('.sound.audio_play_button.pron-us'));
            const sounds = soundsRaw.map((audioElement) => {
                return audioElement.getAttribute('data-src-mp3');
            }) as string[];

            for (let i = 0; i < phonetics.length; i++) {
                const pronunciation: Pronunciation = {
                    phonetics: PhonEngine(phonetics[i]).toGA(),
                    sound: sounds[i],
                }
                result.push(pronunciation);
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getRPPronunciation(dom: Document): Pronunciation[] | null{
        let result: Pronunciation[] = [];
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            const subParent = parent.querySelector('.phonetics') as HTMLHeadingElement;
            const container = subParent.querySelector('.phons_br') as HTMLHeadingElement;

            const phoneticsRaw = Array.from(container.querySelectorAll('.phon'));
            const phonetics = phoneticsRaw.map((phoneticsElement) => {
                return phoneticsElement.textContent?.replace(/\//g, '');
            }) as string[];
            const soundsRaw = Array.from(container.querySelectorAll('.sound.audio_play_button.pron-uk'));
            const sounds = soundsRaw.map((audioElement) => {
                return audioElement.getAttribute('data-src-mp3');
            }) as string[];

            for (let i = 0; i < phonetics.length; i++) {
                const pronunciation: Pronunciation = {
                    phonetics: phonetics[i],
                    sound: sounds[i],
                }
                result.push(pronunciation);
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getLevel(dom: Document): string | null{
        let result: string | null = null;
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            const container = parent.querySelector('.symbols a') as HTMLHeadingElement;
            result = container.getAttribute('href')?.split('=').pop() || null;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getPartOfSpeech(dom: Document): string | null{
        let result: string | null = null;
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            const container = parent.querySelector('.pos') as HTMLHeadingElement;
            result = container.textContent;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getWord(dom: Document): string | null{
        let result: string | null = null;
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            const container = parent.querySelector('.headword') as HTMLHeadingElement;
            result = container.textContent;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private async getHtml(query: string): Promise<string> {
        await this.page.goto(this.linkBase);
        const searchInputSelector = '#q';
        const searchButtonSelector = '#search-btn input[type="submit"]'; // Modify selector for the button
        await this.page.waitForSelector(searchButtonSelector);
        // Type the query into the search input field
        await this.page.type(searchInputSelector, query);
        // Click the search button
        await this.page.click(searchButtonSelector);
        // Wait for the search results to load (you may need to adjust the selector and wait time)
        const searchResultsSelector = '.responsive_row';
        await this.page.waitForSelector(searchResultsSelector);
        // Get the HTML content of the page
        const pageHTML = await this.page.content();

        // Return the HTML content as a string
        return pageHTML;
    }
    private parseHTML(html: string): Document {
        const { window } = new JSDOM(html);
        return window.document;
    }
    private log(error: unknown) {
        if (this.logError) {
            console.error(error);
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export default function OALDic() {
    return new OALEnglishDictionary();
}

(async () => {
    await OALDic().search('complicated');
})();
