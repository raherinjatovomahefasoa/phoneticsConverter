import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import PhonEngine from './phonetics-engine/phonetics-engine';

interface Pronunciation {
    phonetics: string;
    sound: string;
}

type VerbFormType = 'root' | 'thirdps' | 'past' | 'pastpart' | 'prespart' | 'neg' | 'short';
type VerbFormGroup = VerbForm[];
interface VerbForm {
    type?: VerbFormType;
    prefix?: string;
    spelling?: string;
    phonetics?: {
        british?: Pronunciation[];
        northAmerican?: Pronunciation[];
    }
    verbForms?: VerbFormGroup[];
}
interface Sense {
    level?: string;
    partOfSpeech?: string;
    definition?: string;
    grammar?: string;
    cf?: string;
    examples?: SenseExample[];
}
interface SenseExample {
    cf?: string;
    example?: string;
}
class OALEnglishDictionary {
    constructor() {}

    private linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
    private browser!: Browser;
    private page!: Page;
    private logError = false;

    private async initialize() {
        this.browser = await puppeteer.launch({
            headless: 'new', // Opt in to the new headless mode
            userDataDir: './puppeteer-data',
          });
        this.page = await this.browser.newPage();

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
        // await this.initialize();
        // const htmlContent = await this.getHtml(query);
        // this.close();
        const htmlContent = await fs.readFile('test.html', 'utf8');
        this.scrape(htmlContent);
    }

    private scrape(html: string) {
        const dom = this.parseHTML(html);
        const word = this.getSenses(dom);
        
        console.log(word);
    }

    private getSenseExamples(senseElement: Element): SenseExample[] {
        let result: SenseExample[] = [];
        try {
            const container = this.safeRun<Element>(() => senseElement.querySelector('.examples'));
            if (container) {
                const examplesRaw = Array.from(container.children);
                const examples = examplesRaw.map((exampleElement) => {
                    const example: SenseExample = {};
                    example.cf = this.safeRun<string>(() => exampleElement.querySelector('.cf')?.textContent?.trim());
                    example.example = this.safeRun<string>(() => exampleElement.querySelector('.x')?.textContent?.trim());
                    return example;
                });
                result = examples;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getSenses(dom: Document): Sense[]{
        let result: Sense[] = []
        try {
            const parent = dom.querySelector('.senses_multiple') as HTMLElement;
            const sensesRaw = Array.from(parent.children).filter((child) => child.tagName === 'LI');
            const senses = sensesRaw.map((senseElement) => {
                const sense: Sense = {};
                sense.level = this.getLevel(senseElement, true) || undefined;
                sense.partOfSpeech = this.getPartOfSpeech(senseElement, true) || undefined;
                sense.definition = this.safeRun<string>(() => senseElement.querySelector('.def')?.textContent?.trim());
                sense.grammar = this.safeRun<string>(() => senseElement.querySelector('.grammar')?.textContent?.trim());
                sense.cf = this.safeRun<string>(() => senseElement.querySelector('.cf')?.textContent?.trim());
                // get example
                sense.examples = this.getSenseExamples(senseElement);
                return sense;
            })
            result = senses;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getVerbForms(dom: Document): VerbFormGroup[] {
        let result: VerbFormGroup[] = [];
        try {
            const parent = dom.querySelector('.verb_forms_table tbody') as HTMLTableSectionElement;
            const verbFormsRaw = Array.from(parent.children);
            const mainForms = ['root', 'thirdps', 'past', 'pastpart', 'prespart'];
            const verbFormGroups: VerbFormGroup[] = [];
            const verbForms = verbFormsRaw.map((verbFormElement) => {
                const verbForm: VerbForm = {}
                verbForm.type = this.safeRun<VerbFormType>(() => verbFormElement.getAttribute('form'));
                verbForm.prefix = this.safeRun<string>(() => verbFormElement.querySelector('.vf_prefix')?.textContent);
                if (!verbForm.prefix) {
                    verbForm.spelling = this.safeRun<string>(() => verbFormElement.querySelector('.verb_form')?.textContent);
                } else {
                    const verbFormContainer = this.safeRun<string>(() => verbFormElement.querySelector('.verb_form')?.innerHTML);
                    verbForm.spelling = verbFormContainer?.split('</span>').pop()?.trim();
                }
                verbForm.phonetics = {
                    british: this.getRPPronunciation(dom, verbFormElement),
                    northAmerican: this.getGAPronunciation(dom, verbFormElement),
                }
                return verbForm;
            });
            let currentGroup: VerbForm[] = [];
            // Iterate through the array and create groups
            verbForms.forEach((form) => {
                if (mainForms.includes(form.type as VerbFormType)) {
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

    private getGAPronunciation(dom: Document, parentElement?: Element): Pronunciation[]{
        let result: Pronunciation[] = [];
        try {
            let parent: Element;
            let subParent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLHeadingElement;
                subParent = parent.querySelector('.phonetics') as HTMLHeadingElement;
            } else {
                parent = parentElement;
                subParent = parent.querySelector('.phonetics') as HTMLSpanElement;
            }
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

    private getRPPronunciation(dom: Document, parentElement?: Element): Pronunciation[]{
        let result: Pronunciation[] = [];
        try {
            let parent: Element;
            let subParent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLHeadingElement;
                subParent = parent.querySelector('.phonetics') as HTMLHeadingElement;
            } else {
                parent = parentElement;
                subParent = parent.querySelector('.phonetics') as HTMLSpanElement;
            }
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

    private getLevel(dom: Document | Element, parentElement = false): string | null{
        let result: string | null = null;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
            } else {
                parent = dom as Element;
            }
            const container = parent.querySelector('.symbols a') as HTMLHeadingElement;
            result = container.getAttribute('href')?.split('=').pop() || null;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getPartOfSpeech(dom: Document | Element, parentElement = false): string | null{
        let result: string | null = null;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
            } else {
                parent = dom as Element;
            }
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
    await OALDic().search('have');
})();
