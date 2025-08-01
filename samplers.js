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
    createSampler("marimba", "audio/marimba_c3.mp3", 130.81, "Marimba", "🪵"),
    createSampler("piano", "audio/piano_c4.mp3", 261.63, "Piano", "🎹"),
    createSampler("flute", "audio/flute_c5.mp3", 523.25, "Flute", "🌬️"),
    createSampler("acoustic_bass", "audio/accoustic_bass_c2.mp3", 65.41, "Bass", "🎸"),
    createSampler("biwa", "audio/biwa_c4.mp3", 261.63, "Biwa", "🪕"),
    createSampler("harp", "audio/harp_c3.mp3", 130.81, "Harp", "🎶"),
    createSampler("kalimba", "audio/kalimba_c4.mp3", 261.63, "Kalimba", "✨"),
    createSampler("ocarina", "audio/ocarina_c5.mp3", 523.25, "Ocarina", "🏺"),
    createSampler("harpsilute", "audio/harpsilute_c5.mp3", 523.25, "Harpsilute", "🎼"),
    createSampler("musicbox", "audio/musicbox_c4.mp3", 261.63, "Music Box", "🎁"),
    createSampler("bomtempi", "audio/bomtempi_c6.mp3", 1046.5, "Bomtempi", "🎹"),
    createSampler("harpsicord", "audio/harpsicord_c4.mp3", 261.63, "Harpsicord", "🎶"),
    createSampler("nightvox", "audio/nightvox_c3.mp3", 130.81, "Nightvox", "🎤"),
    createSampler("bellmen", "audio/Ensoniq-ZR-76-Bellmen-C4.wav", 261.63, "Bellmen", "🔔"),
    createSampler("angels", "audio/Korg-M1-Angels-C4.wav", 261.63, "Angels", "👼"),
    createSampler("pad_ana", "audio/Korg-M1-Pad-Ana-C3.wav", 130.81, "Pad Ana", "🎛️"),
    createSampler("santur", "audio/Korg-M1-Santur-C3.wav", 130.81, "Santur", "🪕"),
    createSampler("timpani", "audio/Roland-SC-88-Timpani.wav", 261.63, "Timpani", "🥁"),
    createSampler("kalim", "audio/Yamaha-TG500-FI-Kalim-C5.wav", 523.25, "Kalim", "✨"),
    createSampler("violin", "audio/violin_c4.mp3", 261.63, "Violin", "🎻"),
];
