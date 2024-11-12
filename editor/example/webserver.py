import tornado.ioloop
import tornado.web
import subprocess
import os
import json
import logging

class CodeHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        # 允许跨域
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def options(self):
        # 为 OPTIONS 请求设置响应头
        self.set_status(204)
        self.finish()

    def post(self):
        # 记录请求
        logging.info("Received request")
        try:
            # 获取 JSON 数据
            data = json.loads(self.request.body)
            logging.info("Received data: %s", data)
            code = data.get("code", "")
            user_input = data.get("input", "")

            # 临时保存 Python 代码到文件
            file_path = "./temp_code.p"
            with open(file_path, "w") as code_file:
                code_file.write(code)

            # 使用 subprocess 运行 Python 脚本
            try:
                # 创建子进程并传入用户输入
                process = subprocess.Popen(
                    ["python", "cambridgeScript", "temp_code.p"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

                # 将用户输入发送到 Python 脚本的标准输入，并获取输出和错误信息
                stdout, stderr = process.communicate(input=user_input)

                # 返回脚本的输出或错误信息
                if stderr:
                    self.write({"output": f"Output: {stdout} \nError: {stderr}"})
                else:
                    self.write({"output": stdout})

            except Exception as e:
                logging.error("Execution error: %s", str(e))
                self.write({"output": f"Execution error: {str(e)}"})

            finally:
                # 删除临时文件
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logging.info("Temporary file removed")

        except json.JSONDecodeError:
            self.set_status(400)
            self.write({"output": "Invalid JSON"})

def make_app():
    return tornado.web.Application([
        (r"/", CodeHandler),
    ])

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app = make_app()
    app.listen(5000)
    logging.info("Tornado server started on http://0.0.0.0:5000")
    tornado.ioloop.IOLoop.current().start()
