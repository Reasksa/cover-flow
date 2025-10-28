import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const themes = [
  { name: 'Indigo Light', primary: '#6366F1', secondary: '#F59E0B', background: '#FFFFFF', font: 'Inter', isDefault: true },
  { name: 'Indigo Dark', primary: '#6366F1', secondary: '#F59E0B', background: '#111827', font: 'Inter', isDefault: false },
  { name: 'Emerald', primary: '#10B981', secondary: '#F59E0B', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Sky', primary: '#3B82F6', secondary: '#6366F1', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Violet', primary: '#8B5CF6', secondary: '#F59E0B', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Warm', primary: '#F59E0B', secondary: '#EF4444', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Slate', primary: '#64748B', secondary: '#6366F1', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Rose', primary: '#F43F5E', secondary: '#6366F1', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Teal', primary: '#14B8A6', secondary: '#6366F1', background: '#FFFFFF', font: 'Inter', isDefault: false },
  { name: 'Amber', primary: '#F59E0B', secondary: '#6366F1', background: '#FFFFFF', font: 'Inter', isDefault: false },
];

async function main() {
  for (const t of themes) {
    await prisma.theme.upsert({
      where: { name: t.name },
      update: { primary: t.primary, secondary: t.secondary, background: t.background, font: t.font, isDefault: t.isDefault },
      create: t,
    });
  }
  console.log('Seeded themes');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });