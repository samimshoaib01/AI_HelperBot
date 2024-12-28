// prompt.js

 function generatePrompt(problemDetails, userMessage) {
    const {
        description = "No description available.",
        inputFormat = "No input format provided.",
        outputFormat = "No output format provided.",
        constraints = "No constraints specified.",
        sampleTestCases = [],
    } = problemDetails;

    let testCasesText = "Sample Test Cases:\n";
    sampleTestCases.forEach((testCase, index) => {
        testCasesText += `Test Case ${index + 1}:\nInput:\n${testCase.input}\nOutput:\n${testCase.output}\n\n`;
    });

    const prompt = `
        Problem Description:
        ${description}

        Input Format:
        ${inputFormat}

        Output Format:
        ${outputFormat}

        Constraints:
        ${constraints}

        ${testCasesText}

        User's Question:
        ${userMessage}
    `;

    return prompt.trim();
}

// Attach function to the global window object
window.generatePrompt = generatePrompt;
