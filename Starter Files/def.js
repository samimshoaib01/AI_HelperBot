// Function to extract problem context, language, pixel, and additional content
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
    let extractedText = 'No text found';

    // Helper function to get plain text from an element
    function getPlainText(element) {
        return element ? element.textContent.trim() : 'No content found';
    }

    // Extract problem description, input format, output format, and constraints
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

        // Find all text content inside the fourth div, including katex-html spans and regular text nodes
        const katexHtmlSpans = fourthDiv.querySelectorAll('.katex-html');
        const otherTextNodes = Array.from(fourthDiv.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0)
            .map(node => node.textContent.trim());

        // Extract visible text from .katex-html spans
        const katexText = Array.from(katexHtmlSpans)
            .map(span => {
                return span.innerHTML
                    .replace(
                        /<span class="msupsub">.*?<span class="vlist-t">.*?<span class="mord mtight">(.*?)<\/span>.*?<\/span>/g,
                        '^$1' // Convert superscripts into "^" notation
                    )
                    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
                    .trim();
            })
            .filter(text => text); // Remove empty results

        // Combine text from katex-html and other text nodes
        constraints = [...katexText, ...otherTextNodes]
            .join(' ') // Join multiple expressions with a single space
            .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
            .replace(/[^a-zA-Z0-9≤≥.,^×\- ]/g, '') // Remove unwanted characters
            .trim(); // Remove leading/trailing spaces
    }

    // Extract sample test cases
    const testCaseDivs = document.querySelectorAll('div.coding_input_format_container__iYezu.mb-0.flex-grow-1.p-3');

    // Iterate through the test case divs to extract inputs and outputs
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

    // Extract text content from the specified div
    const divElement = document.querySelector('.view-lines.monaco-mouse-cursor-text');
    if (divElement) {
        extractedText = divElement.innerText.trim();
    }

    // Return all extracted details
    return {
        description,
        inputFormat,
        outputFormat,
        constraints,
        sampleTestCases,
        language,
        pixel,
        extractedText
    };
}


// Attach function to the global window object
window.getProblemContextAndDetails = getProblemContextAndDetails;
