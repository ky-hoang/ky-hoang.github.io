---
title: Vivre
date: 2026-11-05
type: hackathon
summary: Describe what to watch for in a plain sentence, and it watches through your camera and microphone and alerts you when it happens.
stack: [Python, JavaScript, HTML/CSS, Meta Model API]
links:
  code: https://github.com/ky-hoang/vivre
  demo: https://web-production-749fb.up.railway.app
---

My solo submission to the Meta Global AI Developer Hackathon (Indie Developer track). There is a [demo video](https://drive.google.com/file/d/1mxDiw5nzRon1BF0P4Hc_xM5HBM5x6rz_/view?usp=sharing).

## The problem

Cameras that watch for things usually offer a fixed menu of detections. I wanted something you could simply tell what to look for, with nothing to train:

- "Tell me if the stove is on with a pot and nobody has been in the kitchen for 10 seconds"
- "Tell me if someone calls for help"
- "Tell me if a baby is crying"

## What I built

A web app that turns a sentence into a rule you can read on a card, then keeps checking the camera and microphone for it.

- Rules can be typed or spoken
- It finds and counts objects on camera and draws boxes around them on the live video
- It listens for speech and for sounds such as clapping or crying
- It times how long something has lasted
- Alerts come with a chime, a one-sentence explanation and a short replay clip
- Cards and alerts can be sent to a second device through a private link

Vivre is a prototype, not a safety device.

## How it works

Several models each do one job, and plain code keeps the time.

1. A language model turns the sentence into a structured rule, which the server validates.
2. Every few seconds the browser sends a camera frame and recent sound.
3. One model finds and counts objects, another answers each rule's question, and a sound recognizer runs in the browser.
4. Plain code checks the counts and runs the timers.
5. When a rule comes due, a final model confirms the alert and explains it.

The final model is only called when a rule comes due, and still frames skip the model calls, which keeps the cost down.

There are no accounts and no database. The server holds the last few frames in memory during a session and writes nothing to disk.
