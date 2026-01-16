#!/bin/bash
# security-fixes.sh - Apply critical security fixes

set -e

echo "🔒 Applying critical security fixes..."

# 1. Generate new secrets
echo ""
echo "📝 Generating new secrets..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ADMIN_PATH="/admin-$(node -e "console.log(require('crypto').randomBytes(8).toString('hex'))")"

# 2. Update .env file
echo ""
echo "📝 Creating new .env file..."
cat > .env.new << EOF
# SECURITY: Never commit this file to git!
# Generated: $(date)

# JWT Secret for authentication (REQUIRED)
JWT_SECRET=$JWT_SECRET

# Admin key for template management (REQUIRED)
ADMIN_KEY=$ADMIN_KEY

# Session secret (REQUIRED)
SESSION_SECRET=$SESSION_SECRET

# API URL for the coffee timer backend
VITE_API_URL=http://localhost:3005

# Allowed origins for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3005

# Admin IP whitelist (comma-separated, leave empty to allow all)
ADMIN_ALLOWED_IPS=

# Admin panel path (keep secret)
VITE_ADMIN_PATH=$ADMIN_PATH

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
VITE_APP_URL=http://localhost:5173

# Template settings
SEED_USER_DEFAULTS=true
TEMPLATE_USER_EMAIL=admin@admin.com
ADMIN_EMAILS=admin@admin.com
EOF

echo "✅ New .env file created as .env.new"
echo ""

# 3. Install security dependencies
echo "📦 Installing security dependencies..."
cd server
npm install --save express-mongo-sanitize xss-clean hpp morgan
cd ..

echo ""
echo "✅ Security fixes applied!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 IMPORTANT - SAVE THESE CREDENTIALS SECURELY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Admin Panel URL: http://localhost:5173$ADMIN_PATH"
echo "Admin Key: $ADMIN_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Review .env.new and replace .env with it:"
echo "   mv .env .env.backup && mv .env.new .env"
echo ""
echo "2. Update your API keys in .env:"
echo "   - EmailJS credentials"
echo "   - reCAPTCHA site key"
echo "   - Gemini API key"
echo ""
echo "3. Remove .env from git if committed:"
echo "   git rm --cached .env"
echo "   git commit -m 'Remove .env from version control'"
echo ""
echo "4. Update admin route in client/src/App.tsx:"
echo "   <Route path=\"$ADMIN_PATH\" element={<Admin />} />"
echo ""
echo "5. Restart your application:"
echo "   ./scripts/app.sh restart"
echo ""
echo "6. Review SECURITY_AUDIT.md for additional fixes"
echo ""
