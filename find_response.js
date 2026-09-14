const fs = require('fs');
const readline = require('readline');

async function run() {
    const fileStream = fs.createReadStream('C:\\Users\\usuario\\.gemini\\antigravity-ide\\brain\\14a22012-389e-45f8-98f4-cfda01235c94\\.system_generated\\logs\\transcript.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let foundUser = false;
    for await (const line of rl) {
        if (!line.trim()) continue;
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('barria con los datos basura')) {
            foundUser = true;
            console.log("Found USER request at step:", obj.step_index);
        } else if (foundUser && obj.type === 'PLANNER_RESPONSE' && obj.content) {
            console.log("Agent response at step", obj.step_index, ":");
            console.log(obj.content);
            break;
        }
    }
}
run();
