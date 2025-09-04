function resolveSamplePath(path) {
  if (typeof window !== "undefined" && window.location.protocol !== "file:") {
    const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "/");
    return new URL(path, base).href;
  }
  return new URL(`./public/${path}`, import.meta.url).href;
}

function createSampler(id, url, baseFreq, label, icon, category) {
  return {
    id,
    url,
    baseFreq,
    label,
    icon,
    category,
    buffer: null,
    reversedBuffer: null,
    isLoaded: false,
    loadFailed: false,
  };
}

export const SAMPLER_DEFINITIONS = [
  // Mallets / Keys
  createSampler("marimba", resolveSamplePath("audio/marimba_c3.mp3"), 130.81, "Marimba", "M", "Mallets"),
  createSampler("musicbox", resolveSamplePath("audio/musicbox_c4.mp3"), 261.63, "Music Box", "B", "Mallets"),
  createSampler("xylophone", resolveSamplePath("audio/Xylophone-C6.mp3"), 1046.5, "Xylophone", "M", "Mallets"),
  createSampler("vibraphone", resolveSamplePath("audio/Vibraphone-C5.mp3"), 523.25, "Vibraphone", "M", "Mallets"),
  createSampler("glockenspiel", resolveSamplePath("audio/Glockenspiel-C5.mp3"), 523.25, "Glockenspiel", "B", "Mallets"),
  createSampler("tubular_bell", resolveSamplePath("audio/Tubular-Bell-C6.mp3"), 1046.5, "Tubular Bell", "B", "Bells"),
  createSampler("celesta", resolveSamplePath("audio/Celesta-C4.mp3"), 261.63, "Celesta", "K", "Keys"),
  createSampler("piano", resolveSamplePath("audio/Grand-Piano-C4.mp3"), 261.63, "Piano", "K", "Keys"),
  createSampler("piano_low", resolveSamplePath("audio/Grand-Piano-C1.mp3"), 32.7, "Piano Low", "K", "Keys"),
  createSampler("harpsichord", resolveSamplePath("audio/Harpsichord-C4.mp3"), 261.63, "Harpsichord", "K", "Keys"),
  createSampler("organ", resolveSamplePath("audio/Percussive-Organ-C3.mp3"), 130.81, "Organ", "K", "Keys"),
  createSampler("accordion", resolveSamplePath("audio/Accordion-C4.mp3"), 261.63, "Accordion", "K", "Keys"),

  // Winds
  createSampler("flute", resolveSamplePath("audio/flute_c5.mp3"), 523.25, "Flute", "W", "Winds"),
  createSampler("piccolo", resolveSamplePath("audio/Piccolo-C6.mp3"), 1046.5, "Piccolo", "W", "Winds"),
  createSampler("recorder", resolveSamplePath("audio/Recorder-C6.mp3"), 1046.5, "Recorder", "W", "Winds"),
  createSampler("ocarina", resolveSamplePath("audio/ocarina_c5.mp3"), 523.25, "Ocarina", "W", "Winds"),
  createSampler("pan_flute", resolveSamplePath("audio/Pan-Flute-C5.mp3"), 523.25, "Pan Flute", "W", "Winds"),
  createSampler("shakuhachi", resolveSamplePath("audio/Shakuhachi-C6.mp3"), 1046.5, "Shakuhachi", "W", "Winds"),
  createSampler("alto_sax", resolveSamplePath("audio/Alto-Sax-C5.mp3"), 523.25, "Alto Sax", "W", "Winds"),
  createSampler("tenor_sax", resolveSamplePath("audio/Tenor-Sax-C4.mp3"), 261.63, "Tenor Sax", "W", "Winds"),
  createSampler("soprano_sax", resolveSamplePath("audio/Soprano-Sax-C5.mp3"), 523.25, "Soprano Sax", "W", "Winds"),
  createSampler("english_horn", resolveSamplePath("audio/English-Horn-C5.mp3"), 523.25, "English Horn", "W", "Winds"),
  createSampler("oboe", resolveSamplePath("audio/Oboe-C5.mp3"), 523.25, "Oboe", "W", "Winds"),
  createSampler("bassoon", resolveSamplePath("audio/Bassoon-C4.mp3"), 261.63, "Bassoon", "W", "Winds"),

  // Brass
  createSampler("trumpet_muted", resolveSamplePath("audio/Muted-Trumpet-C5.mp3"), 523.25, "Muted Trumpet", "B", "Brass"),
  createSampler("trombone", resolveSamplePath("audio/Trombone-C5.mp3"), 523.25, "Trombone", "B", "Brass"),
  createSampler("tuba", resolveSamplePath("audio/Tuba-C3.mp3"), 130.81, "Tuba", "B", "Brass"),
  createSampler("french_horn", resolveSamplePath("audio/French-Horn-C4.mp3"), 261.63, "French Horn", "B", "Brass"),

  // Strings
  createSampler("violin", resolveSamplePath("audio/violin_c4.mp3"), 261.63, "Violin", "S", "Strings"),
  createSampler("viola", resolveSamplePath("audio/Viola-C4.mp3"), 261.63, "Viola", "S", "Strings"),
  createSampler("cello", resolveSamplePath("audio/Cello-C3.mp3"), 130.81, "Cello", "S", "Strings"),
  createSampler("contrabass", resolveSamplePath("audio/Contrabass-C2.mp3"), 65.41, "Contrabass", "S", "Strings"),
  createSampler("harp", resolveSamplePath("audio/harp_c3.mp3"), 130.81, "Harp", "S", "Strings"),
  createSampler("acoustic_bass", resolveSamplePath("audio/accoustic_bass_c2.mp3"), 65.41, "Acoustic Bass", "S", "Strings"),
  createSampler("fretless_bass", resolveSamplePath("audio/Fretless-Bass-C3.mp3"), 130.81, "Fretless Bass", "S", "Strings"),
  createSampler("jazz_guitar", resolveSamplePath("audio/Jazz-Guitar-C4.mp3"), 261.63, "Jazz Guitar", "S", "Strings"),
  createSampler("overdrive_guitar", resolveSamplePath("audio/Overdriven-Guitar-C3.mp3"), 130.81, "Overdrive Guitar", "S", "Strings"),
  createSampler("steel_guitar", resolveSamplePath("audio/Steel-String-Guitar-C3.mp3"), 130.81, "Steel Guitar", "S", "Strings"),

  // World / Plucked
  createSampler("biwa", resolveSamplePath("audio/biwa_c4.mp3"), 261.63, "Biwa", "W", "World"),
  createSampler("koto", resolveSamplePath("audio/Koto-C5.mp3"), 523.25, "Koto", "W", "World"),
  createSampler("shamisen", resolveSamplePath("audio/Shamisen-C4.mp3"), 261.63, "Shamisen", "W", "World"),
  createSampler("santur", resolveSamplePath("audio/Korg-M1-Santur-C3.wav"), 130.81, "Santur", "W", "World"),
  createSampler("kalimba", resolveSamplePath("audio/kalimba_c4.mp3"), 261.63, "Kalimba", "W", "World"),
  createSampler("kalim", resolveSamplePath("audio/Yamaha-TG500-FI-Kalim-C5.wav"), 523.25, "Kalim", "W", "World"),
  createSampler("ocarina6", resolveSamplePath("audio/Ocarina-C6.mp3"), 1046.5, "Ocarina C6", "W", "World"),

  // Pads / Leads / Synth
  createSampler("angels", resolveSamplePath("audio/Korg-M1-Angels-C4.wav"), 261.63, "Angels Pad", "P", "Pads"),
  createSampler("pad_ana", resolveSamplePath("audio/Korg-M1-Pad-Ana-C3.wav"), 130.81, "Pad Ana", "P", "Pads"),
  createSampler("bowed_pad", resolveSamplePath("audio/Bowed-Pad-C4.mp3"), 261.63, "Bowed Pad", "P", "Pads"),
  createSampler("new_age_pad", resolveSamplePath("audio/New-Age-Pad-C4.mp3"), 261.63, "New Age Pad", "P", "Pads"),
  createSampler("metallic_pad", resolveSamplePath("audio/Metallic-Pad-C4.mp3"), 261.63, "Metallic Pad", "P", "Pads"),
  createSampler("voice_lead", resolveSamplePath("audio/Voice-Lead-C5.mp3"), 523.25, "Voice Lead", "L", "Leads"),
  createSampler("chiff_lead", resolveSamplePath("audio/Chiff-Lead-C5.mp3"), 523.25, "Chiff Lead", "L", "Leads"),
  createSampler("charang_lead", resolveSamplePath("audio/Charang-Lead-C5.mp3"), 523.25, "Charang Lead", "L", "Leads"),
  createSampler("fifths_lead", resolveSamplePath("audio/Fifths-Lead-C5.mp3"), 523.25, "Fifths Lead", "L", "Leads"),
  createSampler("square_click", resolveSamplePath("audio/Square-Click.mp3"), null, "Square Click", "S", "Synth"),

  // Choir / Voice
  createSampler("choir_aah", resolveSamplePath("audio/Choir-Aah-C5.mp3"), 523.25, "Choir Aah", "V", "Voice"),
  createSampler("choir_pad", resolveSamplePath("audio/Choir-Pad-C5.mp3"), 523.25, "Choir Pad", "V", "Voice"),
  createSampler("nightvox", resolveSamplePath("audio/nightvox_c3.mp3"), 130.81, "Nightvox", "V", "Voice"),

  // Orchestral / Ensemble
  createSampler("string_ensemble", resolveSamplePath("audio/String-Ensemble-C5.mp3"), 523.25, "String Ensemble", "O", "Orchestral"),
  createSampler("orchestra_hit", resolveSamplePath("audio/Orchestra-Hit.mp3"), null, "Orchestra Hit", "O", "Orchestral"),

  // Drums / Percussion
  createSampler("timpani", resolveSamplePath("audio/Timpani.mp3"), null, "Timpani", "D", "Drums"),
  createSampler("bass_drum", resolveSamplePath("audio/Bass-Drum.mp3"), null, "Bass Drum", "D", "Drums"),
  createSampler("bass_drum2", resolveSamplePath("audio/Bass-Drum-2.mp3"), null, "Bass Drum 2", "D", "Drums"),
  createSampler("snare", resolveSamplePath("audio/Snare-Drum.mp3"), null, "Snare", "D", "Drums"),
  createSampler("snare_roll", resolveSamplePath("audio/Snare-Roll.mp3"), null, "Snare Roll", "D", "Drums"),
  createSampler("snare2", resolveSamplePath("audio/Snare-Drum-2.mp3"), null, "Snare 2", "D", "Drums"),
  createSampler("crash_cymbal", resolveSamplePath("audio/Crash-Cymbal.mp3"), null, "Crash Cymbal", "D", "Drums"),
  createSampler("crash_cymbal2", resolveSamplePath("audio/Crash-Cymbal-2.mp3"), null, "Crash Cymbal 2", "D", "Drums"),
  createSampler("splash_cymbal", resolveSamplePath("audio/Splash-Cymbal.mp3"), null, "Splash Cymbal", "D", "Drums"),
  createSampler("ride_cymbal", resolveSamplePath("audio/Ride-Cymbal.mp3"), null, "Ride Cymbal", "D", "Drums"),
  createSampler("ride_cymbal2", resolveSamplePath("audio/Ride-Cymbal-2.mp3"), null, "Ride Cymbal 2", "D", "Drums"),
  createSampler("ride_bell", resolveSamplePath("audio/Ride-Bell.mp3"), null, "Ride Bell", "B", "Drums"),
  createSampler("open_hihat", resolveSamplePath("audio/Open-Hi-Hat.mp3"), null, "Open Hi-Hat", "D", "Drums"),
  createSampler("closed_hihat", resolveSamplePath("audio/Closed-Hi-Hat.mp3"), null, "Closed Hi-Hat", "D", "Drums"),
  createSampler("high_tom", resolveSamplePath("audio/High-Tom.mp3"), null, "High Tom", "D", "Drums"),
  createSampler("mid_tom", resolveSamplePath("audio/Mid-Tom.mp3"), null, "Mid Tom", "D", "Drums"),
  createSampler("low_tom", resolveSamplePath("audio/Low-Tom.mp3"), null, "Low Tom", "D", "Drums"),
  createSampler("high_tom2", resolveSamplePath("audio/High-Tom-2.mp3"), null, "High Tom 2", "D", "Drums"),
  createSampler("mid_tom2", resolveSamplePath("audio/Mid-Tom-2.mp3"), null, "Mid Tom 2", "D", "Drums"),
  createSampler("low_tom2", resolveSamplePath("audio/Low-Tom-2.mp3"), null, "Low Tom 2", "D", "Drums"),
  createSampler("cabasa", resolveSamplePath("audio/Cabasa.mp3"), null, "Cabasa", "P", "Percussion"),
  createSampler("tambourine", resolveSamplePath("audio/Tambourine.mp3"), null, "Tambourine", "P", "Percussion"),
  createSampler("maracas", resolveSamplePath("audio/Maracas.mp3"), null, "Maracas", "P", "Percussion"),
  createSampler("agogo", resolveSamplePath("audio/Agogo-C6.mp3"), 1046.5, "Agogo", "P", "Percussion"),
  createSampler("cowbell", resolveSamplePath("audio/Cowbell.mp3"), null, "Cowbell", "P", "Percussion"),
  createSampler("claves", resolveSamplePath("audio/Claves.mp3"), null, "Claves", "P", "Percussion"),
  createSampler("sticks", resolveSamplePath("audio/Sticks.mp3"), null, "Sticks", "P", "Percussion"),
  createSampler("open_conga", resolveSamplePath("audio/Open-High-Conga.mp3"), null, "Open High Conga", "P", "Percussion"),
  createSampler("low_bongo", resolveSamplePath("audio/Low-Bongo.mp3"), null, "Low Bongo", "P", "Percussion"),
  createSampler("high_bongo", resolveSamplePath("audio/High-Bongo.mp3"), null, "High Bongo", "P", "Percussion"),
  createSampler("open_cuica", resolveSamplePath("audio/Open-Cuica.mp3"), null, "Open Cuica", "P", "Percussion"),
  createSampler("mute_cuica", resolveSamplePath("audio/Mute-Cuica.mp3"), null, "Muted Cuica", "P", "Percussion"),
  createSampler("open_surdo", resolveSamplePath("audio/Open-Surdo.mp3"), null, "Open Surdo", "P", "Percussion"),
  createSampler("mute_surdo", resolveSamplePath("audio/Mute-Surdo.mp3"), null, "Muted Surdo", "P", "Percussion"),
  createSampler("taiko", resolveSamplePath("audio/Taiko-Drum.mp3"), null, "Taiko Drum", "D", "Drums"),
  createSampler("triangle", resolveSamplePath("audio/Jingle-Bell.mp3"), null, "Jingle Bell", "B", "Percussion"),

  // FX / Noise
  createSampler("seashore", resolveSamplePath("audio/Seashore.mp3"), null, "Seashore", "F", "FX"),
  createSampler("gunshot", resolveSamplePath("audio/Gunshot.mp3"), null, "Gunshot", "F", "FX"),
  createSampler("telephone", resolveSamplePath("audio/Telephone-Ring.mp3"), null, "Telephone", "F", "FX"),
  createSampler("echo_fx", resolveSamplePath("audio/Echo-FX-C6.mp3"), 1046.5, "Echo FX", "F", "FX"),
  createSampler("crystal_fx", resolveSamplePath("audio/Crystal-FX-C6.mp3"), 1046.5, "Crystal FX", "F", "FX"),
  createSampler("brightness_fx", resolveSamplePath("audio/Brightness-FX-C5.mp3"), 523.25, "Brightness FX", "F", "FX"),
  createSampler("rain_fx", resolveSamplePath("audio/Rain-FX-C4.mp3"), 261.63, "Rain FX", "F", "FX"),
  createSampler("breath_noise", resolveSamplePath("audio/Breath-Noise.mp3"), null, "Breath Noise", "F", "FX"),
  createSampler("fret_noise", resolveSamplePath("audio/Fret-Noise.mp3"), null, "Fret Noise", "F", "FX"),
  createSampler("reverse_cymbal", resolveSamplePath("audio/Reverse-Cymbal.mp3"), null, "Reverse Cymbal", "F", "FX"),
  createSampler("scratch_push", resolveSamplePath("audio/Scratch-Push.mp3"), null, "Scratch Push", "F", "FX"),
  createSampler("scratch_pull", resolveSamplePath("audio/Scratch-Pull.mp3"), null, "Scratch Pull", "F", "FX"),

  // Additional bells
  createSampler("bellmen", resolveSamplePath("audio/Ensoniq-ZR-76-Bellmen-C4.wav"), 261.63, "Bellmen", "B", "Bells"),
];

// Expose sampler definitions globally for compatibility with modules that
// access them via the `window` object.
if (typeof window !== "undefined") {
  window.SAMPLER_DEFINITIONS = SAMPLER_DEFINITIONS;
}

