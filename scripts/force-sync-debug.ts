import { syncPlaidTransactions } from '../src/lib/plaid-sync-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const bankItemId = '6694ea90-afa5-44e4-a965-fc72a49ac0c1';
    console.log(`Starting sync for BankItem: ${bankItemId}...`);

    try {
        const result = await syncPlaidTransactions(bankItemId);
        console.log('Sync Success!');
        console.log('Stats:', result);
    } catch (error: any) {
        console.error('Sync Failed!');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Plaid Response Data:', error.response.data);
        }
        console.error('Full Error:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
