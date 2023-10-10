import StockImage from './image-engine/image-engine';
import GifImages from './gif-engine/gif-engine';
import OALDic from './oalenglish-dictionary/oalenglish-dictionary';

(async () => {
    const word = 'fuck';
    let reuslt: any = await OALDic().searchWord(word);
    console.log(reuslt);
    reuslt = await StockImage().search(word);
    console.log(reuslt);
    reuslt = await GifImages().search(word);
    console.log(reuslt);
})()