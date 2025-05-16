# Roadmap for Improving the Project

## Phase 1: Assess and Modularize
**Objective**: Simplify large files, create reusable components, and improve maintainability.
- **Files to Address**:
  - `src/components/AdminEvent.jsx`:
    - Break down into smaller components for forms, schedules, and staff assignments.
    - Move reusable logic (e.g., event data fetching) to `src/hooks/`.
  - `src/styles/devils-purse.css`:
    - Split this large stylesheet into smaller, modular CSS files or convert it into Tailwind CSS utilities.
  - `src/pages/`:
    - Evaluate individual page files and identify opportunities for shared components.
- **Steps**:
  1. Identify repeating patterns or components across the app (e.g., buttons, modals, headers).
  2. Refactor these into a `shared` folder under `src/components/shared/`.

## Phase 2: Redesign Navigation
**Objective**: Create intuitive and responsive navigation.
- **Files to Address**:
  - `src/components/shared/Header.jsx`:
    - Redesign to support a "hamburger" menu for mobile users.
    - Retain a horizontal navigation bar for desktop views.
  - `index.html`:
    - Ensure proper meta tags and viewport settings for responsiveness.
  - Tailwind CSS (or modularized CSS from Phase 1) for styles.
- **Steps**:
  1. Use a library like `react-router` to manage navigation state.
  2. Integrate breadcrumbs for better context on subpages.

## Phase 3: Enhance Mobile and Desktop Layouts
**Objective**: Ensure layouts are clean, minimal, and work seamlessly across devices.
- **Files to Address**:
  - `src/styles/devils-purse.css`:
    - Add responsive utilities or migrate to Tailwind CSS.
  - Pages in `src/pages/`:
    - Optimize layout structure using a mobile-first approach.
- **Steps**:
  1. Use CSS media queries or Tailwind classes to create a responsive grid system.
  2. Test each page on multiple screen sizes to identify layout issues.

## Phase 4: Preserve and Extend Key Features
**Objective**: Maintain existing functionality while improving usability.
- **Files to Address**:
  - `api/generate-pdf.js`:
    - Ensure compatibility with redesigned forms.
  - `api/analyze-pdf.js`:
    - Test existing form analysis logic with new layouts.
  - Supabase Tables:
    - Verify that changes to forms and schedules are reflected in the database schema.
- **Steps**:
  1. Implement comprehensive tests for PDF generation and schedule editing features.
  2. Modularize the logic in `generate-pdf.js` and `analyze-pdf.js` for reuse in other features.

## Phase 5: Develop Undeveloped Parts
**Objective**: Add missing features and improve existing ones.
- **Files to Address**:
  - Admin Pages (e.g., `src/pages/AdminScheduleEditor.jsx`):
    - Add features like "Jockey Box Information" and "Beer Products Management."
  - Supabase Integration:
    - Ensure tables like `event_supplies` and `event_beers` are correctly utilized.
- **Steps**:
  1. Design new UI components for undeveloped features using reusable elements.
  2. Integrate these with Supabase tables and APIs.

## Phase 6: Testing and Deployment
**Objective**: Validate changes and deploy the improved app.
- **Files to Address**:
  - `package.json`, `package-lock.json`:
    - Ensure dependencies are up-to-date and compatible.
  - `README.md`:
    - Update documentation to reflect the redesigned app.
- **Steps**:
  1. Test the app on various devices and browsers.
  2. Deploy to Vercel and gather feedback for further improvements.

---

## Summary of External Services and Dependencies
- **Supabase**:
  - Tables: `employees`, `events`, `event_assignments`, `event_beers`, `event_supplies`, etc.
  - Ensure APIs are documented and modular for reuse.
- **Libraries**:
  - `pdf-lib` for PDF functionality.
  - `react-router` for navigation.
  - Tailwind CSS for responsive design.

---

## Roles and Features Table

| Section       | Use                                                                                   | Employee                                                                                     | Admin                                                                                         | Notes                                                                                                                                                                    |
|---------------|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Announcements | "General announcements, could be the landing page"                                   | "View only, perhaps commenting"                                                             | Edit/Add/Remove announcements                                                                |                                                                                                                                                                          |
| Schedule      | "Scrollable (left to right) weekly schedule, including Employee Schedule (tasting room) and Events (off-site and in-house)" | "View only, perhaps request open shifts (advanced feature) or request off (advanced feature), download personal schedule or iCal." | "Add/Edit weekly schedule, Add/Edit individual shifts, Assign/Remove employees from shifts, Add/Edit/Apply Schedule Templates to individual weeks or (advanced) a range of weeks." | Events view also on this calendar, but are edited elsewhere. Much of this is already in place and working in AdminSchedule Editor so could possibly be reused when redoing this portion. |
| Employees     | Contact list for employees                                                           | "View only, and only contact details"                                                       | Add/Edit employees and their information, including hidden information viewable only by admins. |                                                                                                                                                                          |
| Events        | View upcoming in-house and off-site events                                           | "View upcoming events, download event form (pdf) if working, fill out post-event notes"      | Add/Edit events, view completed forms for events.                                             | PDF template is already created and fills perfectly in AdminEvents.jsx. Would likely be reused.                                                                          |
| Links         | Useful links and sites for DP employees                                              | View only                                                                                    | "Add/edit links and files for download, such as links to payroll site or download blank event form, etc." |                                                                                                                                                                          |