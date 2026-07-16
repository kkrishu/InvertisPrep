# Implementation Plan - Responsive PDF Viewer

The current PDF viewer has a fixed scale and doesn't adapt its width to smaller screens (mobile devices). This plan will implement dynamic width adjustment using a `ResizeObserver`.

## User Review Required

> [!NOTE]
> We will use the browser's native `ResizeObserver` to track the container's width. This ensures the PDF automatically resizes when the window is resized or when rotating a mobile device.

## Proposed Changes

### [PDF Viewer]

#### [MODIFY] [PDFViewer.tsx](file:///Users/ahqafcoder/Desktop/InvertisPrep/client/components/PDFViewer.tsx)
-   Implement a container ref to measure the available width.
-   Use `ResizeObserver` to update `containerWidth` state.
-   Calculate the effective page width using `containerWidth * scale`.
-   Adjust the toolbar layout to be more compact on mobile (wrap or stack if needed, though a single row might still work if icons are smaller).
-   Add `overflow-x-auto` to the outer container as a fallback.

## Verification Plan

### Manual Verification
-   Open the PDF viewer in Chrome/Firefox DevTools.
-   Toggle "Device Toolbar" and test various mobile presets (iPhone SE, Pixel 7, iPad Mini).
-   Verify that the PDF page fits within the screen width without horizontal scrolling (unless zoomed in).
-   Verify that the toolbar remains accessible.
