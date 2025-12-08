import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, useGLTF, Environment } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store'
import { useState, useRef, useEffect, Suspense } from 'react'
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

// --- COMPONENT 1: The Business Card (Easter Egg) ---
const BusinessCard = ({ position }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const cardRef = useRef() // 1. Create Ref

  // 2. The Smooth Animation Logic
  useFrame((state, delta) => {
    if (cardRef.current) {
      const targetScale = hovered ? 1.2 : 1
      // Lerp (Linear Interpolation) calculates the smooth step between current and target
      // delta * 10 controls the speed (Higher = faster snap)
      cardRef.current.scale.x = THREE.MathUtils.lerp(cardRef.current.scale.x, targetScale, delta * 10)
      cardRef.current.scale.y = THREE.MathUtils.lerp(cardRef.current.scale.y, targetScale, delta * 10)
      cardRef.current.scale.z = THREE.MathUtils.lerp(cardRef.current.scale.z, targetScale, delta * 10)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group 
        ref={cardRef} // 3. Attach Ref
        position={position} 
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
        // scale={hovered ? 1.2 : 1}  <-- REMOVED (Handled by useFrame now)
      >
        <mesh>
          <boxGeometry args={[1.2, 0.7, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
        </mesh>
        
        <Text 
          position={[0, 0.1, 0.04]} 
          fontSize={0.08} 
          color="#ffffff"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
          WANT SOMETHING LIKE THIS?
        </Text>
        
        <Text 
          position={[0, -0.1, 0.04]} 
          fontSize={0.08} 
          color="#888888"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
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

// --- COMPONENT 2: The Particle Explosion ---
const ConfettiExplosion = ({ position, color, onComplete }) => {
  const group = useRef()
  const [particles] = useState(() => 
    new Array(12).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 3, 
      y: (Math.random() - 0.5) * 3,
      z: (Math.random() - 0.5) * 3,
      speed: 0.1 + Math.random() * 0.2,
      scale: 1
    }))
  )

  useFrame(() => {
    if (group.current) {
      group.current.children.forEach((mesh, i) => {
        mesh.position.x += particles[i].x * particles[i].speed
        mesh.position.y += particles[i].y * particles[i].speed
        mesh.position.z += particles[i].z * particles[i].speed
        mesh.scale.setScalar(mesh.scale.x * 0.92) 
      })
    }
  })

  useEffect(() => {
    const timer = setTimeout(onComplete, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <group ref={group} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

// --- COMPONENT 3: The Rising & Popping Balloon ---
const RisingBalloon = ({ startPosition, color }) => {
  const ref = useRef()
  const [popped, setPopped] = useState(false)
  const [exploding, setExploding] = useState(false)
  
  const speed = useRef(0.01 + Math.random() * 0.03) 
  const wobble = useRef(Math.random() * 10)

  const playPopSound = () => {
  // Check if browser supports AudioContext
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Sound settings: Start high frequency, drop fast (Pop effect)
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(300, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  // Volume settings: Start loud, fade out instantly
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

// --- COMPONENT 4: The Floating Polaroid Frame ---
const PhotoFrame = ({ position, imgUrl, label, data }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const texture = useLoader(THREE.TextureLoader, imgUrl)
  const frameRef = useRef() // 1. Create Ref

  // 2. Smooth Animation Logic
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
        ref={frameRef} // 3. Attach Ref
        position={position}
        onPointerOver={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => {
          e.stopPropagation()
          setActiveItem(data)
        }}
        // scale removed, handled by useFrame
      >
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.2, 4.2, 0.1]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[3, 4]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        <Text 
          position={[0, -1.6, 0.06]} 
          fontSize={0.25} 
          color="black"
          anchorX="center" 
          anchorY="middle"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
          {label}
        </Text>
      </group>
    </Float>
  )
}

// --- COMPONENT 5: The 3D Cake ---
const BirthdayCake = ({ position, data }) => {
  const setActiveItem = useStore((state) => state.setActiveItem)
  const [hovered, setHover] = useState(false)
  const { scene } = useGLTF('/cake.glb')
  const cakeRef = useRef() // 1. Create Ref

  // 2. Smooth Animation Logic
  useFrame((state, delta) => {
    if (cakeRef.current) {
      const targetScale = hovered ? 6 : 5 // Target sizes
      cakeRef.current.scale.x = THREE.MathUtils.lerp(cakeRef.current.scale.x, targetScale, delta * 10)
      cakeRef.current.scale.y = THREE.MathUtils.lerp(cakeRef.current.scale.y, targetScale, delta * 10)
      cakeRef.current.scale.z = THREE.MathUtils.lerp(cakeRef.current.scale.z, targetScale, delta * 10)
    }
  })

  return (
    <Float speed={4} rotationIntensity={2} floatIntensity={2}>
      <primitive 
        ref={cakeRef} // 3. Attach Ref
        object={scene} 
        position={position} 
        // scale removed, handled by useFrame
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

// --- COMPONENT 6: The UI Overlay ---
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
          >
            <h2>{activeItem.title}</h2>
            <p>{activeItem.desc}</p>
            
            {activeItem.type === 'image' && <img src={activeItem.url} alt="mem" />}
            {activeItem.type === 'video' && <video src={activeItem.url} controls autoPlay />}
            
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

// --- COMPONENT 7: The Welcome Screen (Start) ---
const WelcomeScreen = ({ onStart }) => {
  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
      style={{ background: '#050505', zIndex: 200, flexDirection: 'column', color: 'white' }} 
    >
      <div className="modal-content" style={{ maxWidth: '400px', background: '#1a1a1a', border: '1px solid #333', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#ffdd4d' }}>🎉 Happy Birthday Nurse Norvin!</h1>
        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Welcome to your interactive 3D surprise.</p>
        <hr style={{ borderColor: '#333', margin: '20px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem', color: '#aaa', textAlign: 'left', paddingLeft: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>🎧</span> <span>Put on your headphones or connect to your loudest speaker!</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>🔄</span> <span><strong>Watch on Smart TV or Rotate phone</strong> to Landscape</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>👆</span> <span>Drag to explore, Click items to view</span></div>
        </div>
        <button onClick={onStart} style={{ marginTop: '30px', padding: '15px 40px', fontSize: '1.2rem', background: 'linear-gradient(45deg, #ff00cc, #3333ff)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
          ENTER PARTY 🚀
        </button>

        <div style={{ marginTop: '30px', fontSize: '0.7rem', color: '#555', borderTop: '1px solid #222', paddingTop: '10px' }}>
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
      <AnimatePresence>
        {!started && <WelcomeScreen onStart={() => setStarted(true)} />}
      </AnimatePresence>

      {/* BACKGROUND MUSIC: Plays when 'started' is true */}
      <BackgroundMusic play={started} />

      <UIOverlay />

      <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
        <Canvas camera={{ position: [0, 0, 14], fov: 45 }}>
          
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1} />
          <Environment preset="city" /> 
          <Stars radius={100} count={5000} factor={4} fade speed={1} />

          {/* Background Text */}
          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
            <Text fontSize={2} color="#00ffff" outlineWidth={0.02} outlineColor="#0088aa" position={[0, 5, -6]}>
              HAPPY BIRTHDAY NORVIN!
            </Text>
          </Float>

          <Suspense fallback={null}>
            {/* The Easter Egg Business Card */}
            <BusinessCard position={[10, -5.5, 0]} />

            {/* Left Photo */}
            <PhotoFrame 
              position={[-4.5, 0, 0]} 
              imgUrl="/pic1.jpg" 
              label="PH"
              data={{ title: "Memory Lane", desc: "Remember this day?", type: "video", url: "video1.mp4" }}
            />

            {/* Right Photo */}
            <PhotoFrame 
              position={[4.5, 0, 0]} 
              imgUrl="/pic2.jpg" 
              label="USA"
              data={{ title: "Adventures", desc: "To many more trips!", type: "video", url: "video2.mp4" }}
            />

            {/* Cake */}
            <BirthdayCake 
              position={[0, -2.5, 2]} 
              data={{ title: "Make a Wish!", desc: "Here is your special video...", type: "video", url: "/video3.mp4" }} 
            />
          </Suspense>

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
          

          <OrbitControls makeDefault minDistance={5} maxDistance={25} />
        </Canvas>
      </div>
    </>
  )
}