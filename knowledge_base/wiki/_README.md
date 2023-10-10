**Contents**
- [Navigating The Docs](#navigating-the-docs)
- [Updating The Docs: How & When](#updating-the-docs-how--when)
    * [Documentation Language](#documentation-language)
        + [Indexicality & Timestamps](#indexicality--timestamps)
        + [Must, Should, & May](#must-should--may)
- [Tracking Documentation Status](#tracking-documentation-status)
    * [Change Logs](#change-logs)
        + [Example Change Log](#example-change-log)
        + [Change Log Keyphrases](#change-log-keyphrases)
          - [Authored By](#authored-by)
          - [Certified Fresh By](#certified-by)
          - [Flagged By](#flagged-by)
          - [Merged By](#merged-by)
          - [Split Off By](#split-off-by)
          - [Updated By](#updated-by)
- [Change Log](#change-log)

# Navigating the docs

For a complete list of knowledge base entries, see our [Table of Contents](_TOC.md)

# Updating The Docs: How & When

Whenever engineering work makes existing documentation obsolete, relevant entries should be updated. This documentation update should be included within the PR itself, similar to how one would update unit tests alongside a breaking code change.

Similarly, whenever a PR introduces new codebase functionality where either...

1. accompanying documentation has been explicitly requested
2. the implementing engineer believes the new functionality will not be easily comprehensible future engineers

...then that PR should include documentation as part of its purview.

Significant updates to knowledge base entries should be manually listed in a given entry's change log; see the [Change Log](#change-log) sub-entry for guidelines and context. All entries should follow the [Documentation Language](#documentation-language) guidelines.

At least for the duration of 2023, as we implement this new system, any PR that updates or contributes to our knowledge base should tag @gdjohnson (the documentarian) on GitHub.

## Documentation Language

### Indexicality & Timestamps

Language is "indexical" insofar as it relies on inferred context to be understood. For instance, in our knowledge base, words like "I," "you," "now," and "soon" are indexical insofar as they rely on a context, known to the contributor at time of writing, that will likely be lost to future readers.

In place of pronouns, documentation should be written with proper names and nouns. Moreover, it is preferable to name _teams_ rather than individuals, since individuals may be replaced or change over time.

References to places and times (e.g. "now," "soon," "recently," "historically") should be explicitly contextualized with dates whenever possible (e.g. "As of 230831..."). Dates across our knowledge base and codebase should be structured YYMMDD, e.g. 230831 for August 31st, 2023.  

### Must, Should, & May

Per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), the following prescriptive language should be consistently used across documentation in order to specify the strength of given guideliens or requirements:

1. **MUST**: This word, or the term "REQUIRED," conveys that the definition is an absolute requirement of the specification.
2. **MUST NOT**: This phrase conveys that the definition is an absolute prohibition of the specification.
3. **SHOULD**: This word, or the adjective "RECOMMENDED", conveys that there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course.
4. **SHOULD NOT**: This phrase, or the phrase "NOT RECOMMENDED" conveys that there may exist valid reasons in particular circumstances when the particular behavior is acceptable or even useful, but the full implications should be understood and the case carefully weighed before implementing any behavior described with this label.
5. **MAY**: This word, or the adjective "OPTIONAL", mean that an item is truly optional. 

# Tracking Documentation Status

An important part of maintaining a working documentation system involves flagging (1) areas in need of documentation (2) areas whose documentation has gone stale.

As of 230901, the best system for flagging stale and missing documentation is by either (1) notifying the archivist, Graham Johnson, on Slack or Github (@gdjohnson), or (2) adding to our [documentation wishlist](./_Wishlist.md). Down the line, a more structured system may be needed.

## Change Logs

Our git history has been frequently compromised across the history of the codebase, and is not fully reliable. Moreover, git history omits documentation audits and conflates minor local changes with noteworthy, page-wide updates.

In order to track the history and status of documentation (e.g. to determine whether an entry is "fresh" or "stale"), we're introducing manual change logs. Change logs must be placed at the bottom of each entry, under an H1 header. Change logs should record the following actions:
- Page authorship (using the keyphrase "Authored by")
- Significant rewrites, either of the entire entry, or dedicated sections (using the keyphrase "Updated by")
- Merges and branchings (using the keyphrases "Merged by," "Split off by")
- Audits and certifications (using the keyphrase "Certified fresh by")
- Flagging sections as incomplete, unclear, misleading, or out of date (using the keyphrase "Flagged by")

Change log entries should center around one of the default change log keyphrases, [listed below](#change-log-keyphrases). They should include additional useful context, including any relevant PRs, and must name the individual responsible for the action as well as the date the action occurred. 

The change log should often be the first section of a knowledge base entry checked. Is the entry out of date? Has it been flagged for an overhaul? One goal of change logs is to prevent engineers from wasting time implementing obsolete documentation. A second goal is to ensure engineers, when assigned work in novel areas of the codebase, can be guaranteed adequate documentation for onboarding into that area.

### Example Change Log

```md
# Change Log

- 230606: Updated and certified fresh by Jane Doe, in light of API changes (#3150). 
- 230403: Flagged by John Smith; will likely fall out of date with upcoming API changes.
- 221201: Certified fresh by Jane Doe.
- 220507: Authored by John Smith (#2350).
```

### Change Log keyphrases

#### Authored By

The author responsible for creating the entry. Since new knowledge base entries should only be created ~fully formed (i.e. no stubs or placeholders), the author will in most cases also be the individual with most knowledge of the area affected, or who is taking on some level of responsibility for the page's content. 

Ideally, all newly authored documentation should also be [certified fresh](#certified-fresh), and authorship on a given date should be assumed to be synonymous with certification on that date. However, as of 230901, we should specifically include the "certified fresh" keyphrase alongside the "authored by" entry, to guarantee this standard of quality.

#### Certified Fresh By

When a contributor certifies an entry as fresh, he is attesting that he has successfully tested, or else followed (implemented, executed), the entry on a given date. For non-codebase process documentation (e.g. [Ways of Working](./Ways-Of-Working.md)), an entry is certified fresh when an authorized individual (typically a lead) has reviewed and signed off on an entry's guidelines.

All newly added pages or sections in the knowledge base should be explicitly certified to the date of their addition, as it is assumed that all new documentation meets the above criteria.

A contributor may certify either a full entry, or a section of that entry, as fresh. But it is important not to certify a wider scope than has been actually verified as accurate. Certification is meant to be a strong signal to engineers, in using documentation, that the documentation can be relied upon as up-to-date and accurate. Dilution of the certification system is more harmful than a lack of certification. 

The other purpose of certification is to provide an additional contact, so that users of the documentation can reach out with questions or  comments. (Authors are typically assumed to be the primary contact for entries.)

#### Flagged By

If an engineer is using or auditing the docs, and notices an incomplete, out-of-date, or misleading entry, this should be explicitly flagged. 

Any concerns about future reliability of the entry (e.g. an engineer knows that in a few months, a new technical solution will replace the currently documented solution) should be noted here whenever possible. 

The goal of the "Flagged by" keyphrase is to raise awareness of areas of the knowledge base need attention, and to prevent future engineers from implementing misleading or out-of-date instructions.

#### Merged By

If pages are merged together, this should be noted in the change log of the merged-into page, and a compressive summary of the merged page should be provided below.

#### Split Off By

If a section is moved out of one entry and into another, this should be listed explicitly in the change logs, so that engineers who have come to rely on the section's previous location are able to find it.

#### Updated By

Used for all significant updates or changes of note. This helps flag, for engineers who may have recently used a docs entry, that some load-bearing aspect of documentation has changed.

# Change Log

- 230831: Updated and certified fresh by Graham Johnson (#4941).
- 230808: Authored by Graham Johnson.