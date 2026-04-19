# FollowThru
Turns “I’ll do it later” into action.

## Description:

We all make commitments and forget to follow through, missing deadlines and letting tasks slip through the cracks. FollowThru is an AI-powered iMessage integration built using Spectrum’s Photon messaging SDK for TypeScript [Photon Repo] (https://github.com/photon-hq/spectrum-ts). It monitors conversations, detects when a user makes a commitment, and extracts deadlines using Gemini 2.5 Flash Lite.
Once a commitment is identified, FollowThru tracks it directly within iMessage and performs automatic check-ins when deadlines are reached. Users can quickly respond to prompts to request more time, mark the task as complete, or notify others that they didn’t finish.
This implementation demonstrates the concept at a small, single-chat scale using Photon. A full version would operate seamlessly across conversations, similar to Apple Intelligence. By integrating directly into iMessage, FollowThru avoids adding yet another app or website; reducing digital clutter while leveraging a familiar interface users already engage with daily across the Apple ecosystem.
 

## Installation:

```bash
bun add spectrum-ts
npm install spectrum-ts
npm install @google/generative-ai
```


After configuring Photon, an iMessage chat will open with the invited user:

<img width="444" height="98" alt="Screenshot 2026-04-19 at 1 49 07 AM" src="https://github.com/user-attachments/assets/e2d6bea2-e5dd-479d-b95f-043eae5913e6" />


Installation References: 

[Installation and setup of Photon documented here] (https://github.com/photon-hq/spectrum-ts?tab=readme-ov-file#installation)

[Installation and setup of Gemini documented here] (https://ai.google.dev/gemini-api/docs/quickstart) 


## Usage:

This repository contains the code to run FollowThru on Photon cloud servers.

To run: 
```bash
node final.js
```
Once running, the program listens for incoming messages in the connected iMessage chat.
- Messages are analyzed using Gemini 2.5 Flash-lite
- If a message is identified as a commitment, it is tracked and a follow-up is scheduled
- If not, the message is ignored

The iMessage chat acts as a simulation of full message access, allowing FollowThru to behave as if it were integrated directly into a user’s messaging environment.


## Contributing:

Special thanks to Photon for their workshop at PrincetonHacks and API access. Claude was used to help troubleshoot issues and assist in developing core functionality. 

## License:

No License 





