import prisma from '../lib/prisma.js';

function parseId(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function formatChore(chore) {
  return {
    id: chore.id,
    name: chore.name,
    status: chore.status,
    assignedTo: chore.assignedTo
      ? { id: chore.assignedTo.id, name: chore.assignedTo.name }
      : null,
    householdId: chore.householdId,
  };
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

async function validateAssignee(assignedToId, householdId, res) {
  const assignee = await prisma.user.findFirst({
    where: { id: Number(assignedToId), householdId },
  });
  if (!assignee) {
    res.status(400).json({ error: 'assignedTo must be a member of this household' });
    return false;
  }
  return true;
}

export async function createChore(req, res) {
  const householdId = parseId(req.params.householdId);
  if (!householdId) return res.status(400).json({ error: 'householdId must be a positive integer' });

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const { name, assignedTo } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  let assignedToId = null;
  if (assignedTo !== undefined && assignedTo !== null) {
    const ok = await validateAssignee(assignedTo, householdId, res);
    if (!ok) return;
    assignedToId = Number(assignedTo);
  }

  const chore = await prisma.chore.create({
    data: { name: name.trim(), householdId, assignedToId },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  res.status(201).json(formatChore(chore));
}

export async function getChores(req, res) {
  const householdId = parseId(req.params.householdId);
  if (!householdId) return res.status(400).json({ error: 'householdId must be a positive integer' });

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const chores = await prisma.chore.findMany({
    where: { householdId },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  res.json(
    chores.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      assignedTo: c.assignedTo ? { id: c.assignedTo.id, name: c.assignedTo.name } : null,
    })),
  );
}

export async function getChore(req, res) {
  const householdId = parseId(req.params.householdId);
  const choreId = parseId(req.params.id);
  if (!householdId || !choreId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const chore = await prisma.chore.findFirst({
    where: { id: choreId, householdId },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  res.json(formatChore(chore));
}

export async function updateChore(req, res) {
  const householdId = parseId(req.params.householdId);
  const choreId = parseId(req.params.id);
  if (!householdId || !choreId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const chore = await prisma.chore.findFirst({ where: { id: choreId, householdId } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  const isAdmin = req.user.householdId === householdId && req.user.role === 'admin';
  const isAssigned = chore.assignedToId === req.user.id;
  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Only the assigned user or household admin can update this chore' });
  }

  const { name, status, assignedTo } = req.body ?? {};
  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    data.name = name.trim();
  }

  if (status !== undefined) {
    if (typeof status !== 'boolean') {
      return res.status(400).json({ error: 'status must be a boolean' });
    }
    data.status = status;
  }

  if (assignedTo !== undefined) {
    if (assignedTo === null) {
      data.assignedToId = null;
    } else {
      const ok = await validateAssignee(assignedTo, householdId, res);
      if (!ok) return;
      data.assignedToId = Number(assignedTo);
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Provide at least one field to update: name, status, or assignedTo' });
  }

  const updated = await prisma.chore.update({
    where: { id: choreId },
    data,
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    status: updated.status,
    assignedTo: updated.assignedTo
      ? { id: updated.assignedTo.id, name: updated.assignedTo.name }
      : null,
  });
}

export async function deleteChore(req, res) {
  const householdId = parseId(req.params.householdId);
  const choreId = parseId(req.params.id);
  if (!householdId || !choreId) {
    return res.status(400).json({ error: 'IDs must be positive integers' });
  }

  const household = await resolveHousehold(householdId, req.user, res);
  if (!household) return;

  const chore = await prisma.chore.findFirst({ where: { id: choreId, householdId } });
  if (!chore) return res.status(404).json({ error: 'Chore not found' });

  const isAdmin = req.user.householdId === householdId && req.user.role === 'admin';
  const isAssigned = chore.assignedToId === req.user.id;
  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ error: 'Only the assigned user or household admin can delete this chore' });
  }

  await prisma.chore.delete({ where: { id: choreId } });

  res.json({ id: chore.id, name: chore.name });
}
