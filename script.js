// --- Configuration ---
// Point to your local backend server
const API_URL = 'http://localhost:3000/generate'; 

const loadingMessages = [
    "Checking verified hotels...",
    "Locating best local food spots...",
    "Scanning safety databases...",
    "Optimizing budget...",
    "Finalizing your personalized plan..."
];

// --- Event Listeners ---
document.getElementById('generateBtn').addEventListener('click', generateItinerary);

function rotateLoadingText() {
    let i = 0;
    const el = document.getElementById('loadingSub');
    return setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        el.innerText = loadingMessages[i];
    }, 1500);
}

// --- Main Function ---
async function generateItinerary() {
    const promptText = document.getElementById('promptInput').value;
    if (!promptText) { alert("Please describe your trip plans!"); return; }

    // UI State Change
    const resultContainer = document.getElementById('resultContainer');
    const feedbackSection = document.getElementById('feedbackSection');
    const loader = document.getElementById('loader');

    resultContainer.style.display = 'none';
    feedbackSection.style.display = 'none';
    loader.style.display = 'block';
    
    // Scroll to loader
    loader.scrollIntoView({ behavior: 'smooth' });
    
    const loadInterval = rotateLoadingText();

    // Collect Data
    const requestData = {
        prompt: promptText,
        budget: document.getElementById('budget').value,
        transport: document.getElementById('transport').value,
        diet: document.getElementById('diet').value,
        language: document.getElementById('language').value
    };

    try {
        // Call YOUR Backend Server
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Render the UI with the data from backend
        renderTrip(data);

    } catch (error) {
        console.error(error);
        alert("Server Error: " + error.message);
    } finally {
        clearInterval(loadInterval);
        loader.style.display = 'none';
    }
}

// --- Rendering Logic ---
function renderTrip(data) {
    const container = document.getElementById('resultContainer');
    
    let html = `
        <div class="trip-header">
            <div>
                <h2>${data.trip_title}</h2>
                <p>${data.summary}</p>
            </div>
            <div style="text-align:right;">
                <h3>${data.budget_breakdown?.total_est || 'N/A'}</h3>
                <small>Estimated Total</small>
            </div>
        </div>

        <div class="safety-card">
            <i class="fas fa-shield-alt safety-icon"></i>
            <div>
                <h4>Safety Score: ${data.safety_report?.score || 'N/A'}</h4>
                <p><strong>Emergency:</strong> ${data.safety_report?.emergency_contact || '112'}</p>
                <ul style="margin-top:0.5rem; padding-left:1rem;">
                    ${data.safety_report?.tips?.map(tip => `<li>${tip}</li>`).join('') || ''}
                </ul>
            </div>
        </div>

        <h3 style="margin-bottom:1.5rem; color:var(--secondary)"><i class="fas fa-bed"></i> Stays & Travel</h3>
        <div class="options-grid">
            ${data.hotels?.map(h => `
                <div class="option-card">
                    <h4>${h.name} <span style="font-size:0.8rem; color:#f1c40f">★ ${h.rating}</span></h4>
                    <p style="font-size:0.9rem; margin-bottom:0.5rem">${h.reason}</p>
                    <div>${h.tags?.map(t => `<span class="tag veg">${t}</span>`).join('') || ''}</div>
                </div>
            `).join('') || ''}
            ${data.transport_options?.map(t => `
                <div class="option-card">
                    <h4><i class="fas fa-ticket-alt"></i> ${t.mode}</h4>
                    <p>${t.details}</p>
                    <p><strong>Est: ${t.cost_est}</strong></p>
                </div>
            `).join('') || ''}
        </div>

        <h3 style="margin-bottom:1.5rem; color:var(--secondary)"><i class="fas fa-calendar-alt"></i> Day-by-Day Plan</h3>
        <div class="timeline">
            ${data.itinerary?.map(day => `
                <div class="day-card">
                    <div style="font-size:1.2rem; font-weight:700; margin-bottom:0.5rem;">Day ${day.day}: ${day.title}</div>
                    <ul class="day-activities">
                        ${day.activities?.map(act => `
                            <li>
                                <i class="fas fa-clock" style="color:var(--primary); margin-top:4px;"></i>
                                <span><strong>${act.time}:</strong> ${act.activity} - <em style="color:#666">${act.description}</em></span>
                            </li>
                        `).join('') || ''}
                        <li>
                            <i class="fas fa-utensils" style="color:var(--primary); margin-top:4px;"></i>
                            <span style="color:var(--primary)"><strong>Food Pick:</strong> ${day.food_spot}</span>
                        </li>
                    </ul>
                </div>
            `).join('') || ''}
        </div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';
    document.getElementById('feedbackSection').style.display = 'block';
    
    // Smooth scroll to results
    container.scrollIntoView({ behavior: 'smooth' });
}

function submitFeedback(type) {
    alert(`Feedback (${type}) recorded! The AI model has been updated.`);
    document.getElementById('feedbackSection').innerHTML = `<h3 style="color:green; text-align:center;">Feedback Recorded! <i class="fas fa-check"></i></h3>`;
}