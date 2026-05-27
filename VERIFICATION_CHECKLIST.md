# Frontend Verification Checklist

## Platforms
- Desktop Chrome
- Desktop Edge
- Desktop Safari
- Android Chrome
- iOS Safari
- Capacitor Android WebView

## Common verification items
- [ ] Microphone permissions prompt appears properly
- [ ] Voice recording button is enabled only when supported
- [ ] Speech recognition starts and stops cleanly
- [ ] Typed input can be entered and edited
- [ ] `POST /analyze` request is sent and returns a response
- [ ] Analysis result is rendered and no blank state is shown incorrectly
- [ ] Text-to-speech playback is attempted only if supported
- [ ] Unsupported browser warnings are non-blocking and visible when needed
- [ ] Loading state appears while analysis is in progress
- [ ] Failure messages appear for recognition and API errors
- [ ] Empty transcript is prevented from submitting
- [ ] Layout stays stable at mobile device widths
- [ ] No hydration warnings appear in DevTools
- [ ] Console logs are only informational and do not break the app

## Desktop Chrome
- [ ] Verify microphone permissions are requested once
- [ ] Verify speech recognition result appears in the transcript area
- [ ] Verify analyze request succeeds and response displays
- [ ] Verify TTS playback works if browser speechSynthesis is available

## Desktop Edge
- [ ] Verify microphone support detection is valid
- [ ] Verify speech recognition fallback if required
- [ ] Verify analysis API still works through `POST /analyze`
- [ ] Verify layout and buttons behave correctly

## Desktop Safari
- [ ] Verify recognition support warning is shown when unsupported
- [ ] Verify text input analysis still works
- [ ] Verify speech synthesis support detection and fallback
- [ ] Verify permissions flow is stable on Safari

## Android Chrome
- [ ] Verify microphone permissions and recording flow
- [ ] Verify text input can be used if voice capture is not available
- [ ] Verify analyze request and response handling
- [ ] Verify TTS playback on mobile if available

## iOS Safari
- [ ] Verify voice recording support warning or capture behavior
- [ ] Verify typed analysis still works without voice input
- [ ] Verify audio playback fallback behavior
- [ ] Verify mobile layout and safe viewport spacing

## Capacitor Android WebView
- [ ] Verify app loads in WebView without errors
- [ ] Verify no direct SSR window access fails in the wrapper
- [ ] Verify microphone permission flow in the WebView environment
- [ ] Verify text input and analysis still function
- [ ] Verify no broken browser-specific event registration
