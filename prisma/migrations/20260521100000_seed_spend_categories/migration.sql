-- Seed default SpendCategory rows. Safe to re-run (ON CONFLICT DO NOTHING).
INSERT INTO "SpendCategory" ("id", "name", "icon", "color") VALUES
  (gen_random_uuid(), 'Housing',           '🏠', '#ef4444'),
  (gen_random_uuid(), 'Transportation',    '🚗', '#3b82f6'),
  (gen_random_uuid(), 'Entertainment',     '🎬', '#8b5cf6'),
  (gen_random_uuid(), 'Utilities',         '💡', '#eab308'),
  (gen_random_uuid(), 'Income',            '💰', '#22c55e'),
  (gen_random_uuid(), 'Groceries',         '🛒', '#10b981'),
  (gen_random_uuid(), 'Dining',            '🍽️',  '#f97316'),
  (gen_random_uuid(), 'Travel',            '✈️',  '#0ea5e9'),
  (gen_random_uuid(), 'Shopping',          '🛍️',  '#ec4899'),
  (gen_random_uuid(), 'Health & Wellness', '❤️',  '#ef4444'),
  (gen_random_uuid(), 'Personal Care',     '💇', '#d946ef'),
  (gen_random_uuid(), 'Education',         '📚', '#8b5cf6'),
  (gen_random_uuid(), 'Subscriptions',     '📅', '#6366f1'),
  (gen_random_uuid(), 'Electronics',       '💻', '#3b82f6'),
  (gen_random_uuid(), 'Gifts & Donations', '🎁', '#f43f5e'),
  (gen_random_uuid(), 'Services',          '🔧', '#64748b')
ON CONFLICT ("name") DO NOTHING;
