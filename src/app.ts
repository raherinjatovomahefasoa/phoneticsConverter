import GifImages from './gif-engine/gif-engine';
import StockImage from './image-engine/image-engine';
import OALDic from "./oalenglish-dictionary/oalenglish-dictionary";


(async () => {
    const link = 'good_1';
    const word = `good`;
    // const wordEntry = await OALDic().searchWordLink(link);
    const wordEntry = await OALDic().searchWord(word);
    // const wordEntry = await StockImage().search(word);
    // const wordEntry = await GifImages().search(word);

    console.log((wordEntry as any).inflections[1].phonetics);
})()