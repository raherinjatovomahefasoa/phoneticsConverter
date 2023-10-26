import fs from 'fs/promises';

export class TextElement {
    type?: PartType;
    spelling?: string | number;
    before?: string;
    after?: string;
    children?: (TextElement|string)[];
}
export type PartType = 'text' | 'paragraph' | 'sentence' | 'word' | 'number';
class TextEngine {
    async processTextFile(txtFilename: string = 'text.txt') {
        const textString = await fs.readFile(txtFilename, 'utf8');
        const text = this.renderText(textString);
        // console.log(JSON.stringify(text));
        // await fs.writeFile('result.json',JSON.stringify(text), 'utf8');
        return text;
    }

    private renderWords(words: string[]): TextElement[] {
        const wordsNew = [...words];
        const result = wordsNew.map((wordRaw) => {
            const wordSpelling = (wordRaw.match(/((\d*(\w\.)+)|[a-zA-z'-]+|(\d+\.\d+)|(\d+(?!\.\d+)))/) as string[]);
            const before = wordRaw.match(/^([^\w'-]+)(?=(((\d*(\w\.)+)|[a-zA-z'-]+|(\d+\.\d+)|(\d+(?!\.\d+)))))/);
            const after = wordRaw.match(/(?<=(((\d*(\w\.)+))))([^\w'-]+)$/);
            const word: TextElement = {
                type: 'word',
                spelling: wordSpelling ? wordSpelling[0] : '',
                before: before ? before[0] : '',
                after: after ? after[0] : '',
            };
            try {
                if (!isNaN((wordSpelling as string[])[0] as unknown as number)) {
                    word.spelling = Number((wordSpelling as string[])[0] as unknown as number);
                    if (word.spelling) {
                        word.type = 'number';
                    }
                }
            } catch(e){}
            // if (word.type == 'number'){
                console.log(word);
            // }
            return word;
        })
        return result;
    }


    private renderSenteces(sentences: string[]): TextElement[] {
        const sentencesNew = [...sentences];
        const result = sentencesNew.map((sentnce) => {
            const rawWords: string[] = sentnce.match(/(?<=(^|\s))(.*?)(?=($|\s))/g) || [sentnce];
            const sentence: TextElement = {
                type: 'sentence',
                children: this.renderWords(rawWords),
            };
            return sentence;
        })
        return result;
    }

    private renderParagraphs(para: string): TextElement {
        // const rawSentences: string[] = para.match(/((?<=^)|(?<=\s))(.*?)(\.(?=\s)|\.\.\.(?=\s)|\.(?=$)|\.\.\.(?=$))/g) || [];
        // const rawSentences: string[] = para.match(/((?<=^)|(?<=\s))(.*?)(\.(?=\s)|\.\.\.(?=\s)|\?(?=\s)|\!(?=\s)|\.(?=$)|\?(?=$)|\!(?=$)|\.\.\.(?=$)|$)/g) || [para];
        // const rawSentences: string[] = para.match(/(?<=(^|\s))(.*?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)/g) || [para];
        // const rawSentences: string[] = para.match(/(?<=(^|\s))(.{15,}?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)/g) || [para];
        const rawSentences: string[] = para.match(/(?<=(^|\s))((.{15,}?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)|(.+?)(((\.|\.\.\.|\?|\!)(?=($)))|$))/g) || [para];
        const paragraph: TextElement = {
            type: 'paragraph',
            children: this.renderSenteces(rawSentences),
        };
        return paragraph;
    }

    private renderText(textString: string): TextElement {
        const rawParagraphs: string[] = textString.match(/^(.*?)(?=(\r\n|$(?<=.)))/gm) || [];
        const text: TextElement = {
            type: 'text',
            children: []
        }
        for (const paragraph of rawParagraphs) {
            text.children?.push(this.renderParagraphs(paragraph));
        }
        return text;
    }
}

export default function TxtEngine(): TextEngine {
    return new TextEngine();
}