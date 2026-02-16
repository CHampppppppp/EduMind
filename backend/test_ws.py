import asyncio
import websockets
import json

async def test_chat():
    uri = "ws://localhost:8000/api/v1/chat/ws"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as websocket:
        msg = {"content": "Hello WebSocket", "history": []}
        await websocket.send(json.dumps(msg))
        print("Sent chat message")
        
        while True:
            try:
                response = await websocket.recv()
                data = json.loads(response)
                print(f"Chat Received: {data}")
                if data.get("type") == "end":
                    break
            except Exception as e:
                print(f"Error: {e}")
                break

async def test_generate():
    uri = "ws://localhost:8000/api/v1/generate/ws"
    print(f"Connecting to {uri}...")
    async with websockets.connect(uri) as websocket:
        msg = {"analysisId": "123", "modifiers": "test"}
        await websocket.send(json.dumps(msg))
        print("Sent generate request")
        
        while True:
            try:
                response = await websocket.recv()
                data = json.loads(response)
                if data.get("type") == "progress":
                    print(f"Generate Progress: {data['step']} ({data['progress']}%)")
                elif data.get("type") == "result":
                    print(f"Generate Result: {data['data']['id']}")
                    break
                else:
                    print(f"Generate Received: {data}")
            except Exception as e:
                print(f"Error: {e}")
                break

async def main():
    await test_chat()
    print("-" * 20)
    await test_generate()

if __name__ == "__main__":
    asyncio.run(main())
