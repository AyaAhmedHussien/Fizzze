'use client'
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, Sky, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import FloatingCan from "@/components/FloatingCan";
import { Content } from "@prismicio/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";


// استيراد Noise من مكتبة Three.js (كما في صورتك)
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Props = {
    sentence: string | null;
    flavor: Content.SkyDiveSliceDefaultPrimary["flavor"]
}
gsap.registerPlugin(useGSAP, ScrollTrigger);
export default function Scene({ sentence, flavor }: Props) {
    const groupRef = useRef<THREE.Group>(null)
    const canRef = useRef<THREE.Group>(null)
    const cloudsRef = useRef<THREE.Group>(null)
    const wordsRef = useRef<THREE.Group>(null)


 const ANGLE = 75 * (Math.PI / 180);

  const getXPosition = (distance: number) => distance * Math.cos(ANGLE);
  const getYPosition = (distance: number) => distance * Math.sin(ANGLE);

  const getXYPositions = (distance: number) => ({
    x: getXPosition(distance),
    y: getYPosition(-1 * distance),
  });

 useGSAP(() => {
    if (
      !cloudsRef.current ||
      !canRef.current ||
      !wordsRef.current 
       
    )
      return;

    // Set initial positions
    gsap.set(cloudsRef.current.position, { z: 10 });
    gsap.set(canRef.current.position, {
      ...getXYPositions(-4),
    });

    gsap.set(
      wordsRef.current.children.map((word) => word.position),
      { ...getXYPositions(7), z: 2 },
    );

    // Spinning can
    gsap.to(canRef.current.rotation, {
      y: Math.PI * 2,
      duration: 1.7,
      repeat: -1,
      ease: "none",
    });

    // Infinite cloud movement
    const DISTANCE = 15;
    const DURATION = 6;

     

    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".skydive",
        pin: true,
        start: "top top",
        end: "+=2000",
        scrub: 1.5,
      },
    });

    scrollTl
      .to("body", {
        backgroundColor: "#C0F0F5",
        overwrite: "auto",
        duration: 0.1,
      })
      .to(cloudsRef.current.position, { z: 0, duration: 0.3 }, 0)
      .to(canRef.current.position, {
        x: 0,
        y: 0,
        duration: 0.3,
        ease: "back.out(1.7)",
      })
      .to(
        wordsRef.current.children.map((word) => word.position),
        {
          keyframes: [
            { x: 0, y: 0, z: -1 },
            { ...getXYPositions(-7), z: -7 },
          ],
          stagger: 0.3,
        },
        0,
      )
      .to(canRef.current.position, {
        ...getXYPositions(4),
        duration: 0.5,
        ease: "back.in(1.7)",
      })
      .to(cloudsRef.current.position, { z: 7, duration: 0.5 });
  });










    // 1. توليد الـ Texture من الكود الذي أرفقته في الصورة
    const perlinTexture = useMemo(() => {
        const size = 128;
        const data = new Uint8Array(size * size * size);
        let i = 0;
        const scale = 0.1;
        const perlin = new ImprovedNoise();
        const vector = new THREE.Vector3();

        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
                    data[i] = (128 + 128 * perlin.noise(x * scale, y * scale, z * scale)) * d * d * 1.1;
                    i++;
                }
            }
        }

        const texture = new THREE.Data3DTexture(data, size, size, size);
        texture.format = THREE.RedFormat;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;
        return texture;
    }, []);

    // 2. تحريك السحب للأعلى (إيحاء السقوط)
    useFrame((state, delta) => {
        if (cloudsRef.current) {
            cloudsRef.current.children.forEach((cloud) => {
                cloud.position.y += delta * 10; // سرعة الحركة للأعلى
                if (cloud.position.y > 30) cloud.position.y = -30; // إعادة التدوير
            });
        }
    });

    return (
        <group ref={groupRef}>
            {/* العلبة */}
            <group rotation={[0, 0, 0.5]}>
               <FloatingCan
          ref={canRef}
         
          floatIntensity={3}
          floatSpeed={3}
        >
          <pointLight intensity={30} color="#8C0413" decay={0.6} />
        </FloatingCan>
            </group>

            {/* السحب المدمجة بصورتك والـ Perlin Noise */}
            <group ref={cloudsRef}>
                {[...Array(10)].map((_, i) => (
                    <Billboard key={i} position={[
                        Math.random() * 20 - 10, 
                        Math.random() * 60 - 30, 
                        Math.random() * -10 - 5
                    ]}>
                        <mesh>
                            <planeGeometry args={[20, 8]} />
                            <meshStandardMaterial 
                                map={new THREE.TextureLoader().load('/Labels/download (1).png')} 
                                transparent 
                                opacity={0.5} 
                                depthWrite={false}
                                color="#a9bfd0"
                                depthTest={true}
                                
                                
                            />
                        </mesh>
                    </Billboard>
                ))}
            </group>

            <group ref={wordsRef} >
                {sentence && <ThreeText sentence={sentence} color="#F97315" /> }

            </group>




            {/* الخلفية والإضاءة */}
            <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
            <ambientLight intensity={2} color="#9DDEFA" />
            <Environment files="/hdr/field.hdr" environmentIntensity={1.5} />
            
        </group>
    )}
    function ThreeText({
  sentence,
  color = "white",
}: {
  sentence: string;
  color?: string;
}) {
  const words = sentence.toUpperCase().split(" ");

  const material = new THREE.MeshLambertMaterial();
  const isDesktop = useMediaQuery("(min-width: 950px)", true);

  return words.map((word: string, wordIndex: number) => (
    <Text
      key={`${wordIndex}-${word}`}
      scale={isDesktop ? 1 : 0.5}
      color={color}
      material={material}
      font="/fonts/Alpino-Variable.woff"
      fontWeight={900}
      anchorX={"center"}
      anchorY={"middle"}
      characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!,.?'"
    >
      {word}
    </Text>
  ));
}