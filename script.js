const chatContent = document.getElementById("chatContent");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
let projectHistory = { location: "", squareFootage: 0, materials: "Standard", trades: {} };

sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    chatContent.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
    let response = handleTantyBotResponse(message);
    chatContent.innerHTML += `<p><strong>TantyBot:</strong> ${response}</p>`;
    chatInput.value = "";
    chatContent.scrollTop = chatContent.scrollHeight;
  }
}

function handleTantyBotResponse(message) {
  // Casual update of project history from any trade data if provided
  $$(".panel").forEach(panel => {
    const discipline = panel.dataset.discipline; // Note: This assumes integration with a form later
    projectHistory.trades[discipline] = $$("tbody tr", panel).map(tr => ({
      scope: $$("input", tr)[0].value || "N/A",
      qty: parseFloat($$("input", tr)[1].value) || 0,
      unit: $$("select", tr)[0].value || "N/A",
      ucm: parseFloat($$("input", tr)[2].value) || 0,
      ucl: parseFloat($$("input", tr)[3].value) || 0
    }));
  });

  // Casual flow - no mandatory prompts
  if (message.toLowerCase().includes("hey") || message.toLowerCase().includes("hi")) {
    return "Hey there! Good to see you! I’m TantyBot, your go-to for construction cost estimates. Got a project on your mind? Toss me some details like location or size whenever you’re ready!";
  } else if (message.toLowerCase().includes("estimate") || message.toLowerCase().includes("cost")) {
    if (!projectHistory.location && !projectHistory.squareFootage && !Object.keys(projectHistory.trades).length) {
      return "Cool, let’s talk costs! If you’ve got a location or square footage in mind, let me know—otherwise, I can give you a rough ballpark based on what I’ve got. What’s the project about?";
    }
    return generateCostEstimate();
  } else if (message.toLowerCase().includes("formula")) {
    return "Alright, here’s the smart stuff: Total Cost = (Quantity × Unit Cost Material) + (Quantity × Unit Cost Labor) + Indirect Costs (around 15%) + a Contingency (say, 10%). Pretty standard, but I can tweak it for you!";
  } else if (message.toLowerCase().includes("units")) {
    return "I roll with metric by default—think sq.m, cu.m, or linear m. But if you prefer feet or yards, just say the word, and I’ll convert it for you!";
  } else if (message.toLowerCase().includes("chart")) {
    return "Oh, nice idea! Want me to whip up a chart to break down the costs? Just say yes, and I’ll get on it!";
  } else if (message.toLowerCase().includes("update")) {
    return updateEstimate(message);
  } else if (message.toLowerCase().includes("location")) {
    projectHistory.location = message.split("location")[1].trim() || projectHistory.location;
    return projectHistory.location ? `Sweet, got ${projectHistory.location} locked in! Got a square footage or scope to add?” : "Hmm, where’s this project happening? Give me a city or country to work with!";
  } else if (message.toLowerCase().includes("square footage")) {
    const footage = parseFloat(message.match(/\d+/));
    if (!isNaN(footage)) projectHistory.squareFootage = footage;
    return projectHistory.squareFootage ? `Awesome, ${projectHistory.squareFootage} m² it is! Ready for an estimate?” : "How big’s the space? Throw me a number in m²!";
  } else if (message.toLowerCase().includes("material")) {
    projectHistory.materials = message.split("material")[1].trim() || projectHistory.materials;
    return `Got it, we’re using ${projectHistory.materials} materials. Let me know if you want a cost rundown with that!”;
  } else if (message.toLowerCase().includes("price") || message.toLowerCase().includes("cost of")) {
    const item = message.split("of")[1]?.trim() || message.split("price")[1]?.trim();
    return item ? getPriceInquiry(item) : "Tell me what you’re curious about—e.g., ‘price of concrete’—and I’ll dig up some solid numbers for you!";
  } else {
    return "Hey, I’m here to help with cost estimates! Try chatting about your project—like ‘location: Manila’ or ‘square footage: 1000’—or ask about prices, formulas, or charts. What’s up?";
  }
}

function generateCostEstimate() {
  let totalCost = 0;
  let estimate = "<h4>Cost Breakdown (Rough Estimate)</h4><ul>";
  if (Object.keys(projectHistory.trades).length === 0) {
    estimate += "<li>No scope details yet—let’s start with some trades or quantities if you’ve got ‘em!</li>";
    totalCost = projectHistory.squareFootage * 100; // Placeholder rate of $100/m²
  } else {
    for (let discipline in projectHistory.trades) {
      let discTotal = 0;
      estimate += `<li><strong>${discipline}:</strong><ul>`;
      projectHistory.trades[discipline].forEach((item, index) => {
        const matCost = item.qty * item.ucm;
        const labCost = item.qty * item.ucl;
        const itemTotal = matCost + labCost;
        discTotal += itemTotal;
        estimate += `<li>${index + 1}. ${item.scope}: ${item.qty} ${item.unit} @ $${fmt(item.ucm)} (M), $${fmt(item.ucl)} (L) = $${fmt(itemTotal)}</li>`;
      });
      estimate += `<li>Total ${discipline}: $${fmt(discTotal)}</li></ul>`;
      totalCost += discTotal;
    }
  }
  const indirectCost = totalCost * 0.15;
  const contingency = totalCost * 0.10;
  totalCost += indirectCost + contingency;
  estimate += `<li><strong>Indirect Costs (15%):</strong> $${fmt(indirectCost)}</li>`;
  estimate += `<li><strong>Contingency (10%):</strong> $${fmt(contingency)}</li>`;
  estimate += `<li><strong>Grand Total:</strong> $${fmt(totalCost)}</li></ul>`;
  estimate += `Notes: Based on ${projectHistory.materials} materials and ${projectHistory.location || 'assumed location'}. Give me more details for a tighter estimate!`;
  return estimate;
}

function updateEstimate(message) {
  if (message.toLowerCase().includes("premium")) projectHistory.materials = "Premium";
  return generateCostEstimate() + ` Just updated with ${projectHistory.materials} materials—how’s that look?`;
}

function getPriceInquiry(item) {
  const priceData = {
    "concrete": 100, // $100 per cu.m (example)
    "rebar": 0.8,   // $0.80 per kg (example)
    "tiles": 20,    // $20 per sq.m (example)
    "paint": 2.5    // $2.50 per sq.m (example)
  };
  const price = priceData[item.toLowerCase()];
  return price ? `For ${item}, I’d estimate around $${fmt(price)} per unit (based on recent trends). Want more details or another item?` : `Hmm, not sure about ${item} off the top of my head. Try something like ‘concrete’ or ‘tiles’, or I can look it up if you give me a sec!`;
}

function fmt(n, dec = 2) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
