import { randomInt } from "crypto";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*()-_=+[]{}<>?";

const ALL = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;

export function generatePassword(length = 14): string {
    if (length < 4) {
        throw new Error("Password length must be at least 4.");
    }

    const password = [
        UPPERCASE[randomInt(UPPERCASE.length)],
        LOWERCASE[randomInt(LOWERCASE.length)],
        NUMBERS[randomInt(NUMBERS.length)],
        SPECIAL[randomInt(SPECIAL.length)],
    ];

    for (let i = password.length; i < length; i++) {
        password.push(ALL[randomInt(ALL.length)]);
    }

    // Fisher-Yates shuffle
    for (let i = password.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join("");
}