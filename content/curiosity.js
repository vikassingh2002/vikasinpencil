/* Curiosity Cat: discoveries about AI agents and how AI works (curiosity.html).

   Each discovery follows one loop: hook → prediction → reveal → experiment → next.
   Fields:
     id, concept, title, hook, minutes
     path      position in the suggested path (leave out for extras)
     predict   the prediction. type is one of:
                 choice       options [{t, why}], answer (index)
                 conditional  like choice, where the right answer is "it depends on …"
                 estimate     min, max, step, unit, answer, tolerance
                 spot         lines [..], answer (index of the faulty line), why
                 rank         items in the right order (shown shuffled), why
                 pickmany     options [{t, yes, why}]
     reveal    say (one line), text, tempting (why other answers pull), limits
     deeper    optional sections [{h, p: [..]}]
     lab       a small simulation (illustrative, not a live model): {kind, ...}
     experiment  a real test with a chatbot: task, change, observe
     project   how it applies to the satellite anomaly investigator: {status, text}
     related   ids of related discoveries
     sources   [{title, url, date}]
     variants  new scenarios on the same idea, used when it comes back for review
   New topics or concepts can be added freely; the app makes no assumptions about them. */
window.NB = window.NB || {};
NB.curiosity = {
  version: 2,
  reviewed: "2026-10-29",
  concepts: [
    { id: "agent", name: "What an agent is" },
    { id: "workflow", name: "Agents or workflows" },
    { id: "tools", name: "Tool descriptions" },
    { id: "stopping", name: "Stopping rules" },
    { id: "eval", name: "Evaluation" },
    { id: "context", name: "Context and memory" },
    { id: "cost", name: "Costs" },
    { id: "multi", name: "Many agents" },
    { id: "safety", name: "Prompt injection" },
    { id: "grounding", name: "Grounding" },
    { id: "oversight", name: "Human approval" },
    { id: "reasoning", name: "Reasoning" }
  ],
  discoveries: [
    {
      id: "what-agent", concept: "agent", path: 1, minutes: 3,
      title: "Same model. One chats, one books the meeting.",
      hook: "Four systems all use a language model. Only one of them is what engineers usually mean by an agent.",
      predict: {
        type: "choice", prompt: "Which one is the agent?",
        options: [
          { t: "A spam filter that labels each email as spam or not", why: "It makes a judgement, but only once per email. Nothing loops, and it takes no actions in the world." },
          { t: "A program that reads a request, checks your calendar, books a slot, then confirms it worked", why: "It chooses steps, uses tools, looks at results and continues until the goal is met. That loop is the agent." },
          { t: "A chatbot that answers questions about your documents", why: "Tempting, because it feels smart. But it answers once and stops; it doesn't act or decide a next step." },
          { t: "A model that summarises three documents you paste in", why: "Useful, but a single call: text in, text out." }
        ],
        answer: 1
      },
      reveal: {
        say: "An agent is a model using tools in a loop.",
        text: "The model is the same in all four. What makes the booking program an agent is the setup around it: the model picks an action, a program carries it out, the result comes back, and the model decides what to do next, until the goal is met or something stops it.",
        tempting: "The document chatbot feels the most 'intelligent', which is why it's tempting. But intelligence isn't the test. Acting, observing and choosing the next step is.",
        limits: "'Agent' is used loosely. Some companies call any chatbot an agent; researchers sometimes require planning or memory too. The loop is the most useful working definition, not the only one."
      },
      deeper: [
        { h: "Tools are the hands", p: ["A model can only produce text. Tools turn text into actions: the model writes a small structured request, such as search with the query 'eclipse duration low Earth orbit', and the surrounding program runs it and hands back the result.", "Give the same model different tools and instructions and it becomes a different agent: a coding assistant, a travel planner, a research helper."] },
        { h: "Why agents are harder than chat", p: ["Every step is a chance to go wrong, and mistakes compound. Agents also need to know when they're done, how much they may spend, and which actions need a person's approval. Most of the craft is in those guard rails, not the model."] }
      ],
      lab: { kind: "loop" },
      experiment: {
        task: "In ChatGPT or Claude, paste: 'You are an agent with three tools: search(query), read(url), email(to, text). Goal: find the next ESA launch date and email it to me. Write out each step as Tool call → expected result, and stop when done.'",
        change: "Run it again, adding: 'The first search returns nothing useful.'",
        observe: "Does it plan a different step after the failed search, or repeat the same one? That reaction to results is the loop at work."
      },
      project: { status: "planned", text: "Your satellite anomaly investigator (experiment E-04, planned) would be an agent in exactly this sense: it would look at telemetry, call tools to check related readings, and decide what to examine next. The simulated satellite it will investigate isn't built yet." },
      related: ["workflow", "loop", "react"],
      sources: [
        { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", date: "2024-12-19" },
        { title: "LLM Powered Autonomous Agents (Lilian Weng)", url: "https://lilianweng.github.io/posts/2023-06-23-agent/", date: "2023-06-23" }
      ],
      variants: [
        {
          id: "what-agent-2",
          hook: "A support tool reads a customer's message, looks up their order, issues a refund if the order arrived damaged, and writes back.",
          predict: { type: "choice", prompt: "What makes this an agent rather than a chatbot?", options: [
            { t: "It's polite to customers", why: "Tone has nothing to do with it." },
            { t: "It acts with tools and decides its next step from what it finds", why: "Looking up the order and deciding on a refund from the result is the loop." },
            { t: "It uses a very large model", why: "Model size doesn't decide it; the setup does." }
          ], answer: 1 },
          reveal: { say: "Acting and deciding the next step from results is the mark of an agent.", text: "The refund depends on what the order lookup returns. That decision-from-results is the loop, and it's also why such a system needs approval rules for money." }
        }
      ]
    },
    {
      id: "workflow", concept: "workflow", path: 2, minutes: 3,
      title: "The invoice robot that didn't need to think.",
      hook: "Your team wants AI to process invoices: read each one, check the amount, match it to an order, file it.",
      predict: {
        type: "conditional", prompt: "Should this be an agent that decides its own steps?",
        options: [
          { t: "Yes: an agent can handle anything a workflow can, and more", why: "It can, but you'd pay in cost, speed and predictability for flexibility you may not need." },
          { t: "No: always use a fixed workflow for business processes", why: "Too strong. Some processes really do vary case by case." },
          { t: "It depends on whether the steps change from invoice to invoice", why: "Yes. If you can draw the flowchart in advance, a workflow wins. If invoices regularly need unpredictable investigation, an agent starts to earn its place." }
        ],
        answer: 2
      },
      reveal: {
        say: "Could you draw the flowchart before starting? Then build the flowchart.",
        text: "When the steps are fixed, ordinary code runs them in order and calls a model only where judgement is needed, such as reading a messy scan. That's cheaper, faster and much easier to test than letting a model choose every step.",
        tempting: "'Agent' sounds more capable, so it's tempting to reach for it. Capability you don't need still costs money and adds new ways to fail.",
        limits: "Real processes are often mixed: a fixed workflow for the 95% of normal invoices, and an agent (or a person) for the strange ones."
      },
      deeper: [
        { h: "Workflow shapes worth knowing", p: ["Anthropic's guide describes chaining (one call feeds the next), routing (send each input to the right handler), running calls in parallel, an orchestrator that hands out subtasks, and an evaluator loop where one call critiques another's work.", "Each is more predictable than a fully open agent, and together they cover a lot of real work."] }
      ],
      experiment: {
        task: "Pick a task you do every week. Write its steps as a numbered list and paste it into a chatbot with: 'Which of these steps need judgement, and which are fixed rules?'",
        change: "Add one awkward real case (an invoice in the wrong currency, say) and ask again.",
        observe: "Does the awkward case add a new branch, or does it need open-ended investigation? A new branch means workflow; open-ended means agent."
      },
      project: { status: "planned", text: "In the planned satellite investigator, reading the telemetry and flagging out-of-range values is a fixed workflow. Deciding what to check next for an unfamiliar anomaly is where an agent would earn its place." },
      related: ["what-agent", "many", "cost"],
      sources: [
        { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", date: "2024-12-19" }
      ],
      variants: [
        {
          id: "workflow-2",
          hook: "A news app summarises every article in the same three steps: fetch, summarise, tag by topic.",
          predict: { type: "choice", prompt: "Agent or workflow?", options: [
            { t: "Agent, because summarising needs intelligence", why: "Summarising needs a model, but the steps themselves never change." },
            { t: "Workflow, with a model inside the summarise and tag steps", why: "Yes: fixed steps, with judgement only inside two of them." },
            { t: "Neither: no AI is needed", why: "Summaries do need a model." }
          ], answer: 1 },
          reveal: { say: "Fixed steps, model inside: a workflow.", text: "Needing a model for a step doesn't make the whole thing an agent. The question is who decides the steps: you, in advance, or the model, as it goes." }
        }
      ]
    },
    {
      id: "tooldoc", concept: "tools", path: 3, minutes: 3,
      title: "Your agent can't read your code. Only this.",
      hook: "Your agent keeps sending whole sentences to a search tool that only works with two to four keywords. Here is everything the agent sees about the tool:",
      predict: {
        type: "spot", prompt: "Which line is most to blame?",
        lines: ["name: search", "description: Searches the company knowledge base.", "input query: The query.", "returns: Matching documents."],
        answer: 2,
        why: "'The query.' says nothing about what a good query looks like, so the model writes what it would type to a person: a full sentence."
      },
      reveal: {
        say: "The agent only knows a tool through its description.",
        text: "The model never sees how the tool works. It reads the name, the description and the input notes, and guesses. Saying 'two to four keywords, for example: ESA debris 2026' fixes the behaviour more reliably than a bigger model or more retries.",
        tempting: "The description line looks guilty because it's the longest. But it's accurate; what's missing is guidance on the input.",
        limits: "Good descriptions reduce mistakes but don't eliminate them. Helpful error messages ('No results; try fewer, broader keywords') are the second line of defence."
      },
      deeper: [
        { h: "Design tools for the agent", p: ["Anthropic's engineers suggest fewer, more thoughtful tools rather than wrapping every function in a system. A tool that returns a short, relevant answer beats one that dumps a thousand rows into the agent's context.", "Clear names help too: search_company_docs and search_web are hard to confuse; search and lookup are not."] }
      ],
      lab: { kind: "tooldesc" },
      experiment: {
        task: "In a chatbot, paste: 'You have one tool: search(query) — searches news. Show the exact call you'd make to find out whether ESA launched anything this month.'",
        change: "Repeat in a new chat, describing the tool as: 'search(query) — query must be 2–4 keywords, e.g. ESA launch October'.",
        observe: "Compare the two queries it writes. Which would a keyword search engine handle better?"
      },
      related: ["what-agent", "loop", "eval"],
      sources: [
        { title: "Writing effective tools for agents (Anthropic)", url: "https://www.anthropic.com/engineering/writing-tools-for-agents", date: "2025-09-11" }
      ],
      variants: [
        {
          id: "tooldoc-2",
          hook: "An agent has two tools, lookup and search. It keeps using lookup for web questions, and it fails.",
          predict: { type: "choice", prompt: "What's the best fix?", options: [
            { t: "Rename them search_web and lookup_customer, and say when to use each", why: "Yes: the names and descriptions are the agent's only clue." },
            { t: "Remove one of the tools", why: "That loses a capability you need." },
            { t: "Tell the agent to try harder", why: "Effort doesn't help if it can't tell the tools apart." }
          ], answer: 0 },
          reveal: { say: "Names and descriptions are prompts.", text: "Two vague names invite confusion. Specific names plus a line on when to use each are usually enough." }
        }
      ]
    },
    {
      id: "loop", concept: "stopping", path: 4, minutes: 3,
      title: "Twelve visits to the same webpage.",
      hook: "Your agent has checked the same webpage twelve times. It still says it's working.",
      predict: {
        type: "choice", prompt: "What would you add first?",
        options: [
          { t: "A stopping rule: a step limit, a definition of done, and a way to ask for help", why: "Yes: nothing told it when it was finished or stuck." },
          { t: "More memory, so it remembers it already checked", why: "Tempting: it does seem forgetful. But it can see its history; what it lacks is a reason to stop." },
          { t: "A longer, more detailed prompt about the task", why: "More task detail doesn't add an exit. It needs boundaries, not description." }
        ],
        answer: 0
      },
      reveal: {
        say: "Agents need written-down exits.",
        text: "An agent decides each step by reading what has happened so far. If the last step didn't give it what it wanted, repeating it looks reasonable. Without a step limit, a clear definition of done, or a way to ask for help, the loop has no reason to end.",
        tempting: "Memory is tempting because the behaviour looks forgetful. But the earlier visits are right there in the context. The missing piece is a rule that says 'enough'.",
        limits: "Some agent products add repetition checks automatically; many don't. And a step limit alone can stop a good run early, which is why the 'ask for help' exit matters."
      },
      deeper: [
        { h: "Three exits", p: ["Success: a clear definition of done ('stop when you have the price, the date and the link'). Giving up: a limit on steps, time or cost, after which it reports what it has. Asking for help: 'I'm blocked, here's why' — the one most often forgotten."] }
      ],
      lab: { kind: "stopping" },
      experiment: {
        task: "Ask a chatbot: 'Act as an agent. Find a laptop under ₹60,000 with 16 GB RAM. Narrate each step.' Don't say when to stop.",
        change: "Run it again, adding: 'Stop after 5 steps, or as soon as you have one model, price and link. If stuck, say what you need.'",
        observe: "Count the steps each time, and note whether the second run ends with a clear answer or a clear request."
      },
      project: { status: "planned", text: "The planned satellite investigator needs exactly these exits: done when a likely cause is found with evidence, give up after a step budget, and ask the operator when the telemetry is ambiguous." },
      related: ["cost", "tooldoc", "human"],
      sources: [
        { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", date: "2024-12-19" }
      ],
      variants: [
        {
          id: "loop-2",
          hook: "A coding agent keeps re-running the same failing test, changing nothing between runs.",
          predict: { type: "choice", prompt: "Which exit would help most here?", options: [
            { t: "Ask for help after the same failure repeats", why: "Yes: repeated identical failures are a sign it's stuck and needs input." },
            { t: "A higher step limit", why: "That lets it fail for longer." },
            { t: "A faster computer", why: "Faster failures are still failures." }
          ], answer: 0 },
          reveal: { say: "Repeated identical failure means 'stuck', not 'try again'.", text: "Detecting repetition and switching to 'ask for help' turns an endless loop into a useful question." }
        }
      ]
    },
    {
      id: "eval", concept: "eval", path: 5, minutes: 4,
      title: "The demo was brilliant. Was the change?",
      hook: "You rewrote your agent's instructions. On the demo you always show, version B is much better than version A.",
      predict: {
        type: "conditional", prompt: "Should you ship version B?",
        options: [
          { t: "Yes: the demo clearly improved", why: "One case can improve while others quietly break." },
          { t: "No: keep A until B is perfect", why: "Nothing is perfect; the question is whether B is better overall." },
          { t: "Only if B also does better on a fixed set of test tasks", why: "Yes. A set of realistic tests, run on both versions, shows the overall effect, including what broke." }
        ],
        answer: 2
      },
      reveal: {
        say: "One good demo can be luck. A test set can't hide breakage.",
        text: "Model outputs vary, and people remember the impressive ones. Twenty to fifty real tasks, each with a way to check the result, run before and after every change, tell you whether things improved and what got worse.",
        tempting: "The demo is vivid and it's the case you care about, so it feels decisive. That's exactly why it misleads.",
        limits: "Test sets only cover what you thought of. Keep adding real failures to them, and read real outputs too: numbers don't show you new kinds of mistakes."
      },
      deeper: [
        { h: "Reading outputs is the real work", p: ["Hamel Husain, who has helped many teams with this, argues the most valuable step is simply reading lots of real outputs. Patterns in the failures tell you what to test for."] },
        { h: "Agents need more than final answers", p: ["Check the path too: the right tools, a sensible number of steps, stopping when it should. Success for the wrong reasons won't last."] }
      ],
      lab: { kind: "evalgrid" },
      experiment: {
        task: "Write five questions about your own field with their correct answers. Ask them to one chatbot and mark each right or wrong.",
        change: "Add one instruction to every question, such as 'Answer in one sentence and say how sure you are.' Ask all five again.",
        observe: "Did the score go up, down or both? Note one question that changed in each direction."
      },
      project: { status: "planned", text: "For the planned satellite investigator, the test set would be injected faults with known causes (a broken heater, a failing battery cell) plus normal orbits that must not raise alarms. False alarms count as failures too." },
      related: ["tooldoc", "grounding", "loop"],
      sources: [
        { title: "Your AI product needs evals (Hamel Husain)", url: "https://hamel.dev/blog/posts/evals/", date: "2024-03-29" }
      ],
      variants: [
        {
          id: "eval-2",
          hook: "A new model scores 3 points higher on a public benchmark. Your team wants to switch.",
          predict: { type: "conditional", prompt: "Switch?", options: [
            { t: "Yes, higher is better", why: "Public benchmarks may not resemble your tasks." },
            { t: "Only if it also does better on your own test set", why: "Yes: your tasks are what matter." },
            { t: "Never switch models", why: "Too rigid; models do improve." }
          ], answer: 1 },
          reveal: { say: "Your own tests beat someone else's benchmark.", text: "Benchmarks measure general skill. Your test set measures your job. Check both, and trust yours." }
        }
      ]
    },
    {
      id: "context", concept: "context", path: 6, minutes: 3,
      title: "The rule that faded away.",
      hook: "An agent's instructions are 1,000 tokens long. Every step adds about 2,000 tokens of tool results to its context.",
      predict: {
        type: "estimate", prompt: "By step 20, what share of the context are the original instructions?",
        min: 0, max: 50, step: 1, unit: "%", answer: 2.4, tolerance: 3
      },
      reveal: {
        say: "About 2.4%. The rules become a footnote.",
        text: "After 20 steps the context holds 1,000 tokens of instructions and about 40,000 of tool results, so the instructions are about 2.4% of it. Models tend to use information less reliably as the context grows, especially when it's far from the current question, so early rules lose their pull.",
        tempting: "It's natural to imagine the instructions as a fixed 'setting' the model always obeys. In fact they're just the first part of a long text the model rereads each step.",
        limits: "How much attention fades depends on the model and the task; newer models handle long contexts better. The arithmetic of dilution, though, is the same for all of them."
      },
      deeper: [
        { h: "Context engineering", p: ["Anthropic's engineers call the remedy context engineering: choosing what goes into the context at each step instead of letting everything pile up. Summarise older steps, trim tool outputs to what matters, keep a short notes file, and load details only when needed."] }
      ],
      lab: { kind: "context" },
      experiment: {
        task: "Start a chat by giving one unusual rule: 'Always end your replies with the word pencil.' Then have a long conversation: paste in two long articles and ask questions about them.",
        change: "In a second chat, repeat the rule just before your last question.",
        observe: "Note where the first chat stopped following the rule, and whether repeating it fixed it."
      },
      project: { status: "planned", text: "Telemetry is long and repetitive. The planned investigator would need to summarise readings instead of carrying every data point, or its instructions about what counts as an anomaly would fade." },
      related: ["memory", "cost", "loop"],
      sources: [
        { title: "Effective context engineering for AI agents (Anthropic)", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", date: "2025-09-29" }
      ],
      variants: [
        {
          id: "context-2",
          hook: "Midway through a long research session, the agent starts citing sources you told it to avoid at the start.",
          predict: { type: "choice", prompt: "What's the most likely cause?", options: [
            { t: "The early instruction is buried under a lot of later text", why: "Yes: dilution in a long context." },
            { t: "The model changed during the session", why: "Models don't change mid-session." },
            { t: "The sources became better", why: "The rule didn't change; its weight in the context did." }
          ], answer: 0 },
          reveal: { say: "Buried rules lose their pull.", text: "Restate key rules near the current step, or keep a short summary that carries them forward." }
        }
      ]
    },
    {
      id: "memory", concept: "context", path: 7, minutes: 2,
      title: "It remembered your name. How?",
      hook: "You open a brand new conversation, and the assistant already knows you prefer short answers.",
      predict: {
        type: "choice", prompt: "How does it remember?",
        options: [
          { t: "The model learned your preference from your last chat", why: "Tempting, but models aren't retrained from your conversations as you go." },
          { t: "A note was saved, and read back into the new conversation", why: "Yes: memory is stored text placed into the context." },
          { t: "It guessed from your writing style", why: "Possible in principle, but that's not how memory features work." }
        ],
        answer: 1
      },
      reveal: {
        say: "Memory is retrieval, not learning.",
        text: "The model itself doesn't change between conversations. Assistants with memory save notable facts as text, then place the relevant ones into a new conversation's context, usually without showing you.",
        tempting: "'It learned' is how we'd describe a person, so it's the natural guess.",
        limits: "Products differ in what they save, when, and how they choose what to bring back. Some let you view and delete memories; check yours."
      },
      deeper: [
        { h: "Agents use the same trick", p: ["Long-running agents keep a notes file (progress, decisions, next steps) and reread it, instead of carrying an ever-growing history. Your desk's 'where did you stop?' note works the same way."] }
      ],
      experiment: {
        task: "If your assistant has a memory feature, open its saved memories and read them.",
        change: "Tell it one new, harmless fact (a favourite book), start a new chat, and ask what it knows about your reading.",
        observe: "Was the fact saved? Was it brought back? Note anything it saved that you didn't expect."
      },
      related: ["context", "grounding"],
      sources: [
        { title: "Effective context engineering for AI agents (Anthropic)", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", date: "2025-09-29" }
      ]
    },
    {
      id: "cost", concept: "cost", path: 8, minutes: 3,
      title: "Why step twenty costs more than step one.",
      hook: "An agent runs for 20 steps. The instructions are 1,000 tokens and each step adds 2,000 tokens of results. Every step sends the whole history so far.",
      predict: {
        type: "choice", prompt: "Roughly how many tokens does the whole run send?",
        options: [
          { t: "About 40,000", why: "That's the size of the final context, sent once. But every step resends the history." },
          { t: "About 100,000", why: "Closer, but the history grows every step, so the total grows faster than that." },
          { t: "About 400,000", why: "Yes: step 1 sends 1,000, step 20 sends 39,000, and the total of all twenty is about 400,000." },
          { t: "About 2,000,000", why: "Too high for these numbers, though long runs with big tool outputs can get there." }
        ],
        answer: 2
      },
      reveal: {
        say: "Resending the history makes cost grow much faster than the step count.",
        text: "Each step carries everything before it, so total tokens grow roughly with the square of the number of steps. Anthropic reported that in their data agents used about 4 times the tokens of chat, and multi-agent systems about 15 times.",
        tempting: "40,000 is the size of the final context, which is the number people picture. The bill counts every step's resend.",
        limits: "Real costs depend on the provider's prices, caching discounts and how long outputs are. Many providers charge much less for an unchanged prefix that's sent again soon (prompt caching)."
      },
      deeper: [
        { h: "Keeping costs sensible", p: ["Trim tool outputs, summarise old steps, set a budget per run, and use smaller models for simple steps. An unexpectedly expensive run usually means the agent did more work than the task needed."] }
      ],
      lab: { kind: "cost" },
      experiment: {
        task: "Paste a long article (about 3,000 words) into a chatbot and ask three follow-up questions, one at a time.",
        change: "In a new chat, ask for a 150-word summary first, then ask the same three questions about the summary only.",
        observe: "Were the answers noticeably worse with the summary? That's the trade-off between context size and quality."
      },
      project: { status: "planned", text: "Telemetry tool outputs could be huge. The planned investigator should return summaries (min, max, trend) rather than raw readings, or every step would resend thousands of numbers." },
      related: ["context", "many", "loop"],
      sources: [
        { title: "How we built our multi-agent research system (Anthropic)", url: "https://www.anthropic.com/engineering/built-multi-agent-research-system", date: "2025-06-13" }
      ],
      variants: [
        {
          id: "cost-2",
          hook: "A tool returns a whole 50-page document on step 2 of a 15-step run.",
          predict: { type: "choice", prompt: "What happens to cost?", options: [
            { t: "It's paid once, on step 2", why: "It stays in the history and is resent every later step." },
            { t: "It's resent on every step after 2", why: "Yes: 13 more times." },
            { t: "Nothing; documents are free", why: "Every token in the context counts." }
          ], answer: 1 },
          reveal: { say: "Big outputs early are expensive outputs.", text: "Return only what's needed, or summarise before it enters the history." }
        }
      ]
    },
    {
      id: "many", concept: "multi", path: 9, minutes: 3,
      title: "Five agents walk into a project.",
      hook: "You could split a job across five specialised agents, or give it to one.",
      predict: {
        type: "conditional", prompt: "Which is better?",
        options: [
          { t: "Five: specialists beat generalists", why: "Every hand-off loses context, and specialists can make choices that don't fit together." },
          { t: "One: multi-agent systems don't work", why: "Too strong; they've done well on some kinds of work." },
          { t: "It depends on whether the parts are independent", why: "Yes. Independent parts (researching five companies) split well. Interdependent ones (building one app) often don't." }
        ],
        answer: 2
      },
      reveal: {
        say: "Split work that's independent. Keep together work that isn't.",
        text: "In June 2025, Cognition argued 'Don't build multi-agents': split agents lose context and make clashing decisions. A day later, Anthropic described a research system where a lead agent sends sub-agents to investigate in parallel; on their internal research tests it beat a single agent by 90%. Both are right, for different kinds of work.",
        tempting: "'Specialists' sounds efficient, as it would be with people. But agents don't share context the way a team in one room does.",
        limits: "These are reports from the builders of two specific systems, on their own tests. Multi-agent systems also used about 15 times the tokens of chat in Anthropic's data."
      },
      lab: { kind: "multi" },
      experiment: {
        task: "Ask a chatbot to plan a 3-day trip to Tokyo in one go.",
        change: "In three separate chats, ask for day 1, day 2 and day 3 plans with no knowledge of the others, then compare all three with the first plan.",
        observe: "Do the separate plans repeat places or clash on hotels? That's lost context between agents."
      },
      project: { status: "planned", text: "The planned investigator could check different subsystems (power, thermal, attitude) in parallel, since those checks are fairly independent. The final diagnosis should stay with one agent that sees everything." },
      related: ["workflow", "cost", "context"],
      sources: [
        { title: "Don't build multi-agents (Cognition)", url: "https://cognition.ai/blog/dont-build-multi-agents", date: "2025-06-12" },
        { title: "How we built our multi-agent research system (Anthropic)", url: "https://www.anthropic.com/engineering/built-multi-agent-research-system", date: "2025-06-13" }
      ],
      variants: [
        {
          id: "many-2",
          hook: "You need summaries of 40 unrelated research papers by tomorrow.",
          predict: { type: "choice", prompt: "One agent, or several in parallel?", options: [
            { t: "Several in parallel", why: "Yes: each paper is independent, so splitting saves time with little coordination risk." },
            { t: "One, to keep context", why: "There's no shared context to keep between unrelated papers." },
            { t: "It doesn't matter", why: "Parallel finishes much sooner here." }
          ], answer: 0 },
          reveal: { say: "Independent pieces split well.", text: "When the parts don't depend on each other, parallel agents mostly just save time." }
        }
      ]
    },
    {
      id: "inject", concept: "safety", minutes: 3,
      title: "The email that gave orders.",
      hook: "Each of these assistants reads web pages for you. Some could be tricked by a page containing hidden instructions.",
      predict: {
        type: "rank", prompt: "Order them from most to least dangerous if tricked.",
        items: [
          "Reads your private files, reads web pages, and can send email",
          "Reads web pages and can send email, but has no access to your files",
          "Reads your private files and web pages, but can't send anything anywhere"
        ],
        why: "With private data, untrusted content and a way to send things out, an attacker can make it leak your data. Remove any one ingredient and that attack breaks."
      },
      reveal: {
        say: "Private data + untrusted content + a way out = the lethal trifecta.",
        text: "A model can't reliably tell your instructions apart from instructions hidden in what it reads. Simon Willison calls the dangerous combination the lethal trifecta. The first assistant has all three ingredients. The second can be tricked into sending things, but has nothing private to send. The third has your data but no way to send it out.",
        tempting: "The second and third look similar because both lack something. What decides it: the third can't leak your files because it has no way out; the second has a way out but no private data.",
        limits: "Removing one ingredient blocks data theft, not every harm. A tricked assistant with email access could still send spam or misleading messages."
      },
      deeper: [
        { h: "Practical defences", p: ["Make sending, paying, deleting and publishing wait for a person. Give each agent only the tools and data the task needs. Be careful combining tools: browsing plus email plus file access can add up to the trifecta even if none looks dangerous alone."] }
      ],
      experiment: {
        task: "List the tools an assistant you use can reach: files, email, browsing, calendar.",
        change: "For each, ask: does it give private data, untrusted content, or a way out?",
        observe: "Does any assistant have all three? Note which one tool you could turn off to break the trifecta."
      },
      related: ["human", "tooldoc"],
      sources: [
        { title: "The lethal trifecta for AI agents (Simon Willison)", url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/", date: "2025-06-16" },
        { title: "LLM01: Prompt injection (OWASP)", url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/", date: "2025" }
      ]
    },
    {
      id: "human", concept: "oversight", minutes: 2,
      title: "Where should a person say yes?",
      hook: "Your agent helps run client work. Requiring approval for everything would make it useless.",
      predict: {
        type: "pickmany", prompt: "Which actions should wait for a person's approval?",
        options: [
          { t: "Search the web", yes: false, why: "Read-only and easy to ignore if wrong." },
          { t: "Draft a reply", yes: false, why: "A draft does nothing until someone sends it." },
          { t: "Send the email to the client", yes: true, why: "Can't be unsent." },
          { t: "Pay an invoice", yes: true, why: "Money is hard to get back." },
          { t: "Read the shared project folder", yes: false, why: "Reading doesn't change anything (though what it reads may be untrusted)." },
          { t: "Delete old files", yes: true, why: "Deletion can be hard or impossible to undo." }
        ]
      },
      reveal: {
        say: "Approve the irreversible. Let the rest flow.",
        text: "Sort actions by how hard they are to undo and how much a mistake would hurt. Reading, searching and drafting can run freely; sending, paying, deleting and publishing wait for a yes.",
        tempting: "Reading the shared folder feels sensitive, and privacy does matter, but approval protects against actions. Limit which folders it can read instead.",
        limits: "Approvals only work if people read what they approve. Show a short, clear summary, or approval becomes a reflex."
      },
      experiment: {
        task: "Think of an assistant that could help with your job. Write down five actions it would take.",
        change: "Mark each 'undo easily' or 'can't undo'.",
        observe: "Note which actions need approval, and one that surprised you."
      },
      related: ["inject", "loop"],
      sources: [
        { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", date: "2024-12-19" }
      ]
    },
    {
      id: "grounding", concept: "grounding", minutes: 3,
      title: "The paper that never existed.",
      hook: "Your research assistant cites a convincing paper, with authors and a journal. It doesn't exist.",
      predict: {
        type: "choice", prompt: "What reduces this the most?",
        options: [
          { t: "Answer only from documents it actually fetched, quoting them", why: "Yes: answers built from real passages can be checked." },
          { t: "Use a bigger model", why: "Bigger models do this less, but not never." },
          { t: "Tell it to be honest", why: "It isn't lying; it has no reliable sense of the difference between remembering and generating." }
        ],
        answer: 0
      },
      reveal: {
        say: "Give it the facts, then check the quotes.",
        text: "Models continue text in likely ways, and a believable citation is very likely text. Retrieval-augmented generation (RAG) fetches relevant passages first and has the model answer from them, so claims can point to a source.",
        tempting: "'Be honest' sounds like it should work, but the model isn't choosing to deceive.",
        limits: "Most wrong answers in RAG systems come from fetching the wrong passages. When an answer is wrong, look at what was retrieved first."
      },
      experiment: {
        task: "Ask a chatbot for three academic sources on a niche topic you know well.",
        change: "Ask again, adding: 'Only list sources you are certain exist, and say if you're unsure.'",
        observe: "Search for each source. Note how many exist exactly as described, each time."
      },
      related: ["eval", "memory"],
      sources: [
        { title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.)", url: "https://arxiv.org/abs/2005.11401", date: "2020-05" }
      ]
    },
    {
      id: "react", concept: "reasoning", minutes: 2,
      title: "Think out loud, act better.",
      hook: "Your agent jumps straight to an answer, and it's wrong. Asked to write a plan before acting, it gets it right.",
      predict: {
        type: "choice", prompt: "Why does writing a plan help?",
        options: [
          { t: "It slows the model down so it's more careful", why: "Models don't get careful with time; they produce text step by step either way." },
          { t: "Each written step becomes context that later steps build on", why: "Yes: the plan is text the model then reads." },
          { t: "It doesn't really; that was luck", why: "It helps reliably on many multi-step problems." }
        ],
        answer: 1
      },
      reveal: {
        say: "Written reasoning is context.",
        text: "A model produces its answer piece by piece, reading what it has already written. A written plan gives later steps something to build on. The ReAct paper (2022) combined this with tools: reason, act, observe, reason again.",
        tempting: "'Slowing down' is how it works for people, which makes it the natural explanation.",
        limits: "Written reasoning isn't always a faithful account of how the model reached its answer. Judge results on their own merits."
      },
      experiment: {
        task: "Give a chatbot a tricky word problem and ask for the answer only.",
        change: "In a new chat, give the same problem and ask it to write a plan first.",
        observe: "Compare the two answers and note which was right."
      },
      related: ["what-agent", "loop"],
      sources: [
        { title: "ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al.)", url: "https://arxiv.org/abs/2210.03629", date: "2022-10" }
      ]
    }
  ]
};
