# Security Audit Report - Coffee Brew Timer

**Date:** January 16, 2026  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Executive Summary

This security audit identified **12 security vulnerabilities** across authentication, secrets management, input validation, and infrastructure. The most critical issues include exposed secrets in version control, weak admin authentication, and missing security headers.

**Priority Actions:**
1. Remove exposed secrets from `.env` file and git history
2. Implement proper JWT secret generation and rotation
3. Add rate limiting to admin endpoints
4. Implement input validation and sanitization
5. Add HTTPS enforcement

---

## Critical Vulnerabilities 🔴

### 1. Exposed Secrets in Version Control
**Severity:** 🔴 Critical  
**File:** `.env`

**Issue:**
- Real API keys and secrets are committed to git
- EmailJS private key exposed: `aJEhSjRlpAmVZdLxKpKGB`
- reCAPTCHA site key exposed: `6LcIG0wsAAAAADbPkQW2GLBxK6qCVcqTcQVOtt1G`
- Admin key is weak: `coffee-admin-2024`

**Impact:**
- Attackers can access your EmailJS account
- Bypass reCAPTCHA protection
- Gain admin access to your application

**Recommendation:**
```bash
# 1. Immediately rotate all exposed credentials
# 2. Remove .env from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (WARNING: coordinate with team)
git push origin --force --all

# 4. Generate new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```


### 2. Missing JWT Secret in Production
**Severity:** 🔴 Critical  
**File:** `server/src/middleware/auth.ts`, `.env`

**Issue:**
- JWT_SECRET is not defined in `.env` file
- Falls back to weak default: `dev-only-secret-do-not-use-in-production`
- JWT tokens can be forged if secret is known

**Impact:**
- Attackers can create valid authentication tokens
- Complete authentication bypass possible

**Recommendation:**
```bash
# Add to .env
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET" >> .env

# Update .env.example with placeholder
```

### 3. Weak Admin Authentication
**Severity:** 🔴 Critical  
**Files:** `server/src/routes/admin.ts`, `client/src/pages/Admin.tsx`

**Issue:**
- Admin key passed in URL query parameters: `?key=coffee-admin-2024`
- Keys logged in server console
- No rate limiting on admin endpoints
- No account lockout after failed attempts
- Admin key visible in browser history and server logs

**Impact:**
- Brute force attacks possible
- Admin key leaked in logs and browser history
- No protection against automated attacks

**Recommendation:**
```typescript
// server/src/routes/admin.ts
import rateLimit from 'express-rate-limit';

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many admin login attempts, please try again later',
  skipSuccessfulRequests: true
});

router.use(adminLimiter);

// Remove console.log statements that expose admin keys
// Use secure headers instead of query params
```


---

## High Severity Vulnerabilities 🟠

### 4. Insufficient Input Validation
**Severity:** 🟠 High  
**Files:** `server/src/routes/recipes.ts`, `server/src/routes/admin.ts`

**Issue:**
- No validation on recipe data before database insertion
- SQL injection risk (mitigated by parameterized queries but still risky)
- No sanitization of user inputs
- File upload validation only checks MIME type (can be spoofed)

**Impact:**
- Malicious data stored in database
- XSS attacks via stored recipe names/descriptions
- Potential for malicious file uploads

**Recommendation:**
```typescript
// server/src/middleware/validation.ts
import { z } from 'zod';

export const recipeSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  ratio: z.string().regex(/^\d+:\d+$/),
  dose: z.number().min(0).max(1000),
  water: z.number().min(0).max(10000),
  temperature: z.number().min(0).max(100),
  brewTime: z.string().regex(/^\d+:\d+$/),
  process: z.string().max(5000).optional(),
  photo: z.string().url().optional().or(z.literal('')),
});

// Apply to routes
router.post('/', ensureGuestUser, validateRequest(recipeSchema), (req, res) => {
  // Handler
});
```

### 5. Unrestricted File Upload
**Severity:** 🟠 High  
**Files:** `server/src/routes/admin.ts`, `server/src/routes/recipes.ts`

**Issue:**
- 5MB file size limit is generous
- Only MIME type validation (easily spoofed)
- No file content validation
- No virus scanning
- Uploaded files served directly without sanitization

**Impact:**
- Malicious files uploaded to server
- Potential for stored XSS via SVG files
- Server storage exhaustion

**Recommendation:**
```typescript
import sharp from 'sharp';

const upload = multer({
  storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // Reduce to 2MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Strict whitelist
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images allowed'));
    }
  }
});

// Process and validate uploaded images
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    // Re-encode image to strip metadata and validate
    await sharp(req.file.path)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(req.file.path + '.processed');
    
    // Replace original with processed
    fs.renameSync(req.file.path + '.processed', req.file.path);
  } catch (error) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid image file' });
  }
});
```


### 6. CORS Misconfiguration
**Severity:** 🟠 High  
**File:** `server/src/index.ts`

**Issue:**
- CORS set to `origin: true` (allows ALL origins)
- Credentials enabled with wildcard origin
- No origin validation

**Impact:**
- Any website can make requests to your API
- CSRF attacks possible
- Data theft from authenticated users

**Recommendation:**
```typescript
// server/src/index.ts
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-ID', 'X-Admin-Key'],
  maxAge: 86400 // 24 hours
}));
```

### 7. Missing Security Headers
**Severity:** 🟠 High  
**File:** `server/src/index.ts`

**Issue:**
- CSP disabled completely: `contentSecurityPolicy: false`
- No X-Frame-Options
- No Strict-Transport-Security (HSTS)
- No X-Content-Type-Options

**Impact:**
- Clickjacking attacks possible
- XSS attacks easier to execute
- Man-in-the-middle attacks on HTTP

**Recommendation:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://www.google.com"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```


---

## Medium Severity Vulnerabilities 🟡

### 8. Predictable Guest IDs
**Severity:** 🟡 Medium  
**File:** `client/src/lib/api.ts`

**Issue:**
- Guest IDs use timestamp + short random string
- Predictable pattern: `guest-{timestamp}-{random}`
- Only 9 characters of randomness

**Impact:**
- Guest accounts can be enumerated
- Potential unauthorized access to guest data

**Recommendation:**
```typescript
private getOrCreateGuestId(): string {
  let guestId = localStorage.getItem('coffee-timer-guest-id');
  if (!guestId) {
    // Use crypto.randomUUID() for better randomness
    guestId = 'guest-' + crypto.randomUUID();
    localStorage.setItem('coffee-timer-guest-id', guestId);
  }
  return guestId;
}
```

### 9. No HTTPS Enforcement
**Severity:** 🟡 Medium  
**Files:** `server/src/index.ts`, deployment configuration

**Issue:**
- No redirect from HTTP to HTTPS
- Cookies not marked as Secure
- No HSTS header in development

**Impact:**
- Man-in-the-middle attacks
- Session hijacking
- Credential theft

**Recommendation:**
```typescript
// Add HTTPS redirect middleware
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Update cookie settings
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));
```

### 10. Insufficient Rate Limiting
**Severity:** 🟡 Medium  
**File:** `server/src/index.ts`

**Issue:**
- Global rate limit of 1000 requests per 15 minutes is too generous
- No endpoint-specific rate limiting
- No protection against slow-loris attacks

**Impact:**
- API abuse
- DDoS attacks
- Resource exhaustion

**Recommendation:**
```typescript
// Stricter global limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Reduce to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});

// Endpoint-specific limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
});

app.use('/api/', globalLimiter);
app.use('/api/admin', authLimiter);
app.use('/api/*/upload-photo', uploadLimiter);
```


### 11. Database Security Issues
**Severity:** 🟡 Medium  
**File:** `server/src/db/schema.ts`

**Issue:**
- SQLite database file has no encryption
- No backup strategy
- Database accessible if server is compromised
- No audit logging

**Impact:**
- Data breach if server compromised
- No recovery from data corruption
- No forensics capability

**Recommendation:**
```typescript
// 1. Enable SQLite encryption (requires sqlcipher)
import Database from '@journeyapps/sqlcipher';

const db = new Database(dbPath);
db.pragma(`key='${process.env.DB_ENCRYPTION_KEY}'`);

// 2. Add audit logging
export function logAuditEvent(action: string, userId: string, details: any) {
  db.prepare(`
    INSERT INTO audit_log (action, user_id, details, ip_address, timestamp)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(action, userId, JSON.stringify(details), details.ip);
}

// 3. Implement automated backups
import { CronJob } from 'cron';

new CronJob('0 2 * * *', () => {
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  fs.copyFileSync(dbPath, backupPath);
  console.log('Database backed up to:', backupPath);
}).start();
```

### 12. Exposed Admin Panel URL
**Severity:** 🟡 Medium  
**Files:** `client/src/App.tsx`, `.admin-access.md`

**Issue:**
- Admin panel URL is documented: `/secret-admin-panel-2024`
- URL is predictable and discoverable
- No IP whitelist
- Accessible from any location

**Impact:**
- Admin panel easily discovered by attackers
- Brute force attacks on admin key
- No geographic restrictions

**Recommendation:**
```typescript
// 1. Use environment variable for admin path
const ADMIN_PATH = process.env.VITE_ADMIN_PATH || '/admin';

// 2. Add IP whitelist middleware
const adminIpWhitelist = (req, res, next) => {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

app.use('/api/admin', adminIpWhitelist);

// 3. Generate random admin path on deployment
node -e "console.log('/admin-' + require('crypto').randomBytes(16).toString('hex'))"
```


---

## Low Severity Issues 🟢

### 13. Verbose Error Messages
**Severity:** 🟢 Low  
**Files:** Multiple route files

**Issue:**
- Detailed error messages exposed to clients
- Stack traces in development mode
- Database errors revealed

**Recommendation:**
```typescript
// Generic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});
```

### 14. Missing Request Logging
**Severity:** 🟢 Low  
**File:** `server/src/index.ts`

**Issue:**
- No request logging middleware
- Difficult to audit access
- No monitoring for suspicious activity

**Recommendation:**
```typescript
import morgan from 'morgan';

// Add request logging
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
}));
```

### 15. No Content Security Policy for Uploads
**Severity:** 🟢 Low  
**Files:** Image serving endpoints

**Issue:**
- Uploaded images served without CSP headers
- Potential for malicious content in images

**Recommendation:**
```typescript
app.use('/recipe-images', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(recipeImagesDir));
```


---

## Dependency Security

### Current Dependencies Analysis

**Server Dependencies:**
- ✅ `express-rate-limit` - Good for rate limiting
- ✅ `helmet` - Good for security headers (but misconfigured)
- ✅ `bcryptjs` - Good for password hashing
- ✅ `jsonwebtoken` - Good for JWT (but missing secret)
- ⚠️ `better-sqlite3` - No encryption support
- ⚠️ `multer` - Requires careful configuration

**Recommendations:**
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Add security-focused packages
npm install --save express-mongo-sanitize xss-clean hpp
npm install --save @journeyapps/sqlcipher  # For DB encryption
npm install --save sharp  # For image processing
npm install --save helmet-csp  # Enhanced CSP
```

---

## Implementation Priority

### Immediate (Within 24 hours)
1. ✅ Remove `.env` from git and rotate all secrets
2. ✅ Generate and set strong JWT_SECRET
3. ✅ Change admin key to strong random value
4. ✅ Fix CORS configuration
5. ✅ Add rate limiting to admin endpoints

### Short-term (Within 1 week)
6. ✅ Implement input validation with Zod
7. ✅ Add proper security headers
8. ✅ Implement file upload validation
9. ✅ Add HTTPS enforcement
10. ✅ Implement audit logging

### Medium-term (Within 1 month)
11. ✅ Add database encryption
12. ✅ Implement automated backups
13. ✅ Add IP whitelist for admin
14. ✅ Implement request logging
15. ✅ Add monitoring and alerting

---

## Security Best Practices Checklist

### Authentication & Authorization
- [ ] Strong JWT secret (64+ characters)
- [ ] Secure admin authentication
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Session timeout implementation
- [ ] Secure password reset flow

### Data Protection
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] SQL injection prevention (parameterized queries)
- [ ] Database encryption at rest
- [ ] Secure file upload handling
- [ ] Data backup strategy

### Network Security
- [ ] HTTPS enforcement
- [ ] Proper CORS configuration
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Rate limiting per endpoint
- [ ] DDoS protection
- [ ] IP whitelist for admin

### Infrastructure
- [ ] Secrets in environment variables (not code)
- [ ] Regular dependency updates
- [ ] Security audit logging
- [ ] Monitoring and alerting
- [ ] Incident response plan
- [ ] Regular backups

### Code Security
- [ ] No secrets in version control
- [ ] Secure error handling
- [ ] Least privilege principle
- [ ] Code review process
- [ ] Security testing in CI/CD
- [ ] Dependency vulnerability scanning


---

## Quick Fix Script

Here's a script to implement the most critical fixes:

```bash
#!/bin/bash
# security-fixes.sh - Apply critical security fixes

echo "🔒 Applying critical security fixes..."

# 1. Generate new secrets
echo ""
echo "📝 Generating new secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Update .env file
echo ""
echo "📝 Updating .env file..."
cat > .env.new << EOF
# SECURITY: Never commit this file to git!

# JWT Secret for authentication (REQUIRED)
JWT_SECRET=$JWT_SECRET

# Admin key for template management (REQUIRED)
ADMIN_KEY=$ADMIN_KEY

# Session secret (REQUIRED)
SESSION_SECRET=$SESSION_SECRET

# API URL for the coffee timer backend
VITE_API_URL=http://localhost:3005

# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3005,https://yourdomain.com

# Admin IP whitelist (comma-separated, leave empty to allow all)
ADMIN_ALLOWED_IPS=

# Buy Me a Coffee username
VITE_BUYMEACOFFEE_USERNAME=yourusername

# EmailJS Configuration (Get from https://www.emailjs.com/)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_PASSWORD_RESET_TEMPLATE_ID=your_reset_template_id

# Google reCAPTCHA v2 (Get from https://www.google.com/recaptcha/admin)
VITE_RECAPTCHA_SITE_KEY=your_site_key

# Gemini API Key (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_key

# Website URL
VITE_APP_URL=https://yourdomain.com

# Template settings
SEED_USER_DEFAULTS=true
TEMPLATE_USER_EMAIL=admin@admin.com
ADMIN_EMAILS=admin@admin.com
EOF

echo "✅ New .env file created as .env.new"
echo ""
echo "⚠️  IMPORTANT: Review .env.new and replace .env with it"
echo "⚠️  Then update your EmailJS, reCAPTCHA, and other API keys"
echo ""
echo "🔑 Your new admin key is: $ADMIN_KEY"
echo "   Save this securely - you'll need it to access the admin panel"
echo ""

# 3. Install security dependencies
echo "📦 Installing security dependencies..."
cd server
npm install --save express-mongo-sanitize xss-clean hpp morgan
cd ..

echo ""
echo "✅ Security fixes applied!"
echo ""
echo "Next steps:"
echo "1. Review and activate .env.new"
echo "2. Rotate your EmailJS and reCAPTCHA keys"
echo "3. Update ALLOWED_ORIGINS with your production domain"
echo "4. Run: git rm --cached .env (if committed)"
echo "5. Restart your application"
```

Save this as `scripts/security-fixes.sh` and run:
```bash
chmod +x scripts/security-fixes.sh
./scripts/security-fixes.sh
```

---

## Testing Security Fixes

After implementing fixes, test with:

```bash
# 1. Test rate limiting
for i in {1..10}; do curl http://localhost:3005/api/admin/stats; done

# 2. Test CORS
curl -H "Origin: http://evil.com" http://localhost:3005/api/recipes

# 3. Test admin authentication
curl -X GET http://localhost:3005/api/admin/stats
# Should return 401

# 4. Test file upload limits
curl -X POST -F "photo=@large-file.jpg" http://localhost:3005/api/recipes/upload-photo

# 5. Test input validation
curl -X POST http://localhost:3005/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>"}'
```

---

## Monitoring & Alerting

Set up monitoring for:

1. **Failed authentication attempts**
   - Alert after 5 failed attempts from same IP
   - Alert after 20 failed attempts globally

2. **Unusual API usage**
   - Alert on sudden spike in requests
   - Alert on requests from new countries/IPs

3. **File uploads**
   - Alert on large file uploads
   - Alert on unusual file types

4. **Database changes**
   - Alert on admin template modifications
   - Alert on bulk data deletions

5. **System resources**
   - Alert on high CPU/memory usage
   - Alert on disk space issues

---

## Incident Response Plan

If you detect a security breach:

1. **Immediate Actions**
   - Rotate all secrets immediately
   - Review access logs for suspicious activity
   - Backup current database state
   - Block suspicious IP addresses

2. **Investigation**
   - Check audit logs for unauthorized access
   - Review file uploads for malicious content
   - Check database for injected data
   - Review server logs for anomalies

3. **Recovery**
   - Restore from clean backup if needed
   - Apply all security patches
   - Reset all user sessions
   - Notify affected users if needed

4. **Prevention**
   - Document the incident
   - Update security measures
   - Conduct security review
   - Implement additional monitoring

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

---

## Contact

For security concerns or to report vulnerabilities, please contact:
- Email: security@yourdomain.com
- Create a private security advisory on GitHub

**Do not publicly disclose security vulnerabilities.**
