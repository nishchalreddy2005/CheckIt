import speakeasy from "speakeasy"
import QRCode from "qrcode"
import bcrypt from "bcryptjs"

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

// Two-factor authentication (Node.js runtime only)
export function generateTwoFactorSecret(
    userId: string,
): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }> {
    return new Promise((resolve, reject) => {
        try {
            const secret = speakeasy.generateSecret({
                name: `CheckIt:${userId}`,
            })

            QRCode.toDataURL(secret.otpauth_url || "", (err: Error | null | undefined, qrCodeUrl: string) => {
                if (err) {
                    reject(err)
                    return
                }

                resolve({
                    secret: secret.base32,
                    otpAuthUrl: secret.otpauth_url || "",
                    qrCodeUrl,
                })
            })
        } catch (error) {
            reject(error)
        }
    })
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
    })
}
