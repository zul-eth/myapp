import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${nanoid()}-${file.name}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await writeFile(path.join(uploadDir, filename), buffer);

  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}