# LiftMind Email Templates

Custom branded email templates for Supabase authentication emails.

## 📧 Available Templates

1. **confirm-signup.html** - Welcome email with account confirmation
2. **reset-password.html** - Password reset email
3. **magic-link.html** - Passwordless login email

## 🎨 Design Features

- **Brand Colors**: Rose (#f43f5e) primary, Indigo (#6366f1) accent
- **Modern Design**: Rounded corners, gradients, shadows
- **Responsive**: Mobile-optimized layouts
- **Icons**: Emoji icons for visual appeal
- **Professional**: Clean, athletic aesthetic matching the app

## 📝 How to Use

### Method 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates
2. Select a template (e.g., "Confirm signup")
3. Copy the contents from the corresponding `.html` file
4. Paste into the Supabase email editor
5. Click "Save"

### Method 2: Supabase CLI

```bash
# Update email template via CLI
supabase email update confirm-signup --body-file email-templates/confirm-signup.html
```

## 🔧 Customization

### Available Variables

Supabase provides these template variables:

- `{{ .ConfirmationURL }}` - Confirmation/action URL
- `{{ .Token }}` - One-time token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect destination

### Modify Colors

Update these CSS variables in each template:

```css
/* Primary gradient (rose) */
background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);

/* Accent gradient (indigo) */
background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
```

### Add Your Logo

Replace the emoji icon with your logo:

```html
<!-- Replace this -->
<div class="icon">💪</div>

<!-- With this -->
<img src="https://your-domain.com/logo.png" alt="LiftMind" style="width: 60px; height: 60px;">
```

## 🧪 Testing

### Test in Supabase

1. Set up a test email template
2. Use Supabase dashboard to send a test email
3. Check your inbox
4. Verify all links work correctly

### Local Testing

Use a service like [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/) to preview across different email clients.

## 📱 Email Client Compatibility

These templates are tested and compatible with:

- ✅ Gmail (Desktop & Mobile)
- ✅ Outlook (Desktop & Web)
- ✅ Apple Mail (macOS & iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

## 🎯 Best Practices

1. **Keep it Simple**: Avoid complex CSS that email clients might not support
2. **Use Inline Styles**: Email clients strip `<style>` tags inconsistently
3. **Test Thoroughly**: Always test before deploying to production
4. **Mobile First**: Most emails are read on mobile devices
5. **Clear CTAs**: Make action buttons obvious and easy to tap

## 🔐 Security Notes

- Never expose sensitive data in emails
- Use HTTPS for all links
- Include expiry times for security links
- Add security warnings for unexpected emails

## 📚 Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Design Best Practices](https://templates.mailchimp.com/)
- [Can I Email](https://www.caniemail.com/) - CSS support reference

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#f43f5e` | Main brand color, CTAs |
| Primary Dark | `#e11d48` | Gradients, hover states |
| Accent | `#6366f1` | Secondary actions |
| Text | `#0f172a` | Headings |
| Text Light | `#475569` | Body text |
| Background | `#f8fafc` | Email background |
| Border | `#e2e8f0` | Dividers, borders |

## 📧 SMTP Configuration (Optional)

For custom SMTP server (not required for Supabase default):

1. Go to: Project Settings → API
2. Scroll to "Custom SMTP"
3. Enter your SMTP credentials
4. Test connection

---

**Built with 💪 for LiftMind**

