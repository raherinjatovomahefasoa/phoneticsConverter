import OALDic from "./oalenglish-dictionary/oalenglish-dictionary";


(async () => {
    const link = 'good_1';
    const word = 'henry';
    // const wordEntry = await OALDic().searchWordLink(link);
    const wordEntry = await OALDic().searchWord(word);
    console.log((wordEntry as any));
})()