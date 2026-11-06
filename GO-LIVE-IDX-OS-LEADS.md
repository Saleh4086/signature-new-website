# GO-LIVE — IDX sign-up → Brokerage OS CRM

**When:** 2026-11-05 (America/Los_Angeles)  
**Repo:** Saleh4086/signature-new-website  
**Worker:** billowing-forest-66bc  
**Sal approval:** Yes (wire IDX register/sign-up into Brokerage OS)

## What changed
1. **`public/assets/js/idx-wrapper.js`** — After a successful IDX `usersignup.php` / `addLead` (jQuery ajaxComplete, fetch, or XHR), fire-and-forget POST to `https://blackstonesignatureproperty.com/api/leads` with `source: "idx-signup"`. IDX’s own lead vault is unchanged and always runs first.
2. **`worker.js`** — Allow CORS + origin for `https://blackstonesignatureproperty.idxbroker.com` on `/api/leads` (in addition to the main site and preview). Existing website forms still use the same `/api/leads` → Supabase → `brokerage-os-master.pages.dev/api/website-lead-intake` path.
3. **No Brokerage OS code change** — intake already accepts `source`.
4. **Digital site** — not touched.

## How Sal confirms in OS CRM
1. Have a visitor (or Sal) complete the IDX sign-up / registration popup on an MLS results or details page.
2. In Brokerage OS, open website leads intake (broker sign-in) — lead should appear with **source `idx-signup`**, name/email/phone from the form, lead type typically **buyer**.
3. Same lead is also in the site Supabase CRM (`leads` table) with `source: idx-signup`.
4. Website contact forms continue to show source like `Website - …` (unchanged).

## Rollback
Backup: `/workspace/backups/idx-os-leads-20261105-2232/`  
Or revert commit(s) on `main` and redeploy. To disable only the bridge without rollback: remove the IDX signup block from `idx-wrapper.js` or turn off `BROKERAGE_OS_WEBSITE_LEADS_ENABLED` (also stops website→OS mirror).

## Dry-run notes
- OPTIONS + POST from IDX Origin without contact → 400 (origin/CORS OK, no lead written).
- Optional labeled test lead only if needed (name contains “IDX→OS Bridge Test”).
