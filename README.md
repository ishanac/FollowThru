# FollowThru
Turns “I’ll do it later” into consequences.

Description: 

We all commit to things and forget to follow up and as a result fail to meet deadlines. FollowThru is an iMessage addition based on Spectrum's Photon messaging SDK for TypeScript [Photon Repo] (https://github.com/photon-hq/spectrum-ts). In full implementation the program reads conversations, identifies deadlines/due dates through Gemini 2.5 Flash-lite, and creates a chat directly within iMessage to keep track of upcoming commitments, with check ins offering users the ability to request more time, mark the task as completed, or auto send a text to notify the conversation members that the task was not completed. Here, we use Photon to implement this at a small single chat scale. full funtionality would work similar to Apple's Apple Intelligence. Choosing to integrate this application directly into iMessage provides a great advantage to preventing digital clutter through another website or iphone application that goes untouched (many of us have experienced that) , making it accessible across an entire apple ecosystem, and giving users the familiarity of the iMessage interphase rather than an unfamiliar AI chatbot. 

Installation:

bun add spectrum-ts
npm install spectrum-ts
npm install @google/generative-ai

after configuring photon, an iMessage chat will open with the invited user: 

<img width="444" height="98" alt="Screenshot 2026-04-19 at 1 49 07 AM" src="https://github.com/user-attachments/assets/e2d6bea2-e5dd-479d-b95f-043eae5913e6" />


Installation References: 
[Installation and setup of Photon documented here] (https://github.com/photon-hq/spectrum-ts?tab=readme-ov-file#installation)
[Installation and setup of Gemini documented here] (https://ai.google.dev/gemini-api/docs/quickstart) 


Usage: 

This repo contains code to run FollowThru on Photon cloud servers. 
To use: 
after installing and setting up all relevant dependancies and linking with proper API keys run npm "filename".js // filename in repo is final.js 
This will prompt the program to "listen for relevant messages" 
the iMessage chat pictured earlier is a cloud simulation of a full disk access. Any messages in the single chat can behave as general messages that FollowThru reads from a user's iMessage. 
Gemini 2.5 Flash-lite determines whether a message is a commitment 
if commitment, logs it and sends follow up message 
if not commitment, does not process message. 

Contributing: 

Gratitude to photon for the workshop at PrincetonHacks and API access. Claude helped with troubleshooting issues and developing backbone code. 

License: 

No Lisence





