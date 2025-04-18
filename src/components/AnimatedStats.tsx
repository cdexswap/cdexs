'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedStats() {
  const baseStats = {
    volume: 1250000, // $1.25M daily volume
    users: 2500,     // 2.5K daily active users
    onlineUsers: 750, // 750 online users
    successRate: 99.9
  };

  const [stats, setStats] = useState(baseStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => ({
        volume: prevStats.volume + Math.floor(Math.random() * 10000), // Random increment up to $10K
        users: prevStats.users + Math.floor(Math.random() * 5), // Random increment up to 5 users
        onlineUsers: baseStats.onlineUsers + Math.floor(Math.random() * 50), // Fluctuate by up to 50 users
        successRate: 99.9 // Keep constant
      }));
    }, 2000); // Update more frequently

    return () => clearInterval(interval);
  }, []);

  // Format number with commas
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString('en-US');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="text-center">
        <motion.div
          key={stats.volume}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="text-4xl font-bold text-blue-400"
        >
          ${formatNumber(stats.volume)}
        </motion.div>
        <div className="mt-2 text-gray-400">Daily Trading Volume</div>
      </div>
      <div className="text-center">
        <motion.div
          key={stats.onlineUsers}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="text-4xl font-bold text-blue-400"
        >
          {formatNumber(stats.onlineUsers)}
        </motion.div>
        <div className="mt-2 text-gray-400">Online Users</div>
      </div>
      <div className="text-center">
        <motion.div
          key={stats.users}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="text-4xl font-bold text-blue-400"
        >
          {formatNumber(stats.users)}
        </motion.div>
        <div className="mt-2 text-gray-400">Daily Active Users</div>
      </div>
      <div className="text-center">
        <motion.div
          key={stats.successRate}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="text-4xl font-bold text-blue-400"
        >
          {stats.successRate}%
        </motion.div>
        <div className="mt-2 text-gray-400">Success Rate</div>
      </div>
    </div>
  );
}
