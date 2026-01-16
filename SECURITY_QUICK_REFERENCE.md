# Security Quick Reference Card

## 🚨 Emergency Response

### If Secrets Are Compromised
```bash
# 1. Immediately run security fixes
./scripts/security-fixes.sh

# 2. Activate new environment
mv .env .env.compromised
mv .env.new .env

# 3. Rotate all API keys (EmailJS, reCAPTCHA, Gemini)

# 4. Restart application
./scripts/app.sh restart

# 5. Review logs for suspicious activity
./scripts/app.sh logs | grep -i "auth_failed\|error\|unauthorized"
```

### If Under Attack
```bash
# 1. Check current connections
netstat -an | grep :3005 | wc -l

# 2. Block suspicious IPs (add to .env)
echo "ADMIN_ALLOWED_IPS=YOUR_IP_ONLY" >> .env

# 3. Restart with stricter limits
./scripts/app.sh restart

# 4. Monitor logs in real-time
./scripts/app.sh logs -f
```

---

## 🔑 Generate Secure Secrets

```bash
# JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Admin Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Random Admin Path
node -e "console.log('/admin-' + require('crypto').randomBytes(8).toString('hex'))"

# All at once
./scripts/security-fixes.sh
```

---

## 🔍 Security Checks

### Daily Checks
```bash
# Check for failed auth attempts
./scripts/app.sh logs | grep "auth_failed" | tail -20

# Check rate limit blocks
./scripts/app.sh logs | grep "Too many" | tail -20

# Check application status
./scripts/app.sh status
```

### Weekly Checks
```bash
# Check for dependency vulnerabilities
cd server && npm audit
cd ../client && npm audit

# Check for outdated packages
npm outdated

# Review security logs
./scripts/app.sh logs | grep "SECURITY" | tail -50
```

### Monthly Checks
```bash
# Full security audit
npm audit --audit-level=moderate

# Check disk space
df -h

# Review and rotate logs
ls -lh server/*.log

# Backup database
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/
```

---

## 🧪 Test Security Features

### Test Admin Authentication
```bash
# Should fail (no key)
curl -i http://localhost:3005/api/admin/stats

# Should succeed (with correct key)
curl -i -H "X-Admin-Key: YOUR_KEY" http://localhost:3005/api/admin/stats
```

### Test Rate Limiting
```bash
# Trigger rate limit (should block after 5 attempts)
for i in {1..10}; do 
  curl -H "X-Admin-Key: wrong" http://localhost:3005/api/admin/stats
  sleep 1
done
```

### Test CORS
```bash
# Should be blocked
curl -i -H "Origin: http://evil.com" http://localhost:3005/api/recipes
```

### Test Input Validation
```bash
# Should fail validation
curl -X POST http://localhost:3005/api/recipes \
  -H "Content-Type: application/json" \
  -H "X-Guest-ID: guest-test" \
  -d '{"name":"<script>alert(1)</script>"}'
```

---

## 📊 Monitor Security

### Real-time Monitoring
```bash
# Watch logs live
./scripts/app.sh logs -f

# Watch for security events
./scripts/app.sh logs -f | grep "SECURITY"

# Watch for errors
./scripts/app.sh logs -f | grep -i "error"
```

### Check Current State
```bash
# Check environment variables
cat .env | grep -v "^#" | grep -v "^$"

# Check running processes
ps aux | grep node

# Check open ports
lsof -i :3005

# Check disk usage
du -sh server/data/*
```

---

## 🔧 Common Fixes

### Reset Rate Limits
```bash
./scripts/app.sh restart
```

### Clear Old Logs
```bash
> server/app.log
./scripts/app.sh restart
```

### Fix Permissions
```bash
chmod -R 755 server/data/
chmod 600 .env
```

### Rebuild After Security Updates
```bash
./scripts/deploy.sh
./scripts/app.sh restart
```

---

## 📝 Security Checklist

### Before Deployment
- [ ] All secrets are randomly generated
- [ ] `.env` is not in git
- [ ] CORS is configured for production domain only
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] Input validation is active
- [ ] Admin IP whitelist is set (optional)
- [ ] All API keys are from production accounts

### After Deployment
- [ ] Test admin login
- [ ] Test rate limiting
- [ ] Test CORS restrictions
- [ ] Verify HTTPS redirect
- [ ] Check security headers
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Document admin credentials securely

---

## 🆘 Get Help

### Check Documentation
- Full audit: `SECURITY_AUDIT.md`
- Implementation guide: `SECURITY_FIXES_SUMMARY.md`
- Deployment guide: `DEPLOYMENT.md`
- Troubleshooting: `TROUBLESHOOTING.md`

### Debug Issues
```bash
# Check server logs
./scripts/app.sh logs | tail -100

# Check if server is running
./scripts/app.sh status

# Test API health
curl http://localhost:3005/api/health

# Check environment
env | grep -E "ADMIN_KEY|JWT_SECRET|ALLOWED_ORIGINS"
```

---

## 🔐 Security Contacts

### Report Security Issues
- **DO NOT** create public GitHub issues for security vulnerabilities
- Email: security@yourdomain.com (set this up!)
- Use GitHub Security Advisories for private disclosure

### Emergency Contacts
- System Administrator: [contact info]
- Security Team: [contact info]
- Hosting Provider Support: [contact info]

---

## 📚 Quick Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Docs](https://helmetjs.github.io/)

---

**Keep this file handy for quick security operations!**
