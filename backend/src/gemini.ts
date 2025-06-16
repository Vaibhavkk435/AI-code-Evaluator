import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

import analyzeImageRouter from './routes/analyzeImage';
import summarizeRouter from './routes/summarize';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const apiKey = process.env.GEMINI_API_KEY;

export interface AnalysisResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  category?: string;
  correctedCode?: string; // New field for corrected code
  optimizedCode?: string; // New field for optimized code
  codeIssues?: CodeIssue[]; // New field for specific code issues
}

export interface CodeIssue {
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'style';
  line?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

export interface AnalysisOptions {
  criteria?: 'writing' | 'academic' | 'business' | 'creative' | 'general' | 'code';
  maxScore?: number;
  focusAreas?: string[];
  language?: string; // Programming language for code analysis
  analysisType?: 'analyze' | 'correct' | 'optimize' | 'all'; // Type of code analysis
}

// Function to detect if input is code
function detectInputType(inputText: string): { isCode: boolean; language?: string } {
  const codePatterns = [
    { pattern: /^(import|from|export|const|let|var|function|class)\s+/m, language: 'javascript' },
    { pattern: /^(def|class|import|from|if __name__|print\()/m, language: 'python' },
    { pattern: /^(#include|using namespace|int main\(|cout|cin)/m, language: 'cpp' },
    { pattern: /^(public class|private|public|import java)/m, language: 'java' },
    { pattern: /^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)/im, language: 'sql' },
    { pattern: /^(<\?php|\$[a-zA-Z_]|echo|print)/m, language: 'php' },
    { pattern: /^(package|func|var|import \"|type\s+\w+\s+struct)/m, language: 'go' },
    { pattern: /^(fn|let|mut|use|struct|impl)/m, language: 'rust' },
    { pattern: /^(<html|<div|<script|<!DOCTYPE)/im, language: 'html' },
    { pattern: /^(\.|#|@media|body\s*{|\.[\w-]+\s*{)/m, language: 'css' },
  ];

  // Check for common code indicators
  const hasCodeStructure = /[{}();]/.test(inputText) && 
                          (inputText.includes('function') || 
                           inputText.includes('class') || 
                           inputText.includes('const') ||
                           inputText.includes('def') ||
                           inputText.includes('public') ||
                           inputText.includes('private'));

  for (const { pattern, language } of codePatterns) {
    if (pattern.test(inputText)) {
      return { isCode: true, language };
    }
  }

  return { isCode: hasCodeStructure, language: 'javascript' }; // Default to JavaScript if structure detected
}

export async function analyzeText(
  inputText: string, 
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  try {
    if (!inputText.trim()) {
      throw new Error('Input text cannot be empty');
    }

    // Auto-detect if input is code
    const detection = detectInputType(inputText);
    const isCodeInput = detection.isCode || options.criteria === 'code';
    const detectedLanguage = options.language || detection.language;

    const { 
      criteria = isCodeInput ? 'code' : 'general', 
      maxScore = 100, 
      focusAreas = [],
      analysisType = 'all'
    } = options;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = isCodeInput 
      ? buildCodeAnalysisPrompt(inputText, maxScore, focusAreas, detectedLanguage, analysisType)
      : buildAnalysisPrompt(inputText, criteria, maxScore, focusAreas);

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    if (!response) {
      throw new Error('No response received from Gemini');
    }

    const analysisText = response.text();
    
    // Parse the structured response
    return isCodeInput 
      ? parseCodeAnalysisResponse(analysisText, maxScore)
      : parseAnalysisResponse(analysisText, maxScore);
    
  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildCodeAnalysisPrompt(
  inputCode: string, 
  maxScore: number, 
  focusAreas: string[],
  language?: string,
  analysisType: string = 'all'
): string {
  const focusInstruction = focusAreas.length > 0 
    ? `Pay special attention to: ${focusAreas.join(', ')}.` 
    : '';

  const languageInstruction = language 
    ? `This appears to be ${language.toUpperCase()} code.` 
    : '';

  const analysisInstructions = {
    analyze: 'Analyze the code for issues and quality',
    correct: 'Analyze and provide corrected version of the code',
    optimize: 'Analyze and provide optimized version of the code',
    all: 'Analyze the code, provide corrections for any issues, and suggest optimizations'
  };

  return `
You are an expert code reviewer and optimizer. ${languageInstruction} ${analysisInstructions[analysisType as keyof typeof analysisInstructions]}.

${focusInstruction}

Evaluate the code based on:
- Syntax correctness
- Logic and functionality
- Performance and efficiency
- Security considerations
- Code style and best practices
- Maintainability and readability

You MUST provide a numerical score between 0 and ${maxScore}:
- 0-20: Critical issues, code may not work
- 21-40: Major issues, significant problems
- 41-60: Moderate issues, code works but needs improvement
- 61-80: Good code with minor issues
- 81-100: Excellent code, minimal improvements needed

Respond using this EXACT format:

SCORE: [numerical score from 0 to ${maxScore}]
CATEGORY: Code Analysis - ${language || 'Unknown Language'}
FEEDBACK: [2-3 sentences of overall assessment]
STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
IMPROVEMENTS:
- [improvement suggestion 1]
- [improvement suggestion 2]
- [improvement suggestion 3]

${analysisType === 'correct' || analysisType === 'all' ? `
CORRECTED_CODE:
\`\`\`${language || ''}
[corrected version of the code with fixes applied]
\`\`\`
` : ''}

${analysisType === 'optimize' || analysisType === 'all' ? `
OPTIMIZED_CODE:
\`\`\`${language || ''}
[optimized version of the code with performance improvements]
\`\`\`
` : ''}

CODE_ISSUES:
- TYPE: [syntax|logic|performance|security|style] | SEVERITY: [low|medium|high|critical] | LINE: [line number if applicable] | DESCRIPTION: [issue description] | SUGGESTION: [how to fix]
- TYPE: [type] | SEVERITY: [severity] | LINE: [line] | DESCRIPTION: [description] | SUGGESTION: [suggestion]

Code to analyze:
${inputCode}
  `.trim();
}

function buildAnalysisPrompt(
  inputText: string, 
  criteria: string, 
  maxScore: number, 
  focusAreas: string[]
): string {
  const criteriaInstructions = {
    writing: 'clarity, grammar, style, structure, and engagement',
    academic: 'argument strength, evidence quality, structure, clarity, and academic rigor',
    business: 'professionalism, clarity, persuasiveness, structure, and actionability',
    creative: 'originality, creativity, engagement, style, and emotional impact',
    general: 'overall quality, clarity, structure, and effectiveness'
  };

  const focusInstruction = focusAreas.length > 0 
    ? `Pay special attention to: ${focusAreas.join(', ')}.` 
    : '';

  return `
You are an expert text analyst. Analyze the following text and provide a comprehensive evaluation based on ${criteriaInstructions[criteria as keyof typeof criteriaInstructions]}.

${focusInstruction}

You MUST provide a numerical score between 0 and ${maxScore}. Use the following scoring guidelines:
- 0-20: Poor quality, major issues
- 21-40: Below average, significant improvements needed
- 41-60: Average, some improvements needed  
- 61-80: Good quality, minor improvements
- 81-100: Excellent quality, minimal improvements needed

Respond using this EXACT format (do not deviate):

SCORE: [numerical score from 0 to ${maxScore}]
CATEGORY: [brief category/type of the text]
FEEDBACK: [2-3 sentences of overall assessment]
STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]
IMPROVEMENTS:
- [improvement suggestion 1]
- [improvement suggestion 2]
- [improvement suggestion 3]

Text to analyze:
${inputText}
  `.trim();
}

function parseCodeAnalysisResponse(responseText: string, maxScore: number): AnalysisResult {
  try {
    console.log('Raw AI response:', responseText);
    
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract score
    let score = 0;
    const scorePatterns = [
      /SCORE:\s*(\d+(?:\.\d+)?)/i,
      /Score:\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\/\d+/,
      /(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*\d+/i
    ];
    
    for (const line of lines) {
      for (const pattern of scorePatterns) {
        const match = line.match(pattern);
        if (match) {
          score = Math.min(Math.round(parseFloat(match[1])), maxScore);
          break;
        }
      }
      if (score > 0) break;
    }

    // Extract category
    const categoryLine = lines.find(line => line.toLowerCase().startsWith('category:'));
    const category = categoryLine?.replace(/category:\s*/i, '').trim();

    // Extract feedback
    const feedbackIndex = lines.findIndex(line => line.toLowerCase().startsWith('feedback:'));
    let feedback = '';
    if (feedbackIndex !== -1) {
      const feedbackLines = [];
      if (lines[feedbackIndex].length > 'feedback:'.length) {
        feedbackLines.push(lines[feedbackIndex].replace(/feedback:\s*/i, ''));
      }
      
      for (let i = feedbackIndex + 1; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.startsWith('strengths:') || line.startsWith('improvements:') || 
            line.startsWith('corrected_code:') || line.startsWith('optimized_code:') || 
            line.startsWith('code_issues:')) {
          break;
        }
        feedbackLines.push(lines[i]);
      }
      feedback = feedbackLines.join(' ').trim();
    }

    // Extract strengths
    const strengthsIndex = lines.findIndex(line => line.toLowerCase().startsWith('strengths:'));
    const strengths: string[] = [];
    if (strengthsIndex !== -1) {
      for (let i = strengthsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().startsWith('improvements:') || 
            line.toLowerCase().startsWith('corrected_code:') ||
            line.toLowerCase().startsWith('optimized_code:') ||
            line.toLowerCase().startsWith('code_issues:')) break;
        if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
          strengths.push(line.replace(/^[-•\d.\s]+/, '').trim());
        }
      }
    }

    // Extract improvements
    const improvementsIndex = lines.findIndex(line => line.toLowerCase().startsWith('improvements:'));
    const improvements: string[] = [];
    if (improvementsIndex !== -1) {
      for (let i = improvementsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().startsWith('corrected_code:') ||
            line.toLowerCase().startsWith('optimized_code:') ||
            line.toLowerCase().startsWith('code_issues:')) break;
        if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
          improvements.push(line.replace(/^[-•\d.\s]+/, '').trim());
        }
      }
    }

    // Extract corrected code
    let correctedCode = '';
    const correctedCodeMatch = responseText.match(/CORRECTED_CODE:\s*```[\w]*\n([\s\S]*?)```/i);
    if (correctedCodeMatch) {
      correctedCode = correctedCodeMatch[1].trim();
    }

    // Extract optimized code
    let optimizedCode = '';
    const optimizedCodeMatch = responseText.match(/OPTIMIZED_CODE:\s*```[\w]*\n([\s\S]*?)```/i);
    if (optimizedCodeMatch) {
      optimizedCode = optimizedCodeMatch[1].trim();
    }

    // Extract code issues
    const codeIssues: CodeIssue[] = [];
    const issuesIndex = lines.findIndex(line => line.toLowerCase().startsWith('code_issues:'));
    if (issuesIndex !== -1) {
      for (let i = issuesIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('-') || line.startsWith('•')) {
          const issueMatch = line.match(/TYPE:\s*(\w+)\s*\|\s*SEVERITY:\s*(\w+)(?:\s*\|\s*LINE:\s*(\d+))?\s*\|\s*DESCRIPTION:\s*([^|]+)\s*\|\s*SUGGESTION:\s*(.+)/i);
          if (issueMatch) {
            codeIssues.push({
              type: issueMatch[1].toLowerCase() as CodeIssue['type'],
              severity: issueMatch[2].toLowerCase() as CodeIssue['severity'],
              line: issueMatch[3] ? parseInt(issueMatch[3]) : undefined,
              description: issueMatch[4].trim(),
              suggestion: issueMatch[5].trim()
            });
          }
        }
      }
    }

    const result: AnalysisResult = {
      score,
      feedback: feedback || 'Code analysis completed successfully',
      strengths: strengths.length > 0 ? strengths : ['Code structure is present'],
      improvements: improvements.length > 0 ? improvements : ['Consider reviewing for best practices'],
      category,
      ...(correctedCode && { correctedCode }),
      ...(optimizedCode && { optimizedCode }),
      ...(codeIssues.length > 0 && { codeIssues })
    };

    console.log('Parsed result:', result);
    return result;

  } catch (error) {
    console.error('Failed to parse code analysis response:', error);
    
    const scoreMatch = responseText.match(/(\d+)(?:\s*\/\s*\d+|\s*out\s*of\s*\d+|\s*points?)?/i);
    const fallbackScore = scoreMatch ? Math.min(parseInt(scoreMatch[1]), maxScore) : 50;
    
    return {
      score: fallbackScore,
      feedback: 'Code analysis completed but parsing encountered issues.',
      strengths: ['Code provided for analysis'],
      improvements: ['Consider simplifying the code structure'],
    };
  }
}

function parseAnalysisResponse(responseText: string, maxScore: number): AnalysisResult {
  try {
    console.log('Raw AI response:', responseText);
    
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract score with multiple patterns
    let score = 0;
    const scorePatterns = [
      /SCORE:\s*(\d+(?:\.\d+)?)/i,
      /Score:\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\/\d+/,
      /(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*\d+/i
    ];
    
    for (const line of lines) {
      for (const pattern of scorePatterns) {
        const match = line.match(pattern);
        if (match) {
          score = Math.min(Math.round(parseFloat(match[1])), maxScore);
          console.log('Extracted score:', score);
          break;
        }
      }
      if (score > 0) break;
    }

    // Extract category
    const categoryLine = lines.find(line => line.toLowerCase().startsWith('category:'));
    const category = categoryLine?.replace(/category:\s*/i, '').trim();

    // Extract feedback
    const feedbackIndex = lines.findIndex(line => line.toLowerCase().startsWith('feedback:'));
    let feedback = '';
    if (feedbackIndex !== -1) {
      const feedbackLines = [];
      let currentLine = feedbackIndex;
      
      if (lines[currentLine].length > 'feedback:'.length) {
        feedbackLines.push(lines[currentLine].replace(/feedback:\s*/i, ''));
      }
      
      for (let i = currentLine + 1; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.startsWith('strengths:') || line.startsWith('improvements:') || line.startsWith('score:')) {
          break;
        }
        feedbackLines.push(lines[i]);
      }
      feedback = feedbackLines.join(' ').trim();
    }

    // Extract strengths
    const strengthsIndex = lines.findIndex(line => line.toLowerCase().startsWith('strengths:'));
    const strengths: string[] = [];
    if (strengthsIndex !== -1) {
      for (let i = strengthsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().startsWith('improvements:')) break;
        if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
          strengths.push(line.replace(/^[-•\d.\s]+/, '').trim());
        }
      }
    }

    // Extract improvements
    const improvementsIndex = lines.findIndex(line => line.toLowerCase().startsWith('improvements:'));
    const improvements: string[] = [];
    if (improvementsIndex !== -1) {
      for (let i = improvementsIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
          improvements.push(line.replace(/^[-•\d.\s]+/, '').trim());
        }
      }
    }

    const result = {
      score,
      feedback: feedback || 'Analysis completed successfully',
      strengths: strengths.length > 0 ? strengths : ['Text structure is present'],
      improvements: improvements.length > 0 ? improvements : ['Consider reviewing for clarity'],
      category
    };

    console.log('Parsed result:', result);
    return result;

  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    console.error('Raw response was:', responseText);
    
    const scoreMatch = responseText.match(/(\d+)(?:\s*\/\s*\d+|\s*out\s*of\s*\d+|\s*points?)?/i);
    const fallbackScore = scoreMatch ? Math.min(parseInt(scoreMatch[1]), maxScore) : 50;
    
    return {
      score: fallbackScore,
      feedback: 'Analysis completed but parsing encountered issues. Please check the raw response for details.',
      strengths: ['Content provided for analysis'],
      improvements: ['Consider simplifying the analysis request'],
    };
  }
}
export async function summarizeText(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = 'Summarize the following text in a concise paragraph:\n\n${text}';
  const result = await model.generateContent(prompt);
  const response = result.response;
  if (!response) throw new Error('No response from Gemini');
  return response.text();
}
// Enhanced convenience functions
export async function analyzeWriting(text: string): Promise<AnalysisResult> {
  return analyzeText(text, { criteria: 'writing' });
}

export async function analyzeAcademicWork(text: string): Promise<AnalysisResult> {
  return analyzeText(text, { criteria: 'academic' });
}

export async function analyzeBusinessDocument(text: string): Promise<AnalysisResult> {
  return analyzeText(text, { criteria: 'business' });
}

export async function analyzeCreativeWork(text: string): Promise<AnalysisResult> {
  return analyzeText(text, { criteria: 'creative' });
}

// New code-specific functions
export async function analyzeCode(code: string, language?: string): Promise<AnalysisResult> {
  return analyzeText(code, { criteria: 'code', language, analysisType: 'analyze' });
}

export async function correctCode(code: string, language?: string): Promise<AnalysisResult> {
  return analyzeText(code, { criteria: 'code', language, analysisType: 'correct' });
}

export async function optimizeCode(code: string, language?: string): Promise<AnalysisResult> {
  return analyzeText(code, { criteria: 'code', language, analysisType: 'optimize' });
}

export async function fullCodeAnalysis(code: string, language?: string): Promise<AnalysisResult> {
  return analyzeText(code, { criteria: 'code', language, analysisType: 'all' });
}

// Enhanced usage examples with code functionality:
/*
// Text analysis (existing functionality)
const textResult = await analyzeWriting("Your text here");
console.log(`Score: ${textResult.score}/100`);

// Code analysis examples
const codeResult = await analyzeCode(`
function calculateSum(a, b) {
  return a + b;
}
`, 'javascript');

// Code correction
const correctionResult = await correctCode(`
function calculateSum(a b) {  // Missing comma
  return a + b
}  // Missing semicolon
`, 'javascript');

// Code optimization
const optimizationResult = await optimizeCode(`
function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}
`, 'javascript');

// Full analysis (analyze + correct + optimize)
const fullResult = await fullCodeAnalysis(`
var nums = [1,2,3,4,5];
var sum = 0;
for (var i = 0; i < nums.length; i++) {
  sum = sum + nums[i];
}
console.log(sum);
`, 'javascript');

console.log('Code Issues:', fullResult.codeIssues);
console.log('Corrected Code:', fullResult.correctedCode);
console.log('Optimized Code:', fullResult.optimizedCode);
*/

// Enhanced test function
export async function testAnalysis(): Promise<void> {
  try {
    console.log('=== Testing Text Analysis ===');
    const testText = "This is a sample text for testing the analysis function. It contains multiple sentences and should receive a constructive score.";
    const textResult = await analyzeText(testText, { criteria: 'writing', maxScore: 100 });
    
    console.log('Text Analysis Results:');
    console.log('Score:', textResult.score);
    console.log('Feedback:', textResult.feedback);
    
    console.log('\n=== Testing Code Analysis ===');
    const testCode = `
function calculateSum(a, b) {
  var result = a + b;
  return result;
}
    `;
    
    const codeResult = await fullCodeAnalysis(testCode, 'javascript');
    
    console.log('Code Analysis Results:');
    console.log('Score:', codeResult.score);
    console.log('Category:', codeResult.category);
    console.log('Feedback:', codeResult.feedback);
    console.log('Strengths:', codeResult.strengths);
    console.log('Improvements:', codeResult.improvements);
    
    if (codeResult.correctedCode) {
      console.log('Corrected Code:', codeResult.correctedCode);
    }
    
    if (codeResult.optimizedCode) {
      console.log('Optimized Code:', codeResult.optimizedCode);
    }
    
    if (codeResult.codeIssues) {
      console.log('Code Issues:', codeResult.codeIssues);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}