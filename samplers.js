function resolveSamplePath(path) {
    if (typeof window !== "undefined" && window.location.protocol !== "file:") {
        const base =
            window.location.origin +
            window.location.pathname.replace(/\/[^\/]*$/, "/");
        return new URL(path, base).href;
    }
    return new URL(`./public/${path}`, import.meta.url).href;
}

function createSampler(id, url, baseFreq, label, icon) {
    return {
        id,
        url,
        baseFreq,
        label,
        icon,
        buffer: null,
        reversedBuffer: null,
        isLoaded: false,
        loadFailed: false,
    };
}

export const SAMPLER_DEFINITIONS = [
    createSampler("marimba", resolveSamplePath("audio/marimba_c3.mp3"), 130.81, "Marimba", "🪵"),
    createSampler("piano", resolveSamplePath("audio/piano_c4.mp3"), 261.63, "Piano", "🎹"),
    createSampler("flute", resolveSamplePath("audio/flute_c5.mp3"), 523.25, "Flute", "🌬️"),
    createSampler("acoustic_bass", resolveSamplePath("audio/accoustic_bass_c2.mp3"), 65.41, "Bass", "🎸"),
    createSampler("biwa", resolveSamplePath("audio/biwa_c4.mp3"), 261.63, "Biwa", "🪕"),
    createSampler("harp", resolveSamplePath("audio/harp_c3.mp3"), 130.81, "Harp", "🎶"),
    createSampler("kalimba", resolveSamplePath("audio/kalimba_c4.mp3"), 261.63, "Kalimba", "✨"),
    createSampler("ocarina", resolveSamplePath("audio/ocarina_c5.mp3"), 523.25, "Ocarina", "🏺"),
    createSampler("harpsilute", resolveSamplePath("audio/harpsilute_c5.mp3"), 523.25, "Harpsilute", "🎼"),
    createSampler("musicbox", resolveSamplePath("audio/musicbox_c4.mp3"), 261.63, "Music Box", "🎁"),
    createSampler("bomtempi", resolveSamplePath("audio/bomtempi_c6.mp3"), 1046.5, "Bomtempi", "🎹"),
    createSampler("harpsicord", resolveSamplePath("audio/harpsicord_c4.mp3"), 261.63, "Harpsicord", "🎶"),
    createSampler("nightvox", resolveSamplePath("audio/nightvox_c3.mp3"), 130.81, "Nightvox", "🎤"),
    createSampler("bellmen", resolveSamplePath("audio/Ensoniq-ZR-76-Bellmen-C4.wav"), 261.63, "Bellmen", "🔔"),
    createSampler("angels", resolveSamplePath("audio/Korg-M1-Angels-C4.wav"), 261.63, "Angels", "👼"),
    createSampler("pad_ana", resolveSamplePath("audio/Korg-M1-Pad-Ana-C3.wav"), 130.81, "Pad Ana", "🎛️"),
    createSampler("santur", resolveSamplePath("audio/Korg-M1-Santur-C3.wav"), 130.81, "Santur", "🪕"),
    createSampler("timpani", resolveSamplePath("audio/Roland-SC-88-Timpani.wav"), 261.63, "Timpani", "🥁"),
    createSampler("kalim", resolveSamplePath("audio/Yamaha-TG500-FI-Kalim-C5.wav"), 523.25, "Kalim", "✨"),
    createSampler("violin", resolveSamplePath("audio/violin_c4.mp3"), 261.63, "Violin", "🎻"),
];

// Expose sampler definitions globally for compatibility with modules that
// access them via the `window` object.
if (typeof window !== "undefined") {
    window.SAMPLER_DEFINITIONS = SAMPLER_DEFINITIONS;
}
