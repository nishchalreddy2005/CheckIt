import { redis } from "@/lib/redis"
import { hashPassword } from "@/lib/security"

// Export both function names for backward compatibility
export async function initializeSuperadmin() {
  return initSuperadmin()
}

export async function initSuperadmin() {
  try {
    console.log("Checking if superadmin exists...")

    // Check if superadmin already exists
    const superadminId = await redis.get("superadmin:email:nishchal.reddy@example.com")

    if (superadminId) {
      console.log("Superadmin already exists, skipping initialization")
      return
    }

    console.log("Creating superadmin account...")

    // Create superadmin
    const id = "superadmin-nishchal"
    const email = "nishchal.reddy@example.com"
    const name = "Nishchal Reddy"
    const password = "07062005@Nr"
    const hashedPassword = await hashPassword(password)

    const superadmin = {
      id,
      email,
      name,
      password: hashedPassword,
      createdAt: Date.now(),
      isSuperadmin: true,
      isAdmin: true,
    }

    // Store superadmin data
    await redis.hset(`superadmin:${id}`, superadmin)

    // Create email mapping
    await redis.set(`superadmin:email:${email}`, id)

    console.log("Superadmin created successfully")

    return true
  } catch (error) {
    console.error("Failed to initialize superadmin:", error)
    return false
  }
}
