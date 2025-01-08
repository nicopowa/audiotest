class AudioVis extends AudioWorkletProcessor {
	constructor() {
		super();
		this.bufferSize = 2048;
		this.numBars = 24;
		this.lastUpdate = 0;
		this.smoothing = 0.85;
		this.levels = new Float32Array(this.numBars).fill(0);
	}

	process(inputs) {
		const input = inputs[0];
		if (!input || !input.length) return true;

		const channelData = input[0];
		
		this.lastUpdate++;
		if (this.lastUpdate < 3) return true;
		this.lastUpdate = 0;

		const chunkSize = Math.floor(channelData.length / this.numBars);
		
		for (let i = 0; i < this.numBars; i++) {
			let sum = 0;
			const start = i * chunkSize;
			const end = start + chunkSize;
			
			for (let j = start; j < end; j++) {
				const sample = channelData[j];
				sum += sample * sample;
			}
			
			const rms = Math.sqrt(sum / chunkSize);
			const normalized = Math.min(1, rms * 3.33);
			
			// Smoother transitions
			this.levels[i] = this.levels[i] * this.smoothing + 
							normalized * (1 - this.smoothing);
		}

		this.port.postMessage(this.levels);
		return true;
	}
}

registerProcessor('audiovis', AudioVis);