import OALDic from "./oalenglish-dictionary/oalenglish-dictionary"

(async () => {
    const word = await OALDic().searchWord('resources');
    console.log(word);
})();