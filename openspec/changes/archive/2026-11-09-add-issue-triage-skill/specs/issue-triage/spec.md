# Spec Delta

## Purpose

Enables AI coding agents to perform tool-agnostic issue triage by ingesting tickets from multiple trackers (Linear, GitHub, GitLab, or manual input), analyzing local codebase context, refining unstructured notes, preserving planning metadata, and updating issue descriptions with standardized specifications ready for OpenSpec.

## ADDED Requirements

### Requirement: Multi-Provider Ticket Ingestion
The skill MUST ingest issue details (identifier, title, existing description/body, and status) from the designated tracker provider using Linear MCP/CLI, GitHub CLI (`gh`), GitLab CLI (`glab`), or direct user prompt.

#### Scenario: Ingest issue from Linear
- **WHEN** user provides a Linear issue key (e.g., `ENG-104`)
- **THEN** system fetches the title and body via Linear MCP or CLI tools

#### Scenario: Ingest issue from GitHub
- **WHEN** user provides a GitHub issue number (e.g., `#42`) or issue URL
- **THEN** system fetches the title and body via GitHub CLI (`gh issue view`)

#### Scenario: Ingest issue from manual text
- **WHEN** user provides raw issue text or unsupported tracker input
- **THEN** system accepts the title and description directly from the conversation prompt

### Requirement: Read-Only Codebase Context Discovery
The skill MUST inspect relevant repository files, modules, and architecture patterns matching the issue topic to identify affected layers without modifying code.

#### Scenario: Exploration of impacted repo modules
- **WHEN** an issue topic indicates specific system layers or modules
- **THEN** the system searches and inspects related repository paths and documents discovered components

### Requirement: Unstructured Notes Parsing and Preservation
The skill MUST extract architectural constraints and business rules from informal notes while strictly preserving all planning metadata such as estimates, phases, and target dates.

#### Scenario: Processing raw brain dump notes
- **WHEN** an issue contains unstructured prose with technical constraints and timeline estimates
- **THEN** the system categorizes the constraints into dedicated sections and retains all original estimation and schedule metadata

### Requirement: Structured Specification Formulation
The skill MUST format the enriched content into a standardized markdown structure compatible with OpenSpec proposal and specification formats.

#### Scenario: Generating structured triage draft
- **WHEN** codebase context, requirements, and metadata are consolidated
- **THEN** the system generates a draft containing Objective, Architectural Constraints, Business Rules, Codebase Context, Scope, Metadata, and Open Questions

### Requirement: Interactive Review Gate
The skill MUST present the structured markdown draft in the conversational interface and await user confirmation before modifying the upstream tracker.

#### Scenario: User approval before persistence
- **WHEN** the triage draft is formulated
- **THEN** the system displays the full draft to the user and asks for confirmation before updating any remote issue

### Requirement: Upstream Issue Persistence
The skill MUST update the issue description or body in the source provider upon user approval, or output the markdown for manual placement.

#### Scenario: Updating Linear issue
- **WHEN** the user confirms a Linear issue draft
- **THEN** the system updates the issue description field using Linear MCP or CLI

#### Scenario: Updating GitHub issue
- **WHEN** the user confirms a GitHub issue draft
- **THEN** the system updates the issue body using `gh issue edit --body`

#### Scenario: Manual fallback output
- **WHEN** no CLI or MCP is configured for the target tracker
- **THEN** the system outputs the finalized markdown block ready for copy-paste
