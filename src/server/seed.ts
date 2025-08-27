import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main(){
  const u = await prisma.user.upsert({
    where: { email: "demo@you.com" },
    update: {},
    create: { email: "demo@you.com", credits: 1000 }
  });
  console.log("seeded", u);
}
main().then(()=>process.exit()).catch(e=>{console.error(e); process.exit(1);});
