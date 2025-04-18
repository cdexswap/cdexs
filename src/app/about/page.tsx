"use client"

import Image from 'next/image';

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            About Our Platform
          </h1>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg">
            <Image 
              src="/home/security-awareness.webp" 
              alt="Security"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Advanced Security</h3>
            <p className="text-gray-400">Our platform employs state-of-the-art security measures including blockchain technology and smart contracts for transaction verification.</p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg">
            <Image 
              src="/home/cybersecurity.webp" 
              alt="Privacy"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Data Privacy</h3>
            <p className="text-gray-400">We prioritize your privacy with end-to-end encryption and secure data handling practices that meet international standards.</p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 backdrop-blur-lg">
            <Image 
              src="/home/data-privacy.webp" 
              alt="Trust"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Trusted Platform</h3>
            <p className="text-gray-400">Built on transparency and reliability, our platform ensures secure P2P trading with professional escrow services.</p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-8 backdrop-blur-lg mb-16">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Our Mission</h2>
          <p className="text-gray-300 text-lg">
            To provide the most secure and transparent P2P trading platform, leveraging blockchain technology and smart contracts to ensure the highest level of security and trust in every transaction.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">Secure Escrow Service</h3>
            <ul className="text-gray-400 space-y-2">
              <li>• Professional third-party verification</li>
              <li>• Automated smart contract execution</li>
              <li>• Real-time transaction monitoring</li>
              <li>• Dispute resolution system</li>
            </ul>
          </div>
          
          <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">Platform Features</h3>
            <ul className="text-gray-400 space-y-2">
              <li>• Multi-currency support</li>
              <li>• 24/7 customer support</li>
              <li>• User verification system</li>
              <li>• Competitive trading fees</li>
            </ul>
          </div>

          <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
            <h3 className="text-xl font-semibold text-gray-100 mb-3">Optional Non KYC</h3>
            <ul className="text-gray-400 space-y-2">
              <li>• No identity verification required</li>
              <li>• Private and anonymous trading</li>
              <li>• Instant account access</li>
              <li>• Simplified trading process</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
