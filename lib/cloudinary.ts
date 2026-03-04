import { v2 as cloudinary } from "cloudinary"

// Explicitly configure Cloudinary with individual credentials
// so we don't rely on the SDK auto-parsing CLOUDINARY_URL
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "di0ufkjyb",
    api_key: process.env.CLOUDINARY_API_KEY || "494598513594917",
    api_secret: process.env.CLOUDINARY_API_SECRET || "4qsM1tdtWnLrwKkRPSBGKlqlkJI",
    secure: true,
})

/**
 * Uploads a raw file buffer to a specific folder in Cloudinary
 */
export async function uploadImageBuffer(
    buffer: Buffer,
    folder: string = "checkit_uploads"
): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                timeout: 60000,
            },
            (error: any, result: any) => {
                if (error) {
                    console.error("Cloudinary upload error:", error)
                    reject(new Error(error.message || "Cloudinary upload failed"))
                } else if (result) {
                    console.log("Cloudinary upload success:", result.secure_url)
                    resolve(result.secure_url)
                } else {
                    reject(new Error("Unknown error occurred during upload"))
                }
            }
        )

        // Write buffer directly to the stream
        uploadStream.end(buffer)
    })
}
