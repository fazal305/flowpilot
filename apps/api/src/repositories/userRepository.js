import { prisma } from "../db/prisma.js";

export function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser({ email, passwordHash, name }) {
  return prisma.user.create({ data: { email, passwordHash, name } });
}
