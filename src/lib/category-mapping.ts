export const PLAID_TO_INTERNAL_CATEGORY_MAP: Record<string, string> = {
    // --- INCOME ---
    'INCOME_DIVIDENDS': 'Income',
    'INCOME_INTEREST_EARNED': 'Income',
    'INCOME_RETIREMENT_PENSION': 'Income',
    'INCOME_TAX_REFUND': 'Income',
    'INCOME_UNEMPLOYMENT': 'Income',
    'INCOME_WAGES': 'Income',
    'INCOME_OTHER_INCOME': 'Income',
    'TRANSFER_IN_DEPOSIT': 'Income',
    'TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS': 'Income',
    'TRANSFER_IN_SAVINGS': 'Income',
    'TRANSFER_IN_ACCOUNT_TRANSFER': 'Income',
    'TRANSFER_IN_OTHER_TRANSFER_IN': 'Income',

    // --- HOUSING ---
    'RENT_AND_UTILITIES_RENT': 'Housing',
    'LOAN_PAYMENTS_MORTGAGE_PAYMENT': 'Housing',
    'HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE': 'Housing',
    'HOME_IMPROVEMENT_FURNITURE': 'Housing',
    'HOME_IMPROVEMENT_HARDWARE': 'Housing',
    'HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT': 'Housing',
    'HOME_IMPROVEMENT_SECURITY': 'Housing',

    // --- UTILITIES ---
    'RENT_AND_UTILITIES_GAS_AND_ELECTRICITY': 'Utilities',
    'RENT_AND_UTILITIES_INTERNET_AND_CABLE': 'Utilities',
    'RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT': 'Utilities',
    'RENT_AND_UTILITIES_TELEPHONE': 'Utilities',
    'RENT_AND_UTILITIES_WATER': 'Utilities',
    'RENT_AND_UTILITIES_OTHER_UTILITIES': 'Utilities',

    // --- FOOD --- (General)
    // Note: We prefer specific 'Dining' or 'Groceries' but map fallbacks here
    'FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK': 'Dining',

    // --- DINING ---
    'FOOD_AND_DRINK_RESTAURANT': 'Dining',
    'FOOD_AND_DRINK_FAST_FOOD': 'Dining',
    'FOOD_AND_DRINK_COFFEE_SHOP': 'Dining',
    'FOOD_AND_DRINK_DELIVERY': 'Dining',
    'FOOD_AND_DRINK_DINING_OUT': 'Dining',

    // --- GROCERIES ---
    'FOOD_AND_DRINK_GROCERIES': 'Groceries',
    'GENERAL_MERCHANDISE_SUPERSTORES': 'Groceries', // Often Walmart/Target, effectively groceries for many

    // --- TRANSPORTATION ---
    'TRANSPORTATION_GAS_STATIONS': 'Transportation',
    'TRANSPORTATION_PUBLIC_TRANSIT': 'Transportation',
    'TRANSPORTATION_TAXIS_AND_RIDE_SHARES': 'Transportation',
    'TRANSPORTATION_TOLLS': 'Transportation',
    'TRANSPORTATION_PARKING': 'Transportation',
    'TRANSPORTATION_AUTOMOTIVE_EXPENSES': 'Transportation',
    'TRANSPORTATION_OTHER_TRANSPORTATION': 'Transportation',
    'TRAVEL_RENTAL_CARS': 'Transportation',

    // --- TRAVEL ---
    'TRAVEL_FLIGHTS': 'Travel',
    'TRAVEL_LODGING': 'Travel',
    'TRAVEL_CRUISES': 'Travel',
    'TRAVEL_OTHER_TRAVEL': 'Travel',

    // --- SHOPPING ---
    'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES': 'Shopping',
    'GENERAL_MERCHANDISE_DEPARTMENT_STORES': 'Shopping',
    'GENERAL_MERCHANDISE_DISCOUNT_STORES': 'Shopping',
    'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES': 'Shopping',
    'GENERAL_MERCHANDISE_SPORTING_GOODS': 'Shopping',
    'GENERAL_MERCHANDISE_OFFICE_SUPPLIES': 'Shopping',
    'GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE': 'Shopping',
    'PERSONAL_CARE_HAIR_AND_BEAUTY': 'Shopping', // Could be Personal Care
    'PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING': 'Services',

    // --- HEALTH & WELLNESS ---
    'MEDICAL_MEDICAL_CARE_PRIMARY_CARE': 'Health & Wellness',
    'MEDICAL_MEDICAL_CARE_SPECIALTY_CARE': 'Health & Wellness',
    'MEDICAL_DENTAL_CARE': 'Health & Wellness',
    'MEDICAL_PHARMACIES_AND_SUPPLEMENTS': 'Health & Wellness',
    'MEDICAL_VETERINARY_SERVICES': 'Health & Wellness',
    'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS': 'Health & Wellness',

    // --- PERSONAL CARE ---
    // Mapping specific beauty/spa items if detailed enough, or fallback to Shopping/Services

    // --- EDUCATION ---
    // If Plaid adds specific education categories

    // --- SUBSCRIPTIONS ---
    'ENTERTAINMENT_MUSIC_AND_AUDIO': 'Subscriptions', // Spotify etc
    'ENTERTAINMENT_VIDEO_GAMES': 'Subscriptions', // Often recurring
    // Plaid doesn't have a perfect subscription category, so we often catch these via recurring rules or manual

    // --- ELECTRONICS ---
    'GENERAL_MERCHANDISE_ELECTRONICS': 'Electronics',

    // --- GIFTS & DONATIONS ---
    // 'TRANSFER_OUT_DONATION' ?? (Not standard Plaid)

    // --- SERVICES ---
    'GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING': 'Services',
    'GENERAL_SERVICES_CONSULTING_AND_LEGAL': 'Services',
    'GENERAL_SERVICES_INSURANCE': 'Services',
    'GENERAL_SERVICES_POSTAGE_AND_SHIPPING': 'Services',
    'GENERAL_SERVICES_STORAGE': 'Services',
    'GENERAL_SERVICES_OTHER_GENERAL_SERVICES': 'Services',

    // --- ENTERTAINMENT ---
    'ENTERTAINMENT_ARTS_AND_CRAFTS': 'Entertainment',
    'ENTERTAINMENT_ENTERTAINMENT': 'Entertainment',
    'ENTERTAINMENT_MOVIES_AND_DVDS': 'Entertainment',
    'ENTERTAINMENT_OTHER_ENTERTAINMENT': 'Entertainment',
    'ENTERTAINMENT_SPORTS_AND_RECREATION': 'Entertainment',

    // --- MISC / FEES ---
    'BANK_FEES_ATM_FEES': 'Services',
    'BANK_FEES_FOREIGN_TRANSACTION_FEES': 'Services',
    'BANK_FEES_INSUFFICIENT_FUNDS': 'Services',
    'BANK_FEES_INTEREST_CHARGE': 'Services',
    'BANK_FEES_OVERDRAFT_FEES': 'Services',
    'BANK_FEES_OTHER_BANK_FEES': 'Services',
};
