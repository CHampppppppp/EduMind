import { motion } from 'framer-motion';
import { useState } from 'react';
import { RefreshCw, Play } from 'lucide-react';

export function GamePreview() {
  const [items, setItems] = useState([5, 2, 8, 1, 9]);
  const [sorting, setSorting] = useState(false);

  const bubbleSortStep = async () => {
    setSorting(true);
    let arr = [...items];
    let len = arr.length;
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          let temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          setItems([...arr]);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    setSorting(false);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] border border-gray-200">
      <h3 className="text-xl font-medium mb-6">互动演示：冒泡排序</h3>
      
      <div className="flex items-end justify-center space-x-4 h-48 w-full mb-8">
        {items.map((val, idx) => (
          <motion.div
            key={idx}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-12 bg-black rounded-t-lg flex items-center justify-center text-white font-bold shadow-md"
            style={{ height: `${val * 10}%` }}
          >
            {val}
          </motion.div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={() => setItems([5, 2, 8, 1, 9])}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          disabled={sorting}
        >
          <RefreshCw className={`h-5 w-5 ${sorting ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={bubbleSortStep}
          disabled={sorting}
          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center"
        >
          <Play className="h-4 w-4 mr-2" />
          开始排序演示
        </button>
      </div>
    </div>
  );
}
