import { randomInt } from "crypto";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../shared/prisma/prisma";


const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*()-_=+[]{}<>?";

export function generatePassword(
    length: number = 14,
    includeSpecial: boolean = true
): string {
    const all = includeSpecial
        ? UPPERCASE + LOWERCASE + NUMBERS + SPECIAL
        : UPPERCASE + LOWERCASE + NUMBERS;

    const password: string[] = [
        UPPERCASE[randomInt(UPPERCASE.length)],
        LOWERCASE[randomInt(LOWERCASE.length)],
        NUMBERS[randomInt(NUMBERS.length)],
    ];

    if (includeSpecial) {
        password.push(SPECIAL[randomInt(SPECIAL.length)]);
    }

    const minimumLength = includeSpecial ? 4 : 3;

    if (length < minimumLength) {
        throw new Error(
            `Password length must be at least ${minimumLength}.`
        );
    }

    while (password.length < length) {
        password.push(all[randomInt(all.length)]);
    }

    // Fisher-Yates shuffle
    for (let i = password.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join("");
}


export const generateResetToken = (userId: number) => {
    const jti = crypto.randomUUID();

    const token = jwt.sign(
        {
            sub: userId,
            purpose: "password-reset",
            jti,
        },
        process.env.JWT_RESET_SECRET!,
        {
            expiresIn: "15m",
        }
    );

    return {
        token,
        jti,
    };
};

export function generateOtp(
    length: number = 6
): string {
    if (length < 1) {
        throw new Error("OTP length must be at least 1");
    }

    const otp: string[] = [];
    
    // Ensure at least one digit (always true for OTP)
    otp.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    
    // Fill remaining positions
    while (otp.length < length) {
        otp.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    }
    
    // Fisher-Yates shuffle for extra randomness
    for (let i = otp.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otp[i], otp[j]] = [otp[j], otp[i]];
    }
    
    return otp.join("");
}

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0, I/1 — avoids ambiguity

export async function createUniqueSchoolPin(length: number = 8): Promise<string> {
    let pin: string;
    let exists = true;

    while (exists) {
        pin = "";
        for (let i = 0; i < length; i++) {
            pin += PIN_CHARS[randomInt(PIN_CHARS.length)];
        }
        const existing = await prisma.school.findUnique({ where: { pin } });
        exists = !!existing;
    }

    return pin!;
}