npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev

Remove-Item -Recurse -Force prisma\migrations