# 📜 AI AGENT COLLABORATION RULES

## 1. PRE-ACTION PROTOCOL (The "Listen" Phase)
- **Check Memory:** Before writing any code or after making a pull from Git, you MUST read `conversation.md` to understand the current state of the project and what the other agent has recently changed.
- **Sync Check:** Identify if any variable names, API endpoints, or file structures have been updated. You must adopt these changes immediately to maintain compatibility.
- **Conflict Prevention:** If you are about to edit a file that the other agent is currently working on (based on the latest entries in `conversation.md`), you must notify the human and suggest creating a separate module/file instead.

## 2. DEVELOPMENT RULES
- **No Breaking Changes:** Never rename a public function or shared variable without documenting it clearly in `conversation.md`.

## 3. POST-ACTION PROTOCOL (The "Talk" Phase)
- **Log Everything:** Every time you finish a task and are pushing the changes to Git, you MUST write an entry in `conversation.md`. 
- **Be Explicit:** Describe exactly what you changed, why you changed it, and what the other agent needs to know to keep their side of the work functioning.
- **Verification:** Ensure the code you wrote follows the patterns established by the other agent in previous logs to ensure a unified codebase.