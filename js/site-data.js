/* ==========================================================================
   ED HARDWOOD FLOOR — SITE DATA  (the file you edit most often)
   --------------------------------------------------------------------------
   1. PROJECTS  → the before/after cards in the "See the Difference" section
   2. REVIEWS   → customer reviews (leave empty until you have real ones)
   3. GOOGLE REVIEW LINK → shows the "Leave ED Hardwood Floor a Review" button

   You do not need to touch main.js for any of this.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. PROJECTS  (before / after photos)
   --------------------------------------------------------------------------
   HOW TO ADD A REAL PROJECT
     a) Save two photos of the SAME spot of the floor, same angle, in the /projects/ folder:
          projects/danbury-before.webp   and   projects/danbury-after.webp
        Tips: landscape (4:3) photos, about 1000 px wide, saved as .webp or .jpg.
        (squoosh.app converts and shrinks photos for free.)
     b) Copy one block below, paste it at the top of the list, and fill it in.
     c) Delete the "placeholder: true" line (that line shows a "Sample photo" tag).
     d) Delete the sample blocks once you have your own projects.

   FIELDS
     before / after : paths to the two photos
     city           : shown on the card, for example "Danbury, CT"
     service        : installation | refinishing | sanding | staining | repair | restoration
     wood           : OPTIONAL wood/stain info. Plain text is fine: wood: "Red oak · Natural stain"
                      (or give all three languages like the samples below). Leave out if unknown.
     alt            : OPTIONAL custom description of the photos for screen readers/SEO
   -------------------------------------------------------------------------- */
window.EDHF_PROJECTS = [
  {
    placeholder: true,                       // ← delete this line for real projects
    before: "projects/project-1-before.webp",
    after:  "projects/project-1-after.webp",
    city: "Connecticut",
    service: "refinishing",
    wood: { en: "Oak · Natural finish", pt: "Carvalho · Acabamento natural", es: "Roble · Acabado natural" }
  },
  {
    placeholder: true,
    before: "projects/project-2-before.webp",
    after:  "projects/project-2-after.webp",
    city: "New York",
    service: "staining",
    wood: { en: "Oak · Dark walnut stain", pt: "Carvalho · Tingimento nogueira escuro", es: "Roble · Teñido nogal oscuro" }
  },
  {
    placeholder: true,
    before: "projects/project-3-before.webp",
    after:  "projects/project-3-after.webp",
    city: "Connecticut",
    service: "restoration",
    wood: { en: "Oak · Restored natural color", pt: "Carvalho · Cor natural restaurada", es: "Roble · Color natural restaurado" }
  }
];


/* --------------------------------------------------------------------------
   2. REVIEWS
   --------------------------------------------------------------------------
   Only add REAL reviews from real customers (with their permission).
   While this list is empty, the page shows a short "reviews coming soon" note.

   To add one, put a block like this between the [ ] below (separate blocks with a comma):

     {
       name: "First name + last initial",       // for example "Maria S."
       city: "Danbury, CT",                     // optional
       rating: 5,                               // 1 to 5
       text: "Paste the customer's words here." // or give all 3 languages: { en: "…", pt: "…", es: "…" }
     }
   -------------------------------------------------------------------------- */
window.EDHF_REVIEWS = [
  // Add real reviews here.
];


/* --------------------------------------------------------------------------
   3. GOOGLE REVIEW LINK
   --------------------------------------------------------------------------
   Paste the link customers use to leave you a Google review (Google Business Profile →
   "Ask for reviews" → copy link). Leave it empty ("") to keep the button hidden.
   -------------------------------------------------------------------------- */
window.EDHF_GOOGLE_REVIEW_URL = "";
