import { MonthlyCourse } from "./payment-engine/payment-engine";
import TxtEngine from "./text-engine/text-engine";

export class MinsPerWeek {
    minutes?: number;
    rate?: Rate;
    discount?: number;
}
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export class Time {
    hours?: number;
    minutes?: number;
};

export class Rate {
    amount?: number;
    minutes?: number;
}

export class Purchase {
    monthlyCourse?: MonthlyCourse;
    studentUniqueId?: string;
    amount?: number;
    paymentUniqueId?: string;
    paymentMethod?: MobileMoney | Cash;
    person?: Person;
    date?: Date;
}

export class Student {
    firstName?: string;
    lastName?: string;
    facebookAccount?: string;
    ankiLogin?: AnkiLogin;
    sessions?: Session[];
}

export class Session {
    start?: Date;
    end?: Date;
    lessons?: number[];
}

export class AnkiLogin {
    mail?: string;
    password?: string;
}

export class Person {
    firstName?: string;
    lastName?: string;
    facebookAccount?: string;
    mail?: string;
    phoneNumber?: PhoneNumber;
}

export class PhoneNumber {
    code?: string;
    number?: number;
}

export class Cash {
    notes?: NoteGroup[];
    change?: number;
}

export class NoteGroup {
    note?: Note;
    number?: number;
}

export type Note = 100 | 200 | 500 | 1000 | 2000 | 5000 | 10000 | 20000;

export class MobileMoney {
    operator?: string;
    phoneNumber?: PhoneNumber;
    owner?: string;
}

(async () => {
    await TxtEngine().processTextFile();
})();