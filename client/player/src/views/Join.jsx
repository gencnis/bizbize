import { useState } from 'react';

export default function Join({ onCreate, onJoin, error, disabled = false }) {
  const [createName, setCreateName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinName, setJoinName] = useState('');

  return (
    <div className="view join-page">
      <h1 className="join-title">Biz Bize</h1>

      <div className="join-hero card">
        <img src="/assets/saziye-uzatan-bg.png" alt="Şaziye Teyze" className="join-hero-banner" />
        <div className="join-speech-bubble">
          <p className="join-speech-text">
          Hoş geldin canım, ben Şaziye Teyze. Bu akşam ev sahibinizim, buyurun şöyle oturun bakalım. 
          Şimdi kural basit yavrum: Bir kategori seçeceksiniz, sonra da o kategorideki rollerden hangisi grupta en çok kime uyuyor, onu. 
          Aman dikkat! Burada en doğruyu bilen değil, grubu en iyi tanıyan kazanır!
          Bir de hızlı ol ha… çabuk seçersen daha çok puan alırsın.
          Utanma utanma, biz bizeyiz. Kim neciymiş bu akşam ortaya çıkacak zaten.
          E hadi, önce bir oda kur ya da bir odaya katıl.
          </p>
        </div>
      </div>

      <section className="join-section card">
        <div className="join-section-header join-section-header--purple">
          <span className="emoji-spacer">⭐</span>
        Oda Oluştur</div>
        <div className="join-section-body">
          <input
            type="text"
            placeholder="Adın ne?"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <button
            onClick={() => onCreate(createName)}
            disabled={disabled || !createName.trim()}
          >
            Odayı Aç
          </button>
        </div>
      </section>

      <section className="join-section card">
        <div className="join-section-header join-section-header--green">
          <span className="emoji-spacer">📍</span>Odaya Katıl
        </div>
        <div className="join-section-body">
          <input
            type="text"
            placeholder="Oda kodu"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
            autoCapitalize="characters"
          />
          <input
            type="text"
            placeholder="Adın ne?"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
          />
          <button
            className="btn-secondary"
            onClick={() => onJoin(roomCode, joinName)}
            disabled={disabled || !roomCode.trim() || !joinName.trim()}
          >
            Katıl
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
