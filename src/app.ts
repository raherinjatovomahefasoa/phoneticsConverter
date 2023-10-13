import OALDic from "./oalenglish-dictionary/oalenglish-dictionary";


(async () => {
    const link = 'get-around';
    const word = 'pants';
    const wordEntry = await OALDic().searchWordLink(link);
    // const wordEntry = await OALDic().searchWord(word);
    console.log((wordEntry as any));
})()