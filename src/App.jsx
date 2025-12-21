import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- ASSETS & DATA CONFIG ---
const ITEMS = [
  {
    id: 'photo1',
    type: 'video',
    title: 'Memory Lane',
    subtitle: 'Philippines',
    desc: 'Remembering the good old days back home. The laughter, the family gatherings, and the warm breeze of the province.',
    thumbnail: '/pic1.jpg', // Ensure this exists in public folder
    contentUrl: '/video1.mp4',
    color: '#ff88cc'
  },
  {
    id: 'cake',
    type: 'video',
    title: 'Make a Wish!',
    subtitle: 'Birthday Messages',
    desc: 'Blow out the candles and make a wish, Norvin! May this year bring you closer to all your dreams.',
    // Using a reliable emoji image source
    thumbnail: 'https://img.icons8.com/fluency/96/000000/gift.png',
    contentUrl: '/video4.mp4', 
    color: '#ffd700'
  },
  {
    id: 'gift',
    type: 'iframe',
    title: 'The Birthday Event',
    subtitle: 'Watch Highlights',
    desc: 'A special video compilation from the celebration. Click play to relive the moments!',
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/4213/4213958.png',
    // Example YouTube embed link (Ensure it is /embed/ ID)
    contentUrl: 'https://www.youtube.com/embed/vrxuk3QywF4', 
    color: '#ff5e5e'
  },
  {
    id: 'photo2',
    type: 'video',
    title: 'New Adventures',
    subtitle: 'USA',
    desc: 'To many more trips, new cities, and memories abroad! Keep exploring.',
    thumbnail: '/pic2.jpg', // Ensure this exists in public folder
    contentUrl: '/video02.mp4',
    color: '#00ffff'
  }
]

// --- COMPONENT: Background Music ---
const BackgroundMusic = ({ play }) => {
  const audioRef = useRef()
  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.volume = 0.4
      audioRef.current.play().catch(e => console.log("Audio interaction needed"))
    }
  }, [play])
  return <audio ref={audioRef} src="/bgm.mp3" loop />
}

// --- COMPONENT: 2D Fireworks Canvas ---
const FireworksCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    let particles = []

    const createFirework = (x, y, color) => {
      const particleCount = 40
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount
        const velocity = 2 + Math.random() * 3
        particles.push({
          x, y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: color,
          alpha: 1,
          decay: 0.01 + Math.random() * 0.02
        })
      }
    }

    const timer = setInterval(() => {
      const colors = ['#ff0055', '#00ddff', '#ffcc00', '#00ff55']
      createFirework(
        Math.random() * width, 
        Math.random() * height * 0.6, 
        colors[Math.floor(Math.random() * colors.length)]
      )
    }, 1200)

    const animate = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.alpha -= p.decay
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        if (p.alpha <= 0) particles.splice(index, 1)
      })
      requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(timer)
    }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />
}

// --- COMPONENT: Welcome Screen ---
const WelcomeScreen = ({ onStart }) => (
  <motion.div 
    initial={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }}
    style={{
      position: 'fixed', inset: 0, background: '#050505', zIndex: 500,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center', padding: '20px'
    }}
  >
    <motion.h1 
      animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '1rem', color: '#ffcc00' }}
    >
      🎉 Happy Birthday!
    </motion.h1>
    <p style={{ color: '#aaa', marginBottom: '2rem', fontSize: '1.1rem' }}>A celebration for Nurse Norvin</p>
    <button 
      onClick={onStart}
      style={{
        padding: '15px 50px', borderRadius: '30px', border: 'none',
        background: 'linear-gradient(45deg, #ff00cc, #3333ff)', color: 'white',
        fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
        boxShadow: '0 5px 15px rgba(255, 0, 204, 0.4)'
      }}
    >
      Enter Celebration
    </button>
  </motion.div>
)

// --- MAIN APP COMPONENT ---
export default function App() {
  const [started, setStarted] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Find data of selected item
  const selectedItem = ITEMS.find(item => item.id === selectedId)

  return (
    <>
      <BackgroundMusic play={started} />

      {/* BACKGROUND GRADIENT */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)', zIndex: -1 }} />
      <FireworksCanvas />

      <AnimatePresence>
        {!started && <WelcomeScreen onStart={() => setStarted(true)} />}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <AnimatePresence>
        {started && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            style={{ 
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              overflowY: 'auto', overflowX: 'hidden', padding: '40px 20px'
            }}
          >
            <h1 style={{ 
              color: 'white', fontFamily: 'sans-serif', marginBottom: '40px', 
              textShadow: '0 0 10px #00ffff', textAlign: 'center',
              fontSize: 'clamp(1.5rem, 5vw, 3rem)'
            }}>
              HAPPY BIRTHDAY NORVIN!
            </h1>

            {/* RESPONSIVE CARD GRID */}
            <div style={{ 
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', 
              gap: '20px', width: '100%', maxWidth: '1000px', paddingBottom: '50px'
            }}>
              {ITEMS.map((item) => (
                <motion.div
                  layoutId={item.id} 
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: '1 1 150px', 
                    maxWidth: '260px',
                    aspectRatio: '3/4', 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', // More padding
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: item.color }} />
                  
                  {/* BIGGER THUMBNAILS */}
                  <motion.img 
                    src={item.thumbnail} 
                    alt={item.title}
                    style={{ 
                      width: item.type === 'image' ? '100%' : '100px', // Bigger icons
                      height: item.type === 'image' ? '65%' : '100px', // Bigger height
                      objectFit: 'cover', borderRadius: '10px', marginBottom: '20px' 
                    }} 
                  />
                  
                  <motion.h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', textAlign: 'center' }}>{item.title}</motion.h3>
                  <motion.p style={{ color: '#aaa', margin: '5px 0 0 0', fontSize: '0.85rem', textAlign: 'center' }}>{item.subtitle}</motion.p>
                </motion.div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', color: '#555', fontSize: '0.8rem', paddingBottom: '20px' }}>
                &copy; Crafted by Romark Bayan
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE MODAL (EXPANDED VIEW) */}
      <AnimatePresence>
        {selectedId && selectedItem && (
          <div 
            style={{ 
              position: 'fixed', inset: 0, zIndex: 100, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}
            />

            {/* Modal Content */}
            <motion.div
              layoutId={selectedId}
              style={{
                width: '100%', maxWidth: '700px', 
                maxHeight: '85vh', 
                background: '#1a1a1a',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                style={{
                  position: 'absolute', top: '15px', right: '15px', zIndex: 20,
                  background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', color: 'white', fontSize: '1.2rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>

              <div style={{ flex: '1', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '250px' }}>
                {selectedItem.type === 'image' && (
                  <motion.img 
                    src={selectedItem.contentUrl} 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '50vh' }}
                  />
                )}

                {selectedItem.type === 'video' && (
                   <video 
                     src={selectedItem.contentUrl} 
                     controls autoPlay 
                     style={{ width: '100%', maxHeight: '50vh' }}
                   />
                )}

                {selectedItem.type === 'iframe' && (
                  <div style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}>
                    <iframe 
                       src={selectedItem.contentUrl} 
                       style={{ width: '100%', height: '100%', border: 0, position: 'absolute', inset: 0 }}
                       allow="autoplay; encrypted-media" 
                       allowFullScreen
                       title="Content"
                    />
                  </div>
                )}
              </div>

              <div style={{ padding: '25px', background: '#222', overflowY: 'auto', maxHeight: '40vh' }}>
                <motion.h2 style={{ margin: 0, color: selectedItem.color, fontSize: '1.5rem' }}>{selectedItem.title}</motion.h2>
                <motion.p style={{ color: '#ccc', lineHeight: '1.6', marginTop: '10px', fontSize: '1rem' }}>{selectedItem.desc}</motion.p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}