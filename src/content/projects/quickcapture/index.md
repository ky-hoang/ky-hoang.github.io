---
title: QuickCapture
date: 2026-04-01
type: personal
summary: A native macOS app that pulls editable text out of screenshots and images.
stack: [Swift, SwiftUI, Apple Vision]
---

## What I built

A Mac app for the moment you need text that's stuck in a screenshot. It uses Apple Vision to turn the image into text you can edit.

## How it works

- **Import:** bring in an image or screenshot
- **Recognize:** Apple Vision reads the text
- **Export:** copy the result to the clipboard
- **History:** past recognitions are stored locally

I tested recognition and history on a wide range of images. When the app can't read an image, it says so with a clear error instead of failing silently.
