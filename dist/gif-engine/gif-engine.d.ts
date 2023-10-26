export declare class GifImage {
    src?: string;
}
declare class GifEngine {
    private linkBase;
    private browser;
    private currentUrl;
    private page;
    logError: boolean;
    private userDataDir;
    private createUserDataDirectory;
    private initialize;
    search(query: string): Promise<GifImage[]>;
    private scrape;
    private getGifImages;
    private safeRun;
    private log;
    private parseHTML;
    private getHtmlByLink;
    private close;
    private stringToLinkType;
}
export default function GifImages(): GifEngine;
export {};
