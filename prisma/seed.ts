import { PrismaClient, ReservationStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Perfil admin y restaurante demo
  const admin = await prisma.profile.upsert({
    where: { id: "admin-demo" },
    update: {},
    create: {
      id: "admin-demo",
      role: Role.admin,
      name: "Admin DineFirst"
    }
  });

  const owner = await prisma.profile.upsert({
    where: { id: "owner-demo" },
    update: {},
    create: {
      id: "owner-demo",
      role: Role.restaurante,
      name: "Restaurante Demo Owner"
    }
  });

  const diner = await prisma.profile.upsert({
    where: { id: "diner-demo" },
    update: {},
    create: {
      id: "diner-demo",
      role: Role.comensal,
      name: "Comensal Demo"
    }
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-restaurante" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Restaurante Demo",
      slug: "demo-restaurante",
      city: "madrid",
      address: "Calle Falsa 123, Madrid",
      lat: 40.4168,
      lng: -3.7038,
      cuisineType: "Mediterránea",
      capacity: 40,
      description:
        "Restaurante de ejemplo para DineFirst con cocina mediterránea moderna.",
      isActive: true
    }
  });

  const table = await prisma.table.upsert({
    where: { id: "mesa-1-demo" },
    update: {},
    create: {
      id: "mesa-1-demo",
      restaurantId: restaurant.id,
      name: "Mesa 1",
      capacity: 4,
      isActive: true
    }
  });

  const now = new Date();
  const todayAt20 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    20,
    0,
    0
  );

  const slot = await prisma.timeSlot.create({
    data: {
      restaurantId: restaurant.id,
      tableId: table.id,
      date: todayAt20,
      startTime: "20:00",
      endTime: "22:00",
      isAvailable: true
    }
  });

  await prisma.reservation.create({
    data: {
      userId: diner.id,
      restaurantId: restaurant.id,
      tableId: table.id,
      timeSlotId: slot.id,
      partySize: 2,
      status: ReservationStatus.confirmed,
      confirmationCode: "DEMO-1234"
    }
  });

  console.log("Seed completado con datos demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

