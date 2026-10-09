# Pipefitter Field Tool — store release preparation

Prepared from approved web version v87 on 2026-10-09 UTC.

**Status: preparation only. Neither native app has been built, signed, submitted,
approved or listed. Billing is not implemented.** The owner confirmed that neither
Apple Developer nor Google Play Console enrollment exists yet.

## Confirmed commercial terms

- US price: $19.99 initially, including the first 12 months.
- Continued active use after that: $9.99 per year.
- No $9.99 charge on day one.
- Prices in other currencies and tax treatment must be configured in the stores.
- Store commissions reduce proceeds; these are customer-facing prices, not net revenue.

`pricing-plan.json` records the decision only; it is not a billing configuration.

## Owner actions blocking submission

1. Enroll in Apple Developer ($99/year) and Google Play Console ($25 one-time),
   complete identity verification, and select the actual individual/business seller.
2. Complete paid-app agreements, tax and payout information directly in each store.
   Never commit banking details, signing secrets, or account credentials.
3. Confirm bundle/application ID, seller name, support contact and public privacy URL.
4. Confirm commercial distribution rights for the bundled Audel manual and other
   third-party images/reference material, or approve a store edition that omits them.
   Possession of the uploaded PDF is not evidence of redistribution permission.

New personal Google accounts require at least 12 opted-in closed testers for 14
continuous days before applying for production access. This does not guarantee approval.

## Native development scaffold

The separate mobile package uses Capacitor to bundle the existing calculator and
drawing locally. It does not load the mutable GitHub Pages site as the app.
The existing web build and its deployment workflow are unchanged.

On a development machine with the current Capacitor 8 platform prerequisites:

1. Build the complete repository with its existing root `npm install` and `npm run build`.
2. In `mobile`, install dependencies and retain the generated package lock.
3. Copy `capacitor.config.example.json` to `capacitor.config.json`. Replace the example
   ID with the owner's confirmed identifier before registering any store app.
4. Run `npm run prepare:web`. This only stages an internal development bundle.
5. Run `npm run add:ios` on a supported Mac/Xcode environment and
   `npm run add:android` with the supported Android SDK/JDK environment.
6. Run `npm run sync`, then the relevant `open:*` command for device testing.

Native projects, SDK dependencies, icons, launch assets and signed binaries have not
been generated here. The scaffold must not be described as an App Store-ready build.
Do not distribute the development bundle until the content review is resolved.

## Billing implementation still required

Design intent: a paid download includes 12 months; a separately consented annual
subscription provides subsequent access. Validate that the selected storefront
configuration can support this exact customer flow before enabling sales. Do not
promise that a paid download silently enrolls the customer in automatic renewals.

- Implement StoreKit / Google Play Billing with localized prices from the stores.
- Verify initial purchase and original purchase time using trusted store evidence,
  not an install date or editable localStorage flag. Reinstall must not restart the year.
- Implement annual subscription purchase, restore, management and cancellation UI.
- Build trusted entitlement validation and handle expiry, billing grace, refunds,
  revocations, pending purchases and duplicate notifications.
- Keep the included first year available without requiring an early renewal purchase.
- Explain ongoing value for annual renewal. Apple requires ongoing subscription value;
  the price decision alone does not establish eligibility or approval.
- Preserve saved work when access expires; design a read/export path rather than deletion.
  Confirm exactly which active-use features are restricted before shipping the paywall.
- Test offline access and trusted-time handling for field use. Do not make a transient
  network outage erase data or incorrectly revoke already verified entitlement.
- Browser localStorage does not automatically migrate to an installed native app.
  Implement an explicit drawing backup/import path and test upgrade persistence.

## Release acceptance work

- Device QA on iPhone and Android: fractions, two-tap pipe creation, tees, C-C reflow,
  dimensions, endpoint flanges, pinch, one-finger pan, edge pan and export.
- Native photo selection/share/save integration and the minimum necessary permissions.
- Audit every permission, data transmission and third-party SDK before completing
  Apple privacy disclosures and Google Data Safety. Draft no unsupported privacy claims.
- Publish actual support/privacy/terms pages, verify subscription disclosures, and
  prepare screenshots, age ratings, an original icon and review instructions.
- Test purchase/restore/expiry/refund/offline scenarios with store sandbox accounts.
- Run TestFlight and Google testing tracks; sign final artifacts with owner-controlled
  credentials, complete review and only then announce store availability.

## Draft listing copy (not submitted)

Name: Pipefitter Field Tool

Short description: Pipe calculations, fractions and interactive isometric drawings.

Description: Calculate feet, inches and fractions, plan pipe runs, add tees and
flanges, and organize dimensions in an interactive isometric drawing. Pan and zoom
around your work, adjust pipe-section measurements, and position dimension labels
for a clearer layout.

Pricing disclosure draft: $19.99 includes your first 12 months of active use.
After that, continued active use requires a $9.99/year subscription. Annual renewal
requires your consent through the store. Local pricing and taxes may vary.

Do not advertise the Audel book, cloud sync, cross-store purchase sharing, or other
unverified capabilities. Final renewal wording must match the actual implemented flow.

## Official references checked

- https://developer.apple.com/help/account/membership/program-enrollment/
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://developer.apple.com/app-store/review/guidelines/ (3.1.2, 4.2, 5.2)
- https://capacitorjs.com/docs/getting-started
- https://capacitorjs.com/docs/config
