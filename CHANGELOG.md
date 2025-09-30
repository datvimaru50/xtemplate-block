# Change Log

All notable changes to the "xtemplate-block" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.1.0] - 2025-09-30

### Added
- **Linked Editing**: Automatically sync block name changes between BEGIN and END tags
  - When you edit a block name in `<!-- BEGIN: blockname -->`, the corresponding `<!-- END: blockname -->` is automatically updated, and vice versa
  - Supports nested blocks with correct matching
  - Case-insensitive matching (e.g., `BEGIN: Header` matches `END: header`)
  - Works seamlessly with Undo/Redo
  - Real-time visual feedback with highlighting

### Technical Details
- Implemented `XTemplateLinkedEditingProvider` using VS Code's built-in `LinkedEditingRangeProvider` API
- Stack-based algorithm for accurate BEGIN-END pair matching in nested structures
- Consistent regex patterns with existing symbol provider

## [1.0.1] - Previous Release

- Add `copy` button to quickly copy the path of each block.

## [1.0.0] - Initial Release

- Initial release of `xtemplate-block`.
- Added language symbols, folding ranges, and hover-to-see-path ability.