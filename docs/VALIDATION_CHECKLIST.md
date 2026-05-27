# Validation Checklist

This checklist is for manual verification of history management and voice analysis workflows across supported platforms.

## Desktop Chrome

- [ ] Open the app and verify the page loads successfully.
- [ ] Start speech recognition and confirm the microphone flow works.
- [ ] Submit an analysis and verify the result appears in the analysis card.
- [ ] Confirm the new history panel displays the recent entry with timestamp, transcript preview, and score.
- [ ] Delete a single history entry and verify it is removed immediately from the panel.
- [ ] Click `Clear history`, confirm the prompt, and verify all saved history is cleared without page reload.
- [ ] Verify the `Reset session` control starts a new session ID and clears history state while keeping preferences.
- [ ] Refresh the page and verify cleared history remains empty and preferences persist.

## iOS Safari

- [ ] Open the app and confirm the UI is responsive on mobile screen width.
- [ ] Confirm microphone permission prompts appear and speech recognition flows correctly.
- [ ] Validate fallback behavior if speech recognition is unavailable and ensure analysis still works.
- [ ] Confirm history persists across refresh and that the history panel remains stable.
- [ ] Test `Clear history` and ensure the confirmation prompt appears and the UI updates immediately.

## Android Chrome

- [ ] Open the app and confirm speech capture stability with microphone input.
- [ ] Run analysis and verify the result is shown and history is stored locally.
- [ ] Validate the history panel remains usable on a small screen.
- [ ] Check the clear/delete controls and verify immediate UI updates.
- [ ] Refresh and verify persisted history state and empty-state handling.

## Capacitor WebView

- [ ] Launch the app in a Capacitor WebView and confirm the page loads.
- [ ] Validate microphone access behavior in the WebView and confirm speech recognition works if available.
- [ ] Verify TTS playback works and does not block history panel updates.
- [ ] Confirm history persistence and clear/delete operations behave correctly inside the WebView.
- [ ] Verify there is no visible performance degradation or blocking behavior when clearing history.

## Edge cases

- [ ] Verify the history panel handles empty history gracefully.
- [ ] Simulate corrupted localStorage by clearing or editing stored state, then refresh the app.
- [ ] Confirm the app recovers safely and the history panel does not crash.
- [ ] Verify partial deletion failures do not leave stale entries visible.
- [ ] Confirm speech sessions can be interrupted and the history UI remains stable.
