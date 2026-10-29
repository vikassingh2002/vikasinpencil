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
        "Another is that most corporate tools do not learn. A model bolted onto a workflow forgets each conversation as soon as it ends, so staff must re-explain the same context every day. Many gave up and went back to the consumer chatbots they already used at home, which at least felt quicker. The researchers called this a \"shadow AI economy\": workers getting value from the technology even as official projects stalled.",
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
        "Freedom costs money. Each step of an agent's work resends everything that has happened so far to the model, so long tasks grow expensive quickly. In Anthropic's own data, agents typically used about four times as many tokens, the units in which AI is billed, as ordinary chat. Systems in which several agents worked together used about 15 times as many. For a valuable research question that may be worth paying; for a routine one it is waste.",
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
        "Systems deemed \"high-risk\", such as those used in hiring, credit scoring or critical infrastructure, face heavy obligations on data quality, documentation and human oversight. Makers of general-purpose models, the large systems behind chatbots, have had to meet transparency and copyright duties since August 2nd 2025, with those already on the market given until 2027. Most remaining provisions were scheduled to apply from August 2026.",
        { h: "The Brussels effect, tested" },
        "The hope in Brussels is that the law becomes a global standard, as its data-protection rules did: firms find it easier to follow one strict regime everywhere than to maintain several. The fear among European firms is the opposite: that compliance costs fall hardest on small companies and push innovation elsewhere, while the largest American and Chinese developers absorb the paperwork with ease.",
        "Implementation has been bumpy. Technical standards and guidance arrived late, and industry groups lobbied for delays; the EU has debated pushing back some deadlines. Anyone relying on the timetable should check the current official text, which may have changed.",
        "The underlying dilemma is not unique to Europe. Rules written for today's systems risk being obsolete by the time they bite, while waiting for the technology to settle risks waiting for ever. Europe has chosen to act first and adjust later. Whether that looks prescient or premature will depend on how nimbly it adjusts. ■"
      ],
      sources: [
        { title: "EU AI Act enters into force: key compliance dates (McCann FitzGerald)", url: "https://www.mccannfitzgerald.com/knowledge/data-privacy-and-cyber-risk/eu-ai-act-enters-into-force-key-compliance-dates-for-stakeholders", date: "2024-08" },
        { title: "The EU AI Act timeline (Reed Smith)", url: "https://www.reedsmith.com/articles/the-eu-ai-act-timeline/", date: "2025" }
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
