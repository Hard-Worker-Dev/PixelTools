# PDF Merger and Splitter

## Processing model
Both tools use `pdf-lib` in the browser. Source files are read through the File API and are not uploaded to PixelTools servers.

## PDF Merger
- Select 2–10 PDF documents.
- Reorder documents before processing.
- Limits: 25 MB per file, 100 MB combined input, 200 combined pages and 150 MB output.
- Pages are copied into a new PDF in the displayed file order.

## PDF Splitter
- Select one PDF up to 25 MB and 200 pages.
- Enter comma-separated page ranges such as `1-3, 5, 8-10`.
- Each range becomes an independent PDF in a ZIP archive.
- Duplicate/overlapping, reversed, malformed and out-of-bounds ranges are rejected.

## Unsupported inputs
Password-protected, malformed and unsupported PDFs are rejected. Password removal and decryption are intentionally not attempted.

## Acceptance requirements
Automated checks cover merge order, split ZIP entries, range validation, corrupt inputs and unsupported file types. Before release, independently open merged and extracted PDFs in a desktop PDF reader, validate ZIP integrity with an archive utility, and test downloads on physical Android Chrome and iPhone Safari devices.


## PDF Rotator
- Rotate every page by 90°, 180° or 270° clockwise, or 90° counterclockwise.
- Existing page rotation is read and adjusted rather than blindly replaced.
- Input is limited to 25 MB and 200 pages; output is limited to 150 MB.

## PDF Page Reorder
- Arrange every page using up/down controls.
- Every original page must appear exactly once in the final order.
- Input is limited to 25 MB and 200 pages; output is limited to 150 MB.

## PDF Page Extractor
- Select individual pages, select all or clear the selection.
- Each selected page is exported as its own PDF in a ZIP archive.
- Input is limited to 25 MB and 200 pages; ZIP output is limited to 150 MB.

Automated page-operation tests verify effective rotation values, existing rotation preservation, page dimensions after reordering, invalid permutations, and the contents of extracted PDF entries. Manual independent-reader, archive-integrity and physical-device checks remain release gates for all five PDF tools.
