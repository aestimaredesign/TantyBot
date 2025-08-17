
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
  if (!projectHistory.location || !projectHistory.squareFootage) {
    return "To provide an accurate estimate, please tell me the project location (e.g., city, country) and square footage (m²).";
  }

  if (message.toLowerCase().includes("estimate") || message.toLowerCase().includes("cost")) {
    return generateCostEstimate();
  } else if (message.toLowerCase().includes("formula")) {
    return "Total Cost = (Quantity × Unit Cost Material) + (Quantity × Unit Cost Labor) + Indirect Costs (15%) + Contingency (10%).";
  } else if (message.toLowerCase().includes("units")) {
    return "Default units are metric (sq.m, cu.m, linear m). I can convert to English units (sq.ft, cu.yd) on request.";
  } else if (message.toLowerCase().includes("chart")) {
    return "Would you like me to create a chart to visualize this cost breakdown?";
  } else if (message.toLowerCase().includes("update") && projectHistory.trades) {
    return updateEstimate(message);
  } else if (message.toLowerCase().includes("location")) {
    projectHistory.location = message.split("location")[1].trim() || projectHistory.location;
    return projectHistory.location ? "Location noted. Please provide square footage." : "Please specify a location.";
  } else if (message.toLowerCase().includes("square footage")) {
    const footage = parseFloat(message.match(/\d+/));
    if (!isNaN(footage)) projectHistory.squareFootage = footage;
    return projectHistory.squareFootage ? "Square footage noted. How else can I assist?" : "Please provide a valid square footage.";
  } else if (message.toLowerCase().includes("material")) {
    projectHistory.materials = message.split("material")[1].trim() || projectHistory.materials;
    return `Materials set to ${projectHistory.materials}. Let me know if you need an estimate or further adjustments.`;
  } else {
    return "I specialize in construction cost estimating. Try 'location: [city]', 'square footage: [number]', or ask about formulas, units, or charts.";
  }
}

function generateCostEstimate() {
  let totalCost = 0;
  let estimate = "<h4>Cost Estimate Breakdown</h4><ul>";
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
  const indirectCost = totalCost * 0.15;
  const contingency = totalCost * 0.10;
  totalCost += indirectCost + contingency;
  estimate += `<li><strong>Indirect Costs (15%):</strong> $${fmt(indirectCost)}</li>`;
  estimate += `<li><strong>Contingency (10%):</strong> $${fmt(contingency)}</li>`;
  estimate += `<li><strong>Grand Total:</strong> $${fmt(totalCost)}</li></ul>`;
  estimate += `Assumptions: ${projectHistory.materials} materials, ${projectHistory.location} labor rates. Provide scope details for accuracy.`;
  return estimate;
}

function updateEstimate(message) {
  if (message.toLowerCase().includes("premium")) projectHistory.materials = "Premium";
  return generateCostEstimate() + " Updated with " + projectHistory.materials + " materials.";
}

function fmt(n, dec = 2) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
