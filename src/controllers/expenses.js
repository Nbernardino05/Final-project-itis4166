import prisma from '../lib/prisma.js';

function parseId(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function getMemberCount(householdId) {
  return prisma.user.count({ where: { householdId } });
}

async function resolveHousehold(householdId, user, res) {
  const household = await prisma.household.findUnique({ where: { id: householdId } });
  if (!household) {
    res.status(404).json({ error: 'Household not found' });
    return null;
  }
  if (user.householdId !== householdId) {
    res.status(403).json({ error: 'You are not a member of this household' });
    return null;
  }
  return household;
}

function formatExpense(expense, memberCount) {
  return {
    id: expense.id,
    name: expense.name,
    cost: expense.cost,
    createdBy: { id: expense.createdBy.id, name: expense.createdBy.name },
    createdAt: expense.createdAt.toISOString().split('T')[0],
    householdId: expense.householdId,
    splitAmount: Math.round((expense.cost / memberCount) * 100) / 100,
    memberCount,
  };
}

export async function createExpense(req, res) {
  const householdId = parseId(req.params.householdId);
  if (!householdId) return res.status(400).json({ error: 'householdId must be a positive integer' });

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const { name, cost } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (cost === undefined || cost === null || typeof cost !== 'number' || cost <= 0) {
    return res.status(400).json({ error: 'cost must be a positive number' });
  }

  const expense = await prisma.expense.create({
    data: { name: name.trim(), cost, createdById: req.user.id, householdId },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  const memberCount = await getMemberCount(householdId);
  res.status(201).json(formatExpense(expense, memberCount));
}

export async function getExpenses(req, res) {
  const householdId = parseId(req.params.householdId);
  if (!householdId) return res.status(400).json({ error: 'householdId must be a positive integer' });

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const [expenses, memberCount] = await Promise.all([
    prisma.expense.findMany({
      where: { householdId },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    getMemberCount(householdId),
  ]);

  res.json(
    expenses.map((e) => ({
      id: e.id,
      name: e.name,
      cost: e.cost,
      createdBy: { id: e.createdBy.id, name: e.createdBy.name },
      createdAt: e.createdAt.toISOString().split('T')[0],
      splitAmount: Math.round((e.cost / memberCount) * 100) / 100,
    })),
  );
}

export async function getExpense(req, res) {
  const householdId = parseId(req.params.householdId);
  const expenseId = parseId(req.params.id);
  if (!householdId || !expenseId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, householdId },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const memberCount = await getMemberCount(householdId);
  res.json(formatExpense(expense, memberCount));
}

export async function updateExpense(req, res) {
  const householdId = parseId(req.params.householdId);
  const expenseId = parseId(req.params.id);
  if (!householdId || !expenseId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, householdId } });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const isAdmin = req.user.householdId === householdId && req.user.role === 'admin';
  const isCreator = expense.createdById === req.user.id;
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: 'Only the creator or household admin can update this expense' });
  }

  const { name, cost } = req.body ?? {};
  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    data.name = name.trim();
  }

  if (cost !== undefined) {
    if (typeof cost !== 'number' || cost <= 0) {
      return res.status(400).json({ error: 'cost must be a positive number' });
    }
    data.cost = cost;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Provide at least one field to update: name or cost' });
  }

  const updated = await prisma.expense.update({ where: { id: expenseId }, data });

  res.json({ id: updated.id, name: updated.name, cost: updated.cost });
}

export async function deleteExpense(req, res) {
  const householdId = parseId(req.params.householdId);
  const expenseId = parseId(req.params.id);
  if (!householdId || !expenseId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, householdId } });
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const isAdmin = req.user.householdId === householdId && req.user.role === 'admin';
  const isCreator = expense.createdById === req.user.id;
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ error: 'Only the creator or household admin can delete this expense' });
  }

  await prisma.expense.delete({ where: { id: expenseId } });

  res.json({ id: expense.id, name: expense.name });
}
