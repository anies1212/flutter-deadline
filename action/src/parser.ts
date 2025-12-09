import * as fs from 'fs';
import * as path from 'path';
import { DeadlineAnnotation, ParseResult } from './types';

/**
 * Regex pattern to match @Deadline annotation with its parameters
 * Supports multiline annotations
 */
const DEADLINE_PATTERN = /@Deadline\s*\(\s*([\s\S]*?)\s*\)/g;

/**
 * Parse a named parameter value from annotation string
 */
function parseNamedParameter(content: string, paramName: string): string | undefined {
  // Match patterns like: paramName: value or paramName: 'value' or paramName: "value"
  const patterns = [
    new RegExp(`${paramName}\\s*:\\s*'([^']*)'`),  // Single quotes
    new RegExp(`${paramName}\\s*:\\s*"([^"]*)"`),  // Double quotes
    new RegExp(`${paramName}\\s*:\\s*(\\d+)`),     // Numbers
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

/**
 * Extract the code block following an annotation
 */
function extractCodeBlock(content: string, annotationEndIndex: number): { codeBlock: string; elementName: string } {
  const afterAnnotation = content.slice(annotationEndIndex);

  // Skip whitespace and other annotations
  let startIndex = 0;
  const whitespaceMatch = afterAnnotation.match(/^[\s\n]*/);
  if (whitespaceMatch) {
    startIndex = whitespaceMatch[0].length;
  }

  const codeStart = afterAnnotation.slice(startIndex);

  // Try to identify and extract the element
  let codeBlock = '';
  let elementName = 'unknown';

  // Match class declaration
  const classMatch = codeStart.match(/^((?:abstract\s+)?class\s+(\w+)[^{]*\{)/);
  if (classMatch) {
    elementName = classMatch[2];
    codeBlock = extractBalancedBraces(codeStart, classMatch.index || 0);
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match mixin declaration
  const mixinMatch = codeStart.match(/^(mixin\s+(\w+)[^{]*\{)/);
  if (mixinMatch) {
    elementName = mixinMatch[2];
    codeBlock = extractBalancedBraces(codeStart, mixinMatch.index || 0);
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match extension declaration
  const extensionMatch = codeStart.match(/^(extension\s+(\w+)?[^{]*\{)/);
  if (extensionMatch) {
    elementName = extensionMatch[2] || 'anonymous extension';
    codeBlock = extractBalancedBraces(codeStart, extensionMatch.index || 0);
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match enum declaration
  const enumMatch = codeStart.match(/^(enum\s+(\w+)[^{]*\{)/);
  if (enumMatch) {
    elementName = enumMatch[2];
    codeBlock = extractBalancedBraces(codeStart, enumMatch.index || 0);
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match function/method declaration
  const funcMatch = codeStart.match(/^((?:static\s+)?(?:Future<[^>]+>|Stream<[^>]+>|void|int|double|bool|String|dynamic|var|final|const|[\w<>,\s]+)\s+(?:get\s+)?(\w+)\s*(?:<[^>]+>)?\s*\([^)]*\)[^{;]*)/);
  if (funcMatch) {
    elementName = funcMatch[2];
    // Check if it's a function body with braces or arrow function
    const afterSignature = codeStart.slice(funcMatch[0].length);
    if (afterSignature.trimStart().startsWith('{')) {
      codeBlock = funcMatch[0] + extractBalancedBraces(afterSignature.trimStart(), 0);
    } else if (afterSignature.trimStart().startsWith('=>')) {
      // Arrow function - find the semicolon
      const arrowEnd = afterSignature.indexOf(';');
      codeBlock = funcMatch[0] + afterSignature.slice(0, arrowEnd + 1);
    } else {
      codeBlock = funcMatch[0] + ';';
    }
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match getter
  const getterMatch = codeStart.match(/^((?:static\s+)?[\w<>,\s]+\s+get\s+(\w+))/);
  if (getterMatch) {
    elementName = getterMatch[2];
    const afterSignature = codeStart.slice(getterMatch[0].length);
    if (afterSignature.trimStart().startsWith('{')) {
      codeBlock = getterMatch[0] + extractBalancedBraces(afterSignature.trimStart(), 0);
    } else if (afterSignature.trimStart().startsWith('=>')) {
      const arrowEnd = afterSignature.indexOf(';');
      codeBlock = getterMatch[0] + afterSignature.slice(0, arrowEnd + 1);
    }
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Match variable/constant declaration
  const varMatch = codeStart.match(/^((?:static\s+)?(?:final\s+|const\s+|var\s+|late\s+)?(?:[\w<>,\s]+\s+)?(\w+)\s*=)/);
  if (varMatch) {
    elementName = varMatch[2];
    // Find the end of the statement
    let depth = 0;
    let endIndex = varMatch[0].length;
    const remaining = codeStart.slice(varMatch[0].length);
    for (let i = 0; i < remaining.length; i++) {
      const char = remaining[i];
      if (char === '(' || char === '[' || char === '{') depth++;
      else if (char === ')' || char === ']' || char === '}') depth--;
      else if (char === ';' && depth === 0) {
        endIndex += i + 1;
        break;
      }
    }
    codeBlock = codeStart.slice(0, endIndex);
    return { codeBlock: truncateCodeBlock(codeBlock), elementName };
  }

  // Fallback: just take the next few lines
  const lines = codeStart.split('\n').slice(0, 5);
  codeBlock = lines.join('\n');

  // Try to extract a name from the first line
  const nameMatch = codeBlock.match(/(?:class|mixin|extension|enum|void|Future|Stream|int|double|bool|String|dynamic|var|final|const)\s+(\w+)/);
  if (nameMatch) {
    elementName = nameMatch[1];
  }

  return { codeBlock: truncateCodeBlock(codeBlock), elementName };
}

/**
 * Extract content within balanced braces
 */
function extractBalancedBraces(content: string, startIndex: number): string {
  let depth = 0;
  let started = false;
  let result = '';

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    result += char;

    if (char === '{') {
      depth++;
      started = true;
    } else if (char === '}') {
      depth--;
      if (started && depth === 0) {
        break;
      }
    }
  }

  return result;
}

/**
 * Truncate code block if too long
 */
function truncateCodeBlock(code: string, maxLines: number = 15): string {
  const lines = code.split('\n');
  if (lines.length > maxLines) {
    return lines.slice(0, maxLines).join('\n') + '\n  // ... (truncated)';
  }
  return code;
}

/**
 * Get line number for a character index in content
 */
function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

/**
 * Check if a position is inside a comment
 * Handles single-line comments (//, ///) and block comments
 */
function isInsideComment(content: string, index: number): boolean {
  // Check for block comments
  let inBlockComment = false;
  let i = 0;
  while (i < index) {
    if (!inBlockComment && content.slice(i, i + 2) === '/*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (inBlockComment && content.slice(i, i + 2) === '*/') {
      inBlockComment = false;
      i += 2;
      continue;
    }
    i++;
  }
  if (inBlockComment) {
    return true;
  }

  // Check for single-line comments (// or ///)
  // Find the start of the current line
  let lineStart = index;
  while (lineStart > 0 && content[lineStart - 1] !== '\n') {
    lineStart--;
  }

  // Check if there's a // before our position on the same line
  const lineBeforeIndex = content.slice(lineStart, index);
  const singleLineCommentMatch = lineBeforeIndex.match(/\/\//);
  if (singleLineCommentMatch) {
    return true;
  }

  return false;
}

/**
 * Parse a single Dart file for @Deadline annotations
 */
export function parseDartFile(filePath: string): ParseResult {
  const result: ParseResult = {
    filePath,
    annotations: [],
    errors: [],
  };

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    result.errors.push(`Failed to read file: ${error}`);
    return result;
  }

  let match: RegExpExecArray | null;
  DEADLINE_PATTERN.lastIndex = 0; // Reset regex state

  while ((match = DEADLINE_PATTERN.exec(content)) !== null) {
    try {
      const annotationContent = match[1];
      const annotationIndex = match.index;
      const annotationEndIndex = annotationIndex + match[0].length;

      // Skip annotations inside comments
      if (isInsideComment(content, annotationIndex)) {
        continue;
      }

      // Parse required parameters
      const yearStr = parseNamedParameter(annotationContent, 'year');
      const monthStr = parseNamedParameter(annotationContent, 'month');
      const dayStr = parseNamedParameter(annotationContent, 'day');

      if (!yearStr || !monthStr || !dayStr) {
        result.errors.push(
          `Invalid @Deadline at line ${getLineNumber(content, annotationIndex)}: missing required date parameters`
        );
        continue;
      }

      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      // Validate date
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        result.errors.push(
          `Invalid @Deadline at line ${getLineNumber(content, annotationIndex)}: invalid date values`
        );
        continue;
      }

      // Parse optional parameters
      const description = parseNamedParameter(annotationContent, 'description');
      const slackMention = parseNamedParameter(annotationContent, 'slackMention');

      // Extract the annotated code block
      const { codeBlock, elementName } = extractCodeBlock(content, annotationEndIndex);

      const annotation: DeadlineAnnotation = {
        filePath,
        lineNumber: getLineNumber(content, annotationIndex),
        year,
        month,
        day,
        description,
        slackMention,
        codeBlock,
        elementName,
        deadlineDate: new Date(year, month - 1, day), // month is 0-indexed in Date
      };

      result.annotations.push(annotation);
    } catch (error) {
      result.errors.push(`Error parsing annotation at index ${match.index}: ${error}`);
    }
  }

  return result;
}

/**
 * Recursively find all Dart files in a directory
 */
export function findDartFiles(directory: string): string[] {
  const dartFiles: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip hidden directories and common non-source directories
      if (entry.isDirectory()) {
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'build' ||
          entry.name === '.dart_tool'
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.dart')) {
        dartFiles.push(fullPath);
      }
    }
  }

  walk(directory);
  return dartFiles;
}

/**
 * Parse all Dart files in a directory
 */
export function parseDirectory(directory: string): ParseResult[] {
  const dartFiles = findDartFiles(directory);
  return dartFiles.map(parseDartFile);
}
