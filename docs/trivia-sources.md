# Trivia source notes

Reviewed October 7, 2026. The 16 questions in `PARK_TRIVIA` are original Side Quest questions based on the official pages below, not recovered Play Disney Parks questions. Existing `DISNEY_TRIVIA` has not received a full fact audit.

| ID prefix | Official source | Facts checked |
| --- | --- | --- |
| `tri-mk-jungle-` | [Jungle Cruise](https://disneyworld.disney.go.com/attractions/magic-kingdom/jungle-cruise/) | Boat transport; skipper; Amazon segment; gorillas at the Congo camp |
| `tri-ep-figment-` | [Journey Into Imagination With Figment](https://disneyworld.disney.go.com/attractions/epcot/journey-into-imagination-with-figment/) | Dragon; five senses; chairman Dr. Nigel Channing; actor Eric Idle |
| `tri-hs-mania-` | [Toy Story Mania!](https://disneyworld.disney.go.com/attractions/hollywood-studios/toy-story-mania/) | 3D glasses; five main games; baseballs in the Army Men game; rings in the Buzz game |
| `tri-ak-avatar-` | [Avatar Flight of Passage](https://disneyworld.disney.go.com/attractions/animal-kingdom/avatar-flight-of-passage/) | Mountain banshee; Pandora; moon; bonding as a rite of passage |

Keep new source notes here when extending the library. Recheck descriptions of current attractions after changes. Historical questions should specify their date or original version.

## Preserved multi-answer pilot (October 8, 2026)

Two adapted questions from the user-supplied `PlayDisneyParks-trivia.zip`, English `questions.json`: `rec094iTASP1duciT` (Mickey and Minnie), and `rec18BGqY9HeKOds5` (Plane Crazy, Mickey and Charles Lindbergh). Source IDs are retained in task IDs. Wording was shortened for cards, choices reordered together with answer indexes, and fun facts moved to post-answer explanations. Preservation credit: GooglyBlox, [Play Disney Parks CDN archive](https://archive.notaspider.dev/details/play-disney-parks-cdn). The archive is a provenance record, not evidence of a reuse license.

## Existing question correction

`tri-d-h-5` now asks for the hotel name, rather than incorrectly calling the answer a town. Answer: The Hollywood Tower Hotel. Alternatives changed to hotel names. [Official attraction description](https://disneyworld.disney.go.com/attractions/hollywood-studios/twilight-zone-tower-of-terror/).

## Retired attraction references (October 8, 2026)

The two current-attraction distractors in `tri-d-m-3` and `tri-d-m-7` now use Tiana’s Bayou Adventure. `tri-d-m-19` explicitly asks what Tiana’s Bayou Adventure at Magic Kingdom was called before retheming (Splash Mountain), replacing the ambiguous first-flume-system claim. [Disney’s retheming announcement](https://disneyparksblog.com/dlr/tianas-bayou-adventure-coming-to-disney-parks-in-late-2024/). The live ride metadata already uses Tiana’s Bayou Adventure.

## Attraction catalog corrections and activity expansion

October 8, 2026: removed the erroneous Magic Kingdom Runaway Railway entry (the Florida attraction belongs to [Hollywood Studios](https://disneyparks.disney.go.com/mickey-minnies-runaway-railway/)). Removed DINOSAUR and TriceraTop Spin from the live ride pool following [DinoLand closures](https://disneyparksblog.com/wdw/dinoland-closing-animal-kingdom/). Updated the display names for [Rock ’n’ Roller Coaster Starring The Muppets](https://disneyexperiences.com/disneyworld-press/release/rock-n-roller-coaster-starring-the-muppets-launches-may-26-2026-at-disneys-hollywood-studios/) and [Soarin’ Across America](https://disneyparksblog.com/disney-experiences/soarin-across-america-at-disneyland-and-disney-world/), retaining stable IDs.

New activity instructions are original observation, performance, menu, trading, meet, exploration, and post-ride prompts. Specific availability is not promised. Trading and meets follow attendant guidance; treat observations require no purchase. Ride activities inherit the catalog’s park and height fields.

The 20 Who Am I clue sets are original summaries of familiar Disney/Pixar character stories, not archived clues or film dialogue. They live separately from the trivia cards.
