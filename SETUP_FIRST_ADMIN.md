# Setting Up Your First Admin Account

## Important: Admin Account Creation

**You cannot create admin accounts through public registration.** This is a security feature to prevent unauthorized admin access.

## Step 1: Run the Database Seeder

The seeder will create the initial admin account along with other test users.

### On Windows:
```bash
cd cafeCareystsem-backend
run-seeder.bat
```

### On Linux/Mac:
```bash
cd cafeCareystsem-backend
chmod +x run-seeder.sh
./run-seeder.sh
```

### Or manually:
```bash
cd cafeCareystsem-backend
npm run prisma:seed:images
```

## Step 2: Use the Seeded Admin Account

After running the seeder, you can log in with:

- **Email:** `admin@cafecare.com`
- **Password:** `admin123`

## Step 3: Create Additional Admin Accounts

Once logged in as the initial admin:

1. Go to the Admin Dashboard
2. Navigate to User Management
3. Click "Create New User"
4. Select "ADMIN" as the role
5. Fill in the user details

## Troubleshooting Login Issues

If you're getting 401 Unauthorized errors:

1. **Check if the database is seeded:**
   ```bash
   cd cafeCareystsem-backend
   npx prisma studio
   ```
   Look for users in the database. If empty, run the seeder.

2. **Verify the backend is running:**
   - Check `http://localhost:3001/health` in your browser
   - Should return: `{"success":true,"message":"CafeCare API is running",...}`

3. **Check backend logs:**
   - Look for error messages when you try to log in
   - Common issues: database connection, password hashing, user not found

4. **Reseed the database (if needed):**
   ```bash
   cd cafeCareystsem-backend
   npm run prisma:seed:images
   ```

## Default Seeded Accounts

After running the seeder, these accounts are available:

- **Admin:** `admin@cafecare.com` / `admin123`
- **Captain:** `captain@cafecare.com` / `captain123`
- **Cashier:** `cashier1@cafecare.com` / `cashier123`
- **Cashier 2:** `cashier2@cafecare.com` / `cashier123`
- **Captain 1:** `captain1@cafecare.com` / `captain123`
- **Barista:** `barista@cafecare.com` / `barista123`

