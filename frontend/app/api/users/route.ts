import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { listUsers } from "@/lib/repository";

export async function GET() {
  try {
    return NextResponse.json(await listUsers());
  } catch (e) {
    return errorResponse(e);
  }
}
