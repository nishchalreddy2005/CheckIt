import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: "success",
      message: "Database connection is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
