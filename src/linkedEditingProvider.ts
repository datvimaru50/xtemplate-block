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
    private readonly beginRegex = /<!--\s*BEGIN:\s*([\w\d_-]+)\s*-->/i;
    private readonly endRegex = /<!--\s*END:\s*([\w\d_-]+)\s*-->/i;

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
            return null;
        }

        // Find the matching pair for the current tag
        const matchingTag = this.findMatchingTag(tags, currentTag);
        if (!matchingTag) {
            return null;
        }

        // Create ranges for both the current tag and its matching pair
        const ranges: vscode.Range[] = [
            new vscode.Range(
                currentTag.line,
                currentTag.nameStartCol,
                currentTag.line,
                currentTag.nameEndCol
            ),
            new vscode.Range(
                matchingTag.line,
                matchingTag.nameStartCol,
                matchingTag.line,
                matchingTag.nameEndCol
            )
        ];

        return new vscode.LinkedEditingRanges(ranges);
    }

    /**
     * Parses all BEGIN and END tags in the document.
     * Returns array of ParsedTag objects with position information.
     */
    private parseAllTags(document: vscode.TextDocument): ParsedTag[] {
        const tags: ParsedTag[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;

            // Check for BEGIN tag
            const beginMatch = text.match(this.beginRegex);
            if (beginMatch && beginMatch.index !== undefined) {
                const name = beginMatch[1];
                const tagStart = beginMatch.index;
                const nameStartCol = tagStart + beginMatch[0].indexOf(name);

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
                const name = endMatch[1];
                const tagStart = endMatch.index;
                const nameStartCol = tagStart + endMatch[0].indexOf(name);

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
     * Finds the tag at the given cursor position.
     * Returns the ParsedTag if cursor is within a block name, null otherwise.
     */
    private findTagAtPosition(tags: ParsedTag[], position: vscode.Position): ParsedTag | null {
        for (const tag of tags) {
            if (tag.line === position.line &&
                position.character >= tag.nameStartCol &&
                position.character <= tag.nameEndCol) {
                return tag;
            }
        }
        return null;
    }

    /**
     * Finds the matching BEGIN or END tag for the given tag.
     * Uses stack-based algorithm to handle nested blocks correctly.
     * Performs case-insensitive matching.
     */
    private findMatchingTag(tags: ParsedTag[], currentTag: ParsedTag): ParsedTag | null {
        if (currentTag.type === 'BEGIN') {
            return this.findMatchingEndTag(tags, currentTag);
        } else {
            return this.findMatchingBeginTag(tags, currentTag);
        }
    }

    /**
     * Finds the matching END tag for a given BEGIN tag.
     * Uses stack to handle nested blocks with the same name.
     */
    private findMatchingEndTag(tags: ParsedTag[], beginTag: ParsedTag): ParsedTag | null {
        const stack: string[] = [];
        let foundBegin = false;

        for (const tag of tags) {
            if (tag.line === beginTag.line && tag.type === 'BEGIN' && 
                tag.nameStartCol === beginTag.nameStartCol) {
                foundBegin = true;
                stack.push(tag.name.toLowerCase());
                continue;
            }

            if (!foundBegin) {
                continue;
            }

            if (tag.type === 'BEGIN') {
                stack.push(tag.name.toLowerCase());
            } else if (tag.type === 'END') {
                if (stack.length > 0 && stack[stack.length - 1] === tag.name.toLowerCase()) {
                    stack.pop();
                    if (stack.length === 0) {
                        return tag;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Finds the matching BEGIN tag for a given END tag.
     * Uses stack to handle nested blocks with the same name.
     */
    private findMatchingBeginTag(tags: ParsedTag[], endTag: ParsedTag): ParsedTag | null {
        const stack: string[] = [];
        const beginTags: ParsedTag[] = [];

        for (const tag of tags) {
            if (tag.line === endTag.line && tag.type === 'END' && 
                tag.nameStartCol === endTag.nameStartCol) {
                // Found the END tag, now find its matching BEGIN
                if (stack.length > 0 && stack[stack.length - 1] === tag.name.toLowerCase()) {
                    return beginTags[beginTags.length - 1];
                }
                break;
            }

            if (tag.type === 'BEGIN') {
                stack.push(tag.name.toLowerCase());
                beginTags.push(tag);
            } else if (tag.type === 'END') {
                if (stack.length > 0 && stack[stack.length - 1] === tag.name.toLowerCase()) {
                    stack.pop();
                    beginTags.pop();
                }
            }
        }

        return null;
    }
}
