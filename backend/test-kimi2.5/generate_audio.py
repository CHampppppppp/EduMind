import os
import wave
import struct
import math

def create_sine_wave(file_path, frequency=440.0, duration=1.0, framerate=44100):
    """生成一个简单的正弦波音频文件用于测试"""
    n_frames = int(duration * framerate)
    
    with wave.open(file_path, 'w') as wav_file:
        wav_file.setnchannels(1)  # 单声道
        wav_file.setsampwidth(2)  # 16位
        wav_file.setframerate(framerate)
        
        for i in range(n_frames):
            value = int(32767.0 * math.sin(2.0 * math.pi * frequency * i / framerate))
            data = struct.pack('<h', value)
            wav_file.writeframes(data)
    
    print(f"生成的音频文件已保存至: {file_path}")

if __name__ == "__main__":
    create_sine_wave("test_audio.wav")
