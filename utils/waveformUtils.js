export function generateWaveformPath(audioBuffer, targetPointCount = 200) {
    console.log(`[Wavetrail Debug] generateWaveformPath: Called. Buffer valid: ${!!audioBuffer}, targetPoints: ${targetPointCount}`);
    if (!audioBuffer || targetPointCount <= 0) {
        console.warn("[Wavetrail Debug] generateWaveformPath: Invalid audioBuffer or targetPointCount <= 0. Returning null.");
        return null;
    }
    try {
        if (audioBuffer.numberOfChannels === 0) {
            console.warn("[Wavetrail Debug] generateWaveformPath: AudioBuffer has 0 channels. Returning null.");
            return null;
        }
        const channelData = audioBuffer.getChannelData(0);
        const totalSamples = channelData.length;
        console.log(`[Wavetrail Debug] generateWaveformPath: totalSamples: ${totalSamples}`);

        if (totalSamples === 0) {
            console.warn("[Wavetrail Debug] generateWaveformPath: AudioBuffer has 0 samples. Returning minimal path.");
            return Array(targetPointCount).fill({ min: 0, max: 0 });
        }

        const points = Math.min(targetPointCount, totalSamples);
        if (points <= 0) {
            console.warn("[Wavetrail Debug] generateWaveformPath: Calculated points <= 0. Returning minimal path.");
            return Array(targetPointCount).fill({ min: 0, max: 0 });
        }

        const waveformPath = [];
        const samplesPerPoint = totalSamples < points ? 1 : Math.floor(totalSamples / points);
        const actualPointsToGenerate = totalSamples < points ? totalSamples : points;

        for (let i = 0; i < actualPointsToGenerate; i++) {
            const chunkStart = (totalSamples < points) ? i : Math.floor(i * (totalSamples / actualPointsToGenerate));
            const chunkEnd = (totalSamples < points) ? (i + 1) : Math.floor((i + 1) * (totalSamples / actualPointsToGenerate));

            let chunkMin = 1.0;
            let chunkMax = -1.0;
            let samplesInThisChunk = 0;
            for (let j = chunkStart; j < chunkEnd && j < totalSamples; j++) {
                const sample = channelData[j];
                if (sample < chunkMin) chunkMin = sample;
                if (sample > chunkMax) chunkMax = sample;
                samplesInThisChunk++;
            }

            if (samplesInThisChunk === 0) {
                const singleSampleIndex = Math.min(chunkStart, totalSamples - 1);
                if (singleSampleIndex >= 0) {
                    chunkMin = channelData[singleSampleIndex] || 0;
                    chunkMax = channelData[singleSampleIndex] || 0;
                } else {
                    chunkMin = 0;
                    chunkMax = 0;
                }
            }
            waveformPath.push({ min: chunkMin, max: chunkMax });
        }

        while (waveformPath.length < targetPointCount && waveformPath.length > 0) {
            waveformPath.push({ ...waveformPath[waveformPath.length - 1] });
        }

        if (waveformPath.length === 0 && targetPointCount > 0) {
            console.warn("[Wavetrail Debug] generateWaveformPath: WaveformPath ended up empty, returning minimal path.");
            return Array(targetPointCount).fill({ min: 0, max: 0 });
        }
        console.log(`[Wavetrail Debug] generateWaveformPath: Generated path with ${waveformPath.length} points.`);
        return waveformPath;
    } catch (error) {
        console.error("[Wavetrail Debug] Error in generateWaveformPath:", error);
        return null;
    }
}
