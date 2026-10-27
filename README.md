# Puhuva kurpitsa – Halloween 2026

Taikapeilin tabletti näyttää Blenderillä tehdyn hehkuvan kurpitsan. Noita (puhelin) soittaa tablettiin, puhe muuttuu kurpitsan ääneksi ja kurpitsan suu liikkuu puheen tahdissa.

- `kurpitsa.html` – avataan **tabletilla** (taikapeilissä)
- `noita.html` – avataan **puhelimella** (kaukosäädin + mikrofoni)
- `index.html` – valintasivu
- `aanitehosteet.js` – äänitehosteet (matala, hirviö, noita, robotti, aave)
- `yhteys.js` – yhteiset asetukset
- `peerjs.min.js` – PeerJS 1.5.4 (WebRTC-yhteys laitteiden välillä)
- `kuvat/suu_0…9.jpg`, `virne_0…4.jpg`, `vino_0…4.jpg` – kurpitsa eri suun asennoissa ja ilmeissä (Blender, `kurpitsa_kuvat.py`)

Molempiin laitteisiin kirjoitetaan sama **huoneen nimi**. Kuva ja ääni kulkevat suoraan laitteiden välillä (salattu WebRTC); PeerJS:n ilmainen palvelin vain esittelee laitteet toisilleen.
