export interface Phoneme {
    index: number;
    phoneme: string;
    type: phonemeType;
}
export type phonemeType = 'stress' | 'sVowel' | 'uVowel';
declare class PhoneticsEngine {
    constructor(phonetics: string);
    private convertedPhonetics;
    private vowels;
    private allVowels;
    private stressedVowels;
    private twoClusterCons;
    private threeClusterCons;
    private ticks;
    private flapT;
    private minorStress;
    private searchChar;
    private indices;
    private phoneme;
    private isBetweenVowels;
    toGA(): string;
    private addStress;
    private addMinorStress;
    private RPtoGAPhonetics;
    private tToFlap;
    private combineDiphthongs;
}
export default function PhonEngine(phonetics: string): PhoneticsEngine;
export {};
