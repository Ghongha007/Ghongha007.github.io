// Everything the room says about Dipti Yadav. Taken from the main portfolio (../index.html); edit here, not in room.js.
export const PERSON = {
  name: "Dipti Yadav",
  title: "OSINT Journalist & Open-Source Investigator",
  role: "Chief Investigation Officer, OSINT JOURNO",
  line: "Tracking conflict, surveillance and information operations through open sources and satellite imagery.",
  photo: "../diptiya.jpg",
};

// Each clue is one object in the room. `deduce` is the floating "deduction" text shown on hover.
export const CLUES = {
  violin: {
    title: "The Profile", deduce: ["Violin, left on the chair", "Owner: thinks while she plays", "Subject: OSINT journalist"],
    html: `<img class="mug" src="../diptiya.jpg" alt="Dipti Yadav">
      <p class="lede">OSINT journalist specialising in China, defence, maritime security, human rights and digital privacy.</p>
      <p>Comfortable working with satellite imagery, flight and ship trackers, corporate records and social media data to unpack complex narratives, and known for clear, visually rich explainer graphics that make technical and geopolitical investigations accessible.</p>
      <h4>Focus areas</h4><ul class="tags"><li>China &amp; Xinjiang</li><li>Defence &amp; military logistics</li><li>Maritime &amp; aviation OSINT</li><li>Human rights violations</li><li>Disinformation &amp; propaganda</li><li>Privacy &amp; data security</li></ul>`,
  },
  board: {
    title: "The Case Wall", deduce: ["Red string, seven pins", "Cases: active", "Access: restricted"],
    locked: true,
    html: `<p>Open-source investigations across defence, maritime security, disinformation and digital rights. Each card opens the published story.</p>
      <div class="cases">
        <a href="https://www.nwsfacts.com/osint/shadow-fleet-in-the-crosshairs-a-drone-strike-exposes-a-global-sanctions-evasion-network" target="_blank" rel="noopener"><b>Shadow fleet in the crosshairs</b><span>A drone strike exposes a Russian shadow-fleet tanker and its covert sanctions-evasion network.</span><i>Sanctions · Maritime OSINT · NWS Facts</i></a>
        <a href="https://www.nwsfacts.com/osint/sunlight-under-sanctions-the-foreign-network-powering-irans-solar-rise" target="_blank" rel="noopener"><b>Sunlight under sanctions</b><span>The foreign supply network powering Iran's solar rise.</span><i>Sanctions · Energy · NWS Facts</i></a>
        <a href="https://medium.com/osint-journo/wings-of-the-junta-satellite-clues-to-myanmars-military-backers-c526998a5444" target="_blank" rel="noopener"><b>Wings of the junta</b><span>Satellite clues to Myanmar's military backers.</span><i>Defence · Aviation OSINT</i></a>
        <a href="https://www.indiatoday.in/amp/world/story/china-propaganda-videos-uyghurs-youtube-2005919-2022-09-28" target="_blank" rel="noopener"><b>Uyghurs propaganda by China</b><span>Open-source analysis of scripted narratives about Uyghur life in Xinjiang.</span><i>China · Human rights · India Today</i></a>
        <a href="https://medium.com/osint-journo/realcraft-portal-exposes-sensitive-fishermen-data-raising-major-privacy-and-security-alarms-55a81954d3d6" target="_blank" rel="noopener"><b>Govt portal exposes fishermen data</b><span>A public portal leaking sensitive personal and location data.</span><i>Privacy · Critical infrastructure</i></a>
        <a href="https://medium.com/osint-journo/maritime-osint-in-detail-part-ii-6b6c1a420129" target="_blank" rel="noopener"><b>Maritime OSINT: In Detail</b><span>Ship trackers, port data and imagery for naval analysis.</span><i>Maritime OSINT · Explainer</i></a>
        <a href="https://www.indiatoday.in/world/story/sea-assaults-israel-hamas-war-us-russia-china-support-warfare-2457977-2023-11-04" target="_blank" rel="noopener"><b>Sea assaults in the Israel–Hamas war</b><span>How naval support shaped the war at sea.</span><i>Defence · Maritime · India Today</i></a>
      </div>`,
  },
  shelf: {
    title: "The Casebook", deduce: ["Spines worn, dates in order", "Newsrooms: four", "Habit: keeps receipts"],
    html: `<ol class="timeline">
      <li><time>Mar – Aug 2026</time><b>NWS Facts · Contributing OSINT Reporter</b><span>Cross-border investigations combining vessel tracking, corporate registries and satellite imagery.</span></li>
      <li><time>Jan 2025 – now</time><b>OSINT JOURNO · Chief Investigation Officer</b><span>Independent OSINT outlet on China, defence, surveillance infrastructure and privacy: long-form explainers, investigations and video.</span></li>
      <li><time>Oct 2023 – Mar 2024</time><b>Centre for Information Resilience · Network Member</b><span>Tracked coordinated influence operations and state-linked propaganda.</span></li>
      <li><time>Aug 2022 – Nov 2023</time><b>India Today · OSINT Reporter</b><span>Open-source investigations on China, conflict zones and information operations. Chairman's Award for Team Excellence 2023.</span></li>
      <li><time>May – Jul 2022</time><b>Hacktoria · Lead Editor (volunteer)</b><span>Maritime OSINT explainer later cited in GIJN's ship-tracking resources.</span></li>
      <li><time>Mar – May 2022</time><b>DFRLab · Digital Sherlock Scholar</b><span>Advanced OSINT, network mapping and verification.</span></li></ol>`,
  },
  frame: {
    title: "The Certificate", deduce: ["Frame: new, still straight", "Subject: still studying", "Field: security & strategy"],
    html: `<p class="lede">MA in International Relations, Security &amp; Strategy (MA-IRSS)</p><p>O.P. Jindal Global University · Oct 2026 – Sept 2027</p>
      <p>Pairing open-source investigation with formal study of international relations, security and strategy.</p>`,
  },
  laptop: {
    title: "The Laptop", deduce: ["Screen still warm", "Repos: open source", "Workflow: AI, checked by hand"],
    html: `<p>Open-source tools built for journalists and researchers, and the AI workflow behind them.</p>
      <p><a class="btn" href="https://github.com/Ghongha007" target="_blank" rel="noopener">github.com/Ghongha007 →</a></p>
      <h4>Toolbox</h4><ul class="tags"><li>Geolocation &amp; satellite analysis</li><li>Video &amp; image verification</li><li>Network &amp; influence mapping</li><li>Data scraping &amp; visualisation</li><li>Explainer graphic design</li></ul>
      <h4>AI in the workflow</h4><ul class="tags"><li>Agentic AI workflows</li><li>Prompt engineering</li><li>Human-in-the-loop verification</li><li>AI output fact-checking</li><li>AI-assisted data analysis</li><li>AI-assisted video production</li><li>Generative AI image &amp; video</li><li>MCP servers &amp; agent skills</li><li>Synthetic media provenance (C2PA)</li><li>Responsible AI use</li></ul>`,
  },
  skull: {
    title: "The Headphones", deduce: ["Headphones on a skull", "Listens in seven languages", "Reads Tibetan script"],
    html: `<ul class="langs"><li><b>Hindi</b> native</li><li><b>English</b> professional</li><li><b>Tibetan</b> certificate of proficiency, Nalanda University</li><li><b>Korean</b> basic reading &amp; conversation</li><li><b>Bengali</b> basic</li><li><b>Mandarin</b> basic, for OSINT research</li><li><b>Russian script</b> reading familiarity for sources</li></ul>`,
  },
  newspaper: {
    title: "The Morning Paper", deduce: ["Folded at one page", "SANS OSINT Summit", "Cited by GIJN"],
    html: `<p class="lede">Speaker, SANS OSINT Summit 2025</p><p>"Chinese Social Media Intelligence": how narratives, influencers and platforms shape China's information environment.</p>
      <p>Maritime OSINT work cited in <a href="https://gijn.org/resource/tracking-ships-at-sea/" target="_blank" rel="noopener">GIJN's ship-tracking resources</a>.</p>
      <p>Bylines: <a href="https://www.indiatoday.in/author/dipti-yadav" target="_blank" rel="noopener">India Today</a> · <a href="https://medium.com/osint-journo" target="_blank" rel="noopener">OSINT JOURNO</a></p>`,
  },
  window: {
    title: "The Window", deduce: ["Rain on Baker Street", "Lamp still lit", "Taking new cases"],
    html: `<p class="lede">For editors, producers and collaborators.</p>
      <p>Email: <a href="mailto:dydiptiyadav07@gmail.com">dydiptiyadav07@gmail.com</a><br>Signal: <span class="mono">@Ghongha007.15</span></p>
      <p class="links"><a href="https://in.linkedin.com/in/dydiptiyadav07" target="_blank" rel="noopener">LinkedIn</a><a href="https://x.com/Ghongha007" target="_blank" rel="noopener">X</a><a href="https://github.com/Ghongha007" target="_blank" rel="noopener">GitHub</a></p>
      <h4>OSINT JOURNO</h4><p class="links"><a href="https://www.osintjourno.com/" target="_blank" rel="noopener">Website</a><a href="https://www.instagram.com/osint_journo/" target="_blank" rel="noopener">Instagram</a><a href="https://medium.com/osint-journo" target="_blank" rel="noopener">Medium</a><a href="https://www.linkedin.com/company/osint-journo" target="_blank" rel="noopener">LinkedIn</a></p>`,
  },
};
