"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextElement = void 0;
const promises_1 = __importDefault(require("fs/promises"));
class TextElement {
}
exports.TextElement = TextElement;
class TextEngine {
    processTextFile(txtFilename = 'text.txt') {
        return __awaiter(this, void 0, void 0, function* () {
            const textString = yield promises_1.default.readFile(txtFilename, 'utf8');
            const text = this.renderText(textString);
            // console.log(JSON.stringify(text));
            // await fs.writeFile('result.json',JSON.stringify(text), 'utf8');
            return text;
        });
    }
    renderWords(words) {
        const wordsNew = [...words];
        const result = wordsNew.map((wordRaw) => {
            const wordSpelling = wordRaw.match(/((([a-zA-Z]\.)+)|(\d+\.\d+)|(\d+(?!\.\d+))|([a-zA-z'-]+))/);
            const before = wordRaw.match(/^([^\w'-]+)(?=((((\w\.)+)|[a-zA-z'-]+|(\d+\.\d+)|(\d+(?!\.\d+)))))/);
            const after1 = wordRaw.match(/(?<=((((\w\.){2,}))))([^\w'-]+)$/);
            const after2 = wordRaw.match(/(?<=([a-zA-z'-]+|(\d+\.\d+)|(\d+(?!\.\d+))))([^\w'-]+)$/);
            const after = (after1 === null || after1 === void 0 ? void 0 : after1.length) ? after1 : after2;
            const word = {
                type: 'word',
                spelling: wordSpelling ? wordSpelling[0] : undefined,
                before: before ? before[0] : undefined,
                after: after ? after[0] : undefined,
            };
            try {
                if (!isNaN(wordSpelling[0])) {
                    word.spelling = Number(wordSpelling[0]);
                    if (word.spelling) {
                        word.type = 'number';
                    }
                }
            }
            catch (e) { }
            // if (word.type == 'number'){
            // console.log(word);
            // }
            return word;
        });
        return result;
    }
    renderSenteces(sentences) {
        const sentencesNew = [...sentences];
        const result = sentencesNew.map((sentnce) => {
            const rawWords = sentnce.match(/(?<=(^|\s))(.*?)(?=($|\s))/g) || [sentnce];
            const sentence = {
                type: 'sentence',
                children: this.renderWords(rawWords),
            };
            return sentence;
        });
        return result;
    }
    renderParagraphs(para) {
        // const rawSentences: string[] = para.match(/((?<=^)|(?<=\s))(.*?)(\.(?=\s)|\.\.\.(?=\s)|\.(?=$)|\.\.\.(?=$))/g) || [];
        // const rawSentences: string[] = para.match(/((?<=^)|(?<=\s))(.*?)(\.(?=\s)|\.\.\.(?=\s)|\?(?=\s)|\!(?=\s)|\.(?=$)|\?(?=$)|\!(?=$)|\.\.\.(?=$)|$)/g) || [para];
        // const rawSentences: string[] = para.match(/(?<=(^|\s))(.*?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)/g) || [para];
        // const rawSentences: string[] = para.match(/(?<=(^|\s))(.{15,}?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)/g) || [para];
        const rawSentences = para.match(/(?<=(^|\s))((.{15,}?)(((\.|\.\.\.|\?|\!)(?=(\s|$)))|$)|(.+?)(((\.|\.\.\.|\?|\!)(?=($)))|$))/g) || [para];
        const paragraph = {
            type: 'paragraph',
            children: this.renderSenteces(rawSentences),
        };
        return paragraph;
    }
    renderText(textString) {
        var _a;
        const rawParagraphs = textString.match(/^(.*?)(?=(\r\n|$(?<=.)))/gm) || [];
        const text = {
            type: 'text',
            children: []
        };
        for (const paragraph of rawParagraphs) {
            (_a = text.children) === null || _a === void 0 ? void 0 : _a.push(this.renderParagraphs(paragraph));
        }
        return text;
    }
}
function TxtEngine() {
    return new TextEngine();
}
exports.default = TxtEngine;
