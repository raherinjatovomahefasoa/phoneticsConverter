import OALDic from "./oalenglish-dictionary/oalenglish-dictionary"

(async () => {
    const reuslt = await OALDic().searchWord('wrote');
    console.log(reuslt);
})()