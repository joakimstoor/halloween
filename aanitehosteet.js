// Äänitehosteet Web Audiolla. Käyttö:
//   const fx = Aanitehosteet.luo(ctx);   lähde.connect(fx.sisaan); fx.ulos.connect(ctx.destination);
//   fx.aseta('kurpitsa');
(function () {

  // ---- Sävelkorkeuden muutos ("Jungle"-menetelmä: kaksi liukuvaa viivettä ristiin häivytettynä) ----
  const VIIVE = 0.100, HAIVYTYS = 0.050, PUSKURI = 0.100;

  function haivytysPuskuri(ctx) {
    const sr = ctx.sampleRate, l1 = Math.round(PUSKURI * sr), l2 = Math.round((PUSKURI - 2 * HAIVYTYS) * sr);
    const b = ctx.createBuffer(1, l1 + l2, sr), d = b.getChannelData(0);
    const fl = HAIVYTYS * sr, i1 = fl, i2 = l1 - fl;
    for (let i = 0; i < l1; i++) d[i] = i < i1 ? Math.sqrt(i / fl) : i >= i2 ? Math.sqrt(1 - (i - i2) / fl) : 1;
    return b;
  }
  function viivePuskuri(ctx, ylos) {
    const sr = ctx.sampleRate, l1 = Math.round(PUSKURI * sr), l2 = Math.round((PUSKURI - 2 * HAIVYTYS) * sr);
    const b = ctx.createBuffer(1, l1 + l2, sr), d = b.getChannelData(0);
    for (let i = 0; i < l1; i++) d[i] = ylos ? (l1 - i) / l1 : i / l1;
    return b;
  }

  // kerroin: -1 … 1. Negatiivinen = matalampi ääni. Taajuus muuttuu n. (1 + 0.5 * kerroin) -kertaiseksi.
  function savelSiirto(ctx, kerroin) {
    const sisaan = ctx.createGain(), ulos = ctx.createGain();
    const alas = viivePuskuri(ctx, false), ylos = viivePuskuri(ctx, true), fade = haivytysPuskuri(ctx);
    const lahde = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; };
    const m1 = lahde(alas), m2 = lahde(alas), m3 = lahde(ylos), m4 = lahde(ylos);
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain(), g4 = ctx.createGain();
    const ylosOn = kerroin > 0;
    g1.gain.value = g2.gain.value = ylosOn ? 0 : 1;
    g3.gain.value = g4.gain.value = ylosOn ? 1 : 0;
    m1.connect(g1); m2.connect(g2); m3.connect(g3); m4.connect(g4);
    const mg1 = ctx.createGain(), mg2 = ctx.createGain();
    mg1.gain.value = mg2.gain.value = 0.5 * VIIVE * Math.abs(kerroin);
    g1.connect(mg1); g3.connect(mg1); g2.connect(mg2); g4.connect(mg2);
    const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1);
    d1.delayTime.value = d2.delayTime.value = 0;
    mg1.connect(d1.delayTime); mg2.connect(d2.delayTime);
    const f1 = lahde(fade), f2 = lahde(fade);
    const mix1 = ctx.createGain(), mix2 = ctx.createGain();
    mix1.gain.value = mix2.gain.value = 0;
    f1.connect(mix1.gain); f2.connect(mix2.gain);
    sisaan.connect(d1); sisaan.connect(d2);
    d1.connect(mix1); d2.connect(mix2); mix1.connect(ulos); mix2.connect(ulos);
    const t = ctx.currentTime + 0.05, t2 = t + PUSKURI - HAIVYTYS;
    m1.start(t); m2.start(t2); m3.start(t); m4.start(t2); f1.start(t); f2.start(t2);
    const lahteet = [m1, m2, m3, m4, f1, f2];
    return { sisaan, ulos, pysayta() { lahteet.forEach(s => { try { s.stop(); } catch (e) {} }); } };
  }

  function kaiku(ctx, aika, palaute, marka) {
    const sisaan = ctx.createGain(), ulos = ctx.createGain(), d = ctx.createDelay(2), fb = ctx.createGain(),
          wet = ctx.createGain(), suoda = ctx.createBiquadFilter();
    d.delayTime.value = aika; fb.gain.value = palaute; wet.gain.value = marka;
    suoda.type = 'lowpass'; suoda.frequency.value = 2500;
    sisaan.connect(ulos);
    sisaan.connect(d); d.connect(suoda); suoda.connect(fb); fb.connect(d); suoda.connect(wet); wet.connect(ulos);
    return { sisaan, ulos, pysayta() {} };
  }

  function sarasyys(ctx, maara) {
    const w = ctx.createWaveShaper(), n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + maara) * x / (1 + maara * Math.abs(x)); }
    w.curve = c; w.oversample = '2x';
    return { sisaan: w, ulos: w, pysayta() {} };
  }

  function robotti(ctx, taajuus) {
    const g = ctx.createGain(), osc = ctx.createOscillator();
    g.gain.value = 0; osc.frequency.value = taajuus; osc.connect(g.gain); osc.start();
    const ulos = ctx.createGain(); ulos.gain.value = 1.6; g.connect(ulos);
    return { sisaan: g, ulos, pysayta() { try { osc.stop(); } catch (e) {} } };
  }

  function suodin(ctx, tyyppi, taajuus) {
    const f = ctx.createBiquadFilter(); f.type = tyyppi; f.frequency.value = taajuus;
    return { sisaan: f, ulos: f, pysayta() {} };
  }

  // Tehosteiden reseptit: ketju vasemmalta oikealle
  const TEHOSTEET = {
    normaali: { nimi: 'Normaali', ketju: () => [] },
    kurpitsa: { nimi: 'Kurpitsa (matala)', ketju: c => [savelSiirto(c, -0.35), suodin(c, 'lowpass', 3800), kaiku(c, 0.16, 0.2, 0.25)] },
    hirvio:   { nimi: 'Hirviö (tosi matala)', ketju: c => [savelSiirto(c, -0.7), sarasyys(c, 4), suodin(c, 'lowpass', 2600), kaiku(c, 0.12, 0.15, 0.2)] },
    noita:    { nimi: 'Noita (kimeä)', ketju: c => [savelSiirto(c, 0.5), suodin(c, 'highpass', 250), kaiku(c, 0.2, 0.25, 0.3)] },
    robotti:  { nimi: 'Robotti', ketju: c => [robotti(c, 55), suodin(c, 'highpass', 150)] },
    aave:     { nimi: 'Aave (kaikuva)', ketju: c => [savelSiirto(c, 0.15), suodin(c, 'highpass', 300), kaiku(c, 0.33, 0.55, 0.6)] }
  };

  function luo(ctx) {
    const sisaan = ctx.createGain(), ulos = ctx.createGain();
    let osat = [], nykyinen = null;
    function aseta(nimi) {
      if (!TEHOSTEET[nimi]) nimi = 'kurpitsa';
      sisaan.disconnect();
      osat.forEach(o => { try { o.ulos.disconnect(); } catch (e) {} o.pysayta(); });
      osat = TEHOSTEET[nimi].ketju(ctx);
      let edellinen = sisaan;
      osat.forEach(o => { edellinen.connect(o.sisaan); edellinen = o.ulos; });
      edellinen.connect(ulos);
      nykyinen = nimi;
      return nimi;
    }
    return { sisaan, ulos, aseta, get nykyinen() { return nykyinen; } };
  }

  window.Aanitehosteet = { luo, TEHOSTEET, savelSiirto };
})();
