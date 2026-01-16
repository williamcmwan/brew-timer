# Security Fixes - Quick Start Guide

## 🚨 Critical Actions Required Immediately

### 1. Run the Security Fix Script
```bash
./scripts/security-fixes.sh
```

This will:
- Generate strong secrets (JWT_SECRET, ADMIN_KEY, SESSION_SECRET)
- Create a new `.env.new` file with secure defaults
- Install required security packages

### 2. Activate New Environment File
```bash
# Backup current .env
mv .env .env.backup

# Activate new secure .env
mv .env.new .env

# Update with your API keys
nano .env  # or use your preferred editor
```

### 3. Remove Secrets from Git
```bash
# Remove .env from git tracking
git rm --cached .env

# Commit the change
git commit -m "Remove .env from version control"

# Push to remote
git push
```

### 4. Rotate All API Keys

You must get new keys for:

1. **EmailJS** (https://www.emailjs.com/)
   - Create new service
   - Get new Service ID, Template ID, Public Key, Private Key
   - Update in `.env`

2. **Google reCAPTCHA** (https://www.google.com/recaptcha/admin)
   - Create new site
   - Get new Site Key
   - Update in `.env`

3. **Gemini API** (https://aistudio.google.com/app/apikey)
   - Generate new API key
   - Update in `.env`

### 5. Update Admin Panel Route

Edit `client/src/App.tsx`:
```typescript
// Change from:
<Route path="/secret-admin-panel-2024" element={<Admin />} />

// To (use the path from security-fixes.sh output):
<Route path="/admin-YOUR-RANDOM-PATH" element={<Admin />} />
```

### 6. Rebuild and Restart
```bash
./scripts/deploy.sh
./scripts/app.sh restart
```

---

## 📋 Implementation Checklist

### Immediate (Today)
- [ ] Run `./scripts/security-fixes.sh`
- [ ] Activate new `.env` file
- [ ] Remove `.env` from git
- [ ] Rotate all API keys
- [ ] Update admin panel route
- [ ] Restart application
- [ ] Test admin login with new key

### This Week
- [ ] Implement enhanced security middleware (see below)
- [ ] Add input validation to all routes
- [ ] Configure CORS properly
- [ ] Add HTTPS enforcement
- [ ] Set up request logging
- [ ] Configure IP whitelist for admin (optional)

### This Month
- [ ] Set up automated backups
- [ ] Implement audit logging
- [ ] Add monitoring and alerting
- [ ] Conduct security testing
- [ ] Document incident response plan

---

## 🔧 Enhanced Security Implementation

### Step 1: Update Server Entry Point

Edit `server/src/index.ts`:

```typescript
import { 
  globalLimiter, 
  adminLimiter, 
  uploadLimiter,
  corsOptions,
  helmetConfig,
  httpsRedirect 
} from './config/security.js';

// Add HTTPS redirect (before other middleware)
app.use(httpsRedirect);

// Update helmet configuration
app.use(helmet(helmetConfig));

// Update CORS
app.use(cors(corsOptions));

// Apply rate limiters
app.use('/api/', globalLimiter);
app.use('/api/admin', adminLimiter);
```

### Step 2: Update Admin Routes

Edit `server/src/routes/admin.ts`:

```typescript
import { adminIpWhitelist, logSecurityEvent } from '../config/security.js';
import { validateRequest, templateSchema } from '../middleware/validation.js';

// Add IP whitelist
router.use(adminIpWhitelist);

// Update admin auth to remove console.logs
const adminAuth = (req: any, res: any, next: any) => {
  const adminKey = req.headers['x-admin-key'];
  const validAdminKey = process.env.ADMIN_KEY;
  
  if (!adminKey || adminKey !== validAdminKey) {
    logSecurityEvent('admin_auth_failed', { 
      ip: req.ip,
      path: req.path 
    });
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  
  logSecurityEvent('admin_auth_success', { 
    ip: req.ip,
    path: req.path 
  });
  next();
};

// Add validation to template creation
router.post('/templates', adminAuth, validateRequest(templateSchema), (req, res) => {
  // Handler
});
```

### Step 3: Update Recipe Routes

Edit `server/src/routes/recipes.ts`:

```typescript
import { uploadLimiter } from '../config/security.js';
import { validateRequest, recipeSchema, validateGuestId } from '../middleware/validation.js';

// Add upload rate limiting
router.post('/upload-photo', uploadLimiter, ensureGuestUser, upload.single('photo'), ...);

// Add validation to recipe creation
router.post('/', ensureGuestUser, validateRequest(recipeSchema), (req, res) => {
  // Handler
});

// Add validation to recipe updates
router.put('/:id', ensureGuestUser, validateRequest(recipeSchema), (req, res) => {
  // Handler
});
```

---

## 🧪 Testing Your Security Fixes

### Test 1: Admin Authentication
```bash
# Should fail (no key)
curl http://localhost:3005/api/admin/stats

# Should fail (wrong key)
curl -H "X-Admin-Key: wrong-key" http://localhost:3005/api/admin/stats

# Should succeed (correct key from .env)
curl -H "X-Admin-Key: YOUR-NEW-ADMIN-KEY" http://localhost:3005/api/admin/stats
```

### Test 2: Rate Limiting
```bash
# Should block after 5 attempts
for i in {1..10}; do 
  curl -H "X-Admin-Key: wrong-key" http://localhost:3005/api/admin/stats
  echo ""
done
```

### Test 3: CORS
```bash
# Should be blocked
curl -H "Origin: http://evil.com" http://localhost:3005/api/recipes
```

### Test 4: Input Validation
```bash
# Should fail validation
curl -X POST http://localhost:3005/api/recipes \
  -H "Content-Type: application/json" \
  -H "X-Guest-ID: guest-test-123" \
  -d '{"name":"<script>alert(1)</script>","dose":-1}'
```

---

## 📊 Monitoring

### Check Security Logs
```bash
# View security events
./scripts/app.sh logs | grep "SECURITY"

# View failed auth attempts
./scripts/app.sh logs | grep "admin_auth_failed"

# View rate limit blocks
./scripts/app.sh logs | grep "Too many"
```

### Regular Security Checks
```bash
# Check for dependency vulnerabilities
cd server && npm audit
cd ../client && npm audit

# Check for outdated packages
npm outdated
```

---

## 🆘 Troubleshooting

### "Invalid admin key" error
- Check your `.env` file has the correct `ADMIN_KEY`
- Restart the server after changing `.env`
- Make sure you're using the key from the security-fixes.sh output

### "CORS blocked" error
- Add your domain to `ALLOWED_ORIGINS` in `.env`
- Restart the server
- Check browser console for the blocked origin

### "Too many requests" error
- Wait 15 minutes for rate limit to reset
- Or restart the server to clear rate limits
- Adjust rate limits in `server/src/config/security.ts` if needed

### Admin panel not found
- Make sure you updated the route in `client/src/App.tsx`
- Rebuild the client: `npm run build --prefix client`
- Clear browser cache

---

## 📚 Additional Resources

- Full audit report: `SECURITY_AUDIT.md`
- Security configuration: `server/src/config/security.ts`
- Validation middleware: `server/src/middleware/validation.ts`

---

## ✅ Verification

After completing all steps, verify:

1. [ ] New secrets are in `.env` and working
2. [ ] Old `.env` is removed from git
3. [ ] All API keys have been rotated
4. [ ] Admin panel requires new key
5. [ ] Rate limiting is working
6. [ ] CORS is properly configured
7. [ ] Input validation is active
8. [ ] Application is running without errors

**Your application is now significantly more secure!** 🎉
