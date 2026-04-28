import prisma from '../lib/prisma.js';

function parseId(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function createHousehold(req, res) {
  const { name } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (req.user.householdId !== null) {
    return res.status(409).json({ error: 'You already belong to a household' });
  }

  const household = await prisma.household.create({ data: { name: name.trim() } });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { householdId: household.id, role: 'admin' },
  });

  res.status(201).json({ id: household.id, name: household.name });
}

export async function getHouseholds(req, res) {
  let where = {};

  // Members only see their own household; admins see all
  if (req.user.role !== 'admin') {
    if (!req.user.householdId) return res.json([]);
    where = { id: req.user.householdId };
  }

  const households = await prisma.household.findMany({
    where,
    include: { _count: { select: { members: true } } },
  });

  res.json(
    households.map((h) => ({ id: h.id, name: h.name, memberCount: h._count.members })),
  );
}

export async function getHousehold(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID must be a positive integer' });

  const household = await prisma.household.findUnique({
    where: { id },
    include: { members: { select: { id: true, name: true, role: true } } },
  });

  if (!household) return res.status(404).json({ error: 'Household not found' });
  if (req.user.householdId !== id) {
    return res.status(403).json({ error: 'You are not a member of this household' });
  }

  res.json({ id: household.id, name: household.name, members: household.members });
}

export async function updateHousehold(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID must be a positive integer' });

  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const household = await prisma.household.findUnique({ where: { id } });
  if (!household) return res.status(404).json({ error: 'Household not found' });

  if (req.user.householdId !== id || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the household admin can update it' });
  }

  const updated = await prisma.household.update({
    where: { id },
    data: { name: name.trim() },
  });

  res.json({ id: updated.id, name: updated.name });
}

export async function deleteHousehold(req, res) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID must be a positive integer' });

  const household = await prisma.household.findUnique({ where: { id } });
  if (!household) return res.status(404).json({ error: 'Household not found' });

  if (req.user.householdId !== id || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the household admin can delete it' });
  }

  await prisma.$transaction(async (tx) => {
    // Reset member roles before household deletion clears householdId
    await tx.user.updateMany({
      where: { householdId: id },
      data: { role: 'member' },
    });
    // Cascade on Chore/Expense handles those deletions;
    // SetNull on User.householdId handles clearing the FK
    await tx.household.delete({ where: { id } });
  });

  res.json({ id: household.id, name: household.name });
}
