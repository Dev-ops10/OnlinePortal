import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const serviceClient = await createServiceClient();

    const { error } = await serviceClient
      .from("profiles")
      .update({ role: "user" })
      .eq("role", "admin");

    if (error) {
      return NextResponse.json(
        { error: `Failed to reset admins: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "All admin roles have been reset. You can now run /admin/setup.",
    });
  } catch (error) {
    console.error("Admin reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
