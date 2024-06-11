export declare class MinsPerWeek {
    rate?: Rate;
    minutes?: number;
    discount?: number;
}
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export declare class Time {
    hours?: number;
    minutes?: number;
}
export declare class Schedule {
    day?: Day;
    time?: Time;
}
export declare class MonthlyCourse {
    minsPerWeek?: MinsPerWeek;
    schedules?: Schedule[];
    startDate?: Date;
}
export declare class Rate {
    amount?: number;
    minutes?: number;
}
export declare class Purchase {
    monthlyCourse?: MonthlyCourse;
    studentUniqueId?: string;
    amount?: number;
    paymentUniqueId?: string;
    paymentMethod?: MobileMoney | Cash;
    person?: Person;
    date?: Date;
}
export declare class Student {
    firstName?: string;
    lastName?: string;
    facebookAccount?: string;
    ankiLogin?: AnkiLogin;
    sessions?: Session[];
}
export declare class Session {
    start?: Date;
    end?: Date;
    lessons?: number[];
}
export declare class AnkiLogin {
    mail?: string;
    password?: string;
}
export declare class Person {
    firstName?: string;
    lastName?: string;
    facebookAccount?: string;
    mail?: string;
    phoneNumber?: PhoneNumber;
}
export declare class PhoneNumber {
    code?: string;
    number?: number;
}
export declare class Cash {
    notes?: NoteGroup[];
    change?: number;
}
export declare class NoteGroup {
    note?: Note;
    number?: number;
}
export type Note = 100 | 200 | 500 | 1000 | 2000 | 5000 | 10000 | 20000;
export declare class MobileMoney {
    operator?: string;
    phoneNumber?: PhoneNumber;
    owner?: string;
}
