import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/** Verifies the Firebase ID token and the server assigned admin custom claim. */
export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { uid: null, response: NextResponse.json({ error: "Admin authentication required" }, { status: 401 }) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    if (decoded.admin !== true) {
      return { uid: null, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
    }
    return { uid: decoded.uid, response: null };
  } catch {
    return { uid: null, response: NextResponse.json({ error: "Admin authentication required" }, { status: 401 }) };
  }
}
