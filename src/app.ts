import OALDic from "./oalenglish-dictionary/oalenglish-dictionary";


(async () => {
    const word = 'good';
    let entry = await OALDic().searchWord(word);
    console.log(entry);
    // const savedEntry = await OALDic().saveSounds(entry);
    // console.log((savedEntry as any).inflections[0].phonetics);
})()
