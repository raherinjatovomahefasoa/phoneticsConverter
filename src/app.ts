function RPtoGAPhonetics(phonetics: string): string[]{
    const diphthongsMap :  Record<string, string> = {
        'əʊ':'oʊ'
    }
    const longVowelsMap:  Record<string, string> = {
        'iː':'i',
        'ɑː':'ɑ',
        'ɔː':'ɑ',
        'uː':'u',
        'ɜː':'ə',
    }
    const shortVowelsMap:  Record<string, string> = {
        'e':'ɛ',
        'ɒ':'ɑ',
    }
    const consonantsMap:  Record<string, string> = {
        'j':'y',
    }
    const mapping = {
        ...consonantsMap,
        ...shortVowelsMap,
        ...diphthongsMap,
        ...longVowelsMap,
    };

    // replace phonemes
    let result = combineDiphthongs(phonetics);
    result = result.map((phoneme) => {
        return mapping[phoneme] || phoneme;
    });

    // result
    return result;

    // functions
    function combineDiphthongs(phonemicScript: string): string[] {
        // Define an array to store combined phonemes
        const combinedPhonemes: string[] = [];
        
        // Initialize variables to track the current position and current phoneme
        let currentPos = 0;
        
        while (currentPos < phonemicScript.length) {
            let currentPhoneme = phonemicScript[currentPos];
            // Check if the current character is a potential diphthong
            if (
                currentPhoneme === 'i' ||
                currentPhoneme === 'ɑ' ||
                currentPhoneme === 'ɔ' ||
                currentPhoneme === 'u' ||
                currentPhoneme === 'ɜ' ||
                currentPhoneme === 'e' ||
                currentPhoneme === 'ə' ||
                currentPhoneme === 'a'
            ) {
            // Check if there's a following character and if it forms a diphthong
            const nextPos = currentPos + 1;
            if (nextPos < phonemicScript.length) {
                const nextPhoneme = phonemicScript[nextPos];
                const potentialDiphthong = currentPhoneme + nextPhoneme;
        
                // Define British English diphthongs
                const diphthongs = ['eɪ', 'əʊ', 'aɪ', 'ɔɪ', 'aʊ', 'iː', 'ɑː', 'ɔː', 'uː', 'ɜː'];
        
                if (diphthongs.includes(potentialDiphthong)) {
                    currentPhoneme = potentialDiphthong;
                    currentPos = nextPos; // Skip the next character
                }
            }
            }
        
            combinedPhonemes.push(currentPhoneme);
            currentPos++;
        }
        return combinedPhonemes;
    }    
}

function check(phonetics: string) {
    const test = RPtoGAPhonetics(phonetics);
    const vowels = ['oʊ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'i', 'ɪ', 'æ', 'ɑ', 'ʊ', 'ɔ', 'ʌ', 'u', 'ə', 'ɛ'];
    const flapT = 't̮';
    // if has t
    if (!test.includes('t')) {
        return phonetics;
    }
    const searchChar = 't';
    const indices = [];
    let isBetweenVowels = false;

    for (let i = 0; i < test.length; i++) {
        if (test[i] === searchChar) {
            indices.push(i);
        }
    }
    for (const tIndex of indices) {
        tToFlap(tIndex);
    }
    return test.join('');

    function tToFlap(tIndex: number) {
        // check if between vowels
        
        const before = tIndex - 1;
        const after = tIndex + 1;
        let phonBefore = '';
        let phonAfter = '';
        if (!test[before] || !test[after]) {
            isBetweenVowels = false;
        } else {
            phonBefore = test[before];
            phonAfter = test[after];
            if (!vowels.includes(phonBefore) || !vowels.includes(phonAfter)) {
                isBetweenVowels = false;
            } else {
                isBetweenVowels = true;
            }
        }
        if (isBetweenVowels) {
            test[tIndex] = flapT;
        }
    }

    
}

console.log(check('ˈstrætɪfaɪ'));
console.log(check('ˈwɔːtərfɔːl'));

