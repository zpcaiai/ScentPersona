-- Admin auth upgrade: password + last login
ALTER TABLE "admin_users" ADD COLUMN     "passwordHash" TEXT;
ALTER TABLE "admin_users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);
