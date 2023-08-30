_Certified fresh 230808 by Graham Johnson._

# Navigating the docs

For a complete list of entries, see our [Table of Contents](_TOC.md)

# Updating the docs: How & when

Whenever a code change PR breaks (or makes obsolete) existing documentation, the relevant entry should be updated. This documentation update should be included within the PR itself, similar to how one would update unit tests alongside a breaking code change.

Similarly, whenever a PR adds codebase functionality where either:

1. accompanying documentation has been explicitly requested 
2. the implementing engineer believes the new functionality will not be easily legible to or extendable by future engineers

...then that PR should include a new documentation entry as part of its purview.

At least for the duration of 2023, as we implement this new system, any PR that updates or contributes to our documentation wiki should tag @gdjohnson (the documentarian) on Github.

# Documentation language

## Must, Should, & May

Per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), the following prescriptive language should be consistently used across documentation in order to specify the strength of given guideliens or requirements:

1. **MUST**: This word, or the term "REQUIRED," conveys that the definition is an absolute requirement of the specification.
2. **MUST NOT**: This phrase conveys that the definition is an absolute prohibition of the specification.
3. **SHOULD**: This word, or the adjective "RECOMMENDED", conveys that there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course.
4. **SHOULD NOT** This phrase, or the phrase "NOT RECOMMENDED" conveys that there may exist valid reasons in particular circumstances when the particular behavior is acceptable or even useful, but the full implications should be understood and the case carefully weighed before implementing any behavior described with this label.
5. **MAY**   This word, or the adjective "OPTIONAL", mean that an item is truly optional. 

# Tracking documentation status

An important part of maintaining a working documentation system involves flagging (1) areas in need of documentation (2) areas whose documentation has gone stale.

For now, the best system is notifying the archivist, Graham Johnson, on Slack or Github (@gdjohnson). Down the line, a more structured system may be worth implementing.

## "Certified fresh" datestamps

Moving forward, our goal is to keep a “Certified fresh” datestamp on all wiki entries. This timestamp is accompanied by an optional note and the name of the certifier. For consistency, dates should take the format YYMMDD.

Example certification:
> _Certified fresh 230731 by Graham Johnson._
> _Note: The optional super-admin steps listed under the "Verifying addresses" sub-section were not re-tested and may be stale._

### What does “Certified fresh” mean operationally?

1. "Certified fresh on X date" means that an engineer or documentarian has successfully tested or followed the entry’s documentation on X date.
2. Successfully acting upon a few tidbits of information on an entry page for development guidance is not sufficient to certify an entry. 
3. "Certified fresh" is a _strong recommendation_ from the certifying team member that the documentation can be faithfully followed.
4. All newly added pages or sections in the wiki should be explicitly certified to the date of their addition, as it is assumed that all new documentation should meet the above criteria (#s 1-3).

### Certification notes & elaboration

Any additional information (e.g. caveats, conditionals, environmental details that might make the certification partial or provisional) should be added as a note under the datestamp.

If only a sub-section can be certified fresh, that section should be explicitly noted. The same is true of any sub-sections that should be excluded from the certification (e.g. that the certifier cannot vouch for, has been unable to test, etc).

Any concerns about future reliability of the entry (e.g. the certifying engineer knows that in a few months, a new technical solution will replace the currently documented solution) should be noted here if possible.

## Certifying: When & how

All certifications (new or updated) should be either (1) submitted in the larger PR in which the documentation entry was certified fresh (2) be opened as a separate PR.

At least for the duration of 2023, as we implement this new system, all certifications and additions to documentation should tag/flag @gdjohnson (the documentarian) on Github
