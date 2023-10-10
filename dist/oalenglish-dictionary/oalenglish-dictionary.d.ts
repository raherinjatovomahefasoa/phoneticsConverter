export declare class Pronunciation {
    phonetics?: string;
    sound?: string;
}
export declare class Idiom {
    idiom?: string;
    definiton?: string;
    usage?: string;
    labels?: string;
    examples?: SenseExample[];
}
type VerbFormType = 'root' | 'thirdps' | 'past' | 'pastpart' | 'prespart' | 'neg' | 'short';
export type VerbFormGroup = VerbForm[];
export declare class Variant {
    variant?: string;
    highlight?: string[];
}
export declare class VerbForm {
    type?: VerbFormType;
    prefix?: string;
    spelling?: string;
    phonetics?: Phonetics;
}
export declare class Inflection {
    type?: string;
    spelling?: string;
    phonetics?: Phonetics;
}
export declare class Sense {
    level?: string;
    variants?: Variant[];
    partOfSpeech?: string;
    definition?: string;
    grammar?: string;
    cf?: string;
    examples?: SenseExample[];
}
export declare class SenseEntry {
    meaning?: string;
    senses?: Sense[];
}
export declare class SenseExample {
    cf?: string;
    example?: string;
    highlight?: string;
}
export declare class Phonetics {
    british?: Pronunciation[];
    northAmerican?: Pronunciation[];
}
export declare class WordEntry {
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
export declare class NearbyWord {
    link?: string;
    spelling?: string;
    partOfSpeech?: string;
}
export declare class Definition {
    definition?: string;
    reference?: ReferenceGroup;
}
export declare class ReferenceGroup {
    hint?: string;
    references?: Reference[];
}
export declare class Reference {
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
    saveSounds<T>(obj: T, spelling?: string): Promise<T>;
    private downloadAndSaveMp3;
    private sanitizeFileName;
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
    private getReference;
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
