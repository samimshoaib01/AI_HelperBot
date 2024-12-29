// Function to extract problem context, language, and additional details
function getProblemContextAndDetails() {
    // Select all div elements with class `w-100`
    const divs = document.querySelectorAll('div.w-100');

    // Initialize variables
    let description = 'No description found';
    let inputFormat = 'No input format found';
    let outputFormat = 'No output format found';
    let constraints = 'No constraints found';
    const sampleTestCases = [];
    let language = '';
    let pixel = '';

    // Helper function to get plain text from an element and clean up repeated patterns
    function getPlainText(element) {
        if (!element) return 'No content found';

        return element.textContent
            .trim()
            // Remove repeated LaTeX-style variables like NNN or AAA
            .replace(/([A-Z]+)(\\textbf{\1})+/g, '$1') // e.g., NNN\textbf{NNN} -> NNN
            // Remove LaTeX formatting like \textbf{}
            .replace(/\\textbf{.*?}/g, '')
            // Remove repeated standalone words (e.g., NNN NNN)
            .replace(/(\b\w+\b)(\s+\1)+/g, '$1')
            .trim();
    }

    // Extract problem description, input format, and output format
    for (const div of divs) {
        const heading = div.querySelector('h5.problem_heading');
        if (heading && heading.textContent.trim() === 'Description') {
            const descriptionDiv = div.querySelector('.problem_paragraph');
            description = getPlainText(descriptionDiv);

            // Input format
            const inputHeading = Array.from(div.querySelectorAll('h5.problem_heading.mt-4')).find(h5 =>
                h5.textContent.trim() === 'Input Format'
            );
            const inputDiv = inputHeading ? inputHeading.nextElementSibling : null;
            inputFormat = getPlainText(inputDiv);

            // Output format
            const outputHeading = Array.from(div.querySelectorAll('h5.problem_heading.mt-4')).find(h5 =>
                h5.textContent.trim() === 'Output Format'
            );
            const outputDiv = outputHeading ? outputHeading.nextElementSibling : null;
            outputFormat = getPlainText(outputDiv);

            break; // Stop once we find the relevant section
        }
    }

    // Extract constraints from the fourth div with the specified class
    const constraintDivs = document.querySelectorAll('div.undefined.markdown-renderer');
    if (constraintDivs.length >= 4) {
        const fourthDiv = constraintDivs[3];

        // Extract visible text including katex-html and regular text nodes
        const katexHtmlSpans = fourthDiv.querySelectorAll('.katex-html');
        const otherTextNodes = Array.from(fourthDiv.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0)
            .map(node => node.textContent.trim());

        const katexText = Array.from(katexHtmlSpans)
            .map(span =>
                span.innerHTML
                    .replace(
                        /<span class="msupsub">.*?<span class="vlist-t">.*?<span class="mord mtight">(.*?)<\/span>.*?<\/span>/g,
                        '^$1' // Convert superscripts into "^" notation
                    )
                    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
                    .trim()
            )
            .filter(text => text); // Remove empty results

        constraints = [...katexText, ...otherTextNodes]
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/[^a-zA-Z0-9≤≥.,^×\- ]/g, '')
            .trim();
    }

    // Extract sample test cases
    const testCaseDivs = document.querySelectorAll('div.coding_input_format_container__iYezu.mb-0.flex-grow-1.p-3');
    for (let i = 0; i < testCaseDivs.length; i += 2) {
        const inputDiv = testCaseDivs[i]?.querySelector('div.coding_input_format__pv9fS');
        const outputDiv = testCaseDivs[i + 1]?.querySelector('div.coding_input_format__pv9fS');

        const input = getPlainText(inputDiv);
        const output = getPlainText(outputDiv);

        sampleTestCases.push({ input, output });
    }

    // Extract language and pixel values
    const spans = document.querySelectorAll('.ant-select-selection-item');
    spans.forEach(span => {
        if (span.querySelector('svg')) {
            language = span.innerText.trim();
        }
        if (span.innerText.includes('px')) {
            pixel = span.innerText.trim();
        }
    });

    // Return all extracted details
    return {
        description,
        inputFormat,
        outputFormat,
        constraints,
        sampleTestCases,
        language,
        pixel
    };
}

// Attach function to the global window object
window.getProblemContextAndDetails = getProblemContextAndDetails;
