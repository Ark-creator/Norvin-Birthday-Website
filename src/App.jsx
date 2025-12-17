import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, useGLTF, Environment } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import { useState, useRef, useEffect, Suspense, useMemo } from 'react'
import * as THREE from 'three'

// --- COMPONENT: Background Music ---
const BackgroundMusic = ({ play }) => {
  const audioRef = useRef()

  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.volume = 0.5 
      audioRef.current.play().catch((e) => {
        console.log("Audio play failed. Browser requires interaction first.", e)
      })
    }
  }, [play])

  return (
    <audio ref={audioRef} src="/bgm.mp3" loop />
  )
}

// --- COMPONENT: Landscape Blocker ---
const LandscapeBlocker = () => {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerWidth < window.innerHeight
      const mobile = window.innerWidth < 1024 
      setIsPortrait(portrait && mobile)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  if (!isPortrait) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#050505', zIndex: 9999, display: 'flex', 
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', textAlign: 'center'
    }}>
      <style>{`
        @keyframes rotate-phone {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(90deg); }
          50% { transform: rotate(90deg); }
          75% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .phone-icon {
          width: 50px; height: 80px; border: 3px solid white; border-radius: 5px;
          animation: rotate-phone 2s infinite ease-in-out; margin-bottom: 20px;
        }
      `}</style>
      <div className="phone-icon"></div>
      <h2 style={{ fontFamily: 'sans-serif', marginTop: '20px' }}>Please Rotate Your Device 🔄</h2>
      <p style={{ color: '#aaa', maxWidth: '300px' }}>This 3D experience is designed for Landscape mode.</p>
    </div>
  )
}

// --- COMPONENT: Floating Wishes ---
const FloatingWishes = () => {
  const words = [
    { text: "Health", pos: [-8, 6, -5], color: "#ff88cc" },
    { text: "Wealth", pos: [8, 8, -8], color: "#ffd700" },
    { text: "Joy", pos: [-6, 10, -10], color: "#00ffff" },
    { text: "Love", pos: [6, 4, -4], color: "#ff5e5e" },
    { text: "Success", pos: [0, 12, -12], color: "#adff2f" }
  ]

  return (
    <>
      {words.map((word, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
          <Text
            position={word.pos}
            fontSize={0.8}
            color={word.color}
            font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
            fillOpacity={0.6}
          >
            {word.text}
          </Text>
        </Float>
      ))}
    </>
  )
}

// --- COMPONENT: Particle Explosion ---
const ConfettiExplosion = ({ position, color, onComplete, scale = 1 }) => {
  const group = useRef()
  const [particles] = useState(() => 
    new Array(15).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 3, 
      y: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 3,
      speed: 0.1 + Math.random() * 0.2,
      scale: scale 
    }))
  )

  useFrame(() => {
    if (group.current) {
      group.current.children.forEach((mesh, i) => {
        mesh.position.x += particles[i].x * particles[i].speed
        mesh.position.y += particles[i].y * particles[i].speed
        mesh.position.z += particles[i].z * particles[i].speed
        mesh.scale.setScalar(mesh.scale.x * 0.94) 
      })
    }
  })

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <group ref={group} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1 * scale, 8, 8]} /> 
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

// --- COMPONENT: Background Fireworks ---
const FireworkEmitter = ({ position, delay, color }) => {
    const [exploding, setExploding] = useState(false)
    
    useEffect(() => {
        const interval = setInterval(() => {
            setExploding(true)
        }, delay)
        return () => clearInterval(interval)
    }, [delay])

    if (!exploding) return null

    return (
        <ConfettiExplosion 
            position={position} 
            color={color} 
            onComplete={() => setExploding(false)} 
            scale={2} 
        />
    )
}

// --- COMPONENT: Business Card ---
const BusinessCard = ({ position }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const cardRef = useRef()

  useFrame((state, delta) => {
    if (cardRef.current) {
      const targetScale = hovered ? 1.2 : 1
      cardRef.current.scale.x = THREE.MathUtils.lerp(cardRef.current.scale.x, targetScale, delta * 10)
      cardRef.current.scale.y = THREE.MathUtils.lerp(cardRef.current.scale.y, targetScale, delta * 10)
      cardRef.current.scale.z = THREE.MathUtils.lerp(cardRef.current.scale.z, targetScale, delta * 10)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group 
        ref={cardRef} 
        position={[8, -4, 0.5]} 
        rotation={[0.2, -0.5, 0]} 
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => {
          e.stopPropagation()
          setActiveItem({
            title: "Developer Credits",
            desc: "This 3D experience was crafted by Romark Bayan. Want to share your memories with your love ones through your unique personalized website? Email me at romark7bayan@gmail.com or visit my portfolio and contact me there.",
            type: "ad",
            url: "https://romark-bayan-online-portfolio.vercel.app" 
          })
        }}
      >
        <mesh>
          <boxGeometry args={[1.2, 0.7, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
        </mesh>
        <Text position={[0, 0.1, 0.04]} fontSize={0.08} color="#ffffff" font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff">
          WANT SOMETHING LIKE THIS?
        </Text>
        <Text position={[0, -0.1, 0.04]} fontSize={0.08} color="#888888" font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff">
          CLICK ME!
        </Text>
        <mesh position={[0, 0, -0.01]}>
           <boxGeometry args={[1.25, 0.75, 0.04]} />
           <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  )
}

// --- COMPONENT: Rising Balloon ---
const RisingBalloon = ({ startPosition, color }) => {
  const ref = useRef()
  const [popped, setPopped] = useState(false)
  const [exploding, setExploding] = useState(false)
  const speed = useRef(0.01 + Math.random() * 0.03) 
  const wobble = useRef(Math.random() * 10)

  const playPopSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  }

  useFrame((state) => {
    if (!ref.current || popped) return
    ref.current.position.y += speed.current
    ref.current.position.x += Math.sin(state.clock.elapsedTime + wobble.current) * 0.005
    if (ref.current.position.y > 10) {
      ref.current.position.y = -10
      ref.current.position.x = startPosition[0] + (Math.random() - 0.5) * 3
    }
  })

  if (popped && !exploding) return null
  if (exploding) {
    return <ConfettiExplosion position={ref.current.position} color={color} onComplete={() => setExploding(false)} />
  }

  return (
    <group 
      ref={ref} 
      position={startPosition}
      onClick={(e) => {
        e.stopPropagation()
        playPopSound()
        setPopped(true)
        setExploding(true)
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0, -1, 0]}>
           <cylinderGeometry args={[0.01, 0.01, 2]} />
           <meshBasicMaterial color="white" transparent opacity={0.3} />
        </mesh>
    </group>
  )
}

// --- COMPONENT: Photo Frame ---
const PhotoFrame = ({ position, imgUrl, label, data }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const texture = useLoader(THREE.TextureLoader, imgUrl)
  const frameRef = useRef()

  useFrame((state, delta) => {
    if (frameRef.current) {
      const targetScale = hovered ? 1.1 : 1
      frameRef.current.scale.x = THREE.MathUtils.lerp(frameRef.current.scale.x, targetScale, delta * 10)
      frameRef.current.scale.y = THREE.MathUtils.lerp(frameRef.current.scale.y, targetScale, delta * 10)
      frameRef.current.scale.z = THREE.MathUtils.lerp(frameRef.current.scale.z, targetScale, delta * 10)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group 
        ref={frameRef} 
        position={position}
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => {
          e.stopPropagation()
          setActiveItem(data)
        }}
      >
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.2, 4.2, 0.1]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3, 4]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <Text position={[0, -1.6, 0.06]} fontSize={0.25} color="black" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff">
          {label}
        </Text>
      </group>
    </Float>
  )
}

// --- COMPONENT: Birthday Cake ---
const BirthdayCake = ({ position, data }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const { scene } = useGLTF('/cake.glb')
  const cakeRef = useRef()

  useFrame((state, delta) => {
    if (cakeRef.current) {
      const targetScale = hovered ? 6 : 5
      cakeRef.current.scale.x = THREE.MathUtils.lerp(cakeRef.current.scale.x, targetScale, delta * 10)
      cakeRef.current.scale.y = THREE.MathUtils.lerp(cakeRef.current.scale.y, targetScale, delta * 10)
      cakeRef.current.scale.z = THREE.MathUtils.lerp(cakeRef.current.scale.z, targetScale, delta * 10)
    }
  })

  return (
    <Float speed={4} rotationIntensity={2} floatIntensity={2}>
      <primitive 
        ref={cakeRef} 
        object={scene} 
        position={position} 
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => {
          e.stopPropagation()
          setActiveItem(data)
        }}
      />
    </Float>
  )
}

// --- COMPONENT: Gift Box ---
const GiftBox = ({ position, data }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const [opened, setOpened] = useState(false)
  const lidRef = useRef()

  useFrame((state, delta) => {
    if (lidRef.current) {
      const targetY = hovered || opened ? 1.2 : 0.55
      const targetRot = hovered || opened ? 0.2 : 0
      lidRef.current.position.y = THREE.MathUtils.lerp(lidRef.current.position.y, targetY, delta * 5)
      lidRef.current.rotation.z = THREE.MathUtils.lerp(lidRef.current.rotation.z, targetRot, delta * 5)
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, targetRot, delta * 5)
    }
  })

  return (
    <group 
      position={position}
      onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => {
        e.stopPropagation()
        setOpened(true)
        setTimeout(() => {
            setActiveItem(data)
            setOpened(false)
        }, 300)
      }}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff3333" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.02, 1.02, 0.2]} />
        <meshStandardMaterial color="#ffd700" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 1.02, 1.02]} />
        <meshStandardMaterial color="#ffd700" metalness={0.5} />
      </mesh>

      <group ref={lidRef} position={[0, 0.55, 0]}>
        <mesh>
            <boxGeometry args={[1.1, 0.2, 1.1]} />
            <meshStandardMaterial color="#ff3333" roughness={0.3} />
        </mesh>
        <mesh>
            <boxGeometry args={[1.12, 0.21, 0.2]} />
            <meshStandardMaterial color="#ffd700" metalness={0.5} />
        </mesh>
        <mesh>
            <boxGeometry args={[0.2, 0.21, 1.12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.5} />
        </mesh>
      </group>
      
      <Float speed={2} floatIntensity={0.5}>
        <Text 
            position={[0, 1, 0]} 
            fontSize={0.2} 
            color="white"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#ff3333"
        >
            {/* OPEN ME! */}
        </Text>
      </Float>
    </group>
  )
}

// --- COMPONENT: UI Overlay (Updated for Google Drive) ---
const UIOverlay = () => {
  const { activeItem, closeModal } = useStore()
  return (
    <AnimatePresence>
      {activeItem && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%', maxWidth: '800px' }} 
          >
            <h2>{activeItem.title}</h2>
            <p>{activeItem.desc}</p>
            
            {activeItem.type === 'image' && <img src={activeItem.url} alt="mem" />}
            
            {activeItem.type === 'video' && <video src={activeItem.url} controls autoPlay />}
            
            {/* Google Drive Embed Support */}
            {activeItem.type === 'iframe' && (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                <iframe 
                  src={activeItem.url} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                  title="video"
                />
              </div>
            )}
            
            {activeItem.type === 'ad' && (
              <a href={activeItem.url} target="_blank" className="portfolio-btn">
                Visit My Portfolio
              </a>
            )}

            <br /><button className="close-btn" onClick={closeModal}>Close</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- COMPONENT: Welcome Screen ---
const WelcomeScreen = ({ onStart }) => {
  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
      style={{ background: '#050505', zIndex: 200, flexDirection: 'column', color: 'white' }} 
    >
      <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '280px', background: '#1a1a1a', border: '1px solid #333', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#ffdd4d', fontSize: '1.4rem' }}>🎉 Happy Birthday Nurse Norvin!</h1>
        <p style={{ color: '#ccc', fontSize: '0.8rem' }}>Welcome to your interactive 3D surprise.</p>
        <hr style={{ borderColor: '#333', margin: '20px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.7rem', color: '#aaa', textAlign: 'left', paddingLeft: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>🎧</span> <span>Put on your headphones or connect to your loudest speaker!</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>👆</span> <span>Drag to explore, Click items to view</span></div>
        </div>
        <button onClick={onStart} style={{ marginTop: '10px', padding: '15px 40px', fontSize: '1.2rem', background: 'linear-gradient(45deg, #ff00cc, #3333ff)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
          ENTER PARTY 🚀
        </button>

        <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#555', borderTop: '1px solid #222', paddingTop: '10px' }}>
          Interactive Experience crafted by <br/>
          <a 
            href="#" 
            target="_blank" 
            style={{ color: '#777', textDecoration: 'none', fontWeight: 'bold', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = '#777'}
          >
            Romark Bayan
          </a>
        </div>
      </div>
    </motion.div>
  )
}

// --- MAIN APP ---
export default function App() {
  const [started, setStarted] = useState(false)

  return (
    <>
      <LandscapeBlocker />

      <AnimatePresence>
        {!started && <WelcomeScreen onStart={() => setStarted(true)} />}
      </AnimatePresence>

      <BackgroundMusic play={started} />
      <UIOverlay />

      <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
        <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
          
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1} />
          <Environment preset="city" /> 
          <Stars radius={100} count={5000} factor={4} fade speed={1} />

          {/* New Floating Wishes */}
          <FloatingWishes />

          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
            <Text fontSize={2} color="#00ffff" outlineWidth={0.02} outlineColor="#0088aa" position={[0, 5, -6]}>
              HAPPY BIRTHDAY NORVIN!
            </Text>
          </Float>

          <Suspense fallback={null}>
            <BusinessCard position={[10, -5.5, 0]} />

            <PhotoFrame 
              position={[-4.5, 0, 0]} 
              imgUrl="/pic1.jpg" 
              label="PH"
              data={{ title: "Memory Lane", desc: "Remember this day?", type: "video", url: "video01.mp4" }}
            />

            <PhotoFrame 
              position={[4.5, 0, 0]} 
              imgUrl="/pic2.jpg" 
              label="USA"
              data={{ title: "Adventures", desc: "To many more trips!", type: "video", url: "video02.mp4" }}
            />

            <BirthdayCake 
              position={[0, -2.5, 2]} 
              data={{ title: "Make a Wish!", desc: "Here is your special video...", type: "video", url: "/video4.mp4" }} 
            />

            <GiftBox 
              position={[0, .8, 4]} 
              data={{ 
                title: "The Birthday Event", 
                desc: "Highlights from the celebration!", 
                type: "iframe", // Use 'iframe' for Google Drive
                url: "https://www.youtube.com/embed/vrxuk3QywF4"
                // https://youtu.be/ // Make sure this ends in /preview
              }} 

            />
          </Suspense>

          {/* Balloons */}
          <RisingBalloon startPosition={[-5, -5, -5]} color="#ff5e5e" />
          <RisingBalloon startPosition={[5, -10, -6]} color="#ffdd4d" />
          <RisingBalloon startPosition={[0, -12, -10]} color="#adff2f" />
          <RisingBalloon startPosition={[-2, -8, -4]} color="#00ffff" />
          <RisingBalloon startPosition={[2, -15, -8]} color="#ff00ff" />
          
          <RisingBalloon startPosition={[-10, -10, -10]} color="#ff5e5e" />
          <RisingBalloon startPosition={[10, -15, -11]} color="#ffdd4d" />
          <RisingBalloon startPosition={[-5, -7, -5]} color="#adff2f" />
          <RisingBalloon startPosition={[-7, -13, -9]} color="#00ffff" />
          <RisingBalloon startPosition={[7, -8, -13]} color="#ff00ff" />
          
          {/* Automatic Fireworks */}
          <FireworkEmitter position={[-10, 10, -20]} color="#ff00ff" delay={3000} />
          <FireworkEmitter position={[10, 12, -25]} color="#00ffff" delay={4500} />
          <FireworkEmitter position={[0, 15, -30]} color="#ffd700" delay={6000} />
          <FireworkEmitter position={[-5, 8, -25]} color="#ff5e5e" delay={5200} />

          <OrbitControls makeDefault minDistance={5} maxDistance={25} />
        </Canvas>
      </div>
    </>
  )
}