---
title: Journal RAG
date: 2026-07-15
type: personal
summary: Ask questions about my own Notion journal in plain language and get answers with citations to the entries they came from.
stack: [Python, FastAPI, React, ChromaDB, Gemini API, GitHub Actions]
---

## What I built

A full-stack retrieval-augmented generation (RAG) app. It indexes my Notion journal entries in ChromaDB and answers natural-language questions about them, citing its sources, through a FastAPI backend and a React interface.

## How it works

- **Hybrid search:** vector search and BM25 keyword search run side by side, and their results are merged with reciprocal-rank fusion
- **Date filtering:** questions can be limited to a time range
- **Multi-step queries:** the app rewrites follow-up questions so they stand on their own, retrieves relevant entries over several rounds, and computes exact counts for questions that ask for a number
- **Regression checks:** run automatically in GitHub Actions
