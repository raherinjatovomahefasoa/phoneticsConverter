export interface StockImage {
    src?: string;
}
declare class iStockEngine {
    private linkBase;
    private browser;
    private currentUrl;
    private page;
    logError: boolean;
    private userDataDir;
    private createUserDataDirectory;
    private initialize;
    search(query: string): Promise<StockImage[]>;
    private scrape;
    private getImages;
    private safeRun;
    private log;
    private parseHTML;
    private getHtmlByLink;
    private close;
}
export default function iStockImages(): iStockEngine;
export {};
