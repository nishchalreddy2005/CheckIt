import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import crypto from "crypto";

async function updateAdminUsers() {
    const adminEmail = "2200033247cse@gmail.com";
    const superadminEmail = "2200033247cseh@gmail.com";
    const passwordStr = "1234567@Nr";

    const { hashPassword } = await import("./lib/security-server");
    const { db } = await import("./lib/db");
    const { users } = await import("./lib/db/schema");
    const { eq } = await import("drizzle-orm");

    console.log("Hashing password...");
    const hashedPassword = await hashPassword(passwordStr);

    console.log("Updating Admin role...");
    try {
        await db.update(users)
            .set({ isAdmin: true, isSuperadmin: false, emailVerified: true, password: hashedPassword })
            .where(eq(users.email, adminEmail));
        console.log("Admin updated successfully!");
    } catch (e) { console.error(e) }

    console.log("Updating Superadmin role...");
    try {
        await db.update(users)
            .set({ isAdmin: true, isSuperadmin: true, emailVerified: true, password: hashedPassword })
            .where(eq(users.email, superadminEmail));
        console.log("Superadmin updated successfully!");
    } catch (e) { console.error(e) }
}

updateAdminUsers().then(() => {
    console.log("Done.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
