
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

// Initialize Prisma Client
const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // Initialize OpenAI inside the handler to safely catch missing key errors
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("OPENAI_API_KEY is missing in environment variables.");
            return NextResponse.json({ error: "Server Error: OPENAI_API_KEY is missing. Please add it to your .env file and restart the server." }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        // Default to current month/year if not specified
        const now = new Date();
        const month = parseInt(searchParams.get("month") || (now.getUTCMonth()).toString()); // 0-indexed
        const year = parseInt(searchParams.get("year") || now.getUTCFullYear().toString());

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // 1. Check for cached insight
        const existingInsight = await prisma.insight.findFirst({
            where: {
                userId,
                month,
                year,
                type: "MONTHLY_ROAST" // Default type
            }
        });

        if (existingInsight) {
            return NextResponse.json({ content: existingInsight.content, cached: true });
        }

        // 2. Generate new insight if not found
        // Fetch monthly stats
        // Construct start/end dates for the month
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0));

        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                type: "EXPENSE"
            },
            include: {
                category: true
            }
        });

        const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

        // Group by Category
        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
            const catName = t.category?.name || "Uncategorized";
            categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount);
        });

        // Top Categories
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, amount]) => `${name}: $${amount.toFixed(0)}`)
            .join(", ");

        // Group by Merchant (Top spending spots)
        const merchantTotals: Record<string, number> = {};
        transactions.forEach(t => {
            const merch = t.merchantName || t.description;
            merchantTotals[merch] = (merchantTotals[merch] || 0) + Number(t.amount);
        });

        const topMerchants = Object.entries(merchantTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, amount]) => `${name}: $${amount.toFixed(0)}`)
            .join(", ");

        // Construct Prompt
        // Construct Prompt
        const prompt = `
      You are a blunt, no-nonsense financial analyst with a dry sense of humor. 
      The user has spent $${totalSpent.toFixed(2)} this month.
      Top categories: ${topCategories}.
      Top merchants: ${topMerchants}.
      
      Write a VERY concise insight (2 sentences max).
      1. Point out exactly WHERE they are wasting money (be specific based on the data).
      2. Throw a playful jab or harsh truth about it.
      
      Do NOT be flowery. Do NOT use hashtags. Do NOT use emojis. 
      Focus on the numbers and the behavior.
    `;

        if (transactions.length === 0) {
            return NextResponse.json({ content: "You haven't spent anything yet. Are you even living, or just hibernating to save money? 🐻", cached: false });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a sarcastic financial assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 150,
        });

        const generatedText = completion.choices[0].message.content || "Spending looks... interesting.";

        // 3. Save to DB
        await prisma.insight.create({
            data: {
                userId,
                month,
                year,
                content: generatedText,
                type: "MONTHLY_ROAST"
            }
        });

        return NextResponse.json({ content: generatedText, cached: false });

    } catch (error: any) {
        console.error("Error generating insight:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate insight" },
            { status: 500 }
        );
    }
}
