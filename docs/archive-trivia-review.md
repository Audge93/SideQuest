# Play Disney Parks trivia archive review

Reviewed October 8, 2026 from the user-supplied `PlayDisneyParks-trivia.zip`. The initial scan below predates the two-question pilot described at the end. This is a structural review and comparison, not a full factual audit.

## Contents

- `questions.json`: 2,310 records under `en-US` (the only locale).
- `category.json`: 101 category definitions, with park/land tags and game configuration.
- The ZIP contains JSON only; referenced images are not bundled.
- 1,645 records include a fun fact; 930 reference a question image URL.
- 759 records have the specific `WDWpark` tag. Other WDW and land tags also identify relevant content; this tag alone is not a complete park classification.

## Question formats

| Format | Records | Import consideration |
| --- | ---: | --- |
| Text, 4 choices, 1 correct | 1,947 | 1,910 have four nonempty string choices; inspect the other 37 |
| Text, 2 choices, 1 correct | 241 | Requires support for two choices or editorial conversion |
| Text, 4 choices, multiple correct | 89 | Current UI expects one correct index; rewrite or skip |
| Character identification (`whoAmI`) | 14 | Needs images and the appropriate UI |
| Hidden-object puzzles | 7 | Not standard trivia; no question text |
| Ordering puzzles (`sequence`) | 12 | Requires a different interaction |

The 1,910 structurally compatible text records include 803 carrying at least one of the inspected WDW/park/land tags. These are candidates, not the final import count. Image URLs alone do not mean a question depends on an image; many illustrate self-contained text. A narrow wording scan flagged record `1477` for image dependence, but manual review is still needed for others.

## Duplicate comparison

- The existing Side Quest library contains 91 trivia questions.
- No archive question matches an existing description exactly after lowercasing and removing punctuation/whitespace.
- This does not establish semantic uniqueness: questions can ask the same fact with different wording.
- Within the archive, 85 records repeat an earlier normalized question wording. Compare their answers before collapsing them: versions may disagree or refer to changed attractions.
- Example duplicate ID pairs: `2072` / `2754`, `2613` / `2820`, `2730` / `2821`, `1938` / `2839`, `2362` / `2856`.

## Correct-answer positions

Of the 1,910 compatible records, 1,886 put the answer first, 3 second, 2 third, and 19 fourth. Import must shuffle answer/choice pairs together and recompute `triviaAnswer`; importing in source order would make the first choice correct almost every time.

## Recommended import review

1. Preserve source IDs for provenance and assign globally unique Side Quest IDs.
2. Review Disney-wide candidates, including shared Disney/movie trivia; keep location and historical context explicit.
3. Compare facts and correct answers against existing questions, not just wording.
4. Resolve archive duplicates, empty choices, multi-answer formats, and image dependence.
5. Review dated facts and references to retired or changed attractions. Use historical wording where appropriate.
6. Assign Side Quest difficulty and 5/10/15 points rather than copying the archive's score values.
7. Shuffle choices reproducibly, keeping the correct answer attached to its choice.
8. Preserve useful fun facts as post-answer triviaExplanation, after reviewing their accuracy.
9. Follow `docs/content-guide.md` and run content validation, type checking, and phone browser tests after an actual import.

Current static trivia is shared across selected parks. Archive park tags will not automatically enforce park-specific dealing without a store change.

## Follow-up: October 8, 2026

Disney-wide questions are now in scope. Two multi-answer records were adapted as a pilot, bringing the bank to 93 questions. The app now supports multiple correct indexes, optional required-answer counts, and post-answer explanations. Passing reveals the answer until explicit dismissal. The remaining archive records still require individual review; the counts above describe the pre-import scan.

## Bulk import: October 8, 2026

The user-supplied ZIP is now represented by 2,148 preserved questions in the live bank: the two pilot questions plus 2,146 additional text questions. Combined with 91 original questions, this totals 2,239 trivia cards. The importer is `scripts/import-archive-trivia.cjs`; it accepts the ZIP’s extracted `questions.json`. Do not commit the raw input file.

Exclusions from the 2,310 source records: 37 malformed/duplicate choice records, 21 records mentioning Splash Mountain in question/answers/fun fact pending separate historical editing, 66 repeated normalized question wordings, 2 existing pilots, 33 unsupported formats, and 5 all-correct or invalid answer sets. The full ID/reason list is in `archive-import-report.json`.

Two-choice and multiple-correct-answer text questions are supported by the current UI. Choices are deterministically shuffled together with their answer flags. First-person voiced prompts include the named speaker in text. Useful fun facts appear only after an answer or pass. Park/attraction questions are labeled “Disney parks history” and their explanations “Archive-era note”; the imported answer is preserved rather than rewritten into an unverified current claim.

Correction to the initial scan: record 1477 is a self-contained question about a show’s building, not an image-dependent prompt. An image URL alone is not a requirement to see that image. Referenced images are not downloaded or used. The `whoAmI`, `hiddenObject`, and `sequence` source formats remain excluded. The new Who Am I minigame uses original text clues.

This is a structural import with exact-wording deduplication. It is not a full semantic or factual audit of thousands of questions. Content rights and a final editorial review remain release work.
