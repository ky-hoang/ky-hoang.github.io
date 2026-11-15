---
title: QuickCapture
date: 2026-04-01
type: personal
summary: A native macOS app that pulls editable text out of screenshots and images.
stack: [Swift, SwiftUI, Apple Vision]
---

## What I built

A native macOS app that uses Apple Vision to extract editable text from screenshots and images.

## How it works

- **Import:** bring in an image or screenshot
- **Recognize:** Apple Vision reads the text
- **Export:** copy the result to the clipboard
- **History:** past recognitions are stored locally

I tested recognition and history across varied images, and the app handles recognition failures with explicit errors.
