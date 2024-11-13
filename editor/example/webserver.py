import asyncio
import websockets
import json
import subprocess
from functools import partial
import random

class CodeExecutionServer:
    def __init__(self):
        self.process = None  # 用于存储子进程

    async def run_code(self, websocket, code):
        file = f"pscode{random.randint(1,2000)}.p"
        f = open(file, "w")
        f.write(code)
        f.close()
        
        # 启动子进程执行代码，并连接到它的 stdin 和 stdout
        self.process = await asyncio.create_subprocess_exec(
            'python', 'cambridgeScript', file,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # 从子进程的 stdout 读取输出并发送给客户端
        while True:
            output = await self.process.stdout.readline()
            if output == b"":
                break
            await websocket.send(json.dumps({"output": output.decode()}))

        # 读取子进程的 stderr（错误输出）并发送给客户端
        while True:
            error_output = await self.process.stderr.readline()
            if error_output == b"":
                break
            await websocket.send(json.dumps({"output": error_output.decode()}))

        # 关闭子进程
        await self.process.wait()
        self.process = None

    async def send_input_to_program(self, input_text):
        # 向子进程的 stdin 写入输入数据
        if self.process:
            self.process.stdin.write(input_text.encode() + b"\n")
            await self.process.stdin.drain()

    async def handler(self, websocket):
        async for message in websocket:
            data = json.loads(message)
            if "code" in data:
                # 如果接收到的消息包含代码，则执行代码
                await self.run_code(websocket, data["code"])
            elif "input" in data:
                # 如果接收到的消息包含输入，则将输入发送给子进程
                await self.send_input_to_program(data["input"])

async def main():
    server = CodeExecutionServer()
    # Use functools.partial to bind `server.handler` correctly
    async with websockets.serve(partial(server.handler), "127.0.0.1", 5000):
        print("Server started at ws://127.0.0.1:5000")
        await asyncio.Future()  # 保持服务器运行

asyncio.run(main())
