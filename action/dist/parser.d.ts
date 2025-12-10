import { ParseResult } from './types';
/**
 * Parse a single Dart file for @Deadline annotations
 */
export declare function parseDartFile(filePath: string): ParseResult;
/**
 * Recursively find all Dart files in a directory
 */
export declare function findDartFiles(directory: string): string[];
/**
 * Parse all Dart files in a directory
 */
export declare function parseDirectory(directory: string): ParseResult[];
