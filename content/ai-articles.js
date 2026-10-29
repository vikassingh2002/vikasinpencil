/* Agentic AI: articles on AI as a whole (curiosity.html).
   Written for this site in the manner of a weekly news magazine: a fly title, a
   headline, a one-line rubric, then the piece. Body items are paragraphs, or
   { h: '…' } for a crosshead. Every figure cites a source below the article.
   Add new articles at the top of the list; the newest appears first. */
window.NB = window.NB || {};
NB.aiArticles = {
  reviewed: "2026-10-29",
  sections: [
    { id: "business", name: "Business" },
    { id: "markets", name: "Finance and markets" },
    { id: "technology", name: "Technology" },
    { id: "work", name: "Work" },
    { id: "science", name: "Science" },
    { id: "policy", name: "Policy" }
  ],
  articles: [
    {
      id: "pilots", section: "business", fly: "Corporate AI", date: "2026-10-29", minutes: 4,
      title: "Ninety-five per cent of nothing",
      rubric: "Firms are spending heavily on generative AI. Most have little to show for it yet",
      body: [
        "Every boardroom wants an AI strategy, and most now have one. The trouble starts afterwards. In a report published in July 2025 researchers at MIT's NANDA initiative, drawing on interviews and surveys of companies, concluded that some 95% of the organisations they studied had seen no measurable return from their generative-AI projects. Between them, those firms had put an estimated $30bn-40bn into the technology.",
        "The figure travelled fast, and was often stretched further than it could bear. The study was preliminary, rested largely on interviews rather than audited accounts, and defined success in different ways for different firms. Its authors were careful to say so. But the pattern it described will be familiar to anyone who has sat through a dazzling demonstration and then waited a year for the promised savings.",
        { h: "Demo, then drift" },
        "Part of the problem is where the money goes. The report found that budgets flowed disproportionately to sales and marketing, where results are visible and easy to show off, while the better returns came from duller back-office work: processing documents, handling routine queries, cutting the bill for outside contractors. A chatbot that writes cheerful emails impresses the board; one that quietly clears a backlog of invoices pays for itself.",
        "Another is that most corporate tools do not learn. A poorly integrated assistant can require staff to re-explain the same context every day; persistent memory and retrieval depend on the surrounding software. Many gave up and went back to the consumer chatbots they already used at home, which at least felt quicker. The researchers called this a \"shadow AI economy\": workers getting value from the technology even as official projects stalled.",
        { h: "Buy, don't build" },
        "The firms that did see returns tended to behave differently. They bought tools from specialist vendors more often than they built their own, picked narrow problems with clear measures of success, and let the people closest to the work choose what to automate. None of this is novel. It is how successful companies have adopted every general-purpose technology, from electricity to the spreadsheet, and it took years each time.",
        "That is the more useful lesson of the 95% figure. Early returns from a new technology are usually disappointing, because firms first use it to do old things in old ways. The gains come when they reorganise work around it. For generative AI, that reorganisation has barely begun. ■"
      ],
      sources: [
        { title: "The GenAI Divide: State of AI in Business 2025 (MIT NANDA), as reported by Virtualization Review", url: "https://virtualizationreview.com/Articles/2025/08/19/MIT-Report-Finds-Most-AI-Business-Investments-Fail-Reveals-GenAI-Divide.aspx", date: "2025-08-19" },
        { title: "MIT report: 95% of corporate generative AI pilots fail to deliver returns (Computing)", url: "https://computing.co.uk/news/2025/ai/mit-report-95pc-corporate-generative-ai-pilots-fail", date: "2025-08" }
      ]
    },
    {
      id: "deepseek", section: "markets", fly: "Artificial intelligence and investors", date: "2026-10-29", minutes: 3,
      title: "The day the chips fell",
      rubric: "A cheap Chinese model wiped hundreds of billions off America's most valuable chipmaker in a single session",
      body: [
        "On January 27th 2025 investors discovered that the AI boom had a fragile assumption at its heart. A week earlier DeepSeek, a Chinese start-up, had released R1, a reasoning model that performed close to the best American systems and that its makers said had been far cheaper to build. By the time markets closed, Nvidia's shares had fallen by about 17%, erasing roughly $589bn of market value. No company had ever lost so much in a day.",
        "The logic of the sell-off was simple. Nvidia's valuation rested on the belief that ever-better AI required ever more of its chips. If a lean team could match the frontier on a modest budget, perhaps the appetite for hardware had been overestimated. The tech-heavy NASDAQ index fell by about 3%.",
        { h: "Jevons strikes back" },
        "Within days the bulls had a riposte, borrowed from a 19th-century economist. William Stanley Jevons observed that more efficient steam engines did not reduce Britain's consumption of coal; they increased it, by making steam power worth using in more places. Cheaper AI, the argument ran, would do the same for chips: lower costs would bring in more users and more uses, and total demand would rise.",
        "There was something to this. But the episode exposed how much of the industry's value rests on forecasts about costs that change monthly. Training methods improve, models are compressed, and techniques published openly by one lab are copied by the rest within weeks. A moat built on being the only one able to afford something is a narrow one when the price keeps falling.",
        "The deeper lesson concerned openness. DeepSeek published its model's weights for anyone to download and run. That put a near-frontier system in the hands of firms and researchers everywhere, and made it harder for any company to charge a premium simply for having the best model. For investors, the question has shifted from who builds the smartest machine to who can sell something useful on top of it. ■"
      ],
      sources: [
        { title: "Nvidia loses $589 billion in market cap (Tom's Hardware)", url: "https://www.tomshardware.com/tech-industry/artificial-intelligence/nvidia-loses-usd589-billion-in-market-cap-broad-stock-plunge-triggered-by-deepseek-ai-release", date: "2025-01-27" },
        { title: "DeepSeek sparks AI stock selloff; Nvidia loses record $593 bn in mcap (Business Standard)", url: "https://www.business-standard.com/amp/markets/news/deepseek-sparks-ai-stock-selloff-nvidia-loses-record-593-bn-in-mcap-125012800095_1.html", date: "2025-01-28" }
      ]
    },
    {
      id: "llm", section: "technology", fly: "How AI works", date: "2026-10-29", minutes: 4,
      title: "Autocomplete, scaled up",
      rubric: "The chatbots that write essays and code are, at heart, machines for predicting the next word",
      body: [
        "Ask a large language model a question and it seems to think. It does something stranger. It reads the text so far, breaks it into fragments called tokens, and calculates which token is most likely to come next. It adds one, then repeats the exercise with the slightly longer text, and so on until it decides it has finished. Everything else, from wit to working code, emerges from doing that one thing extraordinarily well.",
        "\"Well\" depends on training. A model starts as billions of numbers set at random. It is then shown a vast library of text and, word by word, asked to predict what comes next. Each wrong guess nudges the numbers slightly. Repeat this trillions of times and the numbers come to encode a remarkable amount about grammar, facts, reasoning and style, because predicting text accurately requires understanding, of a sort, what the text is about.",
        { h: "From parrot to assistant" },
        "A model trained only this way is a gifted mimic but a poor helper: ask it a question and it may continue with three more questions, as a web page might. So developers add further training, showing it examples of good answers and rewarding responses that people rate highly. This is what turns a text predictor into something that follows instructions, declines harmful requests and, mostly, stays on topic.",
        "The approach explains both the strengths and the strange failures. Because models learn patterns rather than look facts up, they can produce fluent, plausible statements that happen to be false; a believable citation is, after all, very likely text. And because they have no memory between conversations, anything they seem to remember about you must be fed back in each time.",
        { h: "The scaling bet" },
        "For most of the past decade, the surest way to make models better was to make them bigger and feed them more data and more computing power. That bet has paid off handsomely, and it explains the industry's ravenous appetite for chips and electricity. Newer models also spend more effort at the moment of answering, writing out intermediate steps before replying, which improves their performance on maths and logic.",
        "Whether prediction, however refined, can become something like general intelligence is the field's great open argument. What is not in dispute is that a system built to guess the next word has turned out to be useful for far more than anyone expected. ■"
      ],
      sources: [
        { title: "LLM Powered Autonomous Agents (Lilian Weng)", url: "https://lilianweng.github.io/posts/2023-06-23-agent/", date: "2023-06-23" }
      ]
    },
    {
      id: "agents", section: "technology", fly: "AI agents", date: "2026-10-29", minutes: 4,
      title: "From talking to doing",
      rubric: "Chatbots answer questions. Agents act on them, which is more useful, more expensive and more dangerous",
      body: [
        "The first wave of generative AI produced text. The second is meant to produce results. An AI agent is a language model given tools (a web browser, a calendar, a company database) and allowed to use them in a loop: it decides on an action, sees what happened, and decides what to do next, until the job is done. Booking a meeting, reconciling invoices or chasing a delayed delivery all become possible without a person typing each step.",
        "Builders have learned to be sparing with this freedom. Anthropic, a model-maker, draws a useful line between workflows, in which programmers fix the steps in advance and the model fills in the judgement, and agents, in which the model chooses its own path. Workflows are cheaper, faster and easier to check. Agents earn their keep only where the route cannot be known beforehand.",
        { h: "The meter is running" },
        "Freedom costs money. An agent can accumulate a growing history of instructions and tool results, making long tasks expensive unless that context is managed carefully. In Anthropic's own data, agents typically used about four times as many tokens, the units in which AI is billed, as ordinary chat. Systems in which several agents worked together used about 15 times as many. For a valuable research question that may be worth paying; for a routine one it is waste.",
        "Errors compound, too. A wrong search result leads to a wrong conclusion, which leads to a wrong action. Hence the engineering effort now going into the unglamorous parts: clear descriptions of each tool, rules about when an agent should stop, and test suites that measure whether a change actually helped rather than merely improved one demonstration.",
        { h: "Trust, but verify" },
        "The gravest risks come from what agents read. A model cannot reliably tell its owner's instructions from instructions planted in a web page or an email. Simon Willison, a programmer, warns of a \"lethal trifecta\": an agent with access to private data, exposure to untrusted content and a way to send information out can be tricked into leaking secrets. Remove any one of the three and that attack fails.",
        "The sensible approach, for now, resembles the way firms treat a capable new recruit: let them read and draft freely, but require a manager's sign-off before anything is sent, paid or deleted. Agents will earn more autonomy as they earn a track record. That process has only just begun. ■"
      ],
      sources: [
        { title: "Building effective agents (Anthropic)", url: "https://www.anthropic.com/engineering/building-effective-agents", date: "2024-12-19" },
        { title: "How we built our multi-agent research system (Anthropic)", url: "https://www.anthropic.com/engineering/built-multi-agent-research-system", date: "2025-06-13" },
        { title: "The lethal trifecta for AI agents (Simon Willison)", url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/", date: "2025-06-16" }
      ]
    },
    {
      id: "power", section: "technology", fly: "AI and energy", date: "2026-10-29", minutes: 3,
      title: "Power hungry",
      rubric: "Data centres could need more than twice as much electricity by 2030. AI is the main reason",
      body: [
        "Artificial intelligence lives in warehouses full of humming servers, and those servers run on electricity. According to the International Energy Agency (IEA), a watchdog, the world's data centres consumed about 415 terawatt-hours in 2024, roughly 1.5% of global electricity use. America accounted for 45% of that and China for a quarter.",
        "The IEA's central projection, published in April 2025, has demand more than doubling to around 945 terawatt-hours by 2030, slightly more than Japan uses today. AI is the main driver: consumption by data centres built specifically for it is expected to more than quadruple over the same period.",
        { h: "Grids under strain" },
        "The global share remains modest, which is why some dismiss the worry. But data centres cluster in a few places, so the local effect is large. In America, the IEA expects them to account for nearly half of the growth in electricity demand to 2030. Utilities that had planned for flat demand for a generation suddenly face queues of requests for gigawatts of new connections, and the transmission lines and power plants take far longer to build than the data centres do.",
        "Tech firms are responding with a scramble for supply: long contracts for solar and wind, deals to restart or extend nuclear plants, and plenty of gas turbines in the meantime. Each choice has consequences for prices paid by other consumers and for climate targets the same firms have trumpeted.",
        { h: "Efficiency, the wild card" },
        "The forecasts come with wide error bands, and the IEA publishes several scenarios. Chips grow more efficient with each generation, and models are being shrunk and optimised to do more with less. If efficiency gains outrun demand, the curve will flatten. If cheaper AI simply invites more use, as cheaper computing always has, it will not. Bet on the second. ■"
      ],
      sources: [
        { title: "AI set to drive surging electricity demand (IEA Energy and AI, as reported by Hydrocarbon Engineering)", url: "https://www.hydrocarbonengineering.com/special-reports/10042025/iea-ai-set-to-drive-surging-electricity-demand/", date: "2025-04-10" },
        { title: "AI to double electricity demand from data centres by 2030 (RCR Wireless)", url: "https://rcrwireless.com/20250411/rcr-techtrends/ai-electricity-dcs-2030-iea", date: "2025-04-11" }
      ]
    },
    {
      id: "novices", section: "work", fly: "AI and jobs", date: "2026-10-29", minutes: 3,
      title: "The novice's friend",
      rubric: "One of the best studies of AI at work found that it helped the least experienced most",
      body: [
        "Predictions about AI and jobs are plentiful; evidence is scarcer. One of the most cited pieces comes from a call centre. Erik Brynjolfsson, Danielle Li and Lindsey Raymond, economists at Stanford and MIT, studied the staggered introduction of an AI assistant to more than 5,000 customer-support agents at a software firm. The tool listened to conversations and suggested replies.",
        "On average, agents with the assistant resolved about 14% more issues per hour, according to the working paper first published in 2023. The averages concealed the interesting part. The least experienced and least skilled workers improved by around 34%. The most experienced barely improved at all.",
        { h: "Bottling the best" },
        "The researchers' explanation is that the AI had, in effect, learned the habits of the firm's top performers and passed them on to everyone else. A new agent got suggestions of the sort a seasoned colleague might whisper. Customers noticed: they were treated more pleasantly, and staff turnover fell.",
        "That cuts against a common fear. Earlier waves of automation, from factory robots to accounting software, tended to reward the highly skilled and hollow out the middle. On this evidence generative AI may compress the gap instead, by making expertise cheap to share.",
        { h: "Mind the caveats" },
        "One study of one firm proves only so much. Call-centre work is unusually well suited to AI, with clear goals and plenty of past conversations to learn from. Making novices as good as veterans could also reduce what firms are willing to pay for experience, and some jobs may vanish rather than improve. But the finding is a useful corrective to the assumption that AI's benefits must flow to those who already have the most. ■"
      ],
      sources: [
        { title: "Generative AI at Work (Brynjolfsson, Li and Raymond, NBER Working Paper 31161)", url: "https://www.nber.org/papers/w31161", date: "2023-04" }
      ]
    },
    {
      id: "alphafold", section: "science", fly: "AI and science", date: "2026-10-29", minutes: 3,
      title: "Folding time",
      rubric: "An AI system cracked a 50-year-old problem in biology, and won a Nobel prize for its makers",
      body: [
        "Proteins are the machinery of life, and their shape determines what they do. Working out that shape from the chain of amino acids that makes up a protein was, for half a century, one of biology's hardest problems. Determining a single structure in the laboratory could take years.",
        "AlphaFold 2, a system developed by Google DeepMind and unveiled in 2020, changed that. Given a protein's sequence, it predicts the structure with accuracy often rivalling experiments, in minutes. In October 2024 Demis Hassabis and John Jumper of DeepMind shared half of the Nobel prize in chemistry for it. The other half went to David Baker of the University of Washington, who uses computational methods to design entirely new proteins.",
        { h: "Beyond chatbots" },
        "The prize was a reminder that AI's most consequential uses may not involve conversation at all. AlphaFold's makers released predicted structures for a vast catalogue of known proteins, and researchers around the world have used them, Mr Hassabis has said more than 2m of them, for work ranging from designing enzymes that break down plastics to understanding disease and developing drugs.",
        "It also showed what such systems need: a well-defined problem, a clear way to score answers and decades of carefully gathered data. The protein-structure field had all three, thanks to a public database of experimentally determined structures and a long-running competition to test predictions.",
        "Many scientific problems lack those advantages. But where they exist, AI is turning questions that once took a career into ones that take an afternoon. That shifts the bottleneck from finding answers to asking the right questions, and to the slow, unglamorous work of checking them in the laboratory. ■"
      ],
      sources: [
        { title: "AI wins another Nobel, this time in chemistry (VentureBeat)", url: "https://venturebeat.com/ai/ai-wins-another-nobel-this-time-in-chemistry-google-deepminders-hassabis-and-jumper-awarded-for-alphafold", date: "2024-10-09" },
        { title: "DeepMind's Demis Hassabis and John Jumper scoop Nobel Prize in Chemistry for AlphaFold (TechCrunch)", url: "https://techcrunch.com/2024/10/09/deepminds-demis-hassabis-and-john-jumper-scoop-nobel-prize-in-chemistry-for-alphafold", date: "2024-10-09" }
      ]
    },
    {
      id: "euaiact", section: "policy", fly: "Regulating AI", date: "2026-10-29", minutes: 3,
      title: "Brussels writes the rules",
      rubric: "The European Union's AI Act is the world's most ambitious attempt to regulate the technology. Implementing it is proving harder than passing it",
      body: [
        "Europe has a habit of regulating technologies that others build. Its AI Act, which entered into force on August 1st 2024, sorts AI systems by the risk they pose. A few uses are banned outright, among them social scoring of citizens and the untargeted scraping of faces from the internet to build recognition databases. Those prohibitions took effect on February 2nd 2025.",
        "Systems deemed \"high-risk\", such as those used in hiring, credit scoring or critical infrastructure, face heavy obligations on data quality, documentation and human oversight. General-purpose models, the systems behind many chatbots, are subject to a separate set of duties. The Commission’s code of practice addresses transparency, copyright, and safety and security, with obligations that differ by model and risk.",
        { h: "The Brussels effect, tested" },
        "The hope in Brussels is that the law becomes a global standard, as its data-protection rules did: firms find it easier to follow one strict regime everywhere than to maintain several. The fear among European firms is the opposite: that compliance costs fall hardest on small companies and push innovation elsewhere, while the largest American and Chinese developers absorb the paperwork with ease.",
        "The timetable has already changed. The Commission says the AI Omnibus entered into force in July 2026. Its current enforcement guidance puts the high-risk rules for Annex III systems in December 2027 and those for AI embedded in regulated products in August 2028. Rules are arriving in stages, making the distinction between a model, a product and its particular use consequential.",
        "The underlying dilemma is not unique to Europe. Rules written for today's systems risk being obsolete by the time they bite, while waiting for the technology to settle risks waiting for ever. Europe has chosen to act first and adjust later. Whether that looks prescient or premature will depend on how nimbly it adjusts. ■"
      ],
      sources: [
        { title: "AI Act: current framework — European Commission", url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai" },
        { title: "AI Act enforcement framework — European Commission", url: "https://digital-strategy.ec.europa.eu/en/policies/enforcement-ai-act" }, { title: "General-Purpose AI Code of Practice — European Commission", url: "https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai" }
      ]
    },
    {
      id: "deploy", section: "business", fly: "Putting AI to work", date: "2026-10-29", minutes: 3,
      title: "Dazzling demos, dull deployments",
      rubric: "Getting AI to work once is easy. Getting it to work every time is the hard part",
      body: [
        "Every AI project has a magical moment: the demonstration in which the system answers a tricky question perfectly. What follows is often less magical. Outputs vary from one run to the next, and people remember the impressive ones. A change that fixes the case everyone was watching can quietly break three others nobody was.",
        "Practitioners have settled on an unglamorous cure: evaluation. Before changing anything, build a set of a few dozen realistic tasks, each with a clear way to judge the result, and run it before and after every change. Hamel Husain, a consultant who has advised many firms on this, argues that the most valuable habit is simply reading lots of real outputs, because patterns in the failures show what to test for.",
        { h: "Garbage in, confidence out" },
        "A second lesson concerns knowledge. Models trained on the internet know a lot in general and nothing about a particular firm's contracts or customers. The usual remedy, known as retrieval-augmented generation, fetches relevant documents and places them in front of the model before it answers. When such systems go wrong, the fault usually lies in what was fetched rather than in the model: if the right paragraph never arrives, no amount of intelligence will find it.",
        "The third is about people. Systems that make their reasoning and sources visible get used; black boxes get ignored or, worse, trusted blindly. The best deployments keep a person in the loop for decisions that are hard to undo, and make it easy for that person to check the work.",
        "None of this is as exciting as a new model release. It is, however, where most of the value of AI will be won or lost. The firms that treat it as engineering rather than magic will be the ones with something to show for their spending. ■"
      ],
      sources: [
        { title: "Your AI product needs evals (Hamel Husain)", url: "https://hamel.dev/blog/posts/evals/", date: "2024-03-29" },
        { title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al.)", url: "https://arxiv.org/abs/2005.11401", date: "2020-05" }
      ]
    }
  ]
};

/* Original explainers added 29 October 2026; illustrative examples are labelled. */
NB.aiArticles.articles.unshift.apply(NB.aiArticles.articles, [
  {
    "id": "workflow-dividend",
    "section": "business",
    "fly": "The automation bargain",
    "date": "2026-10-29",
    "minutes": 3,
    "title": "The virtues of a dull machine",
    "rubric": "Autonomy is useful when the route is uncertain. Routine work often rewards restraint",
    "body": [
      "Consider a hypothetical accounts department with an unglamorous ambition: to clear its invoice queue before Friday. The documents arrive in different formats, but the decisions are familiar. Identify the supplier, match the purchase order, check the amount and send exceptions to a person. An autonomous agent could choose how to tackle each invoice. The first question is why it should have to.",
      "The distinction is architectural. In its guide to building effective agents, published in December 2024, Anthropic separates workflows, whose paths are specified in code, from agents, which choose their next steps dynamically. It recommends starting with the simplest arrangement that works. Autonomy brings flexibility, but can add cost and delay. That is a trade, not an automatic improvement.",
      {
        "h": "Freedom has a price"
      },
      "For our accounts department, the sensible division of labour might be quite narrow. A model reads a messy description; ordinary software checks whether the total matches. An uncertain supplier name goes to a reviewer. The model need not decide the payment rules, invent a sequence of checks or possess permission to move money. Each responsibility can be tested separately.",
      "This arrangement also changes the economics of failure. Suppose the system misunderstands a line item. A fixed validation step may catch the discrepancy before it reaches the ledger. An unconstrained assistant might instead reinterpret the task and continue. Neither architecture guarantees correctness. But a clearly bounded error is usually easier to diagnose than a plausible chain of improvised decisions.",
      {
        "h": "Where the map runs out"
      },
      "Now imagine investigating an unfamiliar mismatch across contracts, correspondence and delivery records. The next useful search depends on what the previous search found. Here, discretion may earn its keep. The practical boundary is between work whose route is already understood and work that must discover its route along the way.",
      "A small builder can test the distinction cheaply. Take ten representative cases, write down what a successful outcome means, and compare a fixed workflow with a more flexible alternative. Record the errors, elapsed time and effort required to review each result. These are proposed checks, not results from a completed trial.",
      "The least impressive demonstration may turn out to be the better product. A system that finishes a modest job reliably gives its owner something more useful than a display of initiative: an afternoon back. ■"
    ],
    "sources": [
      {
        "title": "Building effective agents — Anthropic",
        "url": "https://www.anthropic.com/research/building-effective-agents",
        "date": "2024-12-19"
      }
    ]
  },
  {
    "id": "tool-contract",
    "section": "technology",
    "fly": "Designing for agents",
    "date": "2026-10-29",
    "minutes": 3,
    "title": "Better tools, fewer mistakes",
    "rubric": "Before replacing a struggling model, examine the tools it has been given",
    "body": [
      "Imagine hiring an assistant and giving them two buttons labelled “Search” and “Lookup”. One searches the current customer list; the other searches an archive. Neither says which identifier it expects. When the assistant picks the wrong button, calling them incompetent would be a peculiar management technique. Yet software teams can create much the same confusion for an AI agent.",
      "A tool interface tells a model which actions are available and how to request them. Its name, description and input schema help shape the choice. The underlying software then executes the request. A function that is convenient for the database programmer may still be awkward for the model trying to solve a user’s problem.",
      {
        "h": "A smaller menu"
      },
      "Anthropic’s September 2025 engineering guide argues for choosing tools carefully, using clear names, returning relevant context and evaluating how agents actually use the interface. It also recommends measuring errors, tool calls, runtime and token consumption. The interface belongs in the experiment, alongside the prompt and the model.",
      "Consider a hypothetical search response containing a thousand records. A person might ask for a filter. An agent might read the lot, miss the important row and search again. Returning a compact result with stable identifiers, a useful summary and a way to request detail creates a different problem for the model to solve. More information is valuable only when it helps the next decision.",
      "There is a corresponding risk in tidying too aggressively. A tool that returns only its own conclusion can hide the evidence needed to challenge it. A good summary should preserve the route back to the underlying record. For an investigator examining satellite telemetry, that might mean a timestamp, a sensor identifier and the interval covered, rather than a reassuring sentence about battery health.",
      {
        "h": "Watch the hands"
      },
      "The practical test is to hold the model and task constant while changing the interface. Try a vague tool description, then one specifying the input format and the meaning of an empty response. Inspect the actual requests and outcomes. If the improvement appears only on the examples used to write the description, try fresh cases before celebrating.",
      "This is a proposed experiment for the notebook, not a reported performance gain. Its attraction is that it asks a question a builder can answer. The next breakthrough in an agent may be a better model. The next fix may be a better label. ■"
    ],
    "sources": [
      {
        "title": "Writing effective tools for agents — Anthropic",
        "url": "https://www.anthropic.com/research/writing-tools-for-agents",
        "date": "2025-09-11"
      }
    ]
  },
  {
    "id": "reasoning-evidence",
    "section": "science",
    "fly": "The limits of explanation",
    "date": "2026-10-29",
    "minutes": 3,
    "title": "Trust, but inspect",
    "rubric": "An AI’s account of its reasoning can be useful without being a faithful record of what influenced it",
    "body": [
      "A fluent explanation is comforting. Presented with a wrong answer and an orderly argument, a reader can at least see where to begin. Presented with a right answer and an orderly argument, the reader may stop checking altogether. That second response deserves more suspicion.",
      "In research published in April 2025, Anthropic tested whether reasoning models acknowledged hints that influenced their answers. Researchers inserted suggestions into evaluation questions, then examined the resulting chains of thought. The tested models sometimes followed the hints without mentioning them in their explanations. The study concerned particular models and experimental settings; it does not establish how every current system behaves.",
      "Its lesson is narrower, and useful: readable reasoning is not necessarily a complete account of why an answer was produced. An explanation can omit an influence that matters. Confidence in the prose and confidence in the underlying decision are different judgements.",
      {
        "h": "Follow the evidence"
      },
      "For a builder, this suggests a distinction between a narrative and an audit trail. “I checked the contract” is a narrative claim. A recorded tool request, the retrieved passage and its document identifier offer something that can be inspected. Even then, the passage may be irrelevant or the document outdated. The trail makes checking possible; it does not perform the checking.",
      "Consider the planned satellite investigator in this notebook. A report saying that a heater failed would be more useful if it pointed to the relevant temperature readings, the command history and a written procedure. A reviewer could then ask whether the evidence supports that diagnosis, or whether a faulty sensor would fit just as well. The quality of the report would depend on those connections, not on how confidently it described its thought process.",
      {
        "h": "A modest test"
      },
      "One practical exercise is to give an assistant a small document and request a conclusion with an exact supporting passage. Repeat with a version containing a plausible but unsupported suggestion. Compare the conclusions, check the quoted evidence and note whether the suggestion changes the answer. This is an illustrative exercise, not a replication of the research: a handful of runs cannot establish a model’s general faithfulness.",
      "Explanations still have a job. They can expose assumptions, make an answer easier to question and help a person identify the next check. They become less useful when treated as proof of their own accuracy. The machine can supply the argument. The evidence must bear the weight. ■"
    ],
    "sources": [
      {
        "title": "Reasoning models don’t always say what they think — Anthropic",
        "url": "https://www.anthropic.com/research/reasoning-models-dont-say-think",
        "date": "2025-04-03"
      }
    ]
  }
]);

/* October edition: original analysis grounded in the linked primary sources. */
NB.aiArticles.articles.push.apply(NB.aiArticles.articles, [
  {
    "id": "cost-of-correct",
    "section": "business",
    "fly": "The economics of reliability",
    "title": "The expensive part is being right",
    "rubric": "Cheap answers are plentiful. Cheap answers that need no repair are another matter",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A machine that drafts a report in seconds appears to have abolished the cost of writing it. The illusion lasts until somebody checks the figures. A missing unit, a mistaken reporting period and a quotation that cannot be found can turn a quick draft into a slow investigation. For businesses buying AI, the relevant unit of output is a usable result, not an answer.",
      "That distinction changes the calculation. Imagine a hypothetical service that costs pennies to produce a document but requires twenty minutes of expert review. Cutting the model bill in half barely changes its economics. Reducing the review burden might. The figures are illustrative; the accounting principle is ordinary enough. Count the whole process, including the people who make the output safe to use.",
      {
        "h": "The bill after the bill"
      },
      "Review itself has different prices. Checking a well-organised answer against a handful of linked passages can be straightforward. Reconstructing how an unsupported assertion entered a report can take longer than writing the report from scratch. An assistant that supplies its evidence may therefore be worth more than one that merely supplies better prose. Evidence is part of the product.",
      "There is a trap here. An exhaustive verification system can become so cumbersome that users bypass it. The aim should be to concentrate attention where mistakes are costly: an altered payment instruction, an unusual exception, a number on which a recommendation depends. Routine formatting deserves a different level of scrutiny. That is a proposed design principle, not a claim that any particular model can reliably identify every risky case.",
      "Anthropic’s guide to agent evaluations distinguishes the sequence of actions an agent takes from the outcome it produces. This is a useful starting point for buyers. A successful-looking conversation is not enough; the requested job must actually be completed. A reliable procurement test should inspect representative outcomes, including awkward ones.",
      {
        "h": "Buy the result"
      },
      "The sensible comparison is with the current way of working. How long does the task take now? Which errors already occur? What can be checked automatically, and what still requires judgement? Without that baseline, a polished demonstration can make an expensive system look like a bargain.",
      "For vendors, the opportunity is substantial. A defensible product can consist of the checking, integration and exception handling around a model that anybody can rent. The cleverest answer may win a demonstration. The cheapest correct result has a better chance of winning a renewal. ■"
    ],
    "sources": [
      {
        "title": "Demystifying evals for AI agents — Anthropic",
        "url": "https://www.anthropic.com/research/demystifying-evals-for-ai-agents"
      }
    ],
    "image": "servers"
  },
  {
    "id": "integration-moat",
    "section": "business",
    "fly": "Enterprise software",
    "title": "The moat is in the plumbing",
    "rubric": "Connecting AI to real work is less glamorous than building a model—and can be more valuable",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "In a demonstration, a customer record is usually easy to find. In a company, it may have three identifiers, two owners and a history nobody quite trusts. An AI assistant entering that environment inherits its confusion. Fluent language does not reconcile conflicting databases.",
      "This makes integration a promising, if unromantic, business. A model can be rented by a competitor. A carefully maintained connection between a company’s documents, permissions and working practices is harder to reproduce. The advantage comes from knowing which record counts, what an employee may access and how a mistaken change is reversed.",
      {
        "h": "Where the work lives"
      },
      "Consider a hypothetical service desk. Answering a question about a refund policy is one task. Finding the applicable policy, checking the customer’s history, establishing who may authorise a refund and recording the decision is another. The second is closer to the work for which the company pays. It also exposes the software to failures that a conversational demo can conveniently omit.",
      "A good integration preserves boundaries. A search tool should return material the user is permitted to see. A write operation should distinguish preparing a change from executing it. A failed request should leave a record that a person can understand. These are features of the surrounding system; putting a stern instruction in a prompt does not implement them.",
      "The attraction of this approach should not become an excuse for permanent custom work. Every special case can turn a software business into a consultancy. Builders need to ask which connections repeat across customers and which exceptions reflect a customer’s unfinished housekeeping. The latter may be valuable work without being a scalable product.",
      {
        "h": "An ordinary advantage"
      },
      "NIST’s generative-AI risk profile treats risks as matters for an organisation to manage throughout a system’s use. Read as a product question, that suggests a useful test: can the buyer operate, inspect and correct the system after the sales team has left?",
      "The next valuable AI company may have an excellent model. It may instead have a dependable answer to a dull question: when two systems disagree, what happens next? ■"
    ],
    "sources": [
      {
        "title": "Generative Artificial Intelligence Profile — NIST AI 600-1, 2024",
        "url": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf"
      }
    ],
    "image": "office"
  },
  {
    "id": "open-weight-economics",
    "section": "markets",
    "fly": "The price of intelligence",
    "title": "Free weights, costly work",
    "rubric": "An open model removes one bill. It leaves the rest of the business to be built",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "Downloading a model feels like acquiring a factory for the price of an internet connection. The comparison is useful mainly for what it leaves out. A factory also needs power, maintenance, people and customers. So does a model put to work inside a business.",
      "DeepSeek’s R1 repository makes its code and model weights available under the MIT licence. That is an important permission, but it is not a promise of free computing or a complete service. Running a model still requires suitable hardware or a hosting provider, an interface and decisions about security and reliability. Distilled models can also involve licences inherited from their base models; buyers should inspect the particular release they intend to use.",
      {
        "h": "The make-or-rent decision"
      },
      "For a hypothetical firm with steady demand and a capable engineering team, controlling deployment may be attractive. It can choose where requests run and how the service is monitored. Another firm may prefer paying an external provider to absorb that complexity. Neither choice follows automatically from a benchmark score.",
      "Utilisation matters. Hardware paid for all day but used for an hour has different economics from the same equipment serving a steady queue. So does the cost of keeping a specialist team available. Comparing a hosted price per token with the purchase price of a graphics card misses both questions.",
      "Openness can also shift bargaining power. A credible alternative gives buyers something to compare with a proprietary service, even if they never migrate. But switching depends on more than access to weights. Prompts, tools, evaluation cases and performance assumptions must survive the move. A model that is cheap to acquire may be expensive to substitute.",
      {
        "h": "Where the margin goes"
      },
      "The commercial consequence is a hypothesis, not a forecast: as capable models become more accessible, some value may move towards distribution, specialised data and reliable operation. Suppliers can respond by bundling those services rather than selling intelligence alone.",
      "For customers, the practical lesson is to price a working system. Open weights expand the menu. They do not pick the meal or wash the dishes. ■"
    ],
    "sources": [
      {
        "title": "DeepSeek-R1: model repository and licence",
        "url": "https://github.com/deepseek-ai/DeepSeek-R1"
      }
    ],
    "image": "circuits"
  },
  {
    "id": "electricity-option",
    "section": "markets",
    "fly": "AI infrastructure",
    "title": "The queue behind the boom",
    "rubric": "The scarce asset in an AI project may be a connection to the grid",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A server ordered today does not become useful simply because it arrives. It needs somewhere to sit, equipment to keep it cool and electricity delivered when it is required. The speed of software encourages investors to forget the timetable of infrastructure.",
      "The International Energy Agency’s 2025 report on energy and AI identified grid connections and equipment supply as possible constraints on data-centre expansion. It estimated that, without action on those risks, around a fifth of planned projects could face delays. That was a conditional estimate in a particular report, not a count of projects that have since been cancelled.",
      {
        "h": "Location is a liability"
      },
      "The same demand can look modest in a global energy total and enormous to a local network. A development proposed for one place cannot necessarily borrow spare capacity from another. Transmission, substations and local planning decisions turn a general appetite for computing into a collection of specific engineering problems.",
      "This creates an economic option. A site with a credible route to power may be more useful than a cheaper site without one. Yet announcing a connection is not the same as having an operating facility. Buyers still need to understand the conditions, the timetable and who carries the cost if an assumption fails.",
      "Efficiency makes the picture more complicated. Better chips or smaller models can reduce the energy required for a task. Lower costs can also encourage more tasks. Neither effect tells us, by itself, how much electricity a particular project will need. A plausible investment case must explain both the computing workload and the infrastructure required to support it.",
      {
        "h": "Hard hats, soft forecasts"
      },
      "For the industry, the implication is analytical: project execution deserves as much scrutiny as an ambitious demand forecast. Equipment delivery, permission to build and the availability of power do not improve merely because a model improves. A delay can leave expensive assets waiting for one another.",
      "There will be no shortage of confident claims about the AI boom. Electricity has a useful habit of demanding a physical connection. ■"
    ],
    "sources": [
      {
        "title": "Energy and AI, 2025 executive summary — International Energy Agency",
        "url": "https://www.iea.org/reports/energy-and-ai/executive-summary"
      }
    ],
    "image": "power"
  },
  {
    "id": "context-tax",
    "section": "technology",
    "fly": "Inside the machine",
    "title": "The tax on remembering everything",
    "rubric": "A longer context window is useful. Filling it indiscriminately is less so",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A diligent assistant saves every message. An effective assistant knows which message matters now. For an AI agent, the difference is an engineering problem: instructions, documents, tool results and earlier decisions must fit into the information supplied for the next model call.",
      "Anthropic’s September 2025 account of context engineering describes context as a resource to curate, rather than a container to fill. Its recommendations include retrieving information when needed, compressing old material and keeping durable notes for longer tasks. The broader lesson is that capacity and usefulness are different measurements.",
      {
        "h": "An untidy desk"
      },
      "Imagine an investigator looking for the cause of a failed delivery. The full history may contain duplicate tracking updates, an obsolete address and the revised address that actually matters. Supplying everything does not tell the model which version is authoritative. Omitting the revision can be worse. The design task is to preserve the decisive evidence while reducing irrelevant competition.",
      "Summaries help only when they keep the distinctions that later decisions need. “Address checked” is a poor substitute for the address, the date of the check and its source. A short note can save space while silently destroying the ability to verify a claim. The important question is what a future step might need to recover.",
      "Retrieval has a similar trade-off. Searching a document store can bring in relevant material without carrying an entire archive. It can also miss the one passage that would change the answer. A well-designed system needs a way to recognise an incomplete search, request more detail and preserve a route back to original evidence.",
      {
        "h": "Remember selectively"
      },
      "A useful evaluation would compare the same tasks under different context policies: a full history, a compressed history and a concise working note with retrieval. The comparison should examine correctness and missing evidence as well as cost. These are proposed experiments, not results reported here.",
      "Memory is often sold as the ability to retain more. For agents doing real work, the harder skill is keeping the right thing available at the right moment. ■"
    ],
    "sources": [
      {
        "title": "Effective context engineering for AI agents — Anthropic",
        "url": "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents"
      }
    ],
    "image": "tools"
  },
  {
    "id": "benchmark-theatre",
    "section": "technology",
    "fly": "Testing agents",
    "title": "The demonstration is not the job",
    "rubric": "An agent needs an examination that survives contact with the work it is meant to do",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A demonstration has a narrator. A working system has a queue. That is why a delightful example can say so little about whether an AI agent is ready to use: the example shows a path through the task, while the queue contains the cases that refuse to follow it.",
      "Anthropic’s January 2026 guide to agent evaluations discusses testing outcomes, inspecting transcripts and combining different kinds of graders. This is useful because an agent produces more than text. It may change files, call services or leave a task only partly completed. An examination that scores the final answer alone can miss the state of the world behind it.",
      {
        "h": "Passing the wrong test"
      },
      "Consider a hypothetical booking assistant. It announces that a meeting has been arranged. A text-only check might reward the announcement. A meaningful check would inspect the time, the attendees and whether an invitation was actually created. It would also ask whether the assistant made an unauthorised change while getting there.",
      "There is an opposite failure: a test so prescriptive that it rejects a valid solution because the agent used a different sequence of steps. If the job admits several sound routes, the examination should not confuse the examiner’s preferred route with success. Process constraints belong in the test where they protect a real requirement.",
      "The hardest cases deserve their own shelf. Missing information, contradictory instructions, failed tools and requests outside the agent’s authority reveal behaviour that a clean example cannot. A refusal to continue can be the correct outcome. So can asking a precise question. A system trained only to finish may learn the wrong lesson from an ambiguous brief.",
      {
        "h": "A test that earns its keep"
      },
      "For a small team, the starting point can be a modest collection of real tasks with explicit expected outcomes. Keep some cases separate from day-to-day tuning. When a change improves one group and damages another, investigate the trade-off rather than hiding it in an average.",
      "A benchmark is useful when it changes a decision about the product. Otherwise it risks becoming another demonstration, this time with a decimal point. ■"
    ],
    "sources": [
      {
        "title": "Demystifying evals for AI agents — Anthropic",
        "url": "https://www.anthropic.com/research/demystifying-evals-for-ai-agents"
      }
    ],
    "image": "servers"
  },
  {
    "id": "apprentice-economy",
    "section": "work",
    "fly": "Skills and software",
    "title": "Who trains the next expert?",
    "rubric": "AI can help beginners. Employers still need a way to turn them into experienced workers",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "The junior employee has always done two jobs: producing useful work and learning enough to do harder work later. Automating the first can make the second more difficult to see. A firm that counts only the immediate saving may be selling its training programme without noticing.",
      "There is evidence for a more hopeful outcome. An NBER working paper by Erik Brynjolfsson, Danielle Li and Lindsey Raymond studied an AI assistant used by customer-support workers. Gains were larger for less experienced workers than for highly experienced ones. The finding concerns a specific workplace and task; it does not establish what AI will do to every profession.",
      {
        "h": "Help or substitution"
      },
      "The distinction for employers is whether assistance exposes judgement or conceals it. A beginner who sees why a proposed response fits a problem may learn. A beginner who merely forwards an answer may become faster without becoming better equipped to handle an unfamiliar case. These are competing possibilities to test, not effects that follow automatically from installing a chatbot.",
      "A useful training design would preserve opportunities to make a prediction, compare it with the eventual outcome and receive feedback from someone qualified to judge. AI can supply examples and alternative drafts. It should not become the only examiner of its own advice. The point is to keep the relationship between action and consequence visible.",
      "Managers face a measurement problem. Output is easy to count; judgement develops unevenly. A team might track how often a novice can resolve a fresh case without assistance, or explain why a tempting answer is wrong. Such measures are imperfect, but they address a different question from how many responses were sent this hour.",
      {
        "h": "The long promotion"
      },
      "There is a commercial reason to care. The organisation’s difficult cases will not disappear at the same rate as its routine ones. Someone will still need to supervise systems, revise procedures and recognise when a familiar pattern has stopped applying. Those abilities must come from somewhere.",
      "AI may make a good apprentice much more productive. Employers should make sure they are still producing the people who can teach the next one. ■"
    ],
    "sources": [
      {
        "title": "Generative AI at Work — Brynjolfsson, Li and Raymond, NBER working paper",
        "url": "https://www.nber.org/papers/w31161"
      }
    ],
    "image": "office"
  },
  {
    "id": "reviewer-bottleneck",
    "section": "work",
    "fly": "The division of labour",
    "title": "The human at the end of the queue",
    "rubric": "Automation can move the bottleneck to the person asked to approve it",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A department once waited for drafts. Now it waits for approvals. The machine has accelerated one stage of the process and delivered a larger pile to the next. The dashboard records more output; the customer may notice little improvement.",
      "This is a hypothetical example, but it illustrates an ordinary operations problem. A faster component does not guarantee a faster system. If every AI-generated result needs expert review, the capacity of the reviewers helps determine the capacity of the service.",
      {
        "h": "Attention is a budget"
      },
      "The NIST generative-AI risk profile offers a framework for managing risks across an organisation. Applying that perspective to a review queue raises an uncomfortable question: what exactly is the reviewer expected to catch? “Check the answer” is a large instruction, especially when the answer contains a mixture of routine statements and consequential claims.",
      "One option is to make the work more inspectable. Show what changed, identify the source for an important number and separate missing information from a confident inference. Another is to narrow the task until a meaningful check is quick. Neither removes the need for someone to understand the result.",
      "Sampling can reduce effort but changes the kind of assurance being provided. Checking a proportion of outputs can reveal recurring problems; it cannot establish that an unchecked payment instruction is correct. The appropriate control depends on the consequence of a particular mistake, the reversibility of the action and the evidence available. A universal approval button disguises those differences.",
      {
        "h": "Design the handover"
      },
      "The reviewer also needs authority. If rejecting an output merely sends the same request back to the same system, the process can become a polite loop. Someone should be able to stop the task, change its scope or route it to a different method. Escalation is work, and must have an owner.",
      "The practical target is not the largest possible pile of drafts. It is a greater flow of accepted, useful work at an acceptable level of error. An AI assistant that gives a reviewer less to untangle may contribute more than one that writes twice as fast. ■"
    ],
    "sources": [
      {
        "title": "Generative Artificial Intelligence Profile — NIST AI 600-1, 2024",
        "url": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf"
      }
    ],
    "image": "reasoning"
  },
  {
    "id": "prediction-laboratory",
    "section": "science",
    "fly": "AI and discovery",
    "title": "A prediction is an invitation",
    "rubric": "Better molecular models sharpen experiments. They do not make experiments unnecessary",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "A molecular structure is a powerful picture. It suggests where an interaction might occur, which part could matter and what a researcher might try next. Its usefulness should not be mistaken for a certificate that the proposed interaction happens in the conditions that matter.",
      "The 2024 AlphaFold 3 paper in Nature described a system for predicting structures across a wider range of biomolecular interactions, including proteins, nucleic acids and small molecules. That is a statement about a model’s scope and evaluated performance. It is not a statement that a predicted compound will become a medicine.",
      {
        "h": "The next experiment"
      },
      "The distinction matters because biological success asks several questions at once. A plausible structural interaction can help a scientist choose an experiment. Other questions concern whether the interaction occurs, whether it has the intended effect and whether that effect is useful in a living system. A computational prediction and an experimental measurement answer different parts of the problem.",
      "The economic promise is therefore a better search process. If a model helps researchers reject an unpromising direction earlier or choose a more informative measurement, it can improve the use of laboratory time. But a larger supply of predictions can also create a larger verification burden. The value lies in decisions improved, not structures generated.",
      "A sensible research record would keep the prediction, the version of the system, its stated uncertainty and the eventual result together. Failure then becomes useful information. Without that link, it is easy to remember the compelling picture and forget that the experiment disagreed.",
      {
        "h": "An assistant to doubt"
      },
      "The same principle applies beyond molecules. A proposed material, a suggested mechanism or an explanation for an anomalous reading is valuable when it makes the next test better. It is less useful when its fluency discourages a researcher from looking for alternatives.",
      "AI can expand the set of things scientists can imagine checking. The discipline of deciding what would count as disproof remains essential. A good prediction earns its place by inviting a difficult question. ■"
    ],
    "sources": [
      {
        "title": "Accurate structure prediction of biomolecular interactions with AlphaFold 3 — Nature, 2024",
        "url": "https://www.nature.com/articles/s41586-024-07487-w"
      }
    ],
    "image": "science"
  },
  {
    "id": "negative-results",
    "section": "science",
    "fly": "Research incentives",
    "title": "In praise of the failed experiment",
    "rubric": "A useful AI research record needs the disappointments as well as the discoveries",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "The successful example gets a screenshot. The failed run gets another prompt. Over time, that habit can produce a misleading research record: a gallery of outcomes that worked, with little evidence of how difficult they were to obtain.",
      "Agent evaluations offer one way to resist the temptation. Anthropic’s guide recommends looking beyond a final score to examine what happened during a task. The scientific opportunity is broader. A failure can reveal the boundary of a method if its circumstances are recorded precisely enough for someone else to understand.",
      {
        "h": "Keep the awkward cases"
      },
      "Consider an illustrative experiment in which an assistant extracts figures from annual reports. It handles a clean table but confuses a restated year. Recording only the successful table teaches little. Keeping both cases, with the source pages and expected answers, gives the builder something concrete to test when the system changes.",
      "An unsuccessful result is not automatically an important finding. The input may be broken, the task may be poorly defined or a tool may simply be unavailable. A useful record distinguishes those explanations instead of assigning every failure to the model. It also preserves the configuration needed to reproduce the attempt.",
      "There is a further temptation to tune the system until it passes the awkward example and declare the problem solved. That can be progress, but it may be memorisation in another form. Fresh cases are needed to see whether the change addressed a general weakness. The original failure should stay in the record, marked with what changed.",
      {
        "h": "A modest publication rule"
      },
      "For a personal AI laboratory, a practical rule would be to publish the question before the result and keep a short log of attempts. Include an example that failed, explain the most plausible reason and say what would change the conclusion. No dramatic claim is required. A clear boundary can be a useful contribution.",
      "A machine that makes experiments cheap should make honesty about experiments cheaper too. The best notebook may contain a great many crossed-out ideas. ■"
    ],
    "sources": [
      {
        "title": "Demystifying evals for AI agents — Anthropic",
        "url": "https://www.anthropic.com/research/demystifying-evals-for-ai-agents"
      }
    ],
    "image": "science"
  },
  {
    "id": "audit-trail",
    "section": "policy",
    "fly": "Governing AI",
    "title": "The case for keeping the paperwork",
    "rubric": "Accountability starts with being able to reconstruct a decision",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "After an automated decision goes wrong, a reassuring principles document is a poor substitute for a record of what happened. Which model was used? What information did it receive? Which action did it propose, who approved it and what was finally changed? Without answers, even a well-intentioned organisation can struggle to learn.",
      "NIST’s 2024 generative-AI risk profile is a voluntary framework rather than a universal legal requirement. It treats risk management as an organisational task, not simply a property of a model. One practical implication is to build the evidence needed for oversight into the working process.",
      {
        "h": "A record with a purpose"
      },
      "That does not mean retaining every piece of data forever. Logs themselves can contain confidential material, and indiscriminate collection creates another system to protect. The design question is which records are necessary, who may inspect them and how long they serve a legitimate purpose. More data is not automatically better accountability.",
      "A useful record links a consequential action to the information and authority behind it. For an illustrative document assistant, that could mean the source version, the generated draft and the reviewer’s changes. For a system that can modify a database, it could mean the requested change, the permission check and the result. The particulars depend on the task.",
      "There is a distinction between an explanation and evidence. A model’s retrospective account may help someone understand its output. It cannot substitute for a tool log that was never kept or identify an input that has been overwritten. Oversight becomes easier when the surrounding software preserves those facts directly.",
      {
        "h": "Who can stop it?"
      },
      "Records are useful only if someone can act on what they reveal. A process needs an owner who can investigate recurring errors, restrict a capability or withdraw the system from a task. Responsibility divided across so many teams that nobody can intervene is a governance failure, however complete the paperwork.",
      "The argument is for practical accountability, not a claim of compliance with any particular law. A system that can be questioned, corrected and stopped is easier to govern than one whose history exists only in a persuasive answer. ■"
    ],
    "sources": [
      {
        "title": "Generative Artificial Intelligence Profile — NIST AI 600-1, 2024",
        "url": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf"
      }
    ],
    "image": "reasoning"
  },
  {
    "id": "open-not-identical",
    "section": "policy",
    "fly": "Openness and control",
    "title": "Open is a beginning",
    "rubric": "Access to model weights does not settle every question about transparency",
    "date": "2026-10-29",
    "kind": "Analysis",
    "minutes": 2,
    "body": [
      "An open model lets someone inspect and use an important part of an AI system. It does not necessarily reveal every ingredient that produced it. The word “open” becomes less helpful when it is asked to describe weights, training material, code, evaluation methods and deployment rules all at once.",
      "DeepSeek-R1 provides a concrete example of a permissively licensed release of model weights and code. Its repository also documents a family of distilled models, whose underlying models bring their own terms. The example shows why a buyer should identify the particular artefact being discussed rather than treating openness as a single switch.",
      {
        "h": "Different windows"
      },
      "For a researcher, access to weights can make experiments possible that a remote service does not permit. For a business, it can create deployment choices. For an auditor, however, the important question might concern data provenance or the way a system is used. One kind of access does not automatically answer another kind of question.",
      "This distinction should improve the argument on both sides. Critics need to specify which missing information prevents a useful check. Advocates need to specify what a release allows an independent person to verify. “Trust us” and “the weights are available” can each leave a large gap between a claim and the evidence needed to test it.",
      "An operating service adds further layers: instructions, retrieval sources, tools, filters and permissions. Two services using the same underlying model can behave differently. Comparing them requires attention to those choices as well as the model itself. A downloadable component is not a complete description of the product.",
      {
        "h": "Ask a narrower question"
      },
      "The practical response is to ask what kind of control is needed. Must a customer run the system locally? Reproduce a result? Inspect an important decision? Change a safety boundary? The answer may favour different arrangements for different uses. This is an analytical framework, not legal advice about a licence.",
      "Openness can be enormously useful. Its value is easier to defend when the claim is precise enough to check. ■"
    ],
    "sources": [
      {
        "title": "DeepSeek-R1: model repository and licence",
        "url": "https://github.com/deepseek-ai/DeepSeek-R1"
      }
    ],
    "image": "circuits"
  }
]);
