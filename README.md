# AudioTest

[web audio pitch glitch hunting](https://issues.chromium.org/issues/40160849)

[android media session seeking](https://issues.chromium.org/issues/40287871)


## Testing (bugs incoming :)

### Github Pages

- [This way](https://nicopowa.github.io/audiotest)
- Click browse button
- Select two audio files

### Clone repo

- Copy files to any http server
- Drop two mp3 files into "tracks" directory
- Rename to 1.mp3 and 2.mp3
- Navigate to index.html

### Serverless (desktop only)

- Open index.html or dev.html
- Click browse button
- Select two audio files

## Mobile tests

### iPhone 12 mini iOs 18.2.1

- Native seeking breaks if main audio and (or ?) webaudio not playing when initializing MediaSession.
- Other media controls are not affected
- Start AudioContext and main Audio on first user interaction
- Forcing main audio play() when setting player audio source and play() might break MediaSession
- Main audio currentTime = seconds since phone power on ?!
- Native seek bar shows previous track elapsed time before loading previous / next track
- Must null MediaSession actions seekbackward and seekforward to enable previous / next track buttons
- MediaSession setPositionState might not be needed at all, it just works.

### iPad Pro 2nd Gen iOs 17.7.3

- Glitched x) was fine this morning, oops !
- Sometimes glitch when opening Apple Music during playback
- MediaSession broken, also working earlier today :-D
- Background audio with screen off still works

### Samsung Galaxy S10+ Android 12

- Smooth playback

### Samsung Galaxy Tab S7+ Android 13

- Smooth playback
- Seeking from control center works correctly but visual thumb glitch

## Desktop tests

### Windows 11

- Chromium 131 && 133

	- Programmatically hijacking first click to play main audio then play file triggers pitch glitch
	- Glitch stops after 52 seconds, sometimes comes back about one minute later
		- Why 52 ? tested with different files
		- Manually seeking to 52s won't fix it :-D
	- Once glitch fades away everything works fine, changing audio source, browser focus / blur, ...
	- Oscillator node also affected
	- Sometimes audio drops every ~1200ms when pitch is incorrect
	- Manually pausing and playing main audio makes pitch go back to correct level
	- Tested various timed initialize tricks with no luck

- Brave & Edge (Chromium 131)
	- Smooth playback

## What's next

- Cristal clear audio playback on all browsers and devices
- Seamless mobile background playback
- Robust native media controls and metadata
- iOs accurate FLAC seeking
- Background audio play/pause fade in/out
- Dual Audio swap track crossfade

## Mind blown

Just tested browsing two files from iOs & Android, background audio playing, no pitch change, stable media session.

Useless but impressive :)


![](qrloop.gif)