export interface Pronunciation {
    phonetics: string;
    sound: string;
}
export interface Idiom {
    idiom?: string;
    definiton?: string;
    usage?: string;
    labels?: string;
    examples?: SenseExample[];
}
type VerbFormType = 'root' | 'thirdps' | 'past' | 'pastpart' | 'prespart' | 'neg' | 'short';
export type VerbFormGroup = VerbForm[];
export interface Variant {
    variant?: string;
    highlight?: string[];
}
export interface VerbForm {
    type?: VerbFormType;
    prefix?: string;
    spelling?: string;
    phonetics?: Phonetics;
}
export interface Inflection {
    type?: string;
    spelling?: string;
    phonetics?: Phonetics;
}
export interface Sense {
    level?: string;
    variants?: Variant[];
    partOfSpeech?: string;
    definition?: string;
    grammar?: string;
    cf?: string;
    examples?: SenseExample[];
}
export interface SenseEntry {
    meaning?: string;
    senses?: Sense[];
}
export interface SenseExample {
    cf?: string;
    example?: string;
    highlight?: string;
}
export interface Phonetics {
    british?: Pronunciation[];
    northAmerican?: Pronunciation[];
}
export interface WordEntry {
    link?: string;
    spelling?: string;
    partOfSpeech?: string;
    level?: string;
    grammar?: string;
    variants?: Variant[];
    phonetics?: Phonetics;
    definition?: Definition;
    inflections?: Inflection[];
    verbForms?: VerbFormGroup[];
    senses?: SenseEntry[] | Sense[];
    idioms?: Idiom[];
    nearbyWords?: NearbyWord[];
    resultList?: string[];
}
export interface NearbyWord {
    link?: string;
    spelling?: string;
    partOfSpeech?: string;
}
export interface Definition {
    definition?: string;
    reference?: Reference;
}
export interface Reference {
    definition?: string;
    link?: string;
    spelling?: string;
}
declare class OALEnglishDictionary {
    constructor();
    private linkBase;
    private browser;
    private currentUrl;
    private page;
    logError: boolean;
    private userDataDir;
    private createUserDataDirectory;
    private initialize;
    searchWordLink(link: string): Promise<WordEntry>;
    searchWord(query: string): Promise<WordEntry>;
    private getLink;
    private scrape;
    private getResultItems;
    private getNearbyWords;
    private getWordEntry;
    private getMainPhonetics;
    private getInflections;
    private getIdioms;
    private getSenseExamples;
    private getSensesAll;
    private getSenseEntries;
    private getSenses;
    private getVerbForms;
    private safeRun;
    private getGAPronunciation;
    private getRPPronunciation;
    private getVariants;
    private getDefinition;
    private getLevel;
    private getPartOfSpeech;
    private getWord;
    private getGrammar;
    private getHtmlByLink;
    private getHtml;
    private parseHTML;
    private log;
    private close;
}
export default function OALDic(): OALEnglishDictionary;
export {};
