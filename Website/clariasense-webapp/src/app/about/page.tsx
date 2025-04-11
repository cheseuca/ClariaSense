'use client';
import Image from 'next/image'
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import ReactPlayer from 'react-player';

export default function About() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <div>
          <motion.nav 
                initial={{ height: "auto" }}
                animate={{ height: menuOpen ? "auto" : "auto" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-white fixed w-full z-20 top-0 start-0 border-b border-gray-200"
            >
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    {/* Logo Here */}
                    <div className=''>
                      <Link href="/">
                      <Image
                        src="/clariaSenseLogo.png"
                        width={100}
                        height={67}
                        alt="Logo"
                      />
                      </Link>
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
<div className="hidden lg:flex space-x-6 items-center text-lg font-medium">
  <Link href="/"className="text-gray-700 hover:bg-blue-100 hover:text-blue-600 px-4 py-2 rounded-md transition duration-300">Home</Link>
  <Link href="/logs"className="text-gray-700 hover:bg-blue-100 hover:text-blue-600 px-4 py-2 rounded-md transition duration-300">Logs</Link>
  <Link href="/about"className="text-gray-700 hover:bg-blue-100 hover:text-blue-600 px-4 py-2 rounded-md transition duration-300">About</Link>
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
            <main className="bg-gray-auto pt-20 pb-5 min-h-screen px-4 lg:px-20">              
                <div className="flex flex-col lg:flex-row gap-8 w-full mt-6">
                {/* Left Column - About Content */}
                <section className="lg:w-2/5 bg-white shadow-lg rounded-lg p-8 overflow-y-auto max-h-[80vh]">
                  <h1 className="text-4xl font-semibold text-blue-700 mb-5 text-center">About Us</h1>
                  <p className="text-lg text-gray-700 mb-6">Welcome to <strong>ClariaSense</strong> – a team committed to revolutionizing the aquaculture industry through innovative automation solutions. Our focus is on optimizing the management of catfish ponds, ensuring sustainable and efficient operations through cutting-edge technology.</p>
                  <p className="text-lg text-gray-700 mb-6">At <strong>ClariaSense</strong>, we believe that the future of aquaculture lies in automation. By integrating smart systems with real-time monitoring, we help farmers maintain optimal water conditions for their catfish without the need for constant human intervention.</p>

                  <h2 className="text-2xl font-semibold text-blue-600 mt-8 mb-4">What We Do:</h2>
                  <ul className="list-disc pl-6 space-y-4 text-gray-700 text-lg">
                  <li><strong>Automated Water Monitoring:</strong> Our system continuously tracks vital water parameters such as pH levels and temperature, ensuring optimal conditions for catfish growth.</li>
                  <li><strong>Real-Time Adjustments:</strong> The system automatically adjusts water quality, adding water to balance pH or cooling the water when temperatures rise, ensuring a healthy environment for your fish.</li>
                  <li><strong>Pond Draining Automation:</strong> Our solution detects when the water is too dirty and initiates automatic draining, replacing it with clean, fresh water for optimal conditions.</li>
                  <li><strong>Mobile App Integration:</strong> We offer a mobile app that allows farmers to monitor key parameters in real-time, keeping them connected to their ponds even when they're not on-site.</li>
                  </ul>

                  <h2 className="text-2xl font-semibold text-blue-600 mt-8 mb-4">Our Mission:</h2>
                  <p className="text-lg text-gray-700 mb-6">To create a fully automated solution that enhances productivity and sustainability in aquaculture by monitoring and adjusting water parameters in real-time. We aim to eliminate manual labor and ensure the health of catfish without human intervention.</p>

                  <h2 className="text-2xl font-semibold text-blue-600 mt-8 mb-4">Our Vision:</h2>
                  <p className="text-lg text-gray-700 mb-6">To transform the aquaculture industry by offering innovative, efficient, and sustainable automation systems that allow farmers to manage their ponds with ease and precision.</p>

                  <h2 className="text-2xl font-semibold text-blue-600 mt-8 mb-4">Why Choose Us?</h2>
                  <ul className="list-disc pl-6 space-y-4 text-gray-700 text-lg">
                    <li><strong>Innovative Technology:</strong> We leverage advanced sensors and microcontrollers to automate pond management, ensuring the best possible environment for your fish.</li>
                    <li><strong>Efficiency & Sustainability:</strong> Our system reduces the need for manual labor and minimizes water waste, making it both cost-effective and eco-friendly.</li>
                    <li><strong>Real-Time Insights:</strong> With our mobile app and automated system, you can monitor and adjust conditions instantly, ensuring optimal results.</li>
                  </ul>

                  <p className="text-lg text-gray-700 mt-6 text-center">Join us in reshaping the future of aquaculture – where technology meets sustainability for a healthier, more productive industry.</p>
                </section>

                {/* Right Column - Video Section */}
                <div className="lg:w-3/5 flex flex-col items-center">
                  <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-4">
                    <h2 className="text-2xl font-bold text-center mb-6">Our Product in Action</h2>
                    <div className="aspect-video w-full overflow-hidden shadow-xl">
                      <iframe
                        src="https://drive.google.com/file/d/1-C9EtV1HeQVDfTYQuQxplmtBNY34UfBC/preview"
                        width="100%"
                        height="100%"
                        allow="autoplay"
                        style={{ borderRadius: '0.5rem', border: 'none' }}
                      ></iframe>
                    </div>
                    <p className="text-center text-gray-600 mt-4">
                      See how our monitoring system works in real aquarium environments
                    </p>
                  </div>
                </div>
              </div>
            </main>
        </div>
    );
}