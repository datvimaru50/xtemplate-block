import * as vscode from 'vscode';

/**
 * Represents a parsed XTemplate block tag (BEGIN or END)
 */
interface ParsedTag {
    type: 'BEGIN' | 'END';
    name: string;
    line: number;
    nameStartCol: number;
    nameEndCol: number;
}

/**
 * Provider for linked editing of XTemplate BEGIN-END block pairs.
 * When user edits block name in BEGIN tag, the corresponding END tag is automatically updated, and vice versa.
 */
export class XTemplateLinkedEditingProvider implements vscode.LinkedEditingRangeProvider {
    // Updated regex patterns to support Unicode characters including diacritics, emojis, and various scripts
    // Pattern [^\s-->]* matches any character except whitespace and comment closing sequence
    // This allows Unicode characters while preventing matching beyond the comment boundary
    private readonly beginRegex = /<!--\s*BEGIN:\s*([^\s-->]*)\s*-->/i;
    private readonly endRegex = /<!--\s*END:\s*([^\s-->]*)\s*-->/i;

    /**
     * Provides linked editing ranges for XTemplate block names.
     * Returns ranges for both BEGIN and END tags that should be edited together.
     */
    public provideLinkedEditingRanges(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.LinkedEditingRanges> {
        // Parse all BEGIN and END tags in the document
        const tags = this.parseAllTags(document);

        // Find which tag the cursor is currently in
        const currentTag = this.findTagAtPosition(tags, position);
        if (!currentTag) {
            // Debug: Log when no tag is found at position
            console.log(`[XTemplate] No tag found at position ${position.line}:${position.character}`);
            return null;
        }

        // Debug: Log found tag
        console.log(`[XTemplate] Found tag: ${currentTag.type}:${currentTag.name} at ${currentTag.line}:${currentTag.nameStartCol}-${currentTag.nameEndCol}, cursor at ${position.character}`);

        // Find the matching pair for the current tag
        const matchingTag = this.findMatchingTag(tags, currentTag);
        if (!matchingTag) {
            console.log(`[XTemplate] No matching tag found for ${currentTag.type}:${currentTag.name}`);
            return null;
        }

        // Create ranges for both the current tag and its matching pair
        // Ensure ranges are valid even for empty names or during text editing
        const currentRange = new vscode.Range(
            currentTag.line,
            currentTag.nameStartCol,
            currentTag.line,
            Math.max(currentTag.nameStartCol, currentTag.nameEndCol)
        );

        const matchingRange = new vscode.Range(
            matchingTag.line,
            matchingTag.nameStartCol,
            matchingTag.line,
            Math.max(matchingTag.nameStartCol, matchingTag.nameEndCol)
        );

        const ranges: vscode.Range[] = [currentRange, matchingRange];

        return new vscode.LinkedEditingRanges(ranges);
    }

    /**
     * Parses all BEGIN and END tags in the document.
     * Returns array of ParsedTag objects with position information.
     * Handles Unicode characters correctly and supports empty block names.
     */
    private parseAllTags(document: vscode.TextDocument): ParsedTag[] {
        const tags: ParsedTag[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;

            // Check for BEGIN tag
            const beginMatch = text.match(this.beginRegex);
            if (beginMatch && beginMatch.index !== undefined) {
                const name = beginMatch[1] || ''; // Handle empty names
                const tagStart = beginMatch.index;

                // Calculate position more accurately for Unicode characters
                // For empty names, find position after "BEGIN:" and optional whitespace
                let nameStartCol: number;
                if (name.length === 0) {
                    // Find position after "BEGIN:" and any whitespace
                    const beforeNamePattern = /<!--\s*BEGIN:\s*/i;
                    const beforeMatch = beginMatch[0].match(beforeNamePattern);
                    nameStartCol = tagStart + (beforeMatch ? beforeMatch[0].length : 0);
                } else {
                    // Find the actual position of the name within the matched string
                    const nameIndex = beginMatch[0].indexOf(name);
                    nameStartCol = tagStart + nameIndex;
                }

                tags.push({
                    type: 'BEGIN',
                    name: name,
                    line: line,
                    nameStartCol: nameStartCol,
                    nameEndCol: nameStartCol + name.length
                });
            }

            // Check for END tag
            const endMatch = text.match(this.endRegex);
            if (endMatch && endMatch.index !== undefined) {
                const name = endMatch[1] || ''; // Handle empty names
                const tagStart = endMatch.index;

                // Calculate position more accurately for Unicode characters
                // For empty names, find position after "END:" and optional whitespace
                let nameStartCol: number;
                if (name.length === 0) {
                    // Find position after "END:" and any whitespace
                    const beforeNamePattern = /<!--\s*END:\s*/i;
                    const beforeMatch = endMatch[0].match(beforeNamePattern);
                    nameStartCol = tagStart + (beforeMatch ? beforeMatch[0].length : 0);
                } else {
                    // Find the actual position of the name within the matched string
                    const nameIndex = endMatch[0].indexOf(name);
                    nameStartCol = tagStart + nameIndex;
                }

                tags.push({
                    type: 'END',
                    name: name,
                    line: line,
                    nameStartCol: nameStartCol,
                    nameEndCol: nameStartCol + name.length
                });
            }
        }

        return tags;
    }

    /**
     * Finds the tag at the given cursor position with enhanced detection logic.
     * Uses buffer zone approach to maintain linked editing during character deletion and re-typing.
     *
     * The buffer zone expands detection area around block names to handle cases where:
     * - User deletes characters one by one using backspace
     * - Cursor position may temporarily fall outside exact name boundaries
     * - Empty block names need wider detection area
     */
    private findTagAtPosition(tags: ParsedTag[], position: vscode.Position): ParsedTag | null {
        // Buffer zone: extend detection area by this many characters on each side
        const bufferZone = 3;

        for (const tag of tags) {
            if (tag.line === position.line) {
                if (tag.name.length === 0) {
                    // For empty names: create buffer zone around the position where name should be
                    // This handles cases where user starts typing in an empty block
                    const bufferStart = Math.max(0, tag.nameStartCol - bufferZone);
                    const bufferEnd = tag.nameStartCol + bufferZone;

                    if (position.character >= bufferStart && position.character <= bufferEnd) {
                        return tag;
                    }
                } else {
                    // For non-empty names: extend detection range with buffer zone
                    // This maintains linked editing when deleting characters one by one
                    const bufferStart = Math.max(0, tag.nameStartCol - bufferZone);
                    const bufferEnd = tag.nameEndCol + bufferZone;

                    if (position.character >= bufferStart && position.character <= bufferEnd) {
                        return tag;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Finds the matching BEGIN or END tag for the given tag.
     * Uses position-based matching to handle cases where names are being edited.
     * This approach works even when BEGIN and END tag names don't match during editing.
     */
    private findMatchingTag(tags: ParsedTag[], currentTag: ParsedTag): ParsedTag | null {
        if (currentTag.type === 'BEGIN') {
            return this.findMatchingEndTagByPosition(tags, currentTag);
        } else {
            return this.findMatchingBeginTagByPosition(tags, currentTag);
        }
    }

    /**
     * Finds the matching END tag for a given BEGIN tag using position-based matching.
     * This approach works even when tag names are being edited and don't match.
     * Uses nesting level to find the correct matching END tag.
     */
    private findMatchingEndTagByPosition(tags: ParsedTag[], beginTag: ParsedTag): ParsedTag | null {
        let nestingLevel = 0;
        let foundBegin = false;

        for (const tag of tags) {
            // Find the specific BEGIN tag we're looking for
            if (tag.line === beginTag.line && tag.type === 'BEGIN' &&
                tag.nameStartCol === beginTag.nameStartCol) {
                foundBegin = true;
                nestingLevel = 1;
                continue;
            }

            if (!foundBegin) {
                continue;
            }

            // Count nesting levels based on tag types, regardless of names
            if (tag.type === 'BEGIN') {
                nestingLevel++;
            } else if (tag.type === 'END') {
                nestingLevel--;
                // When we reach nesting level 0, we found our matching END tag
                if (nestingLevel === 0) {
                    return tag;
                }
            }
        }

        return null;
    }

    /**
     * Finds the matching BEGIN tag for a given END tag using position-based matching.
     * This approach works even when tag names are being edited and don't match.
     * Uses nesting level to find the correct matching BEGIN tag.
     */
    private findMatchingBeginTagByPosition(tags: ParsedTag[], endTag: ParsedTag): ParsedTag | null {
        let nestingLevel = 0;
        const beginTags: ParsedTag[] = [];

        for (const tag of tags) {
            // Stop when we reach the END tag we're looking for
            if (tag.line === endTag.line && tag.type === 'END' &&
                tag.nameStartCol === endTag.nameStartCol) {
                // Return the most recent unmatched BEGIN tag
                if (beginTags.length > 0) {
                    return beginTags[beginTags.length - 1];
                }
                break;
            }

            // Track nesting levels based on tag types, regardless of names
            if (tag.type === 'BEGIN') {
                nestingLevel++;
                beginTags.push(tag);
            } else if (tag.type === 'END') {
                nestingLevel--;
                // Remove the most recent BEGIN tag when we find its matching END
                if (beginTags.length > 0) {
                    beginTags.pop();
                }
            }
        }

        return null;
    }
}
