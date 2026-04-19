import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROJECT_ID = "key";
const PROJECT_SECRET = "key";

const gemini = new GoogleGenerativeAI("key");
const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Hardcoding fallback triggers
const COMMITMENT_TRIGGERS = [
    /\bi'?ll\b/i,
    /\bi will\b/i,
    /\bi'?m going to\b/i,
    /\bi promise\b/i,
    /\bi can send\b/i,
    /\bby tonight\b/i,
    /\bby tomorrow\b/i,
    /\bbefore midnight\b/i,
    /\btonight\b/i,
    /\bi'?ll send\b/i,
    /\bi'?ll finish\b/i,
    /\bi'?ll do\b/i,
];

// ai fallback function returns boolean if trigger is present
function isCommitmentFallback(text){
    return COMMITMENT_TRIGGERS.some((p) => p.test(text));
}

// ai fallback function returns deadline adds time in ms to current time
function inferDeadlineFallback(text){
    const lower = text.toLowerCase();
    const now = new Date();

    const relMatch = lower.match(/\bin\s+(\d+)\s*(second|sec|minute|min|hour|hr)s?\b/);
    if (relMatch){
        const amount = parseInt(relMatch[1]);
        const unit = relMatch[2];
        let ms = 0;
        if (unit.startsWith("sec")) ms = amount*1000;
        else if (unit.startsWith("min")) ms = amount*60*1000;
        else if (unit.startsWith("hour")) ms = amount*60*60*1000;
        return new Date(Date.now()+ms)
    }


    const timeMatch = lower.match(/\b(?:by|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (timeMatch){
        let hours = parseInt(timeMatch[1])
        const mins = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3];

        // 12 special case
        if (hours === 12 && period ==="am"){
            hours = 0; //12am=midnight
        } else if (hours === 12 && period ==="pm"){
            hours = 12; //12pm=noon
        }
        else if (hours === 12 && !period){ //pick closest
            const noon = new Date();
            noon.setHours(12, mins, 0, 0);
            const nextMidnight = new Date();
            nextMidnight.setDate(nextMidnight.getDate()+1);
            nextMidnight.setHours(0, mins, 0, 0)
            const candidates = [noon, nextMidnight].filter(c => c > now);
            return candidates.sort((a,b) => a-b)[0] || nextMidnight;
        } else if (period === "pm" && hours < 12){
            hours += 12;
        } else if (period === "am" && hours === 0){
            // no change alr midnight
        }

        const d = new Date();
        d.setHours(hours, mins, 0, 0);
        if (d<=now) d.setDate(d.getDate() + 1);
        return d;
    }
        

    if (lower.includes("tomorrow")){
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
    }

    // default at EOD
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d;
}


// Gemini AI checking if an input is a commitment
async function isCommitment(text){
    try{
        const result = await model.generateContent(
            `Is this message a personal promise or commitment to do something? Examples: "I'll send it tonight", "I'll be there at 7", "I'll finish it tomorrow". Reply only with YES or NO.\n\nMessage: "${text}"`
        );
        const answer = result.response.text().trim().toUpperCase();
        console.log(`Gemini isCommitment("${text}") -> ${answer}`);
        return answer.startsWith("YES");
    } catch (err){
        console.warn(`Gemini failed for isCommitment, using fallback. Reason: ${err.message}`);
        const result = isCommitmentFallback(text);
        console.log(`Fallback isCommitment("${text}") -> ${result}`);
        return result;
    }
}

// Gemini AI checking the deadline
// async function inferDeadline(text) {
//     // handle relative time locally, never trust Gemini with it
//     const relMatch = text.toLowerCase().match(/\bin\s+(\d+)\s*(second|sec|minute|min|hour|hr)s?\b/);
//     if (relMatch) {
//         const amount = parseInt(relMatch[1]);
//         const unit = relMatch[2];
//         let ms = 0;
//         if (unit.startsWith("sec")) ms = amount * 1000;
//         else if (unit.startsWith("min")) ms = amount * 60 * 1000;
//         else if (unit.startsWith("hour") || unit.startsWith("hr")) ms = amount * 60 * 60 * 1000;
//         const d = new Date(Date.now() + ms);
//         console.log(`Local relative time: "${text}" -> ${d.toLocaleString()}`);
//         return d;
//     }

//     try {
//         const now = new Date();
//         const h = now.getHours();
//         const m = now.getMinutes();
//         const period = h < 12 ? "AM" : "PM";
//         const h12 = h % 12 || 12;
//         const nowStr = now.toLocaleString("en-US", {
//             hour12: false,
//             timeZoneName: "short",
//             year: "numeric", month: "numeric", day: "numeric",
//             hour: "2-digit", minute: "2-digit", second: "2-digit"
//         });

//         const result = await model.generateContent(
//             `Current time: ${nowStr} (24-hour). Right now it is ${h12}:${String(m).padStart(2,"0")} ${period}.
// Extract the deadline from this message as an ISO 8601 datetime.
// Rules:
// - "in X seconds/minutes/hours" → add that duration to current time
// - Explicit AM/PM → use exactly as stated
// - "12am" = midnight (00:00), "12pm" = noon (12:00)
// - No AM/PM given → match current period (currently ${period}). BUT if that time has already passed, and the other period is within 12 hours, pick the other period instead. If neither works, roll to next day.
// - "tomorrow" → tomorrow at 9am
// - Vague or nothing → tonight at 23:59
// Reply with ONLY the ISO 8601 string, nothing else.

// Message: "${text}"`
//         );

//         const iso = result.response.text().trim();
//         const d = new Date(iso);
//         if (isNaN(d.getTime())) throw new Error(`Invalid date from Gemini: "${iso}"`);
//         console.log(`Gemini inferDeadline("${text}") -> ${d.toLocaleString()}`);
//         return d;

//     } catch (err) {
//         console.warn(`Gemini failed for inferDeadline, using fallback. Reason: ${err.message}`);
//         const d = inferDeadlineFallback(text);
//         console.log(`Fallback inferDeadline("${text}") -> ${d.toLocaleString()}`);
//         return d;
//     }
// }

async function inferDeadline(text) {
    const lower = text.toLowerCase();
    const now = new Date();

    // relative time — handle locally
    const relMatch = lower.match(/\bin\s+(\d+)\s*(second|sec|minute|min|hour|hr)s?\b/);
    if (relMatch) {
        const amount = parseInt(relMatch[1]);
        const unit = relMatch[2];
        let ms = 0;
        if (unit.startsWith("sec")) ms = amount * 1000;
        else if (unit.startsWith("min")) ms = amount * 60 * 1000;
        else if (unit.startsWith("hour") || unit.startsWith("hr")) ms = amount * 60 * 60 * 1000;
        const d = new Date(Date.now() + ms);
        console.log(`Local relative: "${text}" -> ${d.toLocaleString()}`);
        return d;
    }

    // specific time — handle locally with exact rules
    const timeMatch = lower.match(/\b(?:by|at)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (timeMatch && timeMatch[1]) {
        let hours = parseInt(timeMatch[1]);
        const mins = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3]; // "am", "pm", or undefined

        if (period === "am") {
            // next occurrence of that AM time
            if (hours === 12) hours = 0;
            const d = new Date();
            d.setHours(hours, mins, 0, 0);
            if (d <= now) d.setDate(d.getDate() + 1); // already passed → tomorrow AM
            console.log(`Explicit AM: "${text}" -> ${d.toLocaleString()}`);
            return d;

        } else if (period === "pm") {
            // next occurrence of that PM time
            if (hours !== 12) hours += 12;
            const d = new Date();
            d.setHours(hours, mins, 0, 0);
            if (d <= now) d.setDate(d.getDate() + 1); // already passed → tomorrow PM
            console.log(`Explicit PM: "${text}" -> ${d.toLocaleString()}`);
            return d;

        } else {
            // next possible occurrence of that time whichever comes first
            const amHour = hours === 12 ? 0 : hours;
            const pmHour = hours === 12 ? 12 : hours + 12;

            const amCandidate = new Date(); amCandidate.setHours(amHour, mins, 0, 0);
            const pmCandidate = new Date(); pmCandidate.setHours(pmHour, mins, 0, 0);

            
            const candidates = [amCandidate, pmCandidate].filter(d => d > now);
            if (candidates.length > 0) {
                const d = candidates.sort((a, b) => a - b)[0];
                console.log(`No period, next occurrence: "${text}" -> ${d.toLocaleString()}`);
                return d;
            } else {
                // tomorrow AM
                amCandidate.setDate(amCandidate.getDate() + 1);
                console.log(`No period, next day: "${text}" -> ${amCandidate.toLocaleString()}`);
                return amCandidate;
            }
        }
    }

    // no time found — use Gemini for natural language like "friday", "next week"
    try {
        const h = now.getHours();
        const m = now.getMinutes();
        const period = h < 12 ? "AM" : "PM";
        const h12 = h % 12 || 12;
        const nowStr = now.toLocaleString("en-US", {
            hour12: false, timeZoneName: "short",
            year: "numeric", month: "numeric", day: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });

        const result = await model.generateContent(
            `Current time: ${nowStr} (24-hour). Right now it is ${h12}:${String(m).padStart(2,"0")} ${period}.


Message: "${text}"`
        );

        const iso = result.response.text().trim();
        const d = new Date(iso);
        if (isNaN(d.getTime())) throw new Error(`Invalid date: "${iso}"`);
        console.log(`Gemini (natural language): "${text}" -> ${d.toLocaleString()}`);
        return d;

    } catch (err) {
        console.warn(`Gemini failed: ${err.message}, defaulting to tonight 23:59`);
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        return d;
    }
}



const commitments = new Map();
let commitmentCounter = 0;

function getOrCreateSenderMap(senderId){
    if (!commitments.has(senderId)) commitments.set(senderId, new Map());
    return commitments.get(senderId);
}


// Commitment hit deadline

async function onDeadlineHit(space, senderId, commitmentId){
    const senderMap = commitments.get(senderId);
    if(!senderMap) return;
    const c = senderMap.get(commitmentId);
    if (!c) return;
    c.awaitingReply = true;
    console.log(`Deadline hit: "${c.text}"`);
    await space.send (`Deadline reached \n\nYou said you'd: "${c.text}"\n\nReply:\n  a — Give me 10 more minutes\n  b — I did it \n  c — I did not finish (send message)`
    );
}

// Main

async function main(){
    const app = await Spectrum({
        projectId: PROJECT_ID, 
        projectSecret: PROJECT_SECRET, 
        providers: [imessage.config()],
    })

    console.log("Listening for Messages");
    for await(const[space,message] of app.messages){
        if (message.content.type !== "text") continue;

        const text = message.content.text.trim();
        const senderId = message.sender.id;
        const senderMap = getOrCreateSenderMap(senderId);
        const t = text.toLowerCase();

        console.log(`[${senderId}]: "${text}"`);

        let handledAsReply = false;
        for (const[commitmentId, c] of senderMap.entries()){
            if (!c.awaitingReply) continue;

            if(t === `a`){
                c.awaitingReply = false;
                clearTimeout(c.timer);
                c.deadline = new Date(Date.now() + 10*1000);
                c.timer = setTimeout(() => onDeadlineHit(space, senderId, commitmentId), 10*1000);
                await space.send(`Got it. Checking back on "${c.text}" in 10 minutes`);
                handledAsReply = true;
                break;
            }

            if (t === `b`){
                clearTimeout(c.timer);
                senderMap.delete(commitmentId);
                await space.send( `Nice. "${c.text}" marked complete.`);
                handledAsReply = true;
                break;
            }

            if (t === `c`){
                clearTimeout(c.timer);
                senderMap.delete(commitmentId);
                await space.send(`Hey, sorry didn't finish "${c.text}" yet. I'll get it done tomorrow.`);
                handledAsReply = true;
                break;
            }
        }

        if (handledAsReply) continue;

        if (! (await isCommitment(text))){
            console.log("Not a commitment. Skip.")
            continue;
        }

        const deadline = await inferDeadline(text);
        const msUntil = deadline.getTime() - Date.now();

        // if(msUntil <= 0){
        //     console.warn(`Deadline already passed for "${text}", skipping.`);
        //     continue;
        // }

        commitmentCounter++;
        const commitmentId = commitmentCounter;

        console.log(`Commitment: "${text}" — due ${deadline.toLocaleString()} (in ${Math.round(msUntil/1000)}s)`);
        const timer = setTimeout(() => onDeadlineHit(space, senderId, commitmentId), msUntil);
        senderMap.set(commitmentId, {text, deadline, timer, awaitingReply: false});
        await space.send(
            `Task tracked: "${text}" — checking in at ${deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
        );
    }
}

main().catch(console.error);
