import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [
    {
      email: "alice@test.com",
      displayName: "Alice ✨",
      personalMessage: "Hola mundo!",
    },
    {
      email: "bob@test.com",
      displayName: "Bob 🎸",
      personalMessage: "Escuchando música",
    },
    { email: "carol@test.com", displayName: "Carol 🌸", personalMessage: "" },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    createdUsers.push(user);
    console.log(`  ✓ ${user.email}`);
  }

  // Agregar a todos como contactos entre sí
  for (const owner of createdUsers) {
    for (const target of createdUsers) {
      if (owner.id === target.id) continue;
      await prisma.contact.upsert({
        where: {
          ownerId_targetId: { ownerId: owner.id, targetId: target.id },
        },
        update: {},
        create: { ownerId: owner.id, targetId: target.id },
      });
    }
  }

  console.log(
    "✅ Done. Login with any of these accounts (password: password123)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
