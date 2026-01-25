# App Store Checklist - Summit Wheels

## Pre-Submission Checklist

### App Content

- [ ] Game is fully playable with core loop working
- [ ] All UI text is localized (EN + ES minimum)
- [ ] No placeholder text or developer-only features visible
- [ ] All buttons and interactions work correctly
- [ ] Audio toggles function properly

### Visual Assets

- [x] App Icon (1024x1024) - Primary icon ✅ `assets/icon.png`
- [x] Splash Screen (1284x2778 for iPhone) ✅ `assets/splash.png`
- [ ] Screenshots (minimum 3 per device size):
  - iPhone 6.7" (1290x2796)
  - iPhone 6.5" (1284x2778)
  - iPhone 5.5" (1242x2208)
  - iPad 12.9" (2048x2732) - if supporting iPad

### App Store Metadata

- [ ] App Name: "Summit Wheels"
- [ ] Subtitle: "Hill Climb Racing Challenge"
- [ ] Description (max 4000 chars)
- [ ] Keywords (max 100 chars)
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] Age Rating questionnaire completed

### Privacy & Legal

- [ ] Privacy Policy published and accessible
- [ ] Terms of Service (if applicable)
- [ ] "Delete My Data" functionality implemented
- [ ] IDFA disclosure (if using ads)
- [ ] Data collection disclosure accurate

### Technical Requirements

- [ ] App launches without crash
- [ ] No red screen errors
- [ ] Supports latest iOS version
- [ ] Minimum iOS version: 13.0
- [ ] Background audio handling correct
- [ ] App does not drain battery excessively

### Monetization (if applicable)

- [ ] In-App Purchases configured in App Store Connect
- [ ] IAP prices set correctly
- [ ] Restore purchases functionality works
- [ ] Ads comply with Apple guidelines (rewarded only, no forced interstitials for young users)

## Submission Process

1. Build with EAS: `eas build -p ios --profile production`
2. Upload to App Store Connect via Transporter or EAS Submit
3. Fill out App Store metadata
4. Submit for review

## Common Rejection Reasons to Avoid

- Incomplete app or placeholder content
- Broken links (privacy policy, support URL)
- Misleading screenshots
- Missing required permissions explanations
- Crashes during review testing
- Inappropriate content for stated age rating
