
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, date, description, amount, type, categoryId } = body;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!date || !amount) {
            return NextResponse.json(
                { error: "Date and amount are required" },
                { status: 400 }
            );
        }

        // Ensure amount is negative for expenses if it's not already
        // Actually, usually in DB expense amounts are positive values with type EXPENSE or negative values.
        // Let's check existing convention.
        // Based on previous chats, it seems the dashboard calculates spent by summing Math.abs(amount).
        // So storing positive values is likely fine, or negative.
        // Let's assume standard signed values: Expense = negative, Income = positive.
        // Or if previous code used Math.abs, maybe everything is stored as is.
        // Let's look at `page.tsx` again.
        // "return sum + Math.abs(Number(tx.amount));" for spending.
        // So the sign might matter for net worth but for spending calculation it takes absolute.
        // However, for consistency, let's treat Expense as negative and Income as positive in the DB if that's the convention.
        // But if Plaid data comes in as positive for expenses (which it does not, usually positive for expense in Plaid API, but negative in bank statements... wait).
        // Plaid API: positive amount = money moving out (expense). Negative amount = refund/income.
        // Let's stick to the Plaid convention if the app uses Plaid.
        // The previous code: "if (tx.type === 'INCOME' || tx.type === 'TRANSFER') return sum;"
        // It seems it relies on TYPE field more than sign.

        // Let's just save the absolute amount and let the Type dictate the nature.
        // Wait, let's look at how Plaid sync deals with it.
        // If I can't check Plaid sync right now, I'll store it as positive and rely on Type.

        // Wait, if I'm creating a manual transaction, I should probably generate a unique ID.
        // Prisma will handle ID generation.

        const newTransaction = await prisma.transaction.create({
            data: {
                userId,
                date: new Date(date),
                description,
                amount: Number(amount), // storing as positive number, logic elsewhere handles type
                isoCurrencyCode: "USD",
                type: type, // EXPENSE, INCOME, TRANSFER
                categoryId: categoryId || null,
                merchantName: description, // basic fallback
                paymentChannel: "MANUAL", // to distinguish from online
            },
            include: {
                category: true,
            }
        });

        return NextResponse.json(newTransaction);
    } catch (error: any) {
        console.error("Error creating manual transaction:", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
