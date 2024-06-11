export declare class TextElement {
    type?: PartType;
    spelling?: string | number;
    before?: string;
    after?: string;
    children?: (TextElement | string)[];
}
export type PartType = 'text' | 'paragraph' | 'sentence' | 'word' | 'number';
declare class TextEngine {
    processTextFile(txtFilename?: string): Promise<TextElement>;
    private renderWords;
    private renderSenteces;
    private renderParagraphs;
    private renderText;
}
export default function TxtEngine(): TextEngine;
export {};
