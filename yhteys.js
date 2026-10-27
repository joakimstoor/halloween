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

  function peerAsetukset() {
    const p = params.get('palvelin');
    const ice = { iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
        username: 'peerjs', credential: 'peerjsp' }
    ] };
    if (!p) return { debug: 1, config: ice };
    const [host, port] = p.split(':');
    return { host, port: Number(port || 9000), path: '/', secure: location.protocol === 'https:' && !/^(localhost|127\.)/.test(host),
             debug: 1, config: { iceServers: [] } };
  }

  window.Yhteys = {
    params, muista, puhdista, peerAsetukset,
    kurpitsaId: huone => 'hw26-' + puhdista(huone) + '-kurpitsa',
    noitaId: huone => 'hw26-' + puhdista(huone) + '-noita-' + Math.random().toString(36).slice(2, 7),
    alkuHuone() { return params.get('huone') || muista('hw26-huone') || ''; }
  };
})();
