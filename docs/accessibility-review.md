# Accessibility release checks

Implemented October 9, 2026: device-aware reduced motion, larger reading text, readable font, higher contrast, reviewed activity preferences, button alternatives to hand swiping, scrollable full-card reading, answer labels and announcements, help, public report drafts, privacy information, and confirmed local-data deletion.

Automated web checks cover 390×844 and 375×667 screens, preference persistence, navigation, full reading views, filters, drafts, and deletion. Rule checks cover full initial/refill boards in all four parks and rejection of incompatible filter/category combinations. These checks do not establish WCAG conformance or verify native assistive technology.

Before an App Store release, test an installed build with:

- VoiceOver and TalkBack: navigate the hand, open/close dialogs, hear correct answers, choose multiple answers, use 50/50, and play both minigames. Check focus returns to useful controls and the timer does not repeatedly interrupt reading.
- The largest OS text settings and display zoom: ensure full instructions remain scrollable and primary actions stay reachable.
- Reduce Motion enabled on the device before launch and changed during play: check dealing, drafting, score changes, rewards, navigation, and splash effects.
- Higher Contrast in both themes: check question/answer text, disabled/selected states, keyboard focus, and outdoor readability.
- Keyboard and switch control: browse cards with buttons, complete/pass a card, draft a replacement, and dismiss answers without a swipe.
- Activity preferences together and with category toggles: verify the activity suits the player's needs. These preferences do not certify routes or attraction access.

References: [React Native accessibility](https://reactnative.dev/docs/accessibility), [device accessibility preferences](https://reactnative.dev/docs/accessibilityinfo), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/). The timed Sprint remains a timed game; no untimed practice mode was added.
