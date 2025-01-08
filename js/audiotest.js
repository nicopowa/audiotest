window.addEventListener("load", () => 
	new AudioTest());

class AudioTest {
	constructor() {
		this.tracks = ["1.mp3", "2.mp3"];
		this.bars = true;

		this.mediaCallback =
		this.audioContext =
		this.audioPlayer =
		this.audioVis =
		this.audioVisContainer =
		this.mainAudio =
		this.streamDestination =
		this.gainNode =
		this.audioSource =
		this.oscillatorGain =
		this.oscillator =
		this.quiet =
		this.player =
		this.controls =
		this.checkOsc =
		this.soundOfSilence =
		this.checkSpectrum =
		this.prevBtn =
		this.playBtn =
		this.nextBtn =
		this.timeElapsed =
		this.timeRemaining =
		this.progress =
		this.progressBar =
		this.trackTitle =
		this.mainCtrl =
		this.timeMain =
		this.playMain =
		null;

		this.wrap = document.getElementById("wrap");

		this.currentTrack = 0;

		this.files = [];

		const liftoff = document.createElement("div");
		liftoff.id = "liftoff";
		liftoff.innerHTML = "click || touch";
		this.wrap.appendChild(liftoff);

		document.body.addEventListener(
			"click",
			() => {
				liftoff.remove();
				this.init();
			},
			{
				once: true,
			}
		);
	}

	async init() {

		this.createAudioContext();

		await this.resumeAudioContext();

		this.createAudioPlayer();

		this.createAudioMain();

		this.createAudioGain();

		this.createAudioSource();

		this.createOscillator();

		this.createSilence();

		this.createUI();

		try {
			await this.initAudioVis();
		}
		catch(err) {
			console.log(err);
			this.bars = false;
		}

		this.connectGraph();

		await this.playAudioMain();

		// setting MediaSession once now works on iOs
		// reset everytime a track starts playing to fix Android MediaSession
		// this.setSession();

		this.mediaCallback = () => 
			this.setSession.bind(this)();

		this.setTrack();
	}

	createAudioContext() {
		if(DEBUG) console.log("create audio context");

		this.audioContext = new (window.AudioContext ||
			window.webkitAudioContext)({
			// sampleRate: 44100,
			// latencyHint: "playback"
		});

		if(DEBUG) console.log("audio context", this.audioContext.sampleRate);
	}

	async resumeAudioContext() {
		if(DEBUG) console.log("resume audio context");

		await this.audioContext.resume();
	}

	createAudioPlayer() {
		this.audioPlayer = new Audio();

		this.audioPlayer.addEventListener("play", () => 
			this.onPlay());
		this.audioPlayer.addEventListener("pause", () => 
			this.onPause());
		this.audioPlayer.addEventListener("timeupdate", () =>
			this.onTimeUpdate()
		);
		this.audioPlayer.addEventListener("ended", () => 
			this.onEnded());
		this.audioPlayer.addEventListener("error", (evt) =>
			this.onAudioError(evt)
		);
	}

	async initAudioVis() {
		this.audioVis = new AudioVis(this.audioContext, this.audioVisContainer);
		await this.audioVis.init();
	}

	createAudioMain() {
		this.mainAudio = new Audio();

		this.mainAudio.addEventListener("play", () => 
			this.onMainPlayPause());
		this.mainAudio.addEventListener("pause", () => 
			this.onMainPlayPause());
		this.mainAudio.addEventListener("timeupdate", () =>
			this.onMainUpdate()
		);

		this.streamDestination =
			this.audioContext.createMediaStreamDestination();

		this.mainAudio.srcObject = this.streamDestination.stream;
	}

	async playAudioMain() {
		await this.mainAudio.play();
	}

	createAudioGain() {
		this.gainNode = this.audioContext.createGain();
	}

	createAudioSource() {
		this.audioSource = this.audioContext.createMediaElementSource(
			this.audioPlayer
		);
	}

	createOscillator() {
		this.oscillatorGain = this.audioContext.createGain();
		this.oscillatorGain.gain.value = 0.2;

		this.oscillator = this.audioContext.createOscillator();
		this.oscillator.type = "sine";
		this.oscillator.frequency.value = 440;

		this.oscillator.connect(this.oscillatorGain);

		this.oscillator.start(0);
	}

	createSilence() {
		const buf = this.audioContext.createBuffer(
				2,
				this.audioContext.sampleRate,
				this.audioContext.sampleRate
			),
			left = buf.getChannelData(0),
			rght = buf.getChannelData(1);

		for(let i = 0; i < this.audioContext.sampleRate; i++) {
			left[i] = 0;
			rght[i] = 0;
		}

		this.quiet = this.audioContext.createBufferSource();

		this.quiet.buffer = buf;

		this.quiet.loop = true;

		this.quiet.start(0);
	}

	connectGraph() {
		this.audioSource.connect(this.gainNode);
		if(this.bars) this.gainNode.connect(this.audioVis.worklet);
		this.gainNode.connect(this.streamDestination);
	}

	createUI() {
		if(this.bars) this.createAudioVis();

		this.player = document.createElement("div");
		this.player.className = "player";
		this.wrap.appendChild(this.player);

		this.createTimeElapsed();
		this.createPrevButton();
		this.createPlayPauseButton();
		this.createNextButton();
		this.createTimeRemaining();
		this.createProgress();
		this.createTrackTitle();

		this.controls = document.createElement("div");
		this.controls.className = "controls";
		this.wrap.appendChild(this.controls);

		this.checkOsc = this.createCheckBtn("beep");
		this.controls.appendChild(this.checkOsc);
		this.checkOsc.addEventListener("change", () => 
			this.toggleOscillator());

		this.soundOfSilence = this.createCheckBtn("quiet");
		this.controls.appendChild(this.soundOfSilence);
		this.soundOfSilence.addEventListener("change", () =>
			this.toggleSilence()
		);

		if(this.bars) {
			this.checkSpectrum = this.createCheckBtn("bars", true);
			this.controls.appendChild(this.checkSpectrum);
			this.checkSpectrum.addEventListener("change", () =>
				this.toggleSpectrum()
			);
		}

		this.createBrowseFiles();

		this.createMainCtrl();
	}

	createPrevButton() {
		const btn = document.createElement("div");
		btn.className = "prev-btn";
		btn.tabIndex = 0;
		btn.innerHTML = `
			<svg viewBox="0 0 24 24" class="previous-icon">
				<path d="M6,3 L6,21 M6,12 L18,3 L18,21 L6,12"/>
			</svg>
		`;
		btn.addEventListener("click", () => 
			this.previousTrack());
		this.player.appendChild(btn);
		this.prevBtn = btn;
	}

	createPlayPauseButton() {
		const btn = this.playPauseButton();
		btn.addEventListener("click", () => 
			this.togglePlayPause());
		this.player.appendChild(btn);
		this.playBtn = btn;
	}

	playPauseButton() {
		const btn = document.createElement("div");
		btn.className = "play-btn";
		btn.setAttribute("data-state", "paused");
		btn.innerHTML = `
			<svg viewBox="0 0 24 24" class="play-icon">
				<polygon points="5,3 19,12 5,21"/>
			</svg>
			<svg viewBox="0 0 24 24" class="pause-icon">
				<line x1="6" y1="3" x2="6" y2="21"/>
				<line x1="18" y1="3" x2="18" y2="21"/>
			</svg>
		`;
		return btn;
	}

	createNextButton() {
		const btn = document.createElement("div");
		btn.className = "next-btn";
		btn.tabIndex = 0;
		btn.innerHTML = `
			<svg viewBox="0 0 24 24" class="next-icon">
				<path d="M18,3 L18,21 M18,12 L6,3 L6,21 L18,12"/>
			</svg>
		`;
		btn.addEventListener("click", () => 
			this.nextTrack());
		this.player.appendChild(btn);
		this.nextBtn = btn;
	}

	createTimeElapsed() {
		this.timeElapsed = document.createElement("div");
		this.timeElapsed.className = "time-elapsed";
		this.timeElapsed.innerHTML = "00:00";
		this.player.appendChild(this.timeElapsed);
	}

	createTimeRemaining() {
		this.timeRemaining = document.createElement("div");
		this.timeRemaining.className = "time-remaining";
		this.timeRemaining.innerHTML = "00:00";
		this.player.appendChild(this.timeRemaining);
	}

	createProgress() {
		this.progress = document.createElement("div");
		this.progress.className = "audio-progress";
		this.wrap.appendChild(this.progress);

		this.progressBar = document.createElement("div");
		this.progressBar.className = "progress-bar";
		this.progress.appendChild(this.progressBar);

		this.progress.addEventListener("click", (e) => {
			const rect = this.progress.getBoundingClientRect();
			const pos = (e.clientX - rect.left) / rect.width;
			this.audioPlayer.currentTime = pos * this.audioPlayer.duration;
		});
	}

	createTrackTitle() {
		this.trackTitle = document.createElement("div");
		this.trackTitle.className = "track-title";
		this.trackTitle.innerText = "—";
		this.wrap.appendChild(this.trackTitle);
	}

	createCheckBtn(what, precheck = false) {
		const lbl = document.createElement("label");
		lbl.classList.add("ezcheck");

		const chk = document.createElement("input");
		chk.type = "checkbox";
		lbl.appendChild(chk);

		if(precheck) chk.checked = true;

		const spn = document.createElement("span");
		spn.innerHTML = what;
		lbl.appendChild(spn);

		return lbl;
	}

	createAudioVis() {
		this.audioVisContainer = document.createElement("div");
		this.audioVisContainer.id = "audiovis";
		this.wrap.appendChild(this.audioVisContainer);
	}

	createBrowseFiles() {
		const browseBtn = document.createElement("span");
		browseBtn.classList.add("btn");
		browseBtn.innerHTML = "browse";

		this.controls.appendChild(browseBtn);

		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = [".mp3", ".flac", ".wav"];
		fileInput.multiple = true;
		fileInput.style.display = "none";

		browseBtn.addEventListener("click", () => 
			fileInput.click());

		fileInput.addEventListener("change", (e) => {
			const files = e.target.files;
			if(files.length < 2) return;

			// Cleanup old URLs
			if(this.files) {
				this.files.forEach((url) => 
					URL.revokeObjectURL(url));
			}

			this.files = [
				URL.createObjectURL(files[0]),
				URL.createObjectURL(files[1]),
			];
			this.tracks = [files[0].name, files[1].name];

			this.currentTrack = 0;

			this.setTrack();
		});

		this.controls.appendChild(fileInput);
	}

	createMainCtrl() {
		this.mainCtrl = document.createElement("div");
		this.mainCtrl.className = "ctrl-main";
		this.wrap.appendChild(this.mainCtrl);

		this.playMain = this.playPauseButton();
		this.mainCtrl.appendChild(this.playMain);
		this.playMain.addEventListener("click", () =>
			this.toggleMainPlayPause()
		);

		this.timeMain = document.createElement("div");
		this.timeMain.className = "time-main";
		this.timeMain.innerHTML = "00:00";
		this.mainCtrl.appendChild(this.timeMain);
	}

	onPlay() {
		this.setState("playing");
		// this.setTime();
		this.syncPlayPause();
	}

	onPause() {
		this.setState("paused");
		// this.setTime();
		this.syncPlayPause();
	}

	syncPlayPause() {
		this.playBtn.setAttribute(
			"data-state",
			this.audioPlayer.paused ? "paused" : "playing"
		);
	}

	onTimeUpdate() {
		const curMs = (this.audioPlayer.currentTime || 0) * 1000,
			rndMs = Math.round(curMs / 1000) * 1000,
			totMs = (this.audioPlayer.duration || 0) * 1000;

		this.progressBar.style.width = `${(curMs / totMs) * 100}%`;

		this.timeElapsed.textContent = this.msToMmSs(rndMs);
		this.timeRemaining.textContent = this.msToMmSs(totMs - rndMs);

		this.setTime();
	}

	onMainPlayPause() {
		this.playMain.setAttribute(
			"data-state",
			this.mainAudio.paused ? "paused" : "playing"
		);
	}

	onMainUpdate() {
		this.timeMain.textContent = this.msToMmSs(
			this.mainAudio.currentTime * 1000
		);
	}

	msToMmSs(ms) {
		return (
			Math.floor(ms / 60000)
			.toFixed(0)
			.padStart(2, "0") +
			":" +
			Math.floor((ms % 60000) / 1000)
			.toFixed(0)
			.padStart(2, "0")
		);
	}

	onEnded() {
		if(DEBUG) console.log("end");

		this.nextTrack();
	}

	onAudioError(evt) {
		console.error("Audio Player Error:", evt);
	}

	async toggleMainPlayPause() {
		try {
			if(this.mainAudio.paused) {
				await this.playAudioMain();
			} else {
				this.mainAudio.pause();
			}
		} catch (err) {
			console.error("main play pause failed:", err);
		}
	}

	async togglePlayPause() {
		try {
			if(this.audioPlayer.paused) {
				this.startPlayback();
			} else {
				this.audioPlayer.pause();
				// this.setState("paused");
			}
		} catch (err) {
			console.error("audio play pause failed:", err);
		}
	}

	async startPlayback() {
		if(this.mainAudio.paused) {
			if(DEBUG) console.log("resume main audio");
			// Chromium pitch glitch again :)
			// await this.playAudioMain();
		}

		await this.audioPlayer.play();
		// this.setState("playing");
	}

	previousTrack() {
		if(DEBUG) console.log("previous track");
		this.offTrack(-1);
	}

	nextTrack() {
		if(DEBUG) console.log("next track");
		this.offTrack(1);
	}

	offTrack(whichWay) {
		this.currentTrack = this.around(
			this.currentTrack + whichWay,
			0,
			this.tracks.length - 1
		);
		this.setTrack();
	}

	around(value, min, max) {
		return value < min ? max : value > max ? min : value;
	}

	clearTrack() {
		if(DEBUG) console.log("clear track");

		// unload the damn track ?
		// this.audioPlayer.currentTime = 0;
		// this.audioPlayer.pause();
		// this.audioPlayer.src = "";
		// this.audioPlayer.load();

		this.audioPlayer.removeEventListener("play", this.mediaCallback, {
			once: true,
		});

		this.resetData();
		this.resetTime();
	}

	tiltBtn(btn) {
		btn.focus();
		setTimeout(() => 
			btn.blur(), 275);
	}

	setSession() {
		this.setAction("play", () => 
			this.togglePlayPause());
		this.setAction("pause", () => 
			this.togglePlayPause());

		this.setAction("previoustrack", () => {
			this.previousTrack();
			this.tiltBtn(this.prevBtn);
		});
		this.setAction("nexttrack", () => {
			this.nextTrack();
			this.tiltBtn(this.nextBtn);
		});

		// this.setAction("seekbackward", () => this.seekBackward());
		// this.setAction("seekforward", () => this.seekForward());

		this.setAction("seekbackward", null);
		this.setAction("seekforward", null);

		this.setAction("seekto", (evt) => 
			this.seekTrack(evt));
	}

	seekBackward(evt) {
		if(DEBUG) console.log("seek backward", evt);
	}

	seekForward(evt) {
		if(DEBUG) console.log("seek forward", evt);
	}

	seekTrack(evt) {
		if(DEBUG) console.log("seekto", evt);

		this.audioPlayer.currentTime = evt["seekTime"];

		// not fixing Android MediaSession visual seek glitch
		// this.setTime();
	}

	setTrack() {
		this.clearTrack();

		const src = this.tracks[this.currentTrack];
		this.trackTitle.innerText = src;

		// Use file URL if available, otherwise use server path
		if(this.files && this.files[this.currentTrack]) {
			this.audioPlayer.src = this.files[this.currentTrack];
		} else {
			this.audioPlayer.src = "tracks/" + src;
		}

		const trk = src.slice(0, src.lastIndexOf("."));

		this.audioPlayer.addEventListener("play", this.mediaCallback, {
			once: true,
		});

		this.startPlayback();

		if("mediaSession" in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: "track " + trk,
				artist: "artist " + trk,
				album: "album " + trk,
				artwork: [96, 128, 192, 256, 384, 512].map((siz) => 
					({
						src: "covers/" + (this.currentTrack + 1) + ".png",
						sizes: siz + "x" + siz,
						type: "image/png",
					})),
			});
		}
	}

	resetData() {
		if("mediaSession" in navigator) {
			navigator.mediaSession.metadata = new MediaMetadata({});
		}
	}

	setState(stt) {
		if("mediaSession" in navigator) {
			navigator.mediaSession.playbackState = stt;
		}
	}

	setTime() {
		if("mediaSession" in navigator) {
			if(this.audioPlayer.duration) {
				navigator.mediaSession.setPositionState({
					position: this.audioPlayer.currentTime,
					duration: this.audioPlayer.duration,
					playbackRate: this.audioPlayer.playbackRate,
				});
			}
		}
	}

	resetTime() {
		if("mediaSession" in navigator) {
			navigator.mediaSession.setPositionState(null);
		}
	}

	setAction(action, callback) {
		if("mediaSession" in navigator) {
			navigator.mediaSession.setActionHandler(action, callback);
		}
	}

	toggleOscillator() {
		if(DEBUG) console.log("toggle oscillator");

		if(!this.checkOsc.firstChild.checked) {
			this.oscillatorGain.disconnect(this.gainNode);
		} else {
			this.oscillatorGain.connect(this.gainNode);
		}
	}

	toggleSilence() {
		if(DEBUG) console.log("toggle silence");

		if(!this.soundOfSilence.firstChild.checked) {
			this.quiet.disconnect(this.gainNode);
		} else {
			this.quiet.connect(this.gainNode);
		}
	}

	toggleSpectrum() {
		if(DEBUG) console.log("toggle spectrum");

		if(!this.checkSpectrum.firstChild.checked) {
			this.gainNode.disconnect(this.audioVis.worklet);
			this.audioVis.targetLevels.fill(0);
		} else {
			this.gainNode.connect(this.audioVis.worklet);
		}
	}
}

class AudioVis {
	constructor(audioContext, container) {
		this.numBars = 24;
		this.spacing = 4;

		this.canvas = document.createElement("canvas");
		this.canvas.width = container.clientWidth;
		this.canvas.height = container.clientHeight;
		container.appendChild(this.canvas);

		this.ctx = this.canvas.getContext("2d", {
			alpha: false,
			desynchronized: true,
		});

		this.audioContext = audioContext;
		this.worklet = null;
		this.levels = new Float32Array(this.numBars)
		.fill(0);
		this.targetLevels = new Float32Array(this.numBars)
		.fill(0);

		const numSpaces = this.levels.length - 1;
		const totalSpacing = numSpaces * this.spacing;
		this.barWidth =
			(container.clientWidth - totalSpacing) / this.levels.length;

		this.animationFrame = null;
		this.lastDrawTime = 0;

		this.barColor = getComputedStyle(document.body)
		.getPropertyValue("--text")
		.trim();

		this.backgroundColor = getComputedStyle(document.body)
		.getPropertyValue("--back")
		.trim();

		window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", ({ matches }) => {
			this.backgroundColor = getComputedStyle(document.body)
			.getPropertyValue("--back")
			.trim();
		});
	}

	async init() {
		try {
			await this.audioContext.audioWorklet.addModule("js/audiovis.js");
			this.worklet = new AudioWorkletNode(this.audioContext, "audiovis");
			this.worklet.port.onmessage = (e) => {
				this.targetLevels = new Float32Array(e.data);
			};
			this.draw(performance.now());
			return this.worklet;
		} catch (error) {
			console.error("Failed to initialize AudioVis:", error);
			this.cleanup();
			throw error;
		}
	}

	draw(timestamp) {
		if(!this.lastDrawTime) this.lastDrawTime = timestamp;
		const deltaTime = (timestamp - this.lastDrawTime) / 1000;
		this.lastDrawTime = timestamp;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.fillStyle = this.backgroundColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.fillStyle = this.barColor;

		for(let i = 0; i < this.levels.length; i++) {
			const diff = this.targetLevels[i] - this.levels[i];
			this.levels[i] += diff * Math.min(deltaTime * 15, 1);

			const height = this.levels[i] * this.canvas.height;
			const x = i * (this.barWidth + this.spacing);
			const y = this.canvas.height - height;

			this.ctx.fillRect(x, y, this.barWidth, height);
		}

		this.animationFrame = requestAnimationFrame((ts) => 
			this.draw(ts));
	}

	cleanup() {
		if(this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
		}
		if(this.worklet) {
			this.worklet.disconnect();
		}
		if(this.canvas && this.canvas.parentNode) {
			this.canvas.parentNode.removeChild(this.canvas);
		}
	}
}
