export declare class Pronunciation {
    phonetics?: string;
    sound?: string;
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
    usage?: string;
    labels?: string;
    disclaimer?: string;
    definition?: string;
    referenceGroup?: ReferenceGroup;
    grammar?: string;
    cf?: string;
    senseTop?: SenseTop;
    examples?: SenseExample[];
}
export declare class PhrasalVerbEntry {
    spelling?: string;
    usage?: string;
    labels?: string;
    variants?: Variant[];
    disclaimer?: string;
    senses?: Sense[];
}
export declare class Idiom {
    idiom?: string;
    usage?: string;
    labels?: string;
    variants?: Variant[];
    disclaimer?: string;
    senses?: Sense[];
}
export declare class SenseTop {
    labels?: string;
    variants?: Variant[];
    disclaimer?: string;
    usage?: string;
}
export declare class SenseEntry {
    meaning?: string;
    senses?: Sense[];
}
export declare class SenseExample {
    labels?: string;
    cf?: string;
    sentence?: SentenceExample;
}
export declare class SentenceExample {
    sentence?: string;
    highlight?: string;
    gloss?: string;
}
export declare class Phonetics {
    british?: Pronunciation[];
    northAmerican?: Pronunciation[];
}
export declare class WordEntry {
    usage?: string;
    disclaimer?: string;
    link?: string;
    spelling?: string;
    phrasalVerbEntries?: PhrasalVerbEntry[];
    partOfSpeech?: string;
    labels?: string;
    level?: string;
    grammar?: string;
    variants?: Variant[];
    phonetics?: Phonetics;
    referenceGroup?: ReferenceGroup;
    inflections?: Inflection[];
    verbForms?: VerbFormGroup[];
    senses?: SenseEntry[] | Sense[];
    idioms?: Idiom[];
    phrasalVerbs?: PhrasalVerb[];
    nearbyWords?: NearbyWord[];
    resultList?: string[];
}
export declare class NearbyWord {
    link?: string;
    spelling?: string;
    partOfSpeech?: string;
}
export declare class ReferenceGroup {
    hint?: string;
    references?: Reference[];
}
export declare class Reference {
    link?: string;
    spelling?: string;
}
export declare class PhrasalVerb {
    reference?: Reference;
}
declare class OALEnglishDictionary {
    constructor();
    private linkBase;
    private searchLink;
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
    private getPhrasalVerbs;
    private getIdioms;
    private getSenseTop;
    private getPhrasalVerbEntries;
    private getSentenceExample;
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
    private getReferenceGroup;
    private getReference;
    private getLevel;
    private getPartOfSpeech;
    private getWord;
    private getGrammar;
    private getLabels;
    private getDisclaimer;
    private getUsage;
    private getHtmlByLink;
    private getHtml;
    private parseHTML;
    private log;
    private close;
    private stringToLinkType;
}
export default function OALDic(): OALEnglishDictionary;
export {};
