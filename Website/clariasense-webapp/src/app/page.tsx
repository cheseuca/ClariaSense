'use client';
import Image from 'next/image'
import {onValue, ref, off } from 'firebase/database';
import {database} from './library/firebaseconfig'
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link'; // Import Next.js Link

export default function Home() {
  const SENSOR_LABELS: Record<string, string> = {
    ph: "pH Level",
    tds: "TDS",
    temp: "Temperature",
  };  
  const SENSOR_UNITS: Record<string, string> = {
    ph: "pH",
    tds: "ppm",
    temp: "°C",
  };  

  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<{ id: string; value: number }[]>([]);

  useEffect(() => {
    const sensorsRef = ref(database, "sensors");

    const handleValueChange = (snapshot: any) => {
      const sensorsData = snapshot.val();
      if (sensorsData) {
      const values = Object.entries(sensorsData).map(([id, value]) => ({ id, value: Number(value) }));
      console.log("Fetched values:", values);
      setData(values);
      }
    };

    onValue(sensorsRef, handleValueChange, (error) => {
      console.error("Error fetching data: ", error);
    });

    return () => {
      off(sensorsRef, "value", handleValueChange);
    };
  }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <div className='font-inter'>
            <motion.nav 
                initial={{ height: "auto" }}
                animate={{ height: menuOpen ? "auto" : "auto" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-white fixed w-full z-20 top-0 start-0 border-b border-gray-200"
            >
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    {/* Logo Here */}
                    <div className=''>
                      <Image
                        src="/clariaSenseLogo.png"
                        width={100}
                        height={67}
                        alt="Logo"
                      />
                    </div>

                    {/* Mobile menu button */}
                    <div className='lg:hidden'>
                      <button onClick={toggleMenu} className="text-4xl" title="Toggle Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                            className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                      </button>
                    </div>

                    {/* Desktop Menu */}
                    <div className='hidden lg:flex space-x-6'>
                      <Link href="/" className='text-black opacity-100 hover:opacity-70 duration-300'>Home</Link>
                      <Link href="/logs" className='text-black opacity-100 hover:opacity-70 duration-300'>Logs</Link>
                      <Link href="/about" className='text-black opacity-100 hover:opacity-70 duration-300'>About</Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="lg:hidden"
                      >
                        <ul className='space-y-4 mx-5 py-2'>
                          <li><Link href="/" className='text-black opacity-70 hover:opacity-100 duration-300'>Home</Link></li>
                          <li><Link href="/logs" className='text-black opacity-70 hover:opacity-100 duration-300'>Logs</Link></li>
                          <li><Link href="/about" className='text-black opacity-70 hover:opacity-100 duration-300'>About</Link></li>
                        </ul>
                      </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            <main className="mx-8 mt-40">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center items-center">
                  {data.map((value, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-300 rounded-lg p-4 text-center"
                  >
                    <p className= 'text-2xl font-bold'>{SENSOR_LABELS[value.id] ?? value.id}</p>
                    <p className="text-8xl font-medium">{value.value}<span className='text-xl'>{SENSOR_UNITS[value.id] ?? " "}</span> </p>
                  </div>
                  ))}
                </div>
            </main>
        </div>
    );
}
