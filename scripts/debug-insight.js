
const { OpenAI } = require("openai");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

async function main() {
    console.log("--- Starting Debug ---");

    // 1. Check Env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ OPENAI_API_KEY is missing from process.env");
        process.exit(1);
    } else {
        console.log("✅ OPENAI_API_KEY found (starts with: " + apiKey.substring(0, 7) + "...)");
    }

    // 2. Test OpenAI
    console.log("Testing OpenAI API connection...");
    const openai = new OpenAI({ apiKey });
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Hello, are you working?" }],
            max_tokens: 10,
        });
        console.log("✅ OpenAI Responded:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ OpenAI Verification Failed:", error.message);
    }

    // 3. Test Database
    console.log("Testing Database connection...");
    const prisma = new PrismaClient();
    try {
        const count = await prisma.insight.count();
        console.log("✅ Database connected. Insight count:", count);
    } catch (error) {
        console.error("❌ Database Verification Failed:", error.message);
    }
}

main();
