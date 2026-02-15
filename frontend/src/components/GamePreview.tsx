import { motion } from 'framer-motion';
import { useState } from 'react';
import { RefreshCw, Play, Zap } from 'lucide-react';

export function GamePreview() {
  const [magnetPos, setMagnetPos] = useState(0); // 0 to 100
  const [isMoving, setIsMoving] = useState(false);
  const [current, setCurrent] = useState(0);

  const simulateExperiment = async () => {
    setIsMoving(true);
    
    // Move magnet in
    for (let i = 0; i <= 100; i += 5) {
      setMagnetPos(i);
      // Current is positive when entering
      setCurrent(i < 50 ? 20 : 0);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setCurrent(0);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Move magnet out
    for (let i = 100; i >= 0; i -= 5) {
      setMagnetPos(i);
      // Current is negative when leaving
      setCurrent(i > 50 ? -20 : 0);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setCurrent(0);
    setIsMoving(false);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] border border-gray-200 relative overflow-hidden">
      <h3 className="text-xl font-medium mb-6">虚拟实验室：电磁感应</h3>
      
      <div className="relative w-full h-64 flex items-center justify-center">
        {/* Coil */}
        <div className="relative w-48 h-32 border-8 border-yellow-600 rounded-full flex items-center justify-center z-10 bg-transparent opacity-80">
           {/* Visual coil windings */}
           <div className="absolute inset-0 border-4 border-yellow-700 rounded-full opacity-50" style={{ transform: 'scale(0.9)' }}></div>
           <div className="absolute inset-0 border-4 border-yellow-700 rounded-full opacity-50" style={{ transform: 'scale(0.8)' }}></div>
        </div>

        {/* Magnet */}
        <motion.div
          animate={{ x: (magnetPos - 50) * 3 }}
          className="absolute z-0 flex items-center shadow-xl"
        >
           <div className="w-24 h-12 bg-red-600 rounded-l-md flex items-center justify-center text-white font-bold">N</div>
           <div className="w-24 h-12 bg-blue-600 rounded-r-md flex items-center justify-center text-white font-bold">S</div>
        </motion.div>

        {/* Galvanometer */}
        <div className="absolute top-0 right-0 bg-white p-4 rounded-xl border border-gray-200 shadow-md w-40">
           <div className="text-xs text-gray-500 mb-2 text-center">电流计 (G)</div>
           <div className="relative h-20 w-full border-b border-gray-300">
              <div className="absolute bottom-0 left-1/2 w-0.5 h-full bg-gray-200"></div>
              <motion.div 
                animate={{ rotate: current * 2 }}
                className="absolute bottom-0 left-1/2 w-1 h-16 bg-red-500 origin-bottom rounded-full"
                style={{ marginLeft: '-2px' }}
              />
           </div>
           <div className="flex justify-between text-xs text-gray-400 mt-1">
             <span>-</span>
             <span>0</span>
             <span>+</span>
           </div>
        </div>
        
        {/* Current Flow Visualization */}
        {current !== 0 && (
           <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center text-yellow-500 font-bold">
              <Zap className="w-5 h-5 mr-1 animate-pulse" />
              <span>{current > 0 ? "感应电流 >>>" : "<<< 感应电流"}</span>
           </div>
        )}
      </div>

      <div className="flex space-x-4 mt-8">
        <button 
          onClick={() => { setMagnetPos(0); setCurrent(0); }}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          disabled={isMoving}
        >
          <RefreshCw className={`h-5 w-5`} />
        </button>
        <button 
          onClick={simulateExperiment}
          disabled={isMoving}
          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center shadow-lg"
        >
          <Play className="h-4 w-4 mr-2" />
          开始实验演示
        </button>
      </div>
    </div>
  );
}
