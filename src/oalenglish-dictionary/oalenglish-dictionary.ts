import fs from 'fs/promises';
import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import PhonEngine from '../phonetics-engine/phonetics-engine';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as path from 'path';

export class Pronunciation {
    phonetics?: string;
    sound?: string;
}

type VerbFormType = 'root' | 'thirdps' | 'past' | 'pastpart' | 'prespart' | 'neg' | 'short';

export type VerbFormGroup = VerbForm[];

export class Variant {
    variant?: string;
    highlight?: string[];
}

export class VerbForm {
    type?: VerbFormType;
    prefix?: string;
    spelling?: string;
    phonetics?: Phonetics;
}

export class Inflection {
    type?: string;
    spelling?: string;
    phonetics?: Phonetics;
}

export class Sense {
    level?: string; //
    variants?: Variant[]; //
    partOfSpeech?: string; //
    usage?: string;  //
    labels?: string; //
    disclaimer?: string; //
    definition?: string; //
    referenceGroup?: ReferenceGroup;
    grammar?: string; //
    cf?: string; //
    senseTop?: SenseTop;
    examples?: SenseExample[]; //
}

export class PhrasalVerbEntry {
    spelling?: string;
    usage?: string;
    labels?: string;
    variants?: Variant[];
    disclaimer?: string;
    senses?: Sense[];
}
export class Idiom {
    idiom?: string;
    // definition?: string;
    usage?: string;
    labels?: string;
    variants?: Variant[];
    // partOfSpeech?: string;
    disclaimer?: string;
    // referenceGroup?: ReferenceGroup;
    // grammar?: string;
    // cf?: string;
    senses?: Sense[];
    // examples?: SenseExample[];
}

export class SenseTop {
    labels?: string;
    variants?: Variant[];
    disclaimer?: string;
    usage?: string;
}

export class SenseEntry {
    meaning?: string;
    senses?: Sense[];
}

export class SenseExample {
    labels?: string;
    cf?: string;
    sentence?: SentenceExample;
}

export class SentenceExample {
    sentence?: string;
    highlight?: string;
    gloss?: string;
}

export class Phonetics {
    british?: Pronunciation[];
    northAmerican?: Pronunciation[];
}

export class WordEntry {
    usage?: string; //
    disclaimer?: string; //
    link?: string;
    spelling?: string; //
    phrasalVerbEntries?: PhrasalVerbEntry[];
    partOfSpeech?: string; //
    labels?: string; //
    level?: string; //
    grammar?: string; //
    // examples?: SenseExample[];
    variants?: Variant[]; //
    phonetics?: Phonetics; //
    // definition?: string; //
    referenceGroup?: ReferenceGroup; //
    inflections?: Inflection[];
    verbForms?: VerbFormGroup[]; //
    senses?: SenseEntry[] | Sense[]; //
    idioms?: Idiom[]; //
    phrasalVerbs?: PhrasalVerb[]; //
    nearbyWords?: NearbyWord[];
    resultList?: string[];
}

export class NearbyWord {
    link?: string;
    spelling?: string;
    partOfSpeech?: string;
}

export class ReferenceGroup {
    hint?: string;
    references?: Reference[];
}

export class Reference {
    link?: string;
    spelling?: string;
}

export class PhrasalVerb {
    reference?: Reference;
}

class OALEnglishDictionary {
    constructor() {}

    private linkBase = 'https://www.oxfordlearnersdictionaries.com/definition/english/';
    private searchLink = 'https://www.oxfordlearnersdictionaries.com/search/english/?q=';
    private browser!: Browser;
    private currentUrl!: string;
    private page!: Page;
    logError = false;
    private userDataDir = './puppeteer-data/oadl-engine';

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
        try {
            await this.createUserDataDirectory();
            this.browser = await puppeteer.launch({
                headless: 'new', // Opt in to the new headless mode
                userDataDir: this.userDataDir,
                args: ['--no-sandbox', '--disable-setuid-sandbox'], // Use these flags for better compatibility
                devtools: false, // Disable DevTools
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
        } catch (e) {
            this.log(e);
        }
    }

    async searchWordLink(link: string): Promise<WordEntry> {
        await this.initialize();
        const htmlContent = await this.getHtmlByLink(link);
        this.close();
        // const htmlContent = await fs.readFile('test.html', 'utf8');
        return this.scrape(htmlContent);
    }

    async saveSounds<T>(obj: T, spelling?: string): Promise<T> {
            // Base case: if obj is not an object, return it as is
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }
            // Initialize a new object to store the modified values
            const modifiedObj: any = Array.isArray(obj) ? [] : {};
            const title = (obj as any).spelling || spelling || 'word';
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // Recursively call modifySoundKey for nested objects
                    modifiedObj[key] = await this.saveSounds(obj[key], title);
                    // Check if the key is 'sound', and if so, run the callback function
                    if (key === 'sound') {
                        if (obj[key]) {
                            await this.safeRun(async () => {
                                modifiedObj[key] = await this.downloadAndSaveMp3(obj[key] as string, title);
                            })
                        }
                    }
                }
            }
        return modifiedObj;
    }
    private async downloadAndSaveMp3(url: string, name: string): Promise<string> {
        try {
            // Use Axios to download the MP3 file
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // Generate a unique filename
            const uniqueString = uuidv4();
            const fileExtension = '.mp3'; // Assuming it's an MP3 file
            let title = name.toLocaleLowerCase().trim().replace(/\s/g, '-'); // Default title if 'title' is not provided
        
            // Sanitize the title before constructing the new file name
            title = this.sanitizeFileName(title);
            const newFileName = `${title}_${uniqueString}${fileExtension}`;
            // Save the downloaded file to the 'uploads' directory
            const filePath = path.join(__dirname, '../../uploads', newFileName);
            await fs.writeFile(filePath, response.data);
        
            return newFileName;
        } catch (error) {
            return url;
        }
    }
    private sanitizeFileName = (fileName: string) => {
        // Replace characters not allowed in file names with underscores
        return fileName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    };
    async searchWord(query: string): Promise<WordEntry> {
        await this.initialize();
        const htmlContent = await this.getHtml(query);
        this.close();
        // const htmlContent = await fs.readFile('test.html', 'utf8');
        return this.scrape(htmlContent);
    }

    private getLink(url: string): string | undefined{
        let link = undefined;
        try {
            const linkRaw = this.safeRun<string>(() => url.split('/').pop()?.split('?')[0]);
            if (linkRaw) {
                link = linkRaw;
            }
        } catch(e) {
            this.log(e);
        }
        return link;
    } 
    private scrape(html: string): WordEntry {
        const dom = this.parseHTML(html);
        const word = this.getWordEntry(dom);
        return word;
    }
    private getResultItems(dom: Document): string[] {
        let result: string[] = [];
        try {
            const parent = this.safeRun<Element>(() => dom.querySelector('.result-list'));
            if (parent) {
                const resultItemsRaw = Array.from(parent.children);
                const resultItems = resultItemsRaw.map((resultItemElement) => {
                    return this.safeRun(() => resultItemElement.querySelector('a')?.textContent?.trim()) as string;
                });
                result = resultItems;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }
    private getNearbyWords(dom: Document): NearbyWord[]{
        let result: NearbyWord[] = [];
        try {
            const parent = this.safeRun<Element>(() => dom.querySelector('.responsive_row.nearby'));
            if (parent) {
                const subParent = parent.querySelector('.list-col') as Element;
                const nearbyWordsRaw = Array.from(subParent.children);
                const nearbyWords = nearbyWordsRaw.map((nearbyWordElement) => {
                    const nearbyWord: NearbyWord = {};
                    nearbyWord.link = this.safeRun(() => nearbyWordElement.querySelector('a')?.getAttribute('href')?.split('/').pop());
                    const container = nearbyWordElement.querySelector('.hwd') as Element;
                    const spellingAndPartRaw = Array.from(container?.childNodes) as Element[];
                    nearbyWord.spelling = this.safeRun<string>(() => spellingAndPartRaw[0].textContent?.trim());
                    nearbyWord.partOfSpeech = this.safeRun<string>(() => spellingAndPartRaw[1].textContent?.trim());;
                    return nearbyWord;
                })
                result = nearbyWords;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getWordEntry(dom: Document): WordEntry{
        const wordEntry: WordEntry = {};
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

    private getMainPhonetics(dom: Document): Phonetics {
        const phonetics: Phonetics = {}
        phonetics.british = this.getRPPronunciation(dom);
        phonetics.northAmerican = this.getGAPronunciation(dom);
        return phonetics;
    }

    private getInflections(dom: Document): Inflection[] {
        let result: Inflection[] = [];
        try {
            const parent = this.safeRun<Element>(() => dom.querySelector('.inflections'));
            if (parent) {
                const inflectionsAllRaw = Array.from(parent.childNodes) as Element[];
                let inflectionRawGroup: Element[][] = [];
                let currentGroup: Element[] = [];
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
                    const inflection: Inflection = {};
                    inflection.type = this.safeRun<string>(() => elementGroup[0].textContent?.replace(/[+(),]/g, '').trim());
                    inflection.spelling = this.safeRun<string>(() => elementGroup[1].textContent?.trim());
                    const container = dom.querySelector('.inflections') as Element;
                    inflection.phonetics = {
                        british: this.getRPPronunciation(dom, parent),
                        northAmerican: this.getGAPronunciation(dom, parent),
                    }
                    return inflection;
                })
                result = inflections;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getPhrasalVerbs(dom: Document): PhrasalVerb[] {
        let result: PhrasalVerb[] = [];
        try {
            const container = this.safeRun<Element>(() => dom.querySelector('.phrasal_verb_links .pvrefs'));
            if (container) {
                const phrasalVerbsRaw = Array.from(container.querySelectorAll('.li'));
                const phrasalVerbs = phrasalVerbsRaw.map((phrasalVerbElment) => {
                    const refElement = this.safeRun<Element>(() => phrasalVerbElment.querySelector('.Ref'));
                    const phrasalVerb: PhrasalVerb = {};
                    if (refElement) {
                        phrasalVerb.reference = this.getReference(refElement, true);
                    }
                    return phrasalVerb;
                });

                result = phrasalVerbs;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getIdioms(dom: Document): Idiom[] {
        let result: Idiom[] = [];
        try {
            const container = this.safeRun<Element>(() => dom.querySelector('.idioms'));
            if (container) {
                const idiomsRaw = Array.from(container.querySelectorAll('.idm-g'));
                const idioms = idiomsRaw.map((idiomElement) => {
                    const idiom: Idiom = {};
                    idiom.idiom = this.safeRun<string>(() => idiomElement.querySelector('.top-container .webtop .idm')?.textContent?.trim());
                    // idiom.definition = this.safeRun<string>(() => idiomElement.querySelector('.def')?.textContent?.trim());
                    // idiom.disclaimer = this.safeRun<string>(() => idiomElement.querySelector('.dis-g')?.textContent?.trim());
                    idiom.usage = this.safeRun<string>(() => idiomElement.querySelector('.top-container .webtop .use')?.textContent?.trim());
                    idiom.labels = this.safeRun(() => {
                        return this.getLabels(idiomElement.querySelector('.top-container .webtop') as Element, true);
                    });
                    idiom.disclaimer = this.safeRun<string>(() => idiomElement.querySelector('.top-container .webtop .dis-g')?.textContent?.trim());
                    // idiom.examples = this.getSenseExamples(idiomElement);
                    idiom.variants = this.getVariants(idiomElement, true);
                    idiom.senses = this.safeRun(() => {
                        const container = idiomElement.querySelector('ol') as Element;
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
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getSenseTop(sense: Element): SenseTop {
        let senseTop: SenseTop = {};
        try {
            const container = this.safeRun<Element>(() => {
                return Array.from(sense.children).find((child) => {
                    return child.classList.contains('sensetop');
                });
            });
            if (container) {
                // idiom.definition = this.safeRun<string>(() => idiomElement.querySelector('.def')?.textContent?.trim());
                // idiom.disclaimer = this.safeRun<string>(() => idiomElement.querySelector('.dis-g')?.textContent?.trim());
                senseTop.usage = this.safeRun<string>(() => container.querySelector('.use')?.textContent?.trim());
                senseTop.labels = this.safeRun(() => this.getLabels(container, true));
                senseTop.disclaimer = this.safeRun<string>(() => container.querySelector('.dis-g')?.textContent?.trim());
                // idiom.examples = this.getSenseExamples(idiomElement);
                senseTop.variants = this.safeRun(() => this.getVariants(container, true));
            }
        } catch (e) {
            this.log(e);
        }
        return senseTop;
    }
    private getPhrasalVerbEntries(dom: Document): PhrasalVerbEntry[] {
        let result: PhrasalVerbEntry[] = [];
        try {
            const container = this.safeRun<Element>(() => dom.querySelector('.entry'));
            if (container) {
                const phrasalVerbEntriesRaw = Array.from(container.children).filter((child) => child.classList.contains('pv-g'));
                const phrasalVerbEntries = phrasalVerbEntriesRaw.map((phrasalVerbEntryElement) => {
                    const phrasalVerbEntry: PhrasalVerbEntry = {};
                    phrasalVerbEntry.spelling = this.safeRun(() => phrasalVerbEntryElement.querySelector('.webtop .pv')?.textContent?.trim());
                    phrasalVerbEntry.usage = this.safeRun<string>(() => phrasalVerbEntryElement.querySelector('.top-container .webtop .use')?.textContent?.trim());
                    phrasalVerbEntry.labels = this.safeRun(() => {
                        return this.getLabels(phrasalVerbEntryElement.querySelector('.top-container .webtop') as Element, true);
                    });
                    phrasalVerbEntry.disclaimer = this.safeRun<string>(() => phrasalVerbEntryElement.querySelector('.top-container .webtop .dis-g')?.textContent?.trim());
                    // phrasalVerbEntry.examples = this.getSenseExamples(phrasalVerbEntryElement);
                    phrasalVerbEntry.variants = this.getVariants(phrasalVerbEntryElement, true);
                    phrasalVerbEntry.senses = this.safeRun(() => {
                        const container = phrasalVerbEntryElement.querySelector('ol') as Element;
                        const senses = this.getSenses(container, true);
                        return senses;
                    });
                    return phrasalVerbEntry;
                });
                result = phrasalVerbEntries;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }
    private getSentenceExample(senteceElement: Element): SentenceExample {
        let sentenceExample: SentenceExample = {};
        try {
            const container = senteceElement;
            if (container) {
                sentenceExample.sentence = this.safeRun<string>(() => container.querySelector('.x')?.textContent?.trim());
                sentenceExample.gloss = this.safeRun<string>(() => container.querySelector('.x .gloss')?.textContent?.trim());
                sentenceExample.highlight = this.safeRun<string>(() => container.querySelector('.x .cl')?.textContent?.trim());
            }
        } catch (e) {
            this.log(e);
        }
        return sentenceExample;
    }
    private getSenseExamples(senseElement: Element): SenseExample[] {
        let result: SenseExample[] = [];
        try {
            const container = this.safeRun<Element>(() => senseElement.querySelector('.examples'));
            if (container) {
                const examplesRaw = Array.from(container.children);
                const examples = examplesRaw.map((exampleElement) => {
                    const example: SenseExample = {};
                    example.labels = this.safeRun<string>(() => exampleElement.querySelector('.labels')?.textContent?.trim());
                    example.cf = this.safeRun<string>(() => exampleElement.querySelector('.cf')?.textContent?.trim());
                    example.sentence = this.getSentenceExample(exampleElement);
                    return example;
                });
                result = examples;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getSensesAll(dom: Document): SenseEntry[] | Sense[]{
        let result: SenseEntry[] | Sense[] = this.getSenses(dom);
        if (result.length > 0) {
            return result;
        } else {
            result = this.getSenseEntries(dom);
            return result;
        }
    }

    private getSenseEntries(dom: Document): SenseEntry[] {
        let result: SenseEntry[]  = [];
        try {
            const bigParent = this.safeRun(() => dom.querySelector('.entry')) as Element;
            if (bigParent) {
                const parent = Array.from(bigParent.children).find((child) =>
                    child.classList.contains('senses_multiple')
                ) as HTMLElement;
                const senseEntriesRaw = Array.from(parent.children).filter((child) => child.tagName === 'SPAN');
                const senseEntries = senseEntriesRaw.map((senseEntryElement) => {
                    const senseEntry: SenseEntry = {};
                    senseEntry.meaning = this.safeRun<string>(() => senseEntryElement.querySelector('.shcut')?.textContent?.trim());
                    senseEntry.senses = this.getSenses(senseEntryElement, true);
                    return senseEntry;
                })
                result = senseEntries;
            }
            
        } catch (e){
            this.log(e);
        }

        return result;
    }

    private getSenses(dom: Document | Element, parentElement = false): Sense[]{
        let result: Sense[]  = [];
        try {
            let parent: Element | Document;
            if (!parentElement) {
                const bigParent = this.safeRun(() => dom.querySelector('.entry')) as Element;
                parent = Array.from(bigParent.children).find((child) =>
                    child.classList.contains('senses_multiple') || child.classList.contains('sense_single')
                ) as HTMLElement;
            } else {
                parent = dom;
            }
            const sensesRaw = Array.from(parent.children).filter((child) => child.tagName === 'LI');
            const senses = sensesRaw.map((senseElement) => {
                const sense: Sense = {};
                sense.level = this.getLevel(senseElement, true);
                sense.senseTop = this.getSenseTop(senseElement);
                sense.variants = this.getVariants(senseElement, true);
                sense.partOfSpeech = this.getPartOfSpeech(senseElement, true);
                sense.disclaimer = this.safeRun<string>(() => senseElement.querySelector('.dis-g')?.textContent?.trim());
                sense.definition = this.safeRun<string>(() => senseElement.querySelector('.def')?.textContent?.trim());
                sense.referenceGroup = this.getReferenceGroup(senseElement, true);
                sense.usage = this.safeRun<string>(() => senseElement.querySelector('.use')?.textContent?.trim());
                sense.labels = this.getLabels(senseElement, true);
                sense.grammar = this.safeRun<string>(() => senseElement.querySelector('.grammar')?.textContent?.trim());
                sense.cf = this.safeRun<string>(() => {
                    return Array.from(senseElement.children).find((child) => {
                        return child.classList.contains('cf');
                    })?.textContent?.trim();
                });
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
                const testSubParent = this.safeRun<HTMLSpanElement>(() => parent.querySelector('.phonetics'));
                if (testSubParent) {
                    subParent = testSubParent;
                } else {
                    subParent = parent;
                }
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
                const testSubParent = this.safeRun<HTMLSpanElement>(() => parent.querySelector('.phonetics'));
                if (testSubParent) {
                    subParent = testSubParent;
                } else {
                    subParent = parent;
                }
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

    private getVariants(dom: Document | Element, senseElement = false): Variant[]{
        let result: Variant[] = [];
        try {
            let parent: Element;
            if (!senseElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
            } else {
                parent = dom as Element;
            }
            const variantsRaw = Array.from(parent.querySelectorAll('.variants'));
            const variants = variantsRaw.map((variantElement) => {
                const variant: Variant = {};
                variant.variant = this.safeRun<string>(() => variantElement?.textContent?.trim());
                variant.highlight = this.safeRun<string[]>(() => {
                    return Array.from(variantElement?.querySelectorAll('.v-g .v')).map((highlightElement) => {
                        return highlightElement.textContent?.trim();
                    });
                });
                return variant;
            });
            result = variants;
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getDefinition(dom: Document | Element, parentElement = false): string | undefined{
        let definition: string | undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                const testParent = this.safeRun<HTMLDivElement>(() => dom.querySelector('.entry'));
                if (testParent) {
                    parent = testParent;
                    definition = this.safeRun<string>(() => {
                        const senseSingleElement = Array.from(parent.children).find((child) =>
                            child.classList.contains('sense_single')
                        );
                        if (senseSingleElement) {
                            return senseSingleElement.querySelector('.def')?.textContent?.trim();
                        }
                    });
                }
            } else {
                parent = dom as Element;
                definition = parent.querySelector('.def')?.textContent?.trim();
            }
            
        } catch (e) {
            this.log(e);
        }
        return definition;
    }
    private getReferenceGroup(dom: Document | Element, parentElement = false): ReferenceGroup{
        let refGroup: ReferenceGroup = {};
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.entry > .sense_single > .sense .xrefs') as HTMLDivElement;
            } else {
                parent = Array.from(dom.children).find((child) =>
                        child.classList.contains('xrefs')
                    ) as Element;
            }
            refGroup = {
                hint: this.safeRun<string>(() => parent?.querySelector('.prefix')?.textContent?.trim()),
                references: this.safeRun<Reference[]>(() => {
                    return Array.from((parent as Element).querySelectorAll('.Ref')).map((refElement) => {
                        const reference = this.getReference(refElement, true);
                        return reference;
                    });
                }) || [],
            }
        } catch (e) {
            this.log(e);
        }
        return refGroup;
    }

    

    private getReference(dom: Document | Element, parentElement = false): Reference{
        let reference: Reference  = {};
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.Ref') as HTMLDivElement;
                
            } else {
                parent = dom as Element;
            }
            let link = this.safeRun<string>(() => parent.getAttribute('href')?.split('/').pop());
            link = this.safeRun<string>(() => link?.split('#').shift()) || link;
            link = this.safeRun<string>(() => link?.split('=').pop()) || link;
            reference.link = link;
            reference.spelling = this.safeRun<string>(() => parent.querySelector('.xr-g')?.textContent?.trim());
        } catch (e) {
            this.log(e);
        }
        return reference;
    }

    private getLevel(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
                result = this.safeRun<string>(() => parent.querySelector('.symbols a')?.getAttribute('href')?.split('=').pop());
            } else {
                parent = dom as Element;
                result = this.safeRun<string>(() => parent.querySelector('.sensetop .symbols a')?.getAttribute('href')?.split('=').pop());
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getPartOfSpeech(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
            } else {
                parent = dom as Element;
            }
            result = this.safeRun<string>(() => parent.querySelector('.pos')?.textContent?.trim()); 
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getWord(dom: Document): string | undefined{
        let result: string | undefined = undefined;
        try {
            const parent = dom.querySelector('.webtop') as HTMLDivElement;
            result = this.safeRun<string>(() => parent.querySelector('.headword')?.textContent?.trim());
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getGrammar(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
                result = this.safeRun<string>(() => parent.querySelector('.grammar')?.textContent?.trim());
            } else {
                parent = dom as Element;
                result = this.safeRun<string>(() => parent.querySelector('.grammar')?.textContent?.trim());
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getLabels(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.entry .webtop') as HTMLDivElement;
                result = this.safeRun<Element>(() => {
                    return Array.from(parent.children).find((child) => {
                        return child.classList.contains('labels');
                    });
                })?.textContent?.trim() || undefined;
            } else {
                parent = dom as Element;
                result = this.safeRun<Element>(() => {
                    return Array.from(parent.children).find((child) => {
                        return child.classList.contains('labels');
                    });
                })?.textContent?.trim() || undefined;
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }

    private getDisclaimer(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
                result = this.safeRun<string>(() => parent.querySelector('.dis-g')?.textContent?.trim());
            } else {
                parent = dom as Element;
                result = this.safeRun<string>(() => parent.querySelector('.dis-g')?.textContent?.trim());
            }
        } catch (e) {
            this.log(e);
        }
        return result;
    }
    private getUsage(dom: Document | Element, parentElement = false): string | undefined{
        let result: string | undefined = undefined;
        try {
            let parent: Element;
            if (!parentElement) {
                parent = dom.querySelector('.webtop') as HTMLDivElement;
                result = this.safeRun<string>(() => parent.querySelector('.use')?.textContent?.trim());
            } else {
                parent = dom as Element;
                result = this.safeRun<string>(() => parent.querySelector('.use')?.textContent?.trim());
            }
        } catch (e) {
            this.log(e);
            return '';
        }
        return result;
    }
    private async getHtmlByLink(link: string): Promise<string> {
        try {
            await this.page.goto(`${this.linkBase}${link}`, { waitUntil: 'domcontentloaded' });
            // Get the HTML content of the page
            const searchResultsSelector = '.responsive_row';
            await this.page.waitForSelector(searchResultsSelector, { visible: true });
            const pageHTML = await this.page.content();
            this.currentUrl = this.page.url();
            // Return the HTML content as a string
            return pageHTML;
        } catch (e) {
            this.log(e);
            this.close();
            return '';
        }
    }

    private async getHtml(query: string): Promise<string> {
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

            await this.page.goto(`${this.searchLink}${query}`, { waitUntil: 'domcontentloaded' });
            // Get the HTML content of the page
            const searchResultsSelector = '.responsive_row';
            await this.page.waitForSelector(searchResultsSelector, { visible: true });
            const pageHTML = await this.page.content();
            this.currentUrl = this.page.url();
            // Return the HTML content as a string
            return pageHTML;
        } catch (e) {
            this.log(e);
            this.close();
            return '';
        }
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
    private async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export default function OALDic() {
    return new OALEnglishDictionary();
}
