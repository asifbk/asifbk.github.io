# Personal Portfolio Website

Single-page portfolio website for **Md Asif Bin Karim**, showcasing research, publications, certifications, education, experience, and contact information. The site is built with vanilla **HTML, CSS, and JavaScript**, and includes responsive sliders for publications and certifications.

## Features

- Responsive single-page layout (header, education, experience, publications, certifications, contact).
- Typewriter-style animated name in the hero/header.
- Timeline-style Experience section with clickable role summaries.
- Education section with collapsible details for each degree.
- Publications section:
  - Data loaded from `publications.json`.
  - Horizontal slider (up to 2 publications visible per view on large screens, fewer on small screens).
  - Modal image viewer for publication thumbnails.
  - Toggle between “Selected” and “All” publications.
- Certifications section:
  - Card-based slider (up to 4 certificates per view on large screens, fewer on small screens).
  - Larger certificate thumbnails with “View Certificate” external links.
- Contact section:
  - Embedded Google Map for `2801 S. University Ave, Little Rock, AR 72204`.
  - Contact form that opens the user’s email client via `mailto:` with prefilled subject and body.

## Tech Stack

- **HTML5** for structure
- **CSS3** (flexbox + grid, responsive design)
- **Vanilla JavaScript** for:
  - Publications JSON loading and rendering
  - Generic slider logic for publications and certifications
  - Collapsible sections (experience, education)
  - Modal image viewer
  - Contact `mailto:` handling

## Project Structure
.
├── index.html # Main single-page portfolio
├── styles.css # Global styles, layouts, animations
├── scripts.js # Sliders, toggles, modal, contact logic
├── publications.json # Publications data (title, authors, venue, links, etc.)
└── images/ # Logos, profile image, publication thumbnails, certificates