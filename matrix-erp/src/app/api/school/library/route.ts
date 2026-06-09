import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string().optional(),
  copies: z.number().int().positive(),
});

const loanSchema = z.object({
  bookId: z.string(),
  studentId: z.string(),
  dueDate: z.string(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const [books, loans] = await Promise.all([
    db.libraryBook.findMany({ orderBy: { title: "asc" } }),
    db.libraryLoan.findMany({
      where: { returnedAt: null },
      include: { book: true, student: { include: { user: true } } },
    }),
  ]);
  return NextResponse.json({ books, activeLoans: loans });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  if (body.bookId) {
    const parsed = loanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid loan" }, { status: 400 });
    }
    const book = await db.libraryBook.findUnique({ where: { id: parsed.data.bookId } });
    if (!book || book.available < 1) {
      return NextResponse.json({ error: "Book not available" }, { status: 400 });
    }
    const loan = await db.libraryLoan.create({
      data: {
        bookId: parsed.data.bookId,
        studentId: parsed.data.studentId,
        dueAt: new Date(parsed.data.dueDate),
      },
    });
    await db.libraryBook.update({
      where: { id: book.id },
      data: { available: book.available - 1 },
    });
    await logFromSession(session!, "LIBRARY_BORROW", "LibraryLoan", loan.id);
    return NextResponse.json({ ok: true });
  }

  if (body.returnLoanId) {
    const loan = await db.libraryLoan.findUnique({ where: { id: body.returnLoanId } });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    await db.libraryLoan.update({
      where: { id: loan.id },
      data: { returnedAt: new Date() },
    });
    const book = await db.libraryBook.findUnique({ where: { id: loan.bookId } });
    if (book) {
      await db.libraryBook.update({
        where: { id: book.id },
        data: { available: book.available + 1 },
      });
    }
    await logFromSession(session!, "LIBRARY_RETURN", "LibraryLoan", loan.id);
    return NextResponse.json({ ok: true });
  }

  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid book" }, { status: 400 });
  }

  const book = await db.libraryBook.create({
    data: { ...parsed.data, available: parsed.data.copies },
  });
  await logFromSession(session!, "LIBRARY_BOOK_CREATE", "LibraryBook", book.id);
  return NextResponse.json({ ok: true, id: book.id });
}
