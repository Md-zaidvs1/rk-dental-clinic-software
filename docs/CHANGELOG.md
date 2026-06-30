# CHANGELOG - RK DENTAL CLINIC SUITE
All notable changes to the **RK Dental Clinic Suite** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to Semantic Versioning.

---

## [1.0.0-rc1] - 2026-06-27

### Added
- **Interactive Advanced Dental Chart**:
  - Implemented Adult Dentition (32 teeth), Pediatric Dentition (20 teeth), and Mixed Dentition layout options.
  - Added support for two numbering systems: FDI Numbering (e.g., 18-48) and Universal Numbering (1-32).
  - Integrated full clinical status color-coding (Green for Healthy, Yellow for Caries, Amber for RCT, Red for Missing/Impacted/Extraction).
  - Developed multi-select options for bulk-marking multiple teeth.
  - Implemented automatic database synchronization of dental chart updates into the billing procedure ledger.
  - Added individual tooth historical timeline trackers and diagnostic clinical notes.
- **Radiology and RVG Module**:
  - Added high-resolution file support for OPG, RVG, and CBCT scans.
  - Created a drag-and-drop file uploader accepting images and PDF reports up to 10MB.
  - Developed a modern Lightbox Image Viewer equipped with interactive zoom sliders and 25% incremental buttons.
  - Implemented dedicated Download and Print utilities for quick physical medical file linkage.
- **Documentation & Handover Pack**:
  - Generated four complete guidebooks: `USER_MANUAL.md`, `INSTALLATION_GUIDE.md`, `ADMIN_GUIDE.md`, and `QUICK_START_GUIDE.md`.
  - Added `CHANGELOG.md` and `RELEASE_NOTES.md`.

### Changed
- **Patient 360 View**: Refactored the sub-tab structure under Patient Management to host Unified Patient Profiles, Clinical Timelines, Interactive Dental Charts, and Radiology modules side-by-side.
- **Doctor Workspace**: Exchanged the legacy 32-box simplified dental chart with the fully-interactive `AdvancedDentalChart` component to enable instant live diagnostic linkages.
- **Backend Core**: Expanded the database schema, models, routes, and Express controller pipelines to store and update `DentalChart`, `ToothHistory`, and `PatientReport` collections.

---
*Version: RK Dental Clinic Suite v1.0 RC1*
