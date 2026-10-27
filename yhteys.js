// Yhteiset asetukset kurpitsa- ja noitasivulle.
// Huone = salainen nimi, jonka molemmat laitteet tietävät. Sama nimi molempiin!
// Testauskäyttöön oman PeerJS-palvelimen voi antaa osoitteessa: ?palvelin=192.168.1.10:9000
(function () {
  const params = new URLSearchParams(location.search);

  function muista(avain, arvo) {
    try { if (arvo === undefined) return localStorage.getItem(avain); localStorage.setItem(avain, arvo); }
    catch (e) { return null; }
  }

  function puhdista(nimi) {
    return (nimi || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  // TURN-varapalvelin (valinnainen). Annetaan kerran osoitteessa, esim.
  // noita.html?turn=global.relay.metered.ca&tu=KÄYTTÄJÄ&tp=SALASANA  -> muistetaan laitteessa.
  function turnPalvelin() {
    const host = params.get('turn') || muista('hw26-turn');
    const u = params.get('tu') || muista('hw26-tu');
    const pw = params.get('tp') || muista('hw26-tp');
    if (params.get('turn')) { muista('hw26-turn', host); muista('hw26-tu', u || ''); muista('hw26-tp', pw || ''); }
    if (!host || host === 'pois') return null;
    return { urls: ['turn:' + host + ':80', 'turn:' + host + ':80?transport=tcp', 'turn:' + host + ':443', 'turns:' + host + ':443?transport=tcp'],
             username: u, credential: pw };
  }

  function peerAsetukset() {
    const p = params.get('palvelin');
    const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
    const t = turnPalvelin(); if (t) servers.push(t);
    const ice = { iceServers: servers };
    if (!p) return { debug: 1, config: ice };
    const [host, port] = p.split(':');
    return { host, port: Number(port || 9000), path: '/', secure: location.protocol === 'https:' && !/^(localhost|127\.)/.test(host),
             debug: 1, config: { iceServers: [] } };
  }

  // Seuraa WebRTC-yhteyden todellista tilaa (new/checking/connected/failed…)
  function seuraaIce(yhteys, cb) {
    let tehty = false;
    const kiinni = () => {
      const pc = yhteys && yhteys.peerConnection;
      if (!pc) return false;
      if (tehty) return true; tehty = true;
      const ilmoita = () => cb(pc.iceConnectionState, pc);
      pc.addEventListener('iceconnectionstatechange', ilmoita);
      ilmoita();
      return true;
    };
    if (!kiinni()) { const a = setInterval(() => { if (kiinni()) clearInterval(a); }, 100); setTimeout(() => clearInterval(a), 10000); }
  }

  window.Yhteys = {
    params, muista, puhdista, peerAsetukset, seuraaIce, onTurn: () => !!turnPalvelin(),
    kurpitsaId: huone => 'hw26-' + puhdista(huone) + '-kurpitsa',
    noitaId: huone => 'hw26-' + puhdista(huone) + '-noita-' + Math.random().toString(36).slice(2, 7),
    alkuHuone() { return params.get('huone') || muista('hw26-huone') || ''; }
  };
})();
