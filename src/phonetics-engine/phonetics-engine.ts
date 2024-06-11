
export class Phoneme {
    index!: number;
    phoneme!: string;
    type!: phonemeType;
}

export type phonemeType = 'stress' | 'sVowel' | 'uVowel';

class PhoneticsEngine {
    constructor(phonetics: string) {
        this.convertedPhonetics = this.RPtoGAPhonetics(phonetics);
    }
    private convertedPhonetics: string[] = [];
    private vowels = ['oʊ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'i', 'ɪ', 'æ', 'ɑ', 'ʊ', 'ɔ', 'ʌ', 'u', 'ə', 'ɛ'];
    private allVowels = ['ˈ', 'ˌ', 'oʊ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'i', 'ɪ', 'æ', 'ɑ', 'ʊ', 'ɔ','ʌ', 'u', 'ə', 'ɛ', 'iː', 'ɑː', 'ɔː', 'uː', 'ɜː'];
    private stressedVowels = ['oʊ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'æ', 'ʌ', 'ɛ', 'iː', 'ɑː', 'ɔː', 'uː', 'ɜː'];
    private rColored = ['iːr', 'ɑːr', 'ɔːr', 'uːr', 'ɜːr'];
    private twoClusterCons = ['pl', 'pr', 'py', 'bl', 'br', 'by', 'tr', 'ty', 'tw', 'dr', 'dy','dw', 'kl', 'kr', 'ky', 'kw', 'gl', 'gr', 'gw', 'fl', 'fr', 'fy', 'vy', 'θr', 'θr', 'sl', 'sy', 'sw', 'sp', 'st', 'sk', 'sm', 'sn', 'sf', 'ʃr', 'my', 'ny'];
    private threeClusterCons = ['spl', 'spr', 'spy', 'str', 'sty', 'skl', 'skr', 'sky', 'skw'];
    private ticks = ['ˈ', 'ˌ']
    private flapT = 't̮';
    private minorStress = 'ˌ';
    private searchChar = 't';
    private indices: number[] = [];
    private phoneme: Phoneme[] = [];
    private isBetweenVowels = false;

    toGA(): string {
        const longVowelsMap:  Record<string, string> = {
            'iː':'i',
            'ɑː':'ɑ',
            'ɔː':'ɔ',
            'uː':'u',
            'ɜː':'ə',
        }
        
        this.convertedPhonetics = this.addStress(this.convertedPhonetics);
        this.convertedPhonetics = this.convertedPhonetics.map((phoneme) => {
            return longVowelsMap[phoneme] || phoneme;
        });

        if (!this.convertedPhonetics.includes('t')) {
            return this.convertedPhonetics.join('');
        }
    
        for (let i = 0; i < this.convertedPhonetics.length; i++) {
            if (this.convertedPhonetics[i] === this.searchChar) {
                this.indices.push(i);
            }
        }
        for (const tIndex of this.indices) {
            this.tToFlap(tIndex);
        }
        return this.convertedPhonetics.join('');
    }

    private addStress(phoneticsArray: string[]): string[] {
        // find all the vowels and their indexes
        for (let i = 0; i < phoneticsArray.length; i++) {
            if (this.allVowels.includes(phoneticsArray[i])) {
                let type: phonemeType = 'uVowel';
                if (this.stressedVowels.includes(phoneticsArray[i])) {
                    type = 'sVowel';
                } else if (this.ticks.includes(phoneticsArray[i])) {
                    type = 'stress';
                }
                this.phoneme.push({
                    index: i,
                    phoneme: phoneticsArray[i],
                    type: type,
                });
            }
        }
        const vowelIndexes: number[] = [];
        for (let i = 0; i < this.phoneme.length; i++) {
            if (this.phoneme[i].type !== 'stress') {
                vowelIndexes.push(i);
            }
        }
        for (const tIndex of vowelIndexes) {
            this.addMinorStress(tIndex, phoneticsArray);
            this.convertedPhonetics = phoneticsArray;
        }
        return phoneticsArray;
        // find unstressed phoneme that should be stressed
    }

    private addMinorStress (vIndex: number, phoneticsArray: string[]) {
        const beforeIndex = vIndex - 1;
        let isStressed = false;

        if (this.phoneme[beforeIndex]) {
            const before = this.phoneme[beforeIndex];
            if (this.phoneme[vIndex].type === 'sVowel') {
                if (before.type === 'stress') {
                    isStressed = true;
                } else {
                    isStressed = false;
                }
            } else {
                isStressed = true;
            }
        }
        const vowelsOnly = [...this.phoneme].filter((phoneme) => {
            return phoneme.type !== 'stress';
        })
        if (!isStressed && vowelsOnly.length > 1) {
            let phonemeBefore = -1;
            try {
                phonemeBefore = this.phoneme[beforeIndex].index;
            } catch (e){}
            const consNumbers = this.phoneme[vIndex].index - (phonemeBefore + 1);
            let stressIndex: null | number = null;
            if (consNumbers === 1) {
                stressIndex = this.phoneme[vIndex].index - 1;
                phoneticsArray.splice(stressIndex, 0, this.minorStress);
            } else if (consNumbers === 2) {
                const const3 = this.phoneme[vIndex].index - 1;
                const const2 = this.phoneme[vIndex].index - 2;
                const pairsBefore = `${phoneticsArray[const2]}${phoneticsArray[const3]}`;
                
                if (this.twoClusterCons.includes(pairsBefore)) {
                    stressIndex = this.phoneme[vIndex].index - 2;
                    phoneticsArray.splice(stressIndex, 0, this.minorStress);
                } else {
                    stressIndex = this.phoneme[vIndex].index - 1;
                    phoneticsArray.splice(stressIndex, 0, this.minorStress);
                }
            } else if (consNumbers >= 3) {
                const const3 = this.phoneme[vIndex].index - 1;
                const const2 = this.phoneme[vIndex].index - 2;
                const const1 = this.phoneme[vIndex].index - 3;
                const pairsBefore = `${phoneticsArray[const2]}${phoneticsArray[const3]}`;
                const threeBefore = `${phoneticsArray[const1]}${phoneticsArray[const2]}${phoneticsArray[const3]}`;
                if (this.threeClusterCons.includes(threeBefore)) {
                    stressIndex = this.phoneme[vIndex].index - 3;
                    phoneticsArray.splice(stressIndex, 0, this.minorStress);
                } else if (this.twoClusterCons.includes(pairsBefore)) {
                    stressIndex = this.phoneme[vIndex].index - 2;
                    phoneticsArray.splice(stressIndex, 0, this.minorStress);
                } else {
                    stressIndex = this.phoneme[vIndex].index - 1;
                    phoneticsArray.splice(stressIndex, 0, this.minorStress);
                }
            }
        }
    }

    private RPtoGAPhonetics(phonetics: string): string[]{
        const diphthongsMap :  Record<string, string> = {
            'əʊ':'oʊ'
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
            // ...longVowelsMap,
        };
    
        // replace phonemes
        let result = this.combineDiphthongs(phonetics);
        result = result.map((phoneme) => {
            return mapping[phoneme] || phoneme;
        });
    
        // result
        return result;
    }

    private tToFlap(tIndex: number) {
        // check if between vowels
        const before = tIndex - 1;
        const after = tIndex + 1;
        let phonBefore = '';
        let phonAfter = '';
        if (!this.convertedPhonetics[before] || !this.convertedPhonetics[after]) {
            this.isBetweenVowels = false;
        } else {
            phonBefore = this.convertedPhonetics[before];
            phonAfter = this.convertedPhonetics[after];
            if (!this.vowels.includes(phonBefore) || !this.vowels.includes(phonAfter)) {
                this.isBetweenVowels = false;
            } else {
                this.isBetweenVowels = true;
            }
        }
        if (this.isBetweenVowels) {
            this.convertedPhonetics[tIndex] = this.flapT;
        }
    }

    private combineDiphthongs(phonemicScript: string): string[] {
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

export default function PhonEngine(phonetics: string): PhoneticsEngine {
    return new PhoneticsEngine(phonetics);
}


