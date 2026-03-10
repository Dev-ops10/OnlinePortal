import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    // Verify the user is logged in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to check if any admin exists
    const serviceClient = await createServiceClient();
    const { data: existingAdmins } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: "An admin already exists. This setup endpoint is disabled." },
        { status: 403 }
      );
    }

    // Promote current user to admin
    const { error } = await serviceClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to promote user: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been promoted to admin.`,
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
