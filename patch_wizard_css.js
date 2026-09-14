const fs = require('fs');

const cssPath = 'C:\\Proyectos\\sgh-2.0\\frontend\\src\\style.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const additionalCss = `

/* --- WIZARD FORM STYLES --- */
.form-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    font-size: 0.95rem;
    color: #1e293b;
    background-color: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-input:read-only {
    background-color: #f8fafc;
    color: #64748b;
    cursor: not-allowed;
}

.wizard-step {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

if (!cssContent.includes('WIZARD FORM STYLES')) {
    cssContent += additionalCss;
    fs.writeFileSync(cssPath, cssContent, 'utf8');
    console.log('Wizard CSS inyectado.');
} else {
    console.log('Wizard CSS ya estaba inyectado.');
}
